package bookings

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"rep-mrbs/internal/api"
	"rep-mrbs/internal/db"
	"rep-mrbs/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

type EditBookingRequest struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description" binding:"required"`
	RoomID      string `json:"room_id" binding:"required"`
	StartTime   string `json:"start_time" binding:"required"`
	Duration    int    `json:"duration" binding:"required"`
}

func HandleEditBooking(c *gin.Context) {
	bookingID := c.Param("booking-id")
	log.Info().Msgf("Edit booking request received for booking ID %s", bookingID)

	// Fetch booking from the backend
	originalBooking, err := gorm.G[models.Booking](db.GormDB).Where("booking_id = ?", bookingID).Take(context.TODO())
	if err == gorm.ErrRecordNotFound {
		log.Warn().Err(err).Msg("Booking ID not found in database.")
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Booking ID not found",
		})
		return
	}

	// Check if user is admin or person who made original booking
	if api.GetUIDFromContext(c) < 2 && originalBooking.UserID != api.GetUIDFromContext(c) {
		log.Warn().Msg("Edit booking request made by non-admin who did not make original booking. ")
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Unauthorized to edit booking. Booking can only be modified by admin or person who made original booking.",
		})
		return
	}

	// Bind new booking to struct
	var editedBookingReq EditBookingRequest
	if err = c.ShouldBindJSON(&editedBookingReq); err != nil {
		log.Error().Err(err).Msg("Error binding request to booking")
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Error binding request. Please try again later.",
		})
		return
	}

	parsedStartTime, err := models.ParseDateTime(&editedBookingReq.StartTime)
	if err != nil {
		log.Error().Err(err).Msg("Error parsing start time")
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Incorrect datetime format provided",
		})
		return
	}
	endTime := parsedStartTime.Add(time.Duration(editedBookingReq.Duration) * 30 * time.Minute)

	parsedRoomID, err := strconv.ParseUint(editedBookingReq.RoomID, 10, 32)
	if err != nil || parsedRoomID > 9 {
		log.Warn().Err(err).Msg("Invalid roomid provided.")
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid room_id provided",
		})
		return
	}

	// Begin transaction to make sure other users cannot make booking while we check and update current booking.
	// We begin the transaction as late as possible to minimize time spent under lock.
	tx := db.GormDB.Begin()

	// Check if new booking clashes with existing bookings
	numClashes, err := gorm.G[int](tx).Table("mrbs.bookings").Select("count(1)").Where("room_id = ? AND end_time > ? AND start_time < ? AND booking_id != ?", editedBookingReq.RoomID, parsedStartTime, endTime, bookingID).Take(context.Background())
	if err != nil {
		log.Error().Err(err).Msg("Error encountered when checking for clashes")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Please try again later.",
		})
		return
	}
	log.Trace().Int("num clashes", numClashes).Msg("")
	if numClashes > 0 {
		log.Warn().Msg("Booking clashes with existing booking. Please try another time.")
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Booking conflicts with existing booking",
		})
		return
	}

	// Update booking by ID
	rows, err := gorm.G[models.Booking](tx).Where("booking_id = ?", bookingID).Updates(context.Background(), models.Booking{
		Title:       editedBookingReq.Title,
		Description: editedBookingReq.Description,
		RoomID:      uint(parsedRoomID),
		StartTime:   parsedStartTime,
		EndTime:     endTime,
	})
	if err != nil {
		log.Error().Err(err).Msg("Error updating booking")
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Error updating booking, please try again later.",
		})
	}
	tx.Commit()

	log.Trace().Int("rows affected", rows).Msg("Booking updated.")

	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("Booking updated successfully, %v has been booked from %v to %v.", models.GetRoomNameFromID(int(parsedRoomID)), parsedStartTime.Format(models.DateTimeFormat), endTime.Format(models.DateTimeFormat)),
	})
}
