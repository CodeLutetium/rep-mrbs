package users

import (
	"context"
	"fmt"
	"net/http"

	"rep-mrbs/internal/constants"
	"rep-mrbs/internal/db"
	"rep-mrbs/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

type EditUserRequest struct {
	UserID      uint   `json:"user_id" binding:"required"`
	DisplayName string `json:"display_name" binding:"required"`
	Name        string `json:"name" binding:"required"`
	Email       string `json:"email" binding:"required"`
	Level       int    `json:"level" binding:"required"`
}

func HandleEditUser(c *gin.Context) {
	// Bind request
	var editUserRequest EditUserRequest
	if err := c.ShouldBindJSON(&editUserRequest); err != nil {
		log.Error().Err(err).Msg("Error binding request to booking")
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Error binding request. Please try again later.",
		})
		return
	}

	// Block edits to MRBS_ADMIN
	if editUserRequest.Name == "MRBS_ADMIN" {
		log.Warn().Msg("Edits to MRBS_ADMIN not allowed")
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Edits to MRBS_ADMIN not allowed",
		})
		return
	}

	// Fetch user from the backend
	user, err := gorm.G[models.User](db.GormDB).Where("user_id = ?", editUserRequest.UserID).Take(context.Background())
	if err == gorm.ErrRecordNotFound {
		log.Warn().Err(err).Uint("userID", editUserRequest.UserID).Msg("User ID not found in database")
		c.JSON(http.StatusNotFound, gin.H{
			"error": "UserID not found in database",
		})
		return
	}
	if err != nil {
		log.Error().Err(err).Interface("user request", editUserRequest).Msg("Error retrieving user from database")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": constants.InternalServerErrorMsg,
		})
		return
	}

	updateData := map[string]any{
		"display_name": editUserRequest.DisplayName,
		"name":         editUserRequest.Name,
		"email":        editUserRequest.Email,
		"level":        editUserRequest.Level,
	}

	// Update user
	rows, err := gorm.G[map[string]any](db.GormDB).Table("mrbs.users").Where("user_id = ?", editUserRequest.UserID).Updates(context.Background(), updateData)
	if err != nil {
		log.Error().Err(err).Int("rows affected", rows).Msg("Error editing user")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": constants.InternalServerErrorMsg,
		})
		return
	}

	log.Info().Interface("user", editUserRequest).Msg("User details edited successfully")

	if editUserRequest.Level == 2 && user.Level == 1 {
		log.Warn().Str("username", user.Name).Msg("User promoted to ADMIN level")
	}

	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("User %s details updated successfully", editUserRequest.Name),
	})
}
