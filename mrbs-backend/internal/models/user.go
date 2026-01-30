// Package models define models used in the database
package models

import "time"

type User struct {
	UserID       uint      `gorm:"column:user_id; primaryKey; autoIncrement"`
	Level        int       `gorm:"column:level"`
	Name         string    `gorm:"column:name"`
	DisplayName  string    `gorm:"column:display_name"`
	PasswordHash string    `gorm:"column:password_hash"`
	Email        string    `gorm:"column:email"`
	TimeCreated  time.Time `gorm:"column:time_created"`
	LastLogin    string    `gorm:"column:last_login"`
	ResetKeyHash string    `gorm:"column:reset_key_hash"`
}

func (User) TableName() string {
	return "mrbs.users"
}
