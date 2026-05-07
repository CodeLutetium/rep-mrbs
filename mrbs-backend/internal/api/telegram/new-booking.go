package telegram

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	"rep-mrbs/internal/constants"
	"rep-mrbs/internal/db"
	m "rep-mrbs/internal/models"

	"github.com/go-telegram/bot"
	"github.com/go-telegram/bot/models"
	"github.com/rs/zerolog/log"
)

// Map chatId to the current booking state
var userStates = make(map[int64]*m.BookingState)

func HandleNewBooking(ctx context.Context, b *bot.Bot, update *models.Update) {
	if update.Message == nil {
		return
	}

	// Check if user is in the process of creating a new booking
	if _, exists := userStates[update.Message.Chat.ID]; exists {
		// User has a new booking in progress and ran "/new" command again. Let user choose whether to restart over or continue from where user left off.
		log.Trace().Msg("/new is triggered by user who is in the midst of creating a new booking")

		// Prompt if user wants to create a new booking
		kb := &models.InlineKeyboardMarkup{
			InlineKeyboard: [][]models.InlineKeyboardButton{
				{{Text: "Discard previous booking", CallbackData: "discard_booking"}},
				{{Text: "Continue from where I left off.", CallbackData: "continue_booking"}},
			},
		}

		if _, err := b.SendMessage(ctx, &bot.SendMessageParams{
			ChatID:      update.Message.Chat.ID,
			Text:        "You were previously in the middle of creating a new booking, which has not been completed. Would you like to continue from where you left off or start over?",
			ParseMode:   models.ParseModeHTML,
			ReplyMarkup: kb,
		}); err != nil {
			log.Logger.Err(err).Msg(constants.SendTelegramMsgError)
		}
		return
	}

	startBookingWizard(ctx, b, update.Message.Chat.ID)
}

func OnWizardCallback(ctx context.Context, b *bot.Bot, update *models.Update) {
	if update.CallbackQuery == nil {
		return
	}

	// 1. Always answer the callback immediately to stop the UI spinner
	_, err := b.AnswerCallbackQuery(ctx, &bot.AnswerCallbackQueryParams{
		CallbackQueryID: update.CallbackQuery.ID,
	})
	if err != nil {
		log.Error().Err(err).Msg("Error answering callback query")
		return
	}

	data := update.CallbackQuery.Data
	chatID := update.CallbackQuery.Message.Message.Chat.ID
	msgID := userStates[chatID].MessageID

	// 2. Parse the data (e.g., "wiz_room:3")
	// Use SplitN to ensure we only get two parts: the action and the value
	parts := strings.SplitN(data, ":", 2)
	if len(parts) < 2 {
		log.Warn().Str("data", data).Msg("Malformed callback data received")
		return
	}

	action := parts[0] // e.g., "wiz_date"
	value := parts[1]  // e.g., "today"

	// 3. Send to the Dispatcher
	BookingWizardDispatcher(ctx, b, chatID, msgID, action, value)
}

func BookingWizardDispatcher(ctx context.Context, b *bot.Bot, chatID int64, msgID int, action string, value string) {
	s, exists := userStates[chatID]
	if !exists {
		startBookingWizard(ctx, b, chatID)
	}
	_, err := b.EditMessageText(ctx, &bot.EditMessageTextParams{
		ChatID:    chatID,
		MessageID: msgID,
		Text:      "Processing...",
	})
	// Edits may fail if the original message is deleted or stale (>48 hours old)
	if err != nil {
		log.Warn().Err(err).Msg("Edit failed, falling back to SendMessage")

		// Failover: Send a new message to "respawn" the wizard
		newMsg, sendErr := b.SendMessage(ctx, &bot.SendMessageParams{
			ChatID: chatID,
			Text:   "⚠️ Your session was interrupted or the message is too old. Continuing here...",
		})

		if sendErr == nil {
			// Update state with new message id
			s.MessageID = newMsg.ID
			msgID = newMsg.ID
		}
	}

	switch action {
	case "wiz_date":
		if s.Step != 0 {
			log.Warn().Msg("User tried to skip steps")
			return
		}
		var err error
		s.Date, err = time.Parse("02-01-2006", value)
		if err != nil {
			log.Error().Err(err).Msg("Error parsing date")
		}
		s.Step = 1
		showRoomSelection(ctx, b, chatID, msgID)
	case "wiz_room":
		if s.Step != 1 {
			log.Warn().Msg("User tried to skip steps")
			return
		}
		var err error
		s.RoomID, err = strconv.Atoi(value)
		log.Debug().Int("room_id", s.RoomID).Msg("string parsed for room id")
		if err != nil {
			log.Error().Err(err).Msg("Error converting string to int")
			return
		}
		if s.RoomID <= 0 || s.RoomID > len(m.CachedRooms) {
			log.Error().Msg("How on earth do you even do this?? Anyway this is not a valid room id.")
			return
		}
		s.Step = 2
		showTimeSelection(ctx, b, chatID, msgID)
	}
	// REMOVE
	log.Debug().Interface("booking state", s).Msg("Current booking state")
}

