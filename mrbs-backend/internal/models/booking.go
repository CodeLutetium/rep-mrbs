package models

import "time"

/*
* NOTE: All duration constants to be defined in MINUTES
 */

// MaxBookingColours - Number of booking colours available
const MaxBookingColours = 6

// MaxTitleLength - Maximum char length of a title. This was previously hardcoded throughout the codebase.
const MaxTitleLength = 25

const BookingPeriodSize = 30 // 30 mins per period

const DailyBookingLimit = 6 // 3 hours a day = 6 booking periods

// BufferDuration - Number of *minutes* around the booking to search for existing bookings made by the same user to prevent
// abuse (creating multiple mini bookings).
// To allow better granularity, buffer duration will not be defined in BookingPeriodSize
const BufferDuration = 4 * 60

// MaxBookingDuration - Maximum duration of a single booking. This was previously hardcoded throughout the codebase, use this value in the future.
// If there are any bugs regarding to the maximum booking duration in the future (i.e. the maximum booking duration is changed), look for this first.
const MaxBookingDuration = 6 * BookingPeriodSize // 3 hours

type Booking struct {
	BookingID   uint      `gorm:"column:booking_id; primaryKey"`
	UserID      uint      `gorm:"column:user_id"`
	StartTime   time.Time `gorm:"column:start_time"`
	EndTime     time.Time `gorm:"column:end_time"`
	RoomID      uint      `gorm:"column:room_id"`
	TimeCreated time.Time `gorm:"time_created"`
	Title       string    `gorm:"column:title"`
	Description string    `gorm:"column:description"`
	IcalUID     string    `gorm:"column:ical_uid"`
	IcalSeq     string    `gorm:"column:ical_seq; default:1"`
	Colour      int       `gorm:"column:colour; default:1"`
}

// BookingState tracks user progress when making a new booking via telegram bot
// There is no user id associated with the booking. To get the user id, check the
// telegram_auth table
type BookingState struct {
	MessageID   int // track the MessageID to edit
	Step        int // 0: Date, 1: Room, 2: Time, 3: Duration, 4: Title...
	RoomID      int
	StartTime   time.Time
	NumPeriods  int
	Title       string
	Description string
}
