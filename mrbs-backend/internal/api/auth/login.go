package auth

import (
	"context"
	"net/http"
	"strings"

	"rep-mrbs/internal/db"
	"rep-mrbs/internal/models"

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

func HandleLogin(c *gin.Context) {
	log.Info().Msg("Login request received")

	// Get username and password from request body
	var form LoginForm
	if err := c.ShouldBindWith(&form, binding.Form); err != nil {
		log.Error().Err(err).Msg("Error binding to form")
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": err,
		})
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
			Error:  err.Error(),
		})
		return
	}

	// Compare password with stored password.

	c.JSON(http.StatusOK, gin.H{
		"password": user.PasswordHash,
		"name":     user.Name,
		"uid":      user.UserID,
	})
}
