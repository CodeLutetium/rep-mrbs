// Package users defines functions for admins to manage users.
package users

import (
	"rep-mrbs/internal/api"

	"github.com/gin-gonic/gin"
)

func RegisterUserRoutes(router *gin.RouterGroup) {
	router.GET("/", api.AuthGuard(2), HandleGetAllUsers)
	router.POST("/new", api.AuthGuard(2), HandleInsertUsers)
	router.DELETE("/:user", api.AuthGuard(2), HandleDeleteUser)
	router.POST("/:user", api.AuthGuard(2), HandlePromoteUser)
}
