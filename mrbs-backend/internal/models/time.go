package models

import "time"

// DateFormat Contains constants used for formatting time in the database.
const (
	DateFormat           = "2006-01-02"
	DateTimeFormat       = DateFormat + " 15:04"
	DateTimeWithTZFormat = DateTimeFormat + "-07"
)

func ParseDateTime(datetime *string) (time.Time, error) {
	return time.ParseInLocation(DateTimeFormat, *datetime, time.FixedZone("GMT", 8*3600))
}
