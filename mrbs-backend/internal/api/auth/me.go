package auth

import (
	"context"
	"errors"
	"net/http"
	"time"

	"rep-mrbs/internal/db"
	"rep-mrbs/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

// Threshold before we rotate the session key.
const rotationThreshold = 24 * time.Hour

func HandleGetCurrentUser(c *gin.Context) {
	session, err := c.Cookie("session")
	// Session does not exist
	if err != nil {
		deleteSessionCookie(c)
		log.Trace().Msg("Session does not exist, cookie deleted.")

		c.JSON(http.StatusOK, LoginResponse{
			Success: false,
		})
		return
	}

	// Delete expired session keys
	DeleteExpiredSessions()

	// Retrieve session key from db
	// If session key does not exist, it could be an invalid session key or an expired session key.
	sessionObj, err := gorm.G[models.Session](db.GormDB).Where("session_key = ?", session).Take(context.Background())
	if errors.Is(err, gorm.ErrRecordNotFound) {
		log.Warn().Msg("Session not found")
		deleteSessionCookie(c)

		// Do not return 401
		// /auth/me only retrieve the user profile if the user is logged in
		// If the session has expired, we simply handle cookie management here.
		c.JSON(http.StatusOK, LoginResponse{
			Success: false,
		})
		return
	}

	// Valid session: Retrieve user details and refresh session key
	user, err := gorm.G[models.User](db.GormDB).Table("mrbs.users").Where("user_id = ?", sessionObj.UserID).Take(context.Background())
	if err != nil {
		log.Error().Err(err).Msg("Error fetching user from database")
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": err.Error(),
		})
		return
	}

	if time.Since(sessionObj.TimeCreated) > rotationThreshold {
		log.Debug().Msg("Session stale, rotating key")

		RotateSession(&user, c, sessionObj.SessionKey)
	}

	c.JSON(http.StatusOK, LoginResponse{
		Success:     true,
		Username:    user.Name,
		DisplayName: user.DisplayName,
		Email:       user.Email,
		Level:       user.Level,
	})
}

func deleteSessionCookie(c *gin.Context) {
	c.SetCookieData(&http.Cookie{
		Name:     "session",
		Path:     "/",
		Value:    "",
		MaxAge:   -1,
		Expires:  time.Now().Add(-1 * time.Hour),
		HttpOnly: true,
		SameSite: http.SameSiteDefaultMode,
		Secure:   true,
	})
}
