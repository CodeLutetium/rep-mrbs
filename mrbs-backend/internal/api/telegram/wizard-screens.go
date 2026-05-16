package telegram

import (
	"context"
	"fmt"
	"time"

	"rep-mrbs/internal/constants"
	"rep-mrbs/internal/db"
	m "rep-mrbs/internal/models"

	"github.com/go-telegram/bot"
	"github.com/go-telegram/bot/models"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

/**
* This file contains all the screens for creating a new booking on Telegram
 */

// Step 1: Select the date
func showDateSelection(ctx context.Context, b *bot.Bot, chatID int64, msgID int) {
	var rows [][]models.InlineKeyboardButton

	for i := range 3 {
		targetDate := time.Now().AddDate(0, 0, i)
		displayText := targetDate.Format("02 Jan 2006")
		callbackVal := targetDate.Format("02-01-2006")

		rows = append(rows, []models.InlineKeyboardButton{{
			Text:         displayText,
			CallbackData: "wiz_date:" + callbackVal,
		}})
	}

	_, err := b.EditMessageText(ctx, &bot.EditMessageTextParams{
		ChatID:      chatID,
		MessageID:   msgID,
		Text:        "📅 <b>Step 1: Select Date</b>\nWhen would you like to book?",
		ParseMode:   models.ParseModeHTML,
		ReplyMarkup: &models.InlineKeyboardMarkup{InlineKeyboard: rows},
	})
	if err != nil {
		log.Error().Err(err).Msg("Error editing message for date selection")
	}
}

// Step 2: Select the rooms
func showRoomSelection(ctx context.Context, b *bot.Bot, chatID int64, msgID int) {
	if len(m.CachedRooms) == 0 {
		log.Warn().Msg("Room cache is empty, attempting emergency fetch")
		if err := m.InitRooms(); err != nil {
			sendError(ctx, b, chatID)
			return
		}
	}
	var rows [][]models.InlineKeyboardButton
	var currentRow []models.InlineKeyboardButton

	for i, room := range m.CachedRooms {
		btn := models.InlineKeyboardButton{
			Text:         room.DisplayName,
			CallbackData: fmt.Sprintf("wiz_room:%d", room.RoomID),
		}
		currentRow = append(currentRow, btn)

		// Create a new row every 2 buttons (2-column layout)
		if (i+1)%2 == 0 || i == len(m.CachedRooms)-1 {
			rows = append(rows, currentRow)
			currentRow = []models.InlineKeyboardButton{}
		}
	}

	rows = addBackButtonToRows(rows)

	if _, err := b.EditMessageText(ctx, &bot.EditMessageTextParams{
		ChatID:      chatID,
		MessageID:   msgID,
		Text:        "🏢 <b>Step 2: Select Room</b>\nWhich room do you need?",
		ParseMode:   models.ParseModeHTML,
		ReplyMarkup: &models.InlineKeyboardMarkup{InlineKeyboard: rows},
	}); err != nil {
		log.Error().Err(err).Msg(constants.SendTelegramMsgError)
	}
}

// Step 3: Choose available timeslot
func showTimeSelection(ctx context.Context, b *bot.Bot, chatID int64, msgID int) {
	state, ok := UserBookingStates[chatID]
	if !ok {
		sendError(ctx, b, chatID)
		return
	}

	// 1. Define bounds for the selected date
	loc, _ := time.LoadLocation("Asia/Singapore")
	now := time.Now().In(loc)

	var startRange time.Time
	// Check if today using native date components
	y1, m1, d1 := state.StartTime.Date()
	y2, m2, d2 := now.Date()
	isToday := y1 == y2 && m1 == m2 && d1 == d2

	if isToday {
		startRange = now
	} else {
		startRange = time.Date(y1, m1, d1, 8, 0, 0, 0, loc)
	}

	endRange := time.Date(y1, m1, d1+1, 2, 0, 0, 0, loc)

	// 2. Fetch existing bookings for this room and day
	var existingBookings []m.Booking
	err := db.GormDB.Where("room_id = ? AND start_time >= ? AND start_time < ?",
		state.RoomID, startRange, endRange).Find(&existingBookings).Error
	if err != nil {
		log.Error().Err(err).Msg("Failed to fetch bookings for time selection")
		sendError(ctx, b, chatID)
		return
	}

	// 3. Create a map of "Busy" timeslots (standardizing to HH:mm)
	busySlots := make(map[string]bool)
	for _, bk := range existingBookings {
		log.Debug().Interface("bk", bk).Msg("")
		for curr := bk.StartTime; curr.Before(bk.EndTime); curr = curr.Add(m.BookingPeriodSize * time.Minute) {
			busySlots[curr.Format("15:04")] = true
		}
	}

	log.Debug().Interface("busySlots", busySlots).Msg("")

	// 4. Generate the keyboard (8 AM to 2 AM) slice
	var rows [][]models.InlineKeyboardButton
	var currentRow []models.InlineKeyboardButton

	slotTimeIter := time.Date(y1, m1, d1, 8, 0, 0, 0, loc)

	for range 18 {
		if isToday && slotTimeIter.Before(now) {
			slotTimeIter = slotTimeIter.Add(time.Hour)
			continue
		}

		slotTimeStr := slotTimeIter.Format("15:04")

		// Only add if not busy
		if !busySlots[slotTimeStr] {
			btn := models.InlineKeyboardButton{
				Text:         slotTimeIter.Format("03:04 PM"),
				CallbackData: "wiz_time:" + slotTimeIter.Format(time.RFC3339),
			}
			currentRow = append(currentRow, btn)
		}

		if len(currentRow) == 4 {
			rows = append(rows, currentRow)
			currentRow = nil
		}

		log.Trace().Time("slotTimeIter", slotTimeIter).Msg("")
		slotTimeIter = slotTimeIter.Add(time.Hour)
	}

	if len(currentRow) > 0 {
		rows = append(rows, currentRow)
	}

	rows = addBackButtonToRows(rows)

	// 5. Update UI
	text := fmt.Sprintf("🕒 <b>Step 3: Select Start Time</b>\nRoom: %s\nDate: %s\n\nOnly available slots are shown.",
		m.GetRoomNameFromID(int(state.RoomID)), state.StartTime.Format("02 Jan"))

	_, err = b.EditMessageText(ctx, &bot.EditMessageTextParams{
		ChatID:      chatID,
		MessageID:   msgID,
		Text:        text,
		ParseMode:   models.ParseModeHTML,
		ReplyMarkup: &models.InlineKeyboardMarkup{InlineKeyboard: rows},
	})
	if err != nil {
		log.Error().Err(err).Msg(constants.SendTelegramMsgError)
	}
}

// Step 4: Choose duration
func showDurationSelection(ctx context.Context, b *bot.Bot, chatID int64, msgID int) {
	state, ok := UserBookingStates[chatID]
	if !ok {
		sendError(ctx, b, chatID)
		return
	}

	// Prepare query
	endRange := state.StartTime.Add(3 * time.Hour)

	// Fetch existing bookings with start times in the next 3 hours
	existingBookings, err := gorm.G[m.Booking](db.GormDB).Where("room_id = ? AND start_time > ? AND start_time < ?", state.RoomID, state.StartTime, endRange).Order("start_time ASC").Find(ctx)
	if err != nil {
		log.Error().Err(err).Msg("Error fetching bookings from db")
		_, _ = b.EditMessageText(ctx, &bot.EditMessageTextParams{
			ChatID:    chatID,
			MessageID: msgID,
			Text:      "⚠️ <b>Error fetching bookings from backend</b>\nSomething went wrong while fetching available durations. Please try again later. If this problem persists, contact the administrator.",
			ParseMode: models.ParseModeHTML,
			ReplyMarkup: &models.InlineKeyboardMarkup{
				InlineKeyboard: [][]models.InlineKeyboardButton{
					{{Text: "🔄 Restart Wizard", CallbackData: "wiz_action:discard_booking"}},
				},
			},
		})
		return
	}

	loc, _ := time.LoadLocation("Asia/Singapore")
	startYear, startMonth, startDay := state.StartTime.Date()
	businessDayStart := time.Date(startYear, startMonth, startDay, 8, 0, 0, 0, loc)

	if state.StartTime.Hour() < 8 {
		// Booking is between 12am and 2am of the next day: adjust the business day
		businessDayStart = businessDayStart.AddDate(0, 0, -1)
	}
	closingTime := time.Date(businessDayStart.Year(), businessDayStart.Month(), businessDayStart.Day()+1, 2, 0, 0, 0, loc)

	untilClosing := int(closingTime.Sub(state.StartTime).Minutes())
	maxDurationMinutes := min(m.MaxBookingDuration, untilClosing)

	// If there's a booking in the next 3 hours, the gap is our new limit
	if len(existingBookings) > 0 {
		nextBookingStart := existingBookings[0].StartTime
		gapMinutes := int(nextBookingStart.Sub(state.StartTime).Minutes())
		maxDurationMinutes = min(maxDurationMinutes, gapMinutes)
	}

	// 4. Generate duration buttons (60, 120, 180 mins)
	var rows [][]models.InlineKeyboardButton
	for mins := 60; mins <= min(maxDurationMinutes, m.MaxBookingDuration); mins += 60 {
		hours := mins / 60
		label := fmt.Sprintf("%d Hour", hours)
		if hours > 1 {
			label += "s"
		}
		rows = append(rows, []models.InlineKeyboardButton{{
			Text:         label,
			CallbackData: fmt.Sprintf("wiz_duration:%d", mins),
		}})
	}

	// 5. Update UI
	if len(rows) == 0 {
		errorKb := &models.InlineKeyboardMarkup{
			InlineKeyboard: [][]models.InlineKeyboardButton{
				{{Text: "⬅️ Back to Time Selection", CallbackData: "wiz_action:back"}},
				{{Text: "❌ Cancel", CallbackData: "wiz_action:discard_booking"}},
			},
		}

		_, _ = b.EditMessageText(ctx, &bot.EditMessageTextParams{
			ChatID:      chatID,
			MessageID:   msgID,
			Text:        "⚠️ <b>No slots available</b>\nThere isn't enough time before the next booking or closing time for even a 1-hour session. Please try another starting time or room.",
			ParseMode:   models.ParseModeHTML,
			ReplyMarkup: errorKb, // Add the buttons here
		})
		return
	}

	rows = addBackButtonToRows(rows)

	text := fmt.Sprintf("⏳ <b>Step 4: Select Duration</b>\nStart Time: %s\n\nHow long do you need the room?", state.StartTime.Format("15:04"))

	_, _ = b.EditMessageText(ctx, &bot.EditMessageTextParams{
		ChatID:      chatID,
		MessageID:   msgID,
		Text:        text,
		ParseMode:   models.ParseModeHTML,
		ReplyMarkup: &models.InlineKeyboardMarkup{InlineKeyboard: rows},
	})
}

// Step 6: Booking title
func showTitlePrompt(ctx context.Context, b *bot.Bot, chatID int64, msgID int) {
	text := "📝 <b>Step 5: Booking Title</b>\nAlmost done! Please <b>type</b> a brief title for your booking (e.g., 'Group discussion')."

	// Back button
	kb := &models.InlineKeyboardMarkup{
		InlineKeyboard: [][]models.InlineKeyboardButton{
			{{Text: "⬅️ Back", CallbackData: "wiz_action:back"}},
		},
	}

	_, _ = b.EditMessageText(ctx, &bot.EditMessageTextParams{
		ChatID:      chatID,
		MessageID:   msgID,
		Text:        text,
		ParseMode:   models.ParseModeHTML,
		ReplyMarkup: kb,
	})
}

// Step 7: Booking summary
func showBookingSummary(ctx context.Context, b *bot.Bot, chatID int64) {
	s := UserBookingStates[chatID]

	summary := fmt.Sprintf(
		"✅ <b>Review Your Booking</b>\n\n"+
			"🏢 <b>Room:</b> %s\n"+
			"📅 <b>Date:</b> %s\n"+
			"🕒 <b>Time:</b> %s\n"+
			"⏳ <b>Duration:</b> %d hour(s)\n"+
			"📝 <b>Title:</b> %s\n\n"+
			"Would you like to confirm this booking?",
		m.GetRoomNameFromID(int(s.RoomID)),
		s.StartTime.Format("02 Jan 2006"),
		s.StartTime.Format("15:04"),
		s.NumPeriods/2,
		s.Title,
	)

	kb := &models.InlineKeyboardMarkup{
		InlineKeyboard: [][]models.InlineKeyboardButton{
			{{Text: "✅ Confirm Booking", CallbackData: "wiz_action:confirm"}},
			{{Text: "⬅️ Edit Title", CallbackData: "wiz_action:back"}},
			{{Text: "❌ Cancel", CallbackData: "wiz_action:discard_booking"}},
		},
	}

	_, _ = b.EditMessageText(ctx, &bot.EditMessageTextParams{
		ChatID:      chatID,
		MessageID:   s.MessageID,
		Text:        summary,
		ParseMode:   models.ParseModeHTML,
		ReplyMarkup: kb,
	})
}