func startBookingWizard(ctx context.Context, b *bot.Bot, chatID int64) {
	userStates[chatID] = &m.BookingState{Step: 0}

	var rows [][]models.InlineKeyboardButton

	// Generate buttons for today and the next 2 days
	for i := range 3 {
		targetDate := time.Now().AddDate(0, 0, i)

		// Button Display: "07 May 2026"
		displayText := targetDate.Format("02 Jan 2006")

		// Callback Data: "wiz_date:07-05-2026"
		callbackVal := targetDate.Format("02-01-2006")

		rows = append(rows, []models.InlineKeyboardButton{
			{
				Text:         displayText,
				CallbackData: "wiz_date:" + callbackVal,
			},
		})
	}

	kb := &models.InlineKeyboardMarkup{InlineKeyboard: rows}
	msg, err := b.SendMessage(ctx, &bot.SendMessageParams{
		ChatID:      chatID,
		Text:        "📅 <b>Step 1: Select Date</b>\nWhen would you like to book? <i>(Yeah the dates are kinda limited here, use the website if you want to book Alan Turing 4 years ahead.)</i>",
		ParseMode:   models.ParseModeHTML,
		ReplyMarkup: kb,
	})
	if err != nil {
		log.Logger.Err(err).Msg(constants.SendTelegramMsgError)
	}

	userStates[chatID].MessageID = msg.ID
	log.Debug().Int("MessageID", msg.ID).Msg("Booking wizard started")
}

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

func showTimeSelection(ctx context.Context, b *bot.Bot, chatID int64, msgID int) {
	state, ok := userStates[chatID]
	if !ok {
		sendError(ctx, b, chatID)
		return
	}

	// 1. Define bounds for the selected date
	loc, _ := time.LoadLocation("Asia/Singapore")
	now := time.Now().In(loc)

	dateStr := state.Date.Format("2006-01-02")
	endRange := state.Date.AddDate(0, 0, 1).Format("2006-01-02 02:00+08")

	var startRange string
	isToday := state.Date.Format("2006-01-02") == now.Format("2006-01-02")

	if isToday {
		startRange = now.Format(time.RFC3339)
	} else {
		startRange = fmt.Sprintf("%s 08:00+08", dateStr)
	}

	log.Debug().Str("start range", startRange).Msg("")

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
		// Mark every 30-min slot between StartTime and EndTime as busy
		curr := bk.StartTime
		for curr.Before(bk.EndTime) {
			busySlots[curr.Format("15:04")] = true
			curr = curr.Add(30 * time.Minute)
		}
	}

	// 4. Generate the keyboard (8 AM to 2 AM)
	var rows [][]models.InlineKeyboardButton
	var currentRow []models.InlineKeyboardButton

	slotTimeIter, _ := time.ParseInLocation("15:04", "08:00", loc)

	for range 36 {
		slotTimeStr := slotTimeIter.Format("15:04")

		slotDate := state.Date
		if slotTimeIter.Hour() < 8 {
			slotDate = state.Date.AddDate(0, 0, 1)
		}

		// --- NEW LOGIC: Filter past slots if today ---
		if isToday {
			// Build the full timestamp for this specific slot
			// state.Date provides the Y-M-D, slotTimeStr provides the H:M
			fullSlotTime, _ := time.ParseInLocation("2006-01-02 15:04", slotDate.Format("2006-01-02")+" "+slotTimeStr, loc)

			// If the slot is in the past, skip it
			if fullSlotTime.Before(now) {
				slotTimeIter = slotTimeIter.Add(30 * time.Minute)
				continue
			}
		}

		// Only add if not busy
		if !busySlots[slotTimeStr] {
			btn := models.InlineKeyboardButton{
				Text:         slotTimeStr,
				CallbackData: fmt.Sprintf("wiz_time:%s", slotTimeStr),
			}
			currentRow = append(currentRow, btn)
		}

		if len(currentRow) == 4 {
			rows = append(rows, currentRow)
			currentRow = []models.InlineKeyboardButton{}
		}
		slotTimeIter = slotTimeIter.Add(30 * time.Minute)
	}

	if len(currentRow) > 0 {
		rows = append(rows, currentRow)
	}
	// 5. Update UI
	text := fmt.Sprintf("🕒 <b>Step 3: Select Start Time</b>\nRoom: %s\nDate: %s\n\nOnly available slots are shown.",
		m.GetRoomNameFromID(int(state.RoomID)), state.Date.Format("02 Jan"))

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
