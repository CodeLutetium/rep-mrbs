package users

import (
	"context"
	"fmt"
	"net/http"

	"rep-mrbs/internal/db"
	"rep-mrbs/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

func HandleDeleteUser(c *gin.Context) {
	name := c.Param("user") // Delete user by username

	// Block deletes to MRBS admin
	if name == "MRBS_ADMIN" {
		log.Warn().Msg("Deleting MRBS_ADMIN is not allowed")
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Deleting MRBS_ADMIN is forbidden. You naughty little rascal.",
		})
		return
	}

	res, err := gorm.G[models.User](db.GormDB).Where("name = ?", name).Delete(context.Background())
	if err != nil {
		log.Error().Err(err).Msg("Error deleting user")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Error deleting user, please try again later.",
		})
		return
	}

	if res == 0 {
		log.Warn().Msg("User not found, no rows deleted")
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Username not found",
		})
		return
	}

	log.Info().Str("username", name).Msg("User deleted successfully")
	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("%s deleted successfully", name),
	})
}
