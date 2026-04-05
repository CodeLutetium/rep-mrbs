package bookings

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"rep-mrbs/internal/api"
	"rep-mrbs/internal/constants"
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

// Clash - used to personalize the type of error message to return for any possible room booking conflicts
type Clash struct {
	RoomClashes      int     // Someone else has booked the room for the same time
	UserClashes      int     // User already has another booking for the same time.
	ExistingSeconds  float64 // Number of seconds user has already made today.
	ProximityClashes int     // Number of bookings made within buffer window
}

// DailyBookingLimit specify total maximum booking duration users can make in a day.
// TODO: Allow admins to configure this through the dashboard.
const (
	DailyBookingLimit = 3 * 3600 // Limit of 3 hours per day.
	BufferDuration    = 4 * time.Hour
)

func HandleNewBooking(c *gin.Context) {
	userID := api.GetUIDFromContext(c)
	userLevel := api.GetUserLevelFromContext(c)

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

	// Calculate the duration of the *new* booking request
	newDuration := newBooking.EndTime.Sub(newBooking.StartTime).Seconds()

	// Begin transaction to make sure other users cannot create new bookings in the meantime.
	tx := db.GormDB.Begin()

	// ---------------------------------------------------------
	// Branch here - no performance penalty for admins
	// ---------------------------------------------------------
	if userLevel < 2 {
		// Student
		clashes, err := CheckClashes(&newBooking, tx, -1)
		if err != nil {
			log.Error().Err(err).Msg("Error encountered when checking for clashes")
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": constants.InternalServerErrorMsg,
			})
			return
		}
		log.Trace().Interface("Clashes", clashes).Msg("")
		if clashes.RoomClashes > 0 {
			log.Warn().Msg("Booking clashes with existing booking. Please try another time.")
			tx.Rollback()
			c.JSON(http.StatusConflict, gin.H{
				"error": constants.ExistingBookingClashMsg,
			})
			return
		}
		if clashes.UserClashes > 0 {
			log.Warn().Msg("User has already made a booking for the same time at another room.")
			tx.Rollback()
			c.JSON(http.StatusConflict, gin.H{
				"error": constants.UserClashMsg,
			})
			return
		}

		if (clashes.ExistingSeconds + newDuration) > DailyBookingLimit {
			log.Warn().Interface("user_id", userID).Msg("Daily booking for user")
			tx.Rollback()
			c.JSON(http.StatusConflict, gin.H{
				"error": constants.DailyBookingLimitMsg,
			})
			return
		}

		// Check if users are abusing the system by making multiple small bookings in close proximity
		if clashes.ProximityClashes > 0 {
			log.Warn().Interface("user_id", userID).Msg("User attempting to book too close to existing booking")
			tx.Rollback()
			c.JSON(http.StatusConflict, gin.H{
				"error": constants.MultipleBookingsMsg,
			})
			return
		}
	} else {
		// Admin
		numClashes, err := gorm.G[int](tx).
			Table("mrbs.bookings").
			Where("room_id = ? AND start_time < ? AND end_time > ?", parsedRoomID, newBooking.EndTime, newBooking.StartTime).
			Count(context.Background(), "booking_id")
		if err != nil {
			log.Error().Err(err).Msg("Error encountered when checking for clashes")
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Please try again later.",
			})
			return
		}
		if numClashes > 0 {
			log.Warn().Msg("Booking by admin clashes with existing booking.")
			c.JSON(http.StatusConflict, gin.H{
				"error": constants.ExistingBookingClashMsg,
			})
			return
		}
	}

	// No clash: insert booking into database.
	result := gorm.WithResult()
	err = gorm.G[models.Booking](tx, result).Create(context.Background(), &newBooking)
	if err != nil {
		tx.Rollback()
		log.Error().Err(err).Msg("Error creating booking")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": constants.InternalServerErrorMsg,
		})
		return
	}
	log.Debug().Int64("rows affected", result.RowsAffected).Msg("booking inserted into database")
	tx.Commit()

	c.JSON(http.StatusCreated, gin.H{
		"message":    fmt.Sprintf("Booking success, %v has been booked from %v to %v.", models.GetRoomNameFromID(int(newBooking.RoomID)), newBooking.StartTime.Format(models.DateTimeFormat), newBooking.EndTime.Format(models.DateTimeFormat)),
		"booking_id": newBooking.BookingID,
	})
}

// CheckClashes clash checking function, to be reused by edit-booking.go
func CheckClashes(booking *models.Booking, tx *gorm.DB, bookingID int) (*Clash, error) {
	// Define the start/end of the day for the quota check
	dayStart := time.Date(booking.StartTime.Year(), booking.StartTime.Month(), booking.StartTime.Day(), 8, 0, 0, 0, booking.StartTime.Location())
	dayEnd := dayStart.Add(18 * time.Hour) // Room closes at 2am.

	// Calculate buffer times
	bufferStart := booking.StartTime.Add(-BufferDuration)
	bufferEnd := booking.EndTime.Add(BufferDuration)
	durationSQL := "EXTRACT(EPOCH FROM (end_time - start_time))"

	clashes, err := gorm.G[Clash](tx).Table("mrbs.bookings").
		Select(`
				-- 1. Check Room Clashes (Time Overlap)
				COALESCE(SUM(CASE 
					WHEN room_id = ? AND start_time < ? AND end_time > ? AND booking_id != ? THEN 1 
					ELSE 0 
				END), 0) as room_clashes,

				-- 2. Check User Clashes (Time Overlap)
				COALESCE(SUM(CASE 
					WHEN user_id = ? AND start_time < ? AND end_time > ? AND booking_id != ? THEN 1 
					ELSE 0 
				END), 0) as user_clashes,

				-- 3. Calculate Existing Duration for Today (Same Day)
				COALESCE(SUM(CASE 
					WHEN user_id = ? AND start_time >= ? AND end_time < ? AND booking_id != ?
					THEN `+durationSQL+`
					ELSE 0 
				END), 0) as existing_seconds,
				
				-- 4. Check if there are any bookings within window 
				COALESCE(SUM(CASE
					WHEN user_id = ? AND end_time > ? AND start_time < ? AND booking_id != ? THEN 1
					ELSE 0
				END), 0) AS proximity_clashes
			`,
			// Args for Room Clash
			booking.RoomID, booking.EndTime, booking.StartTime, bookingID,
			// Args for User Clash
			booking.UserID, booking.EndTime, booking.StartTime, bookingID,
			// Args for Quota
			booking.UserID, dayStart, dayEnd, bookingID,
			// Args for window
			booking.UserID, bufferStart, bufferEnd, bookingID,
		).
		Where(`
				(start_time < ? AND end_time > ? AND (room_id = ? OR user_id = ?))
				OR 
				(user_id = ? AND start_time >= ? AND end_time < ?)
			`, booking.EndTime, booking.StartTime, booking.RoomID, booking.UserID, // Overlap args
			booking.UserID, dayStart, dayEnd, // Quota args
		).Take(context.Background())
	if err != nil {
		return nil, err
	}

	return &clashes, nil
}
