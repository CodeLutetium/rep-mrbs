package bookings

import (
	"context"
	"net/http"
	"time"

	"rep-mrbs/internal/db"
	"rep-mrbs/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/rs/zerolog/log"
)

type GetBookingResponse struct {
	BookingID        string    `json:"booking_id"`
	BookedBy         string    `json:"booked_by"`
	BookedByUsername string    `json:"booked_by_username"` // username of the person who made the booking.
	StartTime        time.Time `json:"start_time"`
	EndTime          time.Time `json:"end_time"`
	RoomName         string    `json:"room_name"`
	Title            string    `json:"title"`
	Description      string    `json:"description"`
	RoomID           string    `json:"room_id"`
}

func HandleGetBookings(c *gin.Context) {
	dateStr := c.DefaultQuery("date", time.Now().Format("2006-01-02"))
	log.Info().Msgf("Get bookings request received for %s", dateStr)

	if !isValidFormat(dateStr) {
		dateStr = time.Now().Format("2006-01-02")
	}

	// Hardcoded opening time of 8am and hardcoded closing time of 2am.
	// Possible to use Gorm instead of raw SQL query.
	query := `
	SELECT b.booking_id, u.display_name booked_by, u.name booked_by_username, b.start_time,b.end_time, r.display_name room_name, b.title, b.description, b.room_id 
	FROM mrbs.BOOKINGS b 
	INNER JOIN mrbs.USERS u ON b.user_id = u.user_id 
	INNER JOIN mrbs.ROOMS r ON b.room_id = r.room_id 
	WHERE b.start_time >= ($1 || ' 08:00+08')::timestamptz AND b.start_time < (($1::date + 1) || ' 02:00+08')::timestamptz;`

	rows, _ := db.Pool.Query(context.Background(), query, dateStr)
	bookings, err := pgx.CollectRows(rows, pgx.RowToStructByName[GetBookingResponse])
	if err != nil {
		log.Error().Err(err).Msgf("Error fetching bookings for %s", dateStr)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, bookings)
}

// returns true if the date format is correct
func isValidFormat(dateStr string) bool {
	_, err := time.Parse(models.DateFormat, dateStr)
	return err == nil
}
