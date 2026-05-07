package telegram

import (
	"context"
	"fmt"
	"strings"
	"time"

	"rep-mrbs/internal/constants"
	"rep-mrbs/internal/db"
	m "rep-mrbs/internal/models"

	"github.com/go-telegram/bot"
	"github.com/go-telegram/bot/models"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

// HandleStartChat assigns the chat_id to the user_id when a new chat is started.
func HandleStartChat(ctx context.Context, b *bot.Bot, update *models.Update) {
	if update.Message == nil {
		return
	}

	log.Info().Int64("chatID", update.Message.Chat.ID).Msg("/start command activated")

	// Message format: "/start <start_code>"
	parts := strings.Split(update.Message.Text, " ")

	tx := db.GormDB.Begin()
	defer tx.Rollback()

	// /start with no code provided
	if len(parts) < 2 {
		// Check if user has already linked their account
		_, err := gorm.G[m.TelegramAuth](tx).Where("telegram_chat_id = ?", update.Message.Chat.ID).Take(context.Background())
		if err == gorm.ErrRecordNotFound {
			_, err := b.SendMessage(ctx, &bot.SendMessageParams{
				ChatID: update.Message.Chat.ID,
				Text:   fmt.Sprintf("Welcome to REP Meeting Room booking bot! Please use the code on %s/link-telegram to link your account.", constants.MRBSWebsiteURL),
			})
			if err != nil {
				log.Error().Err(err).Msg("Error sending telegram message")
			}
			return
		}

		// User has already linked their account
		_, err = b.SendMessage(ctx, &bot.SendMessageParams{
			ChatID: update.Message.Chat.ID,
			Text:   "Welcome to REP Meeting Room booking bot! You can type your request in the chat, or use the commands /new to create a new booking and /list to show all bookings.",
		})
		if err != nil {
			log.Error().Err(err).Msg("Error sending telegram message")
		}
		return
	}

	// Verify start_code with database
	startCode := parts[1]

	timeLimit := time.Now().Add(-5 * time.Minute) // Time 5 minutes ago - ensures that we fetch fresh auth code (created within last 5 Minutes)
	row, err := gorm.G[m.TelegramAuth](tx).Where("auth_token = ?", startCode).Where("created_at >= ?", timeLimit).Take(context.Background())
	if err == gorm.ErrRecordNotFound {
		log.Error().Err(err).Msg("Start code expired or not found in database")
		_, err := b.SendMessage(ctx, &bot.SendMessageParams{
			ChatID: update.Message.Chat.ID,
			Text:   fmt.Sprintf("We had trouble linking your account. Please scan the code on %s/link-telegram and complete linking within 5 minutes", constants.MRBSWebsiteURL),
		})
		if err != nil {
			log.Error().Err(err).Msg("Error sending telegram message")
		}
		return
	}
	// Unknown error
	if err != nil {
		log.Error().Err(err).Msg("Error fetching auth code from database")
		_, err := b.SendMessage(ctx, &bot.SendMessageParams{
			ChatID: update.Message.Chat.ID,
			Text:   "We had trouble linking your account. Please try again later. If this problem persists, contact the administrator.",
		})
		if err != nil {
			log.Error().Err(err).Msg("Error sending telegram message")
		}
		return
	}

	row.TelegramChatID = &update.Message.Chat.ID
	log.Debug().Int64("ChatID", *row.TelegramChatID).Msg("Code linked to chatID")

	// Write to database
	tx.Save(&row)
	tx.Commit()
	log.Debug().Msg("chatID saved to database")

	_, err = b.SendMessage(ctx, &bot.SendMessageParams{
		ChatID: update.Message.Chat.ID,
		Text:   "Account linked successfully. Welcome to REP Meeting Room Booking bot!",
	})
	if err != nil {
		log.Error().Err(err).Msg("Error sending telegram message")
	}
}
