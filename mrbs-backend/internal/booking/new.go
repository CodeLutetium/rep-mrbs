// Package booking provides the service logic for booking operations
package booking

import (
	"context"
	"fmt"
	"time"

	"rep-mrbs/internal/db"
	"rep-mrbs/internal/models"

	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

// Clash - used to personalize the type of error message to return for any possible room booking conflicts
type Clash struct {
	RoomClashes      int // Someone else has booked the room for the same time
	UserClashes      int // User already has another booking for the same time.
	ExistingPeriods  int // Number of periods user has already booked today.
	ProximityClashes int // Number of bookings made within buffer window
}

func CreateBooking(ctx context.Context, booking *models.Booking) *BookingError {
	// 1. Logic-only validation (e.g., color range)
	if booking.Colour < 1 || booking.Colour > models.MaxBookingColours {
		return NewBookingError("color out of range")
	}

	numPeriods := int(booking.EndTime.Sub(booking.StartTime).Minutes()) / models.BookingPeriodSize

	tx := db.GormDB.WithContext(ctx).Begin()

	// Fetch user level from db.
	// Note: for requests routed from Gin, there is already one check for the user level, so this
	// is done again unnecessarily since Golang does not support optional arguments. In the future,
	// it is possible to look into how one of the checks for user level can be removed.
	user, err := gorm.G[models.User](tx).Where("user_id = ?", booking.UserID).Take(ctx)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			log.Error().Err(err).Interface("booking", booking).Msg("User not found in database")
		} else {
			log.Error().Err(err).Interface("booking", booking).Msg("Error fetching user from database. Booking not created.")
		}
		return ErrUnknownUser
	}

	// 3. Validation Logic (extracted from your HandleNewBooking)
	if user.Level < 2 {
		clashes, err := CheckClashes(booking, tx, -1)
		if err != nil {
			tx.Rollback()
			return NewBookingError(err.Error())
		}

		if clashes.RoomClashes > 0 {
			tx.Rollback()
			return ErrRoomClash
		}
		if clashes.UserClashes > 0 {
			tx.Rollback()
			return ErrUserClash
		}
		if (clashes.ExistingPeriods + numPeriods) > models.DailyBookingLimit {
			tx.Rollback()
			return ErrDailyLimit
		}
		if clashes.ProximityClashes > 0 {
			tx.Rollback()
			return ErrProximityClash
		}
	} else {
		// Admin clash logic
		numClashes, err := gorm.G[int](tx).
			Table("mrbs.bookings").
			Where("room_id = ? AND start_time < ? AND end_time > ?", booking.RoomID, booking.EndTime, booking.StartTime).
			Count(context.Background(), "booking_id")
		if err != nil {
			log.Error().Err(err).Msg("Error encountered when checking for clashes")
			tx.Rollback()
			return NewBookingError(err.Error())
		}
		if numClashes > 0 {
			log.Warn().Msg("Booking by admin clashes with existing booking.")
			tx.Rollback()
			return ErrUserClash
		}
	}

	// 4. Final Insertion
	result := gorm.WithResult()
	if err = gorm.G[models.Booking](tx).Create(ctx, booking); err != nil {
		log.Error().Err(err).Msg("error creating new booking")
		tx.Rollback()
		return NewBookingError(err.Error())
	}

	log.Debug().Int64("rows affected", result.RowsAffected).Msg("booking inserted into database")

	err = tx.Commit().Error
	if err != nil {
		log.Error().Err(err).Msg("Error committing new booking in database")
		return NewBookingError(err.Error())
	}

	return nil
}

// CheckClashes clash checking function, to be reused by edit-booking.go
func CheckClashes(booking *models.Booking, tx *gorm.DB, bookingID int) (*Clash, error) {
	// Define the start/end of the day for the quota check
	dayStart := time.Date(booking.StartTime.Year(), booking.StartTime.Month(), booking.StartTime.Day(), 8, 0, 0, 0, booking.StartTime.Location())
	// Move back 1 day if the time is after 12am
	if booking.StartTime.Hour() >= 0 && booking.StartTime.Hour() <= 2 {
		dayStart = dayStart.AddDate(0, 0, -1)
	}

	dayEnd := dayStart.Add(18 * time.Hour) // Room closes at 2am.

	// Calculate buffer times
	bufferStart := booking.StartTime.Add(-models.BufferDuration * time.Minute)
	bufferEnd := booking.EndTime.Add(models.BufferDuration * time.Minute)
	secondsPerPeriod := models.BookingPeriodSize * 60
	durationSQL := fmt.Sprintf("(EXTRACT(EPOCH FROM (end_time - start_time)) / %d)::integer", secondsPerPeriod)
	log.Debug().Time("buffer start", bufferStart).Time("buffer end", bufferEnd).Msg("buffer args")

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
				END), 0) as existing_periods,
				
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

	log.Debug().Interface("clashes", clashes).Msg("clashes")

	return &clashes, nil
}
