package bookings

import (
	"context"
	"net/http"
	"strconv"

	"rep-mrbs/internal/api"
	"rep-mrbs/internal/db"
	"rep-mrbs/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

func HandleDeleteBooking(c *gin.Context) {
	userID := api.GetUIDFromContext(c)

	log.Info().Msgf("Delete booking request received from user id %s", strconv.Itoa(int(userID)))

	bookingIDStr := c.DefaultQuery("id", "notfound")
	if bookingIDStr == "notfound" {
		log.Warn().Msg("Booking ID not provided")
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Booking ID missing from request",
		})
		return
	}

	bookingID, err := strconv.ParseInt(bookingIDStr, 10, 64)
	if err != nil {
		log.Warn().Err(err).Msg("Invalid booking id provided")
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid booking ID",
		})
		return
	}

	query := gorm.G[models.Booking](db.GormDB).Where("booking_id = ?", bookingID)

	userLevel := api.GetUserLevelFromContext(c)
	if userLevel < 2 {
		query.Where("user_id = ?", userID)
	}

	result, err := query.Delete(context.Background())
	if err != nil {
		log.Error().Err(err).Msg("Error deleting record")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Error in database. Please try again later.",
		})
		return
	}

	if result == 0 {
		log.Warn().Msg("No rows deleted. Booking id may be wrong or user may not have sufficient permissions")
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Booking not found or not authorized.",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Booking deleted successfully.",
	})
}
