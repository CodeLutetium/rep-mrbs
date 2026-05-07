package models

import "time"

// MaxBookingColours - Number of booking colours available
const MaxBookingColours = 6

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
type BookingState struct {
	MessageID   int // track the MessageID to edit
	Step        int // 0: Date, 1: Room, 2: Time, 3: Duration, 4: Title...
	UserID      string
	Date        time.Time
	RoomID      int
	StartTime   time.Time
	NumPeriods  int
	Title       string
	Description string
}
