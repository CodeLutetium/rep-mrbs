package auth

import (
	"context"
	"net/http"
	"time"

	"rep-mrbs/internal/api"
	"rep-mrbs/internal/db"
	"rep-mrbs/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

func HandleLogout(c *gin.Context) {
	userID := api.GetUIDFromContext(c)

	log.Info().Msgf("Logging out user with userID %v", userID)

	sessionID, err := c.Cookie("sesison")
	if err != nil {
		log.Warn().Msg("Session cookie not found in logout request")
		c.JSON(http.StatusOK, gin.H{
			"message": "User is already logged out.",
		})
		return
	}

	// Delete session from DB async
	go func() {
		result := gorm.WithResult()
		_, err = gorm.G[models.Session](db.GormDB, result).Where("session_id = ?", sessionID).Delete(context.Background())
		log.Info().Int64("Rows deleted", result.RowsAffected).Msg("Session key removed from database")
	}()

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

	c.Header("Clear-Site-Data", "\"Cookies\"")

	c.JSON(http.StatusOK, gin.H{
		"message": "Logged out successfully",
	})
}
