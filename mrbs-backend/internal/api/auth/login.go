package auth

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"rep-mrbs/internal/db"
	"rep-mrbs/internal/models"

	"github.com/alexedwards/argon2id"
	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

type LoginForm struct {
	Username string `form:"username" binding:"required"`
	Password string `form:"password" binding:"required"`
}

type LoginResponse struct {
	Sucess      bool   `json:"success"`
	Error       string `json:"error"`
	SessionKey  string `json:"session"`
	Username    string `json:"username"`
	DisplayName string `json:"display_name"`
}

const defaultInternalErrorMsg = "Error encountered when logging in, please try again later."

func HandleLogin(c *gin.Context) {
	log.Info().Msg("Login request received")

	// Get username and password from request body
	var form LoginForm
	if err := c.ShouldBindWith(&form, binding.Form); err != nil {
		log.Error().Err(err).Msg("Error binding to form")
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	db := db.GormDB

	// Verify password
	user, err := gorm.G[models.User](db).Table("mrbs.users").Where("name = ?", strings.ToLower(form.Username)).Take(context.Background())
	if err == gorm.ErrRecordNotFound {
		log.Warn().Err(err).Msg("username not found")
		c.JSON(http.StatusOK, LoginResponse{
			Sucess: false,
			Error:  "Invalid username/password",
		})
		return
	}
	if err != nil {
		log.Error().Err(err).Msg("Error fetching user")
		c.JSON(http.StatusInternalServerError, LoginResponse{
			Sucess: false,
			Error:  defaultInternalErrorMsg,
		})
		return
	}

	// Compare password with stored password.
	isMatch, err := argon2id.ComparePasswordAndHash(form.Password, user.PasswordHash)
	if err != nil {
		log.Error().Err(err).Msg("Error when comparing password with hash")
		c.JSON(http.StatusInternalServerError, LoginResponse{
			Sucess: false,
			Error:  defaultInternalErrorMsg,
		})
		return
	}

	if !isMatch {
		log.Info().Msgf("Login attempt for %s failed", form.Username)
		c.JSON(http.StatusOK, LoginResponse{
			Sucess: false,
			Error:  "Invalid username/password",
		})
		return
	}

	// No problem: Generate session key
	// 1. Do not delete session keys matching UID - user may log in from both mobile and desktop at the same time
	// 2. Housekeeping: delete session keys older than expiry set in config/.env when we generate a new session key
	sessionKeyLifetime, err := strconv.Atoi(os.Getenv("SESSION_KEY_LIFETIME"))
	if err != nil {
		log.Error().Err(err).Msg("")
		c.JSON(http.StatusInternalServerError, LoginResponse{
			Sucess: false,
			Error:  err.Error(),
		})
		return
	}

	_, err = gorm.G[models.Session](db).Where("time_created < now() - (? * interval '1 second')", sessionKeyLifetime).Delete(context.Background())
	if err != nil {
		log.Warn().Err(err).Msg("Error deleting old session keys")
	}

	sessionKey, err := generateSessionKey()
	if err != nil {
		log.Error().Err(err).Msg("Error generating session key, returning 500 as sesison key cannot be empty.")
		c.JSON(http.StatusInternalServerError, LoginResponse{
			Sucess: false,
			Error:  defaultInternalErrorMsg,
		})
		return
	}

	// Update last login async.
	go func() {
		user.LastLogin = time.Now()
		db.Save(&user)

		log.Debug().Msgf("Last login updated for user %s", user.Name)
	}()

	result := gorm.WithResult()
	err = gorm.G[models.Session](db, result).Create(context.Background(), &models.Session{
		SessionKey:  sessionKey,
		UserID:      user.UserID,
		TimeCreated: time.Now(),
	})
	if err != nil {
		log.Error().Err(err).Msg("Error creating new session")
		c.JSON(http.StatusInternalServerError, LoginResponse{
			Sucess: false,
			Error:  defaultInternalErrorMsg,
		})
		return
	}
	log.Info().Int64("num rows inserted", result.RowsAffected).Msg("New session created")

	c.SetCookie("session", sessionKey, 604800, "/", "localhost", true, false)
	c.JSON(http.StatusOK, LoginResponse{
		Sucess:      true,
		SessionKey:  sessionKey,
		Username:    user.Name,
		DisplayName: user.DisplayName,
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
