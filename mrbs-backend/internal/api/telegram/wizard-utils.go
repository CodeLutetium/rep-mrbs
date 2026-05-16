package telegram

import (
	"context"

	"github.com/go-telegram/bot"
	"github.com/go-telegram/bot/models"
)

// Utiity function to add back button
func addBackButtonToRows(rows [][]models.InlineKeyboardButton) [][]models.InlineKeyboardButton {
	backButtonRow := []models.InlineKeyboardButton{
		{Text: "⬅️ Back", CallbackData: "wiz_action:back"},
	}
	return append(rows, backButtonRow)
}

func routeToStep(ctx context.Context, b *bot.Bot, chatID int64, msgID int, step int) {
	switch step {
	case 0:
		showDateSelection(ctx, b, chatID, msgID)
	case 1:
		showRoomSelection(ctx, b, chatID, msgID)
	case 2:
		showTimeSelection(ctx, b, chatID, msgID)
	case 3:
		showDurationSelection(ctx, b, chatID, msgID)
	case 4:
		showTitlePrompt(ctx, b, chatID, msgID)
	case 5:
		showBookingSummary(ctx, b, chatID)
	}
}
