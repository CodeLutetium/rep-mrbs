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
