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

// UpdateSession helper function to manage sessions in application.
// If existing session exists in the database, the old session is removed
// A new session key is generated for the current user and attached to the current gin context
func UpdateSession(user *models.User, c *gin.Context) {
	// Note: Never delete session keys by UID - the user may be logged in from both mobile and desktop with different session keys assigned.
	sessionKeyLifetime, err := strconv.Atoi(os.Getenv("SESSION_KEY_LIFETIME"))
	if err != nil {
		log.Error().Err(err).Msg("")
		c.JSON(http.StatusInternalServerError, LoginResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	// 1. Do not delete session keys matching UID - user may log in from both mobile and desktop at the same time
	// 2. Housekeeping: delete session keys older than expiry set in config/.env when we generate a new session key
	// Performing lazy deletion will be more ideal performance wise, but since this is a small application the gains will be minimal.
	_, err = gorm.G[models.Session](db.GormDB).Where("time_created < now() - (? * interval '1 second')", sessionKeyLifetime).Delete(context.Background())
	if err != nil {
		log.Warn().Err(err).Msg("Error deleting old session keys")
	}
	log.Trace().Msg("Expired session keys deleted from database")

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
