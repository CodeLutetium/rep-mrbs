package users

import (
	"context"
	"net/http"

	"rep-mrbs/internal/db"
	"rep-mrbs/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

func HandleGetAllUsers(c *gin.Context) {
	users, err := gorm.G[models.PublicUser](db.GormDB).Find(context.Background())
	if err != nil {
		log.Error().Err(err).Msg("Error fetching users from database")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Error fetching users from database",
			"users": "",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"users": users,
	})
}
