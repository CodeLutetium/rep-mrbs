package auth

import (
	"context"
	"errors"
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

func HandleGetCurrentUser(c *gin.Context) {
	session, err := c.Cookie("session")
	// Session does not exist
	if err != nil {
		deleteSessionCookie(c)

		c.JSON(http.StatusOK, LoginResponse{
			Success: false,
		})
		return
	}

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

	// Delete expired session keys
	_, err = gorm.G[models.Session](db.GormDB).Where("time_created < now() - (? * interval '1 second')", sessionKeyLifetime).Delete(context.Background())
	if err != nil {
		log.Warn().Err(err).Msg("Error deleting old session keys")
	}
	log.Trace().Msg("Expired session keys deleted from database")

	// Retrieve session key from db
	// If session key does not exist, it could be an invalid session key or an expired session key.
	sessionObj, err := gorm.G[models.Session](db.GormDB).Where("session_key = ?", session).Take(context.Background())
	if errors.Is(err, gorm.ErrRecordNotFound) {
		log.Warn().Msg("Session not found")
		deleteSessionCookie(c)
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

	UpdateSession(&user, c)
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
