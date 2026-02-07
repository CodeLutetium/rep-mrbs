// Package auth contains all handlers for authentication related functionality
package auth

import (
	"rep-mrbs/internal/api"

	"github.com/gin-gonic/gin"
)

func RegisterAuthRoutes(router *gin.RouterGroup) {
	router.POST("/login", HandleLogin)
	router.POST("/logout", api.AuthGuard(1), HandleLogout)
	router.POST("/change-password", api.AuthGuard(1), HandleChangePassword)
}
