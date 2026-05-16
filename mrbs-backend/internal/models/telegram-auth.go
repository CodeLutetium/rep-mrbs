package models

import "time"

type TelegramAuth struct {
	UserID         uint      `gorm:"column:user_id; primaryKey" json:"user_id"`
	TelegramChatID *int64    `gorm:"column:telegram_chat_id; unique" json:"telegram_chat_id"` // NULL: not set yet
	AuthToken      string    `gorm:"column:auth_token" json:"auth_token"`                     // start token
	CreatedAt      time.Time `gorm:"column:created_at" json:"created_at"`
}

func (TelegramAuth) TableName() string {
	return "mrbs.telegram_auth"
}
