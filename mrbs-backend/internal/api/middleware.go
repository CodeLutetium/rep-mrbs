// Package api contains all api related functions
package api

import (
	"context"
	"errors"
	"net/http"

	"rep-mrbs/internal/db"
	"rep-mrbs/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

// AuthGuard session token is valid and user has sufficient authorization to perform action
// requiredLevel: int
// level 1 = user
// level 2 = admin
func AuthGuard(requiredLevel int) gin.HandlerFunc {
	return func(c *gin.Context) {
		log.Trace().Msg("AuthGuard triggered")
		// Retrieve session key
		session, err := c.Cookie("session")
		if err != nil {
			log.Error().Err(err).Msg("session key missing in request")
			c.JSON(http.StatusUnauthorized, gin.H{
				"message": "session key missing",
			})
			c.Abort()
			return
		}

		// Retrieve session key from db
		sessionObj, err := gorm.G[models.Session](db.GormDB).Where("session_key = ?", session).Take(context.Background())
		if errors.Is(err, gorm.ErrRecordNotFound) {
			log.Warn().Msg("Session not found")
			c.JSON(http.StatusUnauthorized, gin.H{
				"message": "login session has expired",
			})
			c.Abort()
			return
		}

		if err != nil {
			log.Error().Err(err).Msg("Error when fetching from sessions")
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": err.Error(),
			})
			c.Abort()
			return
		}

		// Retrieve user permission from db
		// We do not need to check for ErrRecordNotFound as userid is a FK
		userLevel, err := gorm.G[int](db.GormDB).Table("mrbs.users").Select("level").Where("user_id = ?", sessionObj.UserID).Take(context.Background())
		if err != nil {
			log.Error().Err(err).Msg("Error when fetching from users")
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": err.Error(),
			})
			c.Abort()
			return
		}

		if userLevel < requiredLevel {
			log.Warn().Msg("User is unauthorized to access this function")
			c.JSON(http.StatusUnauthorized, gin.H{
				"message": "You do not have permission to access this.",
			})
			c.Abort()
			return
		}

		// Pass the user level and the user to the next function.
		c.Set("userID", sessionObj.UserID)
		c.Set("userLevel", userLevel)

		log.Debug().Msg("AuthGuard passed")
		c.Next()
	}
}

// GetUIDFromContext returns uid from stored context.
func GetUIDFromContext(c *gin.Context) uint {
	// Retrieve uid from context
	userIDVal, exists := c.Get("userID")
	if !exists {
		log.Error().Msg("userID not found -> check middleware.go. Ensure that it is set using c.Set(\"userID\")")
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Error encountered when creating booking, please try again later.",
		})
		return 0
	}
	return userIDVal.(uint)
}

func GetUserLevelFromContext(c *gin.Context) int {
	// Retrieve uid from context
	userLevel, exists := c.Get("userLevel")
	if !exists {
		log.Error().Msg("userLevel not found -> check middleware.go. Ensure that it is set using c.Set(\"userLevel\")")
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Error encountered when creating booking, please try again later.",
		})
		return 0
	}
	return userLevel.(int)
}
