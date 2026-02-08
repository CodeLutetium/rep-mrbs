package models

type Room struct {
	RoomID      uint   `gorm:"column:room_id; primaryKey"`
	AreaID      uint   `gorm:"column:area_id"`
	DisplayName string `gorm:"column:display_name"`
	SortKey     string `gorm:"column:sort_key"`
	Description string `gorm:"column:description"`
	Capacity    uint   `gorm:"column:capacity"`
	AdminEmail  string `gorm:"column:admin_email"`
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
