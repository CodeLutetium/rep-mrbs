package models

import (
	"context"

	"rep-mrbs/internal/db"

	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

type Room struct {
	RoomID      uint   `gorm:"column:room_id; primaryKey"`
	AreaID      uint   `gorm:"column:area_id"`
	DisplayName string `gorm:"column:display_name"`
	SortKey     string `gorm:"column:sort_key"`
	Description string `gorm:"column:description"`
	Capacity    uint   `gorm:"column:capacity"`
	AdminEmail  string `gorm:"column:admin_email"`
}

// CachedRooms global cache for rooms, use this instead of querying database directly.
var CachedRooms []Room

// InitRooms fetches rooms from the DB once at startup
func InitRooms() error {
	var err error
	CachedRooms, err = gorm.G[Room](db.GormDB).Order("room_id ASC").Find(context.Background())
	if err != nil {
		log.Error().Err(err).Msg("Error fetching rooms from database")
		return err
	}
	log.Info().Int("count", len(CachedRooms)).Msg("Room cache initialized")
	return nil
}

var roomNames = [...]string{
	"",
	"Seminar Room 1",
	"Seminar Room 2",
	"Alan Turing",
	"Da Vinci",
	"Isaac Newton",
	"Marie Curie",
	"Michael Faraday",
	"Nikola Tesla",
	"Thomas Edison",
}

func GetRoomNameFromID(r int) string {
	if r < 1 || int(r) >= len(roomNames) {
		return ""
	}
	// Simply return the string at the index
	return roomNames[r]
}
