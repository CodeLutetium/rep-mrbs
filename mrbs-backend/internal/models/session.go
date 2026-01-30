package models

import (
	"crypto/rand"
	"encoding/base64"
	"time"

	"github.com/rs/zerolog/log"
)

type Session struct {
	SessionKey  string    `gorm:"column:session_key;primaryKey"`
	UserID      uint      `gorm:"column:user_id"`
	TimeCreated time.Time `gorm:"column:time_created"`
}

func GenerateSessionKey() (string, error) {
	b := make([]byte, 48)
	_, err := rand.Read(b)
	if err != nil {
		log.Error().Err(err).Msg("Error generating session key, empty string is returned.")
		return "", err
	}

	return base64.RawURLEncoding.EncodeToString(b), nil
}
