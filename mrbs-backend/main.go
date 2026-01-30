package main

import (
	"log/slog"
	"os"

	"rep-mrbs/internal/api/auth"
	"rep-mrbs/internal/db"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func main() {
	// Configure Logger
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})

	_ = godotenv.Load("./config/.env")

	db.Init()

	router := gin.Default()
	router.GET("/", func(ctx *gin.Context) {
		slog.Info("inside the handler", "user_id", 123)

		ctx.JSON(200, gin.H{"ping": "pong"})
	})

	// Auth routes
	authGroup := router.Group("/api/auth")
	auth.RegisterAuthRoutes(authGroup)

	_ = router.Run()
}
