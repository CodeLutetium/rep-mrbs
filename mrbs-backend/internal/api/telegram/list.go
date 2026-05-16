package telegram

import (
	"context"
	"fmt"
	"strings"
	"time"

	"rep-mrbs/internal/api/bookings"
	"rep-mrbs/internal/db"

	"github.com/go-telegram/bot"
	"github.com/go-telegram/bot/models"
	"github.com/jackc/pgx/v5"
	"github.com/rs/zerolog/log"
)

func HandleListBookings(ctx context.Context, b *bot.Bot, update *models.Update) {
	if update.Message == nil {
		return
	}

	// 1. Calculate time bounds: 8am today to 2am tomorrow (SGT/UTC+8)
	now := time.Now()
	dateStr := now.Format("2006-01-02")

	startRange := fmt.Sprintf("%s 08:00+08", dateStr)
	endRange := fmt.Sprintf("%s 02:00+08", now.AddDate(0, 0, 1).Format("2006-01-02"))

	log.Trace().Msgf("Telegram: Fetching bookings from %s to %s", startRange, endRange)

	query := `
    SELECT b.booking_id, u.display_name booked_by, u.name booked_by_username, b.start_time, b.end_time, r.display_name room_name, b.title, b.description, b.room_id, b.colour
    FROM mrbs.BOOKINGS b 
    INNER JOIN mrbs.USERS u ON b.user_id = u.user_id 
    INNER JOIN mrbs.ROOMS r ON b.room_id = r.room_id 
    WHERE b.start_time >= $1::timestamptz AND b.start_time < $2::timestamptz
    ORDER BY room_name ASC, b.start_time ASC;`

	rows, err := db.Pool.Query(ctx, query, startRange, endRange)
	if err != nil {
		log.Error().Err(err).Msg("Database query error in HandleListBookings")
		sendError(ctx, b, update.Message.Chat.ID)
		return
	}
	defer rows.Close()

	bookings, err := pgx.CollectRows(rows, pgx.RowToStructByName[bookings.GetBookingResponse])
	if err != nil {
		log.Error().Err(err).Msg("Error collecting rows in HandleListBookings")
		sendError(ctx, b, update.Message.Chat.ID)
		return
	}

	// 3. Format the message
	if len(bookings) == 0 {
		if _, err = b.SendMessage(ctx, &bot.SendMessageParams{
			ChatID: update.Message.Chat.ID,
			Text:   "📅 No bookings found for today.",
		}); err != nil {
			log.Error().Err(err).Msg("Error sending message on telegram")
		}
		return
	}

	var sb strings.Builder
	sb.Grow(len(bookings) * 150) // pre-allocate memory
	fmt.Fprintf(&sb, "📅 <b>Bookings for %s</b>", now.Format("02 Jan 2006"))

	currentRoom := ""
	for _, booking := range bookings {
		// If the room changes, print a new room header
		if booking.RoomName != currentRoom {
			currentRoom = booking.RoomName
			fmt.Fprintf(&sb, "\n\n<code>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</code>\n")
			fmt.Fprintf(&sb, "🏢 <b>%s</b>\n", currentRoom)
			fmt.Fprintf(&sb, "<code>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</code>\n")
		}

		start := booking.StartTime.Format("15:04")
		end := booking.EndTime.Format("15:04")

		// Indent the specific bookings under the room header
		fmt.Fprintf(&sb, "🕒 <b>%s - %s</b>\n", start, end)
		fmt.Fprintf(&sb, "📝 <i>%s</i>\n", booking.Title)
		fmt.Fprintf(&sb, "👤 %s\n\n", booking.BookedBy)
	}

	responseMsg := sb.String()

	_, err = b.SendMessage(ctx, &bot.SendMessageParams{
		ChatID:    update.Message.Chat.ID,
		Text:      responseMsg,
		ParseMode: models.ParseModeHTML, // Allows bold and italics
	})
	if err != nil {
		log.Error().Err(err).Msg("Failed to send bookings list to Telegram")
	}
}

func sendError(ctx context.Context, b *bot.Bot, chatID int64) {
	_, _ = b.SendMessage(ctx, &bot.SendMessageParams{
		ChatID: chatID,
		Text:   "Error encountered when fetching bookings, please try again later. If this problem persists, please contact the admin",
	})
}
