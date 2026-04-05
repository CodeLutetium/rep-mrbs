// Package constants constants
package constants

const (
	UnauthorizedBookingEditErrorMsg = "Unauthorized to edit booking. Booking can only be modified by admin or person who made original booking."
	// Generic message for 500 errors
	InternalServerErrorMsg = "An unknown error has occured."
	// Used when booking clashes with an existing booking for the same room
	ExistingBookingClashMsg = "Booking clashes with an existing booking. Please select a different time."
	// Used when user tries to book two different rooms for the same tim
	UserClashMsg = "Booking clashes with existing booking. You can only occupy one room at once. To book multiple rooms at the same time, contact the admin."
	// Used when user tries to book more than 3 hours a day
	DailyBookingLimitMsg = "You have exceeded the maximum daily booking limit of 3 hours a day. Please try again tomorrow."
	// Used when user tries to abuse the system by creating multiple mini bookings
	MultipleBookingsMsg = "You have an existing booking within 4 hours of the new booking. The 3-hour limit is in place to ensure fair access for everyone and should not be misused."
)
