package auth

import (
	"context"
	"net/http"
	"strings"

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
	Success     bool   `json:"success"`
	Error       string `json:"error"`
	Username    string `json:"username"`
	DisplayName string `json:"display_name"`
	Email       string `json:"email"`
	Level       int    `json:"level"`
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

	// Strip email from username
	name, _, _ := strings.Cut(form.Username, "@")

	// Verify password
	user, err := gorm.G[models.User](db).Table("mrbs.users").Where("name = ?", strings.ToUpper(name)).Take(context.Background())
	if err == gorm.ErrRecordNotFound {
		log.Warn().Err(err).Msg("username not found")
		c.JSON(http.StatusOK, LoginResponse{
			Success: false,
			Error:   "Invalid username/password",
		})
		return
	}
	if err != nil {
		log.Error().Err(err).Msg("Error fetching user")
		c.JSON(http.StatusInternalServerError, LoginResponse{
			Success: false,
			Error:   defaultInternalErrorMsg,
		})
		return
	}

	// Compare password with stored password.
	isMatch, err := argon2id.ComparePasswordAndHash(form.Password, user.PasswordHash)
	if err != nil {
		log.Error().Err(err).Msg("Error when comparing password with hash")
		c.JSON(http.StatusInternalServerError, LoginResponse{
			Success: false,
			Error:   defaultInternalErrorMsg,
		})
		return
	}

	if !isMatch {
		log.Info().Msgf("Login attempt for %s failed", form.Username)
		c.JSON(http.StatusOK, LoginResponse{
			Success: false,
			Error:   "Invalid username/password",
		})
		return
	}

	// Generate new session key and attach it to cookie
	NewSession(&user, c)

	// c.SetCookie("session", sessionKey, 604800, "/", "localhost", true, true)
	c.JSON(http.StatusOK, LoginResponse{
		Success:     true,
		Username:    user.Name,
		DisplayName: user.DisplayName,
		Email:       user.Email,
		Level:       user.Level,
	})
}
