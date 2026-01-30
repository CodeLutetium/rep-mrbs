package models

import "time"

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
	IcalSeq     string    `gorm:"column:ical_seq"`
}
