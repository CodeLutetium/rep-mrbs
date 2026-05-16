package telegram

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	"rep-mrbs/internal/booking"
	"rep-mrbs/internal/constants"
	"rep-mrbs/internal/db"
	m "rep-mrbs/internal/models"

	"github.com/go-telegram/bot"
	"github.com/go-telegram/bot/models"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

/**
* NOTES:
* Handling the creation of new bookings via Telegram is a relatively complicated process as compared to using the API.
* There are many approaches that we can take. To simplify things, we will use a wizard to guide the user through the creation
* of a new booking. In the event that the booking is invalid (aka a clash has occured) because:
* a. Another user has booked the room in the meantime
* b. User has exceeded the booking limit for the day
* c. User has concurrent bookings
* d. Any other reasons not listed here
* The wizard will check for clashes at the very end and advice the user if the booking cannot be created.
* */

// UserBookingStates Map chatId to the current booking state
var UserBookingStates = make(map[int64]*m.BookingState)

func HandleNewBooking(ctx context.Context, b *bot.Bot, update *models.Update) {
	if update.Message == nil {
		return
	}

	// Check if user is in the process of creating a new booking
	if s, exists := UserBookingStates[update.Message.Chat.ID]; exists {
		// User has a new booking in progress and ran "/new" command again. Let user choose whether to restart over or continue from where user left off.
		log.Trace().Msg("/new is triggered by user who is in the midst of creating a new booking")

		// Clean up the "stale" wizard message to prevent button confusion
		_, _ = b.DeleteMessage(ctx, &bot.DeleteMessageParams{
			ChatID:    update.Message.Chat.ID,
			MessageID: s.MessageID,
		})

		// Prompt if user wants to create a new booking
		kb := &models.InlineKeyboardMarkup{
			InlineKeyboard: [][]models.InlineKeyboardButton{
				{{Text: "Discard previous booking", CallbackData: "wiz_action:discard_booking"}},
				{{Text: "Continue from where I left off.", CallbackData: "wiz_action:continue_booking"}},
			},
		}

		msg, err := b.SendMessage(ctx, &bot.SendMessageParams{
			ChatID:      update.Message.Chat.ID,
			Text:        "You were previously in the middle of creating a new booking, which has not been completed. Would you like to continue from where you left off or start over?",
			ParseMode:   models.ParseModeHTML,
			ReplyMarkup: kb,
		})
		if err != nil {
			log.Logger.Err(err).Msg(constants.SendTelegramMsgError)
		}

		s.MessageID = msg.ID
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
	msgID := UserBookingStates[chatID].MessageID

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
	s, exists := UserBookingStates[chatID]
	log.Debug().Interface("bookings state", s).Msg("booking state")
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
	case "wiz_action":
		switch value {
		case "discard_booking":
			log.Trace().Int64("chatID", chatID).Msg("Discard current booking")
			_, _ = b.DeleteMessage(ctx, &bot.DeleteMessageParams{
				ChatID:    chatID,
				MessageID: s.MessageID,
			})
			startBookingWizard(ctx, b, chatID)
		case "continue_booking":
			routeToStep(ctx, b, chatID, msgID, s.Step)
			return
		case "back":
			if s.Step > 0 {
				s.Step--
			}
			routeToStep(ctx, b, chatID, msgID, s.Step)
			return
		case "confirm":
			s.Step = 6
			handleCreateBooking(ctx, b, chatID)
			return
		}

	case "wiz_date":
		if s.Step != 0 {
			log.Warn().Int("step", s.Step).Msg("User tried to skip steps")
			_, _ = b.EditMessageText(ctx, &bot.EditMessageTextParams{
				ChatID:    chatID,
				MessageID: msgID,
				Text:      "⚠️ <b>Oops, an error has occured</b>\nIt appears that you have tried to skip steps. Please restart and try again.",
				ParseMode: models.ParseModeHTML,
				ReplyMarkup: &models.InlineKeyboardMarkup{
					InlineKeyboard: [][]models.InlineKeyboardButton{
						{{Text: "🔄 Restart Wizard", CallbackData: "wiz_action:discard_booking"}},
					},
				},
			})
			return
		}
		var err error
		s.StartTime, err = time.Parse("02-01-2006", value)
		if err != nil {
			log.Error().Err(err).Msg("Error parsing date")
			_, _ = b.EditMessageText(ctx, &bot.EditMessageTextParams{
				ChatID:    chatID,
				MessageID: msgID,
				Text:      "⚠️ <b>Invalid Date Format</b>\nSomething went wrong while processing the date. Please try again. If this problem persists, contact the administrator.",
				ParseMode: models.ParseModeHTML,
				ReplyMarkup: &models.InlineKeyboardMarkup{
					InlineKeyboard: [][]models.InlineKeyboardButton{
						{{Text: "🔄 Restart Wizard", CallbackData: "wiz_action:discard_booking"}},
					},
				},
			})
			return
		}
		s.Step = 1
		showRoomSelection(ctx, b, chatID, msgID)
	case "wiz_room":
		if s.Step != 1 {
			log.Warn().Int("step", s.Step).Msg("User tried to skip steps")
			_, _ = b.EditMessageText(ctx, &bot.EditMessageTextParams{
				ChatID:    chatID,
				MessageID: msgID,
				Text:      "⚠️ <b>Oops, an error has occured</b>\nIt appears that you have tried to skip steps. Please restart and try again.",
				ParseMode: models.ParseModeHTML,
				ReplyMarkup: &models.InlineKeyboardMarkup{
					InlineKeyboard: [][]models.InlineKeyboardButton{
						{{Text: "🔄 Restart Wizard", CallbackData: "wiz_action:discard_booking"}},
					},
				},
			})
			return
		}
		var err error
		s.RoomID, err = strconv.Atoi(value)
		log.Debug().Int("room_id", s.RoomID).Msg("string parsed for room id")
		if err != nil {
			log.Error().Err(err).Msg("Error converting string to int")
			_, _ = b.EditMessageText(ctx, &bot.EditMessageTextParams{
				ChatID:    chatID,
				MessageID: msgID,
				Text:      "⚠️ <b>An error has occured</b>\nSomething went wrong. Please try again. If this problem persists, contact the administrator.",
				ParseMode: models.ParseModeHTML,
				ReplyMarkup: &models.InlineKeyboardMarkup{
					InlineKeyboard: [][]models.InlineKeyboardButton{
						{{Text: "🔄 Restart Wizard", CallbackData: "wiz_action:discard_booking"}},
					},
				},
			})
			return
		}
		if s.RoomID <= 0 || s.RoomID > len(m.CachedRooms) {
			log.Error().Msg("How on earth do you even do this?? Anyway this is not a valid room id.")
			_, _ = b.EditMessageText(ctx, &bot.EditMessageTextParams{
				ChatID:    chatID,
				MessageID: msgID,
				Text:      "⚠️ <b>An error has occured</b>\nThis is not a valid room and you should never see this message! Maybe a huge renovation has occured and REP has added more rooms.",
				ParseMode: models.ParseModeHTML,
				ReplyMarkup: &models.InlineKeyboardMarkup{
					InlineKeyboard: [][]models.InlineKeyboardButton{
						{{Text: "🔄 Restart Wizard", CallbackData: "wiz_action:discard_booking"}},
					},
				},
			})
			return
		}
		s.Step = 2
		showTimeSelection(ctx, b, chatID, msgID)
	case "wiz_time":
		if s.Step != 2 {
			log.Warn().Int("step", s.Step).Msg("User tried to skip steps")
			_, _ = b.EditMessageText(ctx, &bot.EditMessageTextParams{
				ChatID:    chatID,
				MessageID: msgID,
				Text:      "⚠️ <b>Oops, an error has occured</b>\nIt appears that you have tried to skip steps. Please restart and try again.",
				ParseMode: models.ParseModeHTML,
				ReplyMarkup: &models.InlineKeyboardMarkup{
					InlineKeyboard: [][]models.InlineKeyboardButton{
						{{Text: "🔄 Restart Wizard", CallbackData: "wiz_action:discard_booking"}},
					},
				},
			})
			return

		}

		bookingTime, err := time.Parse(time.RFC3339, value)
		if err != nil {
			log.Error().Err(err).Msg("Error parsing start time")
			_, _ = b.EditMessageText(ctx, &bot.EditMessageTextParams{
				ChatID:    chatID,
				MessageID: msgID,
				Text:      "⚠️ <b>Invalid Time Format</b>\nSomething went wrong while processing the start time. Please try again. If this problem persists, contact the administrator.",
				ParseMode: models.ParseModeHTML,
				ReplyMarkup: &models.InlineKeyboardMarkup{
					InlineKeyboard: [][]models.InlineKeyboardButton{
						{{Text: "🔄 Restart Wizard", CallbackData: "wiz_action:discard_booking"}},
					},
				},
			})
			return
		}

		s.StartTime = bookingTime
		s.Step = 3
		showDurationSelection(ctx, b, chatID, msgID)
	case "wiz_duration":
		if s.Step != 3 {
			log.Warn().Int("step", s.Step).Msg("User tried to skip steps")
			_, _ = b.EditMessageText(ctx, &bot.EditMessageTextParams{
				ChatID:    chatID,
				MessageID: msgID,
				Text:      "⚠️ <b>Oops, an error has occured</b>\nIt appears that you have tried to skip steps. Please restart and try again.",
				ParseMode: models.ParseModeHTML,
				ReplyMarkup: &models.InlineKeyboardMarkup{
					InlineKeyboard: [][]models.InlineKeyboardButton{
						{{Text: "🔄 Restart Wizard", CallbackData: "wiz_action:discard_booking"}},
					},
				},
			})
			return
		}
		numMinutes, err := strconv.Atoi(value)
		if err != nil {
			log.Error().Err(err).Msg("Error parsing minutes string")
			_, _ = b.EditMessageText(ctx, &bot.EditMessageTextParams{
				ChatID:    chatID,
				MessageID: msgID,
				Text:      "⚠️ <b>An error has occured</b>\nSomething went wrong. Please try again. If this problem persists, contact the administrator.",
				ParseMode: models.ParseModeHTML,
				ReplyMarkup: &models.InlineKeyboardMarkup{
					InlineKeyboard: [][]models.InlineKeyboardButton{
						{{Text: "🔄 Restart Wizard", CallbackData: "wiz_action:discard_booking"}},
					},
				},
			})
			return
		}
		s.NumPeriods = numMinutes / 30
		s.Step = 4
		showTitlePrompt(ctx, b, chatID, msgID)
	}
}

