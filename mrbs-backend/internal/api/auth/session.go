package auth

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"net/http"
	"os"
	"strconv"
	"time"

	"rep-mrbs/internal/db"
	"rep-mrbs/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

var sessionKeyLifetime int

func init() {
	lifetime, err := strconv.Atoi(os.Getenv("SESSION_KEY_LIFETIME"))
	if err != nil {
		// Use fallback value of 1 week
		sessionKeyLifetime = 7 * 24 * 60 * 60
		log.Warn().Msg("SESSION_KEY_LIFETIME not set in /config/.env, default value of 7 days is used.")
	} else {
		sessionKeyLifetime = lifetime
	}
}

func NewSession(user *models.User, c *gin.Context) {
	DeleteExpiredSessions()

	sessionKey, err := generateSessionKey()
	if err != nil {
		log.Error().Err(err).Msg("Error generating session key, returning 500 as session key cannot be empty.")
		c.JSON(http.StatusInternalServerError, LoginResponse{
			Success: false,
			Error:   defaultInternalErrorMsg,
		})
		return
	}

	// Update last login async.
	go func() {
		user.LastLogin = time.Now()
		db.GormDB.Save(&user)

		log.Debug().Msgf("Last login updated for user %s", user.Name)
	}()

	result := gorm.WithResult()
	err = gorm.G[models.Session](db.GormDB, result).Create(context.Background(), &models.Session{
		SessionKey:  sessionKey,
		UserID:      user.UserID,
		TimeCreated: time.Now(),
	})
	if err != nil {
		log.Error().Err(err).Msg("Error creating new session")
		c.JSON(http.StatusInternalServerError, LoginResponse{
			Success: false,
			Error:   defaultInternalErrorMsg,
		})
		return
	}
	log.Info().Int64("num rows inserted", result.RowsAffected).Msg("New session created")

	c.SetCookieData(&http.Cookie{
		Name:     "session",
		Value:    sessionKey,
		MaxAge:   sessionKeyLifetime,
		Path:     "/",
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
		HttpOnly: true,
	})
}

// DeleteExpiredSessions remove expired sessions from the database
func DeleteExpiredSessions() {
	// 1. Do not delete session keys matching UID - user may log in from both mobile and desktop at the same time
	// 2. Housekeeping: delete session keys older than expiry set in config/.env when we generate a new session key
	// Performing lazy deletion will be more ideal performance wise, but since this is a small application the gains will be minimal.
	numDeleted, err := gorm.G[models.Session](db.GormDB).Where("time_created < now() - (? * interval '1 second')", sessionKeyLifetime).Delete(context.Background())
	if err != nil {
		log.Warn().Err(err).Msg("Error deleting old session keys")
	}
	log.Trace().Int("numDeleted", numDeleted).Msg("Expired session keys deleted from database")
}

func RotateSession(user *models.User, c *gin.Context, oldKey string) {
	newKey, _ := generateSessionKey()

	err := db.GormDB.Transaction(func(tx *gorm.DB) error {
		// Delete old session
		if err := tx.Table("mrbs.sessions").Where("session_key = ?", oldKey).Delete(&models.Session{}).Error; err != nil {
			return err
		}

		// 2. Create new session
		newSession := models.Session{
			SessionKey:  newKey,
			UserID:      user.UserID,
			TimeCreated: time.Now(),
		}
		if err := tx.Create(&newSession).Error; err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		log.Error().Err(err).Msg("Failed to rotate session")
		return
	}

	c.SetCookieData(&http.Cookie{
		Name:     "session",
		Value:    newKey,
		MaxAge:   sessionKeyLifetime,
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
	})
}

func generateSessionKey() (string, error) {
	const SessionKeyLen = 32

	id := make([]byte, SessionKeyLen)
	_, err := rand.Read(id)
	if err != nil {
		log.Error().Err(err).Msg("Error encountered generating session key")
		return "", err
	}

	return base64.RawURLEncoding.EncodeToString(id), nil
}
