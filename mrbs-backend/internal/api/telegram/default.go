package telegram

import (
	"context"

	"github.com/go-telegram/bot"
	"github.com/go-telegram/bot/models"
	"github.com/rs/zerolog/log"
)

func DefaultBotHandler(c context.Context, b *bot.Bot, update *models.Update) {
	if update.Message == nil {
		return
	}

	log.Info().Interface("chat id", update.Message.Chat.ID).Msg("Text message received")

	// Check if user is in the new booking wizard
	s, exists := UserBookingStates[update.Message.Chat.ID]
	if exists && s.Step == 4 {
		// handle capture title
		HandleSetTitle(c, b, update.Message.Chat.ID, update.Message.Text)
		return
	}
	_, _ = b.SendMessage(c, &bot.SendMessageParams{
		ChatID: update.Message.Chat.ID,
		Text:   "Welcome to REP Meeting Room booking bot! To create a new booking, type /new. To view the list of bookings today, type /list.",
	})
}
