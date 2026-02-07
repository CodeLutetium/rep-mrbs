package auth

import (
	"context"
	"net/http"

	"rep-mrbs/internal/api"
	"rep-mrbs/internal/db"
	"rep-mrbs/internal/models"

	"github.com/alexedwards/argon2id"
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

type ChangePasswordRequest struct {
	OldPassword string `json:"current_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required"`
}

func HandleChangePassword(c *gin.Context) {
	userID := api.GetUIDFromContext(c)
	log.Info().Msgf("Change password request received from userid %v", userID)

	var changePasswordRequest ChangePasswordRequest
	if err := c.ShouldBindJSON(&changePasswordRequest); err != nil {
		log.Error().Err(err).Msgf("Error binding password change request")
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Error binding request, please try again later.",
		})
		return
	}

	pwhash, err := argon2id.CreateHash(changePasswordRequest.NewPassword, argon2id.DefaultParams)
	if err != nil {
		log.Error().Err(err).Msg("Error hashing password")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Error occured while updating password. Please try again later.",
		})
		return
	}

	tx := db.GormDB.Begin()

	oldPWHash, err := gorm.G[string](tx).Table("mrbs.users").Where("user_id = ?", userID).Select("password_hash").Take(context.Background())
	if err != nil {
		log.Error().Err(err).Msg("Error fetching old password from database")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Error occured while updating password. Please try again later.",
		})
		return
	}

	// Check if old password is correct.
	isMatch, err := argon2id.ComparePasswordAndHash(changePasswordRequest.OldPassword, oldPWHash)
	if err != nil {
		log.Error().Err(err).Msg("Error comparing old password with old pw hash")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Error occured while updating password. Please try again later.",
		})
		return
	}
	if !isMatch {
		log.Warn().Msg("Old password incorrect")
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Old password is incorrect, please try again.",
		})
		return
	}

	// Check if old password is the same as new password
	isMatch, err = argon2id.ComparePasswordAndHash(changePasswordRequest.NewPassword, oldPWHash)
	if err != nil {
		log.Error().Err(err).Msg("Error comparing new password with old pw hash")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Error occured while updating password. Please try again later.",
		})
		return
	}
	if isMatch {
		log.Warn().Msg("New password matches old password")
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "New password is the same as the old password.",
		})
		return
	}

	rowsUpdated, err := gorm.G[models.User](tx).Where("user_id = ? ", userID).Update(context.Background(), "password_hash", pwhash)
	if err != nil {
		log.Error().Err(err).Msg("Error updating password")
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Error occured while updating password. Please try again later.",
		})
		return
	}

	tx.Commit()
	log.Debug().Int("Rows updated", rowsUpdated).Msg("Password updated")

	c.JSON(http.StatusOK, gin.H{
		"message": "Password changed successfully!",
	})
}
