// Package telegram contains all handlers for telegram bot
package telegram

import (
	"context"
	"net/http"
	"os"

	"rep-mrbs/internal/api"

	"github.com/gin-gonic/gin"
	"github.com/go-telegram/bot"
	"github.com/joho/godotenv"
	"github.com/rs/zerolog/log"
)

func SetupBot(ctx context.Context) (http.Handler, error) {
	_ = godotenv.Load("./config/.env")
	telegramBotToken, exists := os.LookupEnv("TELEGRAM_BOT_TOKEN")
	if !exists {
		log.Warn().Msg("TELEGRAM_BOT_TOKEN is not set in config/.env")
	}

	telegramWebhookToken, exists := os.LookupEnv("TELEGRAM_WEBHOOK_TOKEN")
	if !exists {
		log.Warn().Msg("TELEGRAM_WEBHOOK_TOKEN is not set in config/.env")
	}

	opts := []bot.Option{
		bot.WithDefaultHandler(DefaultBotHandler),
		bot.WithWebhookSecretToken(telegramWebhookToken),
	}

	b, err := bot.New(telegramBotToken, opts...)
	if err != nil {
		log.Warn().Msg("Error starting telegram bot")
		return nil, err
	}

	// Register commands
	b.RegisterHandler(bot.HandlerTypeMessageText, "/start", bot.MatchTypePrefix, HandleStartChat)
	b.RegisterHandler(bot.HandlerTypeMessageText, "/list", bot.MatchTypePrefix, HandleListBookings)
	b.RegisterHandler(bot.HandlerTypeMessageText, "/new", bot.MatchTypePrefix, HandleNewBooking)
	b.RegisterHandler(bot.HandlerTypeCallbackQueryData, "wiz_", bot.MatchTypePrefix, OnWizardCallback) // callback handler for new booking wizard
	go b.StartWebhook(ctx)

	return b.WebhookHandler(), nil
}

func RegisterTelegramRoutes(router *gin.RouterGroup) {
	botHandler, err := SetupBot(context.Background())
	if err == nil {
		log.Info().Msg("Telegram webhook is active")
		router.Any("/webhook", func(c *gin.Context) {
			botHandler.ServeHTTP(c.Writer, c.Request)
		})
	} else {
		log.Error().Err(err).Msg("Telegram webhook is not running")
	}
	router.GET("/get-code", api.AuthGuard(1), HandleCreateNewCode)
}
