package main

import (
	"os"

	"rep-mrbs/internal/api"
	"rep-mrbs/internal/api/auth"
	"rep-mrbs/internal/api/bookings"
	"rep-mrbs/internal/api/users"
	"rep-mrbs/internal/db"

	"github.com/alexedwards/argon2id"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func init() {
	_ = godotenv.Load("./config/.env")

	_, exists := os.LookupEnv("SESSION_KEY_LIFETIME")
	if !exists {
		log.Fatal().Msg("SESSION_KEY_LIFETIME is not set in config/.env")
	}
}

func main() {
	// Configure Logger
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})

	db.Init()

	pw, err := argon2id.CreateHash("1234", argon2id.DefaultParams)
	if err != nil {
		log.Error().Err(err).Msg("")
	}
	log.Debug().Msg(pw)

	router := gin.Default()

	// Auth routes
	authGroup := router.Group("/api/auth")
	auth.RegisterAuthRoutes(authGroup)

	// Booking routes
	bookingGroup := router.Group("/api/bookings")
	bookings.RegisterBookingRoutes(bookingGroup)

	// User routes
	userGroup := router.Group("/api/users", api.AuthGuard(2))
	users.RegisterUserRoutes(userGroup)

	_ = router.Run()
}
