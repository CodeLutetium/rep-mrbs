// Package bookings contain all route handlers for managing bookings
package bookings

import (
	"rep-mrbs/internal/api"

	"github.com/gin-gonic/gin"
)

func RegisterBookingRoutes(router *gin.RouterGroup) {
	// login not required to view bookings.
	router.GET("/", HandleGetBookings)

	router.POST("/new", api.AuthGuard(1), HandleNewBooking)
	router.DELETE("/", api.AuthGuard(1), HandleDeleteBooking)
}
