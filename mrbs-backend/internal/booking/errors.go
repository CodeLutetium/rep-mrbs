package booking

import (
	"errors"
	"fmt"
	"net/http"

	"rep-mrbs/internal/models"

	"gorm.io/gorm"
)

type BookingError struct {
	HTTPStatusCode int
	Err            error
	Message        string // Formatted error message for frontend
}

func (e *BookingError) Error() string {
	return e.Err.Error()
}

func NewBookingError(msg string) *BookingError {
	return &BookingError{
		HTTPStatusCode: http.StatusInternalServerError,
		Err:            errors.New(msg),
		Message:        "An unknown error has occured. Please try again later. If the problem persists, contact the administrator.",
	}
}

var (
	ErrUnknownUser = &BookingError{
		HTTPStatusCode: http.StatusConflict,
		Err:            gorm.ErrRecordNotFound,
		Message:        "User not found in database.",
	}
	ErrUnauthorizedEdit = &BookingError{
		HTTPStatusCode: http.StatusUnauthorized,
		Err:            errors.New("user is unauthorized to edit booking"),
		Message:        "Unauthorized to edit booking. Booking can only be modified by admin or person who made original booking.",
	}
	ErrRoomClash = &BookingError{
		HTTPStatusCode: http.StatusConflict,
		Err:            errors.New("booking clashes with an existing booking"),
		Message:        "Booking clashes with an existing booking made by another user. Please select a different time.",
	}
	ErrUserClash = &BookingError{
		HTTPStatusCode: http.StatusConflict,
		Err:            errors.New("user has an existing booking"),
		Message:        "Booking clashes with existing booking made by you. You can only occupy one room at once. To book multiple rooms at the same time, contact the admin.",
	}
	ErrDailyLimit = &BookingError{
		HTTPStatusCode: http.StatusConflict,
		Err:            fmt.Errorf("daily booking limit of %d hours exceeded", models.DailyBookingLimit*models.BookingPeriodSize/60),
		Message:        fmt.Sprintf("You have exceeded the maximum daily booking limit of %d hours a day. Please try again tomorrow.", models.DailyBookingLimit*models.BookingPeriodSize/60),
	}
	ErrProximityClash = &BookingError{
		HTTPStatusCode: http.StatusConflict,
		Err:            fmt.Errorf("user has existing booking within %d hours of new booking", models.BufferDuration/60),
		Message:        fmt.Sprintf("You have an existing booking within %d hours of the new booking. The %d-hour limit is in place to ensure fair access for everyone and should not be misused.", models.BufferDuration/60, models.DailyBookingLimit*models.BookingPeriodSize/60),
	}
	ErrInternal = &BookingError{
		HTTPStatusCode: http.StatusInternalServerError,
		Err:            errors.New("an error has occured when making the booking"),
		Message:        "An unknown error has occured.",
	}
)
