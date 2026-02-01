// Package models define models used in the database
package models

import "time"

type User struct {
	PublicUser
	PasswordHash string `gorm:"column:password_hash" json:"-"`
	ResetKeyHash string `gorm:"column:reset_key_hash" json:"-"`
}

type PublicUser struct {
	UserID      uint      `gorm:"column:user_id; primaryKey; autoIncrement" json:"user_id"`
	Level       int       `gorm:"column:level" json:"level"`
	Name        string    `gorm:"column:name" json:"name"`
	DisplayName string    `gorm:"column:display_name" json:"display_name"`
	Email       string    `gorm:"column:email" json:"email"`
	TimeCreated time.Time `gorm:"column:time_created" json:"time_created"`
	LastLogin   time.Time `gorm:"column:last_login" json:"last_login"`
}

func (User) TableName() string {
	return "mrbs.users"
}

func (PublicUser) TableName() string {
	return "mrbs.users"
}