func HandleSetTitle(ctx context.Context, b *bot.Bot, chatID int64, title string) {
	s := UserBookingStates[chatID]

	if s.Step != 4 {
		log.Warn().Int("step", s.Step).Msg("User attept to skip steps")
		_, _ = b.EditMessageText(ctx, &bot.EditMessageTextParams{
			ChatID:    chatID,
			MessageID: s.MessageID,
			Text:      "⚠️ <b>Oops, an error has occured</b>\nIt appears that you have tried to skip steps. Please restart and try again.",
			ParseMode: models.ParseModeHTML,
			ReplyMarkup: &models.InlineKeyboardMarkup{
				InlineKeyboard: [][]models.InlineKeyboardButton{
					{{Text: "🔄 Restart Wizard", CallbackData: "wiz_action:discard_booking"}},
				},
			},
		})
		return
	}

	// Set title and default description
	// Trim whitespace to avoid empty-looking titles
	cleanTitle := strings.TrimSpace(title)
	if cleanTitle == "" {
		cleanTitle = "Untitled Booking"
	}

	// Safe truncation using runes
	runes := []rune(cleanTitle)
	if len(runes) > m.MaxTitleLength {
		s.Title = string(runes[:m.MaxTitleLength])
	} else {
		s.Title = cleanTitle
	}
	s.Description = "Booked via Telegram." // default description
	s.Step = 5

	showBookingSummary(ctx, b, chatID)
}

