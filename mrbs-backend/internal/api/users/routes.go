// Package users defines functions for admins to manage users.
package users

import "github.com/gin-gonic/gin"

func RegisterUserRoutes(router *gin.RouterGroup) {
	router.GET("/", HandleGetAllUsers)
	router.POST("/new", HandleInsertUsers)
	router.DELETE("/:user", HandleDeleteUser)
	router.POST("/:user", HandlePromoteUser)
}
