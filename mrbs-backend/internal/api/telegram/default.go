package telegram

import (
	"context"

	"github.com/go-telegram/bot"
	"github.com/go-telegram/bot/models"
	"github.com/rs/zerolog/log"
)

func DefaultBotHandler(c context.Context, b *bot.Bot, update *models.Update) {
	log.Info().Interface("chat id", update.Message.Chat.ID).Msg("ping")
	_, _ = b.SendMessage(c, &bot.SendMessageParams{
		ChatID: update.Message.Chat.ID,
		Text:   "hello",
	})
}