func handleCreateBooking(ctx context.Context, b *bot.Bot, chatID int64) {
	s, exists := UserBookingStates[chatID]
	if !exists {
		log.Warn().Int64("chatID", chatID).Msg("chatID does not exist in user booking states.")
		return
	}

	// Check that all previous steps have been completed
	if s.Step != 6 {
		log.Warn().Msg("Booking was not completed.")
		_, _ = b.EditMessageText(ctx, &bot.EditMessageTextParams{
			ChatID:    chatID,
			MessageID: s.MessageID,
			Text:      "⚠️ Error: Some steps were not completed. Please ensure all steps were completed.",
			ParseMode: models.ParseModeHTML,
			ReplyMarkup: &models.InlineKeyboardMarkup{
				InlineKeyboard: [][]models.InlineKeyboardButton{
					{{Text: "🔄 Restart Wizard", CallbackData: "wiz_action:discard_booking"}},
				},
			},
		})
		return
	}

	tx := db.GormDB.Begin()

	// Fetch user details
	telegramUser, err := gorm.G[m.TelegramAuth](tx).Where("telegram_chat_id = ?", chatID).First(ctx)

	if err == gorm.ErrRecordNotFound {
		log.Error().Err(err).Msg("Telegram user not found in mrbs.telegram_auth table. Was the user removed or did the user unlink his account?")
		_, _ = b.EditMessageText(ctx, &bot.EditMessageTextParams{
			ChatID:    chatID,
			MessageID: s.MessageID,
			Text:      "Error: Telegram user not found. Please contact administrator.",
			ParseMode: models.ParseModeHTML,
			ReplyMarkup: &models.InlineKeyboardMarkup{
				InlineKeyboard: [][]models.InlineKeyboardButton{
					{{Text: "🔄 Restart Wizard", CallbackData: "wiz_action:discard_booking"}},
				},
			},
		})
		return
	}
	if err != nil {
		log.Error().Err(err).Int64("chatID", chatID).Msg("Error fetching user details from database")
		_, _ = b.EditMessageText(ctx, &bot.EditMessageTextParams{
			ChatID:    chatID,
			MessageID: s.MessageID,
			Text:      constants.DefaultErrorMsg,
			ParseMode: models.ParseModeHTML,
			ReplyMarkup: &models.InlineKeyboardMarkup{
				InlineKeyboard: [][]models.InlineKeyboardButton{
					{{Text: "🔄 Restart Wizard", CallbackData: "wiz_action:discard_booking"}},
				},
			},
		})
		return
	}

	// Convert request into new booking struct
	newBooking := m.Booking{
		UserID:      telegramUser.UserID,
		StartTime:   s.StartTime,
		EndTime:     s.StartTime.Add(time.Duration(s.NumPeriods) * 30 * time.Minute),
		TimeCreated: time.Now(),
		RoomID:      uint(s.RoomID),
		Title:       s.Title,
		Description: s.Description,
		Colour:      1,
	}

	bookingError := booking.CreateBooking(ctx, &newBooking)
	if bookingError != nil {
		_, _ = b.EditMessageText(ctx, &bot.EditMessageTextParams{
			ChatID:    chatID,
			MessageID: s.MessageID,
			Text:      bookingError.Message,
			ParseMode: models.ParseModeHTML,
			ReplyMarkup: &models.InlineKeyboardMarkup{
				InlineKeyboard: [][]models.InlineKeyboardButton{
					{{Text: "🔄 Restart Wizard", CallbackData: "wiz_action:discard_booking"}},
				},
			},
		})
		return
	}

	log.Info().Msg("booking successfully creation")

	successText := fmt.Sprintf(
		"🎉 <b>Booking success!</b>\n"+
			"Your booking has been confirmed.\n\n"+
			"🏢 <b>Room:</b> %s\n"+
			"📅 <b>Date:</b> %s\n"+
			"🕒 <b>Time:</b> %s — %s",
		m.GetRoomNameFromID(int(newBooking.RoomID)),
		newBooking.StartTime.Format("02 Jan 2006"),
		newBooking.StartTime.Format("15:04"),
		newBooking.EndTime.Format("15:04"),
	)

	_, _ = b.EditMessageText(ctx, &bot.EditMessageTextParams{
		ChatID:    chatID,
		MessageID: s.MessageID,
		Text:      successText,
		ParseMode: models.ParseModeHTML,
	})

	// Clear the state
	delete(UserBookingStates, chatID)
}

func startBookingWizard(ctx context.Context, b *bot.Bot, chatID int64) {
	UserBookingStates[chatID] = &m.BookingState{Step: 0}

	// Initial message creation
	msg, err := b.SendMessage(ctx, &bot.SendMessageParams{
		ChatID:    chatID,
		Text:      "🌟 Initializing booking wizard...",
		ParseMode: models.ParseModeHTML,
	})
	if err != nil {
		log.Error().Err(err).Msg(constants.SendTelegramMsgError)
		return
	}

	UserBookingStates[chatID].MessageID = msg.ID
	showDateSelection(ctx, b, chatID, msg.ID)
}
