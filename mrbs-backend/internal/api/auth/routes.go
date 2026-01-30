// Package auth contains all handlers for authentication related functionality
package auth

import "github.com/gin-gonic/gin"

func RegisterAuthRoutes(router *gin.RouterGroup) {
	router.POST("/login", func(ctx *gin.Context) {
		HandleLogin(ctx)
	})
}
