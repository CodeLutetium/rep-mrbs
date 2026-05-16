package bookings

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"rep-mrbs/internal/api"
	"rep-mrbs/internal/booking"
	"rep-mrbs/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

// NewBookingRequest - we do not need to retrieve user details from booking request as we will fetch the detail from the session key.
type NewBookingRequest struct {
	RoomID      string `json:"room_id" binding:"required"`
	StartTime   string `json:"start_time" binding:"required"` // pass as string and parse into time object later.
	NumPeriods  int    `json:"duration" binding:"required"`
	Title       string `json:"title" binding:"required"`
	Description string `json:"description" binding:"required"`
	Colour      int    `json:"colour"`
}

func HandleNewBooking(c *gin.Context) {
	userID := api.GetUIDFromContext(c)

	// Retrieve booking details from request body
	var newBookingReq NewBookingRequest
	if err := c.ShouldBindJSON(&newBookingReq); err != nil {
		log.Error().Err(err).Msg("Error binding new booking request to struct")
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	parsedStartTime, err := models.ParseDateTime(&newBookingReq.StartTime)
	if err != nil {
		log.Warn().Err(err).Str("start_time", newBookingReq.StartTime).Msg("Error parsing time into time object. Layout should be YYYY-MM-DD HH:mm")
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Incorrect datetime format provided",
		})
		return
	}

	parsedRoomID, err := strconv.ParseUint(newBookingReq.RoomID, 10, 32)
	if err != nil || parsedRoomID > 9 {
		log.Warn().Err(err).Msg("Invalid roomid provided.")
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid room_id provided",
		})
		return
	}

	if newBookingReq.Colour < 1 || newBookingReq.Colour > models.MaxBookingColours {
		log.Warn().Err(err).Int("requested colour", newBookingReq.Colour).Msgf("Invalid colour chosen. Valid colour range: 1-%d", models.MaxBookingColours)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid colour",
		})
		return
	}

	// Convert request into booking object for db insertion.
	newBooking := models.Booking{
		UserID:      userID,
		StartTime:   parsedStartTime,
		EndTime:     parsedStartTime.Add(time.Duration(newBookingReq.NumPeriods) * 30 * time.Minute),
		TimeCreated: time.Now(),
		RoomID:      uint(parsedRoomID),
		Title:       newBookingReq.Title,
		Description: newBookingReq.Description,
		Colour:      newBookingReq.Colour,
	}

	bookingError := booking.CreateBooking(c, &newBooking)

	if bookingError != nil {
		c.JSON(bookingError.HTTPStatusCode, gin.H{
			"error": bookingError.Message,
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":    fmt.Sprintf("Booking success, %v has been booked from %v to %v.", models.GetRoomNameFromID(int(newBooking.RoomID)), newBooking.StartTime.Format(models.DateTimeFormat), newBooking.EndTime.Format(models.DateTimeFormat)),
		"booking_id": newBooking.BookingID,
	})
}
