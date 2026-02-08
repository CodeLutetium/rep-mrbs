package auth

import (
	"context"
	"net/http"
	"os"

	"rep-mrbs/internal/db"
	"rep-mrbs/internal/models"

	"github.com/alexedwards/argon2id"
	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

type ResetPasswordForm struct {
	Email string `form:"email" binding:"required"`
}

func HandleResetPassword(c *gin.Context) {
	// Retrieve email from body
	var form ResetPasswordForm
	if err := c.ShouldBindWith(&form, binding.Form); err != nil {
		log.Warn().Err(err).Msg("Error binding to form")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Error resetting password, please try again later.",
		})
		return
	}
	log.Info().Msgf("Reset password request received from %v", form.Email)

	defaultPassword, exists := os.LookupEnv("DEFAULT_PASSWORD")
	if !exists {
		log.Error().Msg("DEFAULT_PASSWORD missing in config/.env")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Error resetting password, please try again later.",
		})
		return
	}

	pwhash, err := argon2id.CreateHash(defaultPassword, argon2id.DefaultParams)
	if err != nil {
		log.Error().Err(err).Msg("Error occurred trying to hash password")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Error resetting password, please try again later.",
		})
		return
	}

	rowsUpdated, err := gorm.G[models.User](db.GormDB).Where("email = ?", form.Email).Update(context.Background(), "password_hash", pwhash)
	if err != nil {
		log.Error().Msg("Error occurred updating password in database")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Error resetting password, please try again later.",
		})
		return
	}

	if rowsUpdated == 0 {
		log.Warn().Str("email", form.Email).Msg("Email does not exist.")
	} else {
		log.Info().Int("rows updated", rowsUpdated).Msgf("Password updated for user %v", form.Email)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Password reset successful. If the email is valid, you can now log in with the default password.",
	})
}
