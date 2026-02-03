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

// NewBookingRequest - we do not need to retrieve user details from booking request as we will fetch the detail from the session key.
type NewBookingRequest struct {
	RoomID      string `json:"room_id" binding:"required"`
	StartTime   string `json:"start_time" binding:"required"` // pass as string and parse into time object later.
	NumPeriods  int    `json:"duration" binding:"required"`
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"` // can be empty
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

	// Convert request into booking object for db insertion.
	newBooking := models.Booking{
		UserID:      userID,
		StartTime:   parsedStartTime,
		EndTime:     parsedStartTime.Add(time.Duration(newBookingReq.NumPeriods) * 30 * time.Minute),
		TimeCreated: time.Now(),
		RoomID:      uint(parsedRoomID),
		Title:       newBookingReq.Title,
		Description: newBookingReq.Description,
	}

	// Check if booking clashes with existing booking.
	numClashes, err := gorm.G[int](db.GormDB).Table("mrbs.bookings").Select("count(1)").Where("room_id = ? AND end_time > ? AND start_time < ?", parsedRoomID, newBooking.StartTime, newBooking.EndTime).Take(context.Background())
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

	// No clash: insert booking into database.
	result := gorm.WithResult()
	err = gorm.G[models.Booking](db.GormDB, result).Create(context.Background(), &newBooking)
	if err != nil {
		log.Error().Err(err).Msg("Error creating booking")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Error creating booking, please try again later.",
		})
		return
	}
	log.Debug().Int64("rows affected", result.RowsAffected).Msg("booking inserted into database")

	c.JSON(http.StatusCreated, gin.H{
		"message":    fmt.Sprintf("Booking success, %v has been booked from %v to %v.", models.GetRoomNameFromID(int(newBooking.RoomID)), newBooking.StartTime.Format(models.DateTimeFormat), newBooking.EndTime.Format(models.DateTimeFormat)),
		"booking_id": newBooking.BookingID,
	})
}
