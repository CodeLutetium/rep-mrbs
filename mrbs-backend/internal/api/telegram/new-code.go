package telegram

import (
	"net/http"
	"time"

	"rep-mrbs/internal/api"
	"rep-mrbs/internal/constants"
	"rep-mrbs/internal/db"
	"rep-mrbs/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm/clause"
)

// HandleCreateNewCode Generate new auth code for telegram linking
func HandleCreateNewCode(c *gin.Context) {
	// Generate new session code
	// This session code will be used to initialize the chatbot and tie the chatID with the user
	code, err := models.GenerateSessionKey() // reuse the same technique used to generate session keys for logging in
	if err != nil {
		log.Error().Err(err).Msg("Error generating session key")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": constants.InternalServerErrorMsg,
		})
		return
	}

	// Retrieve userID and validate
	userID := api.GetUIDFromContext(c)
	if userID == 0 {
		// Invalid userID, should not reach this branch.
		log.Error().Msg("UserID not found")
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Invalid userID",
		})
		return
	}

	row := models.TelegramAuth{
		UserID:         userID,
		TelegramChatID: nil,
		AuthToken:      code,
		CreatedAt:      time.Now(),
	}

	err = db.GormDB.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"auth_token", "created_at"}),
	}).Create(&row).Error
	if err != nil {
		log.Error().Err(err).Msg("Error inserting row to mrbs.telegram_auth")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": constants.InternalServerErrorMsg,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Start code generated successfully",
		"code":    code,
	})
}
