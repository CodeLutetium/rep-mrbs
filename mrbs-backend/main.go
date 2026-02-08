package main

import (
	"embed"
	"io"
	"io/fs"
	"net/http"
	"os"
	"strings"

	"rep-mrbs/internal/api"
	"rep-mrbs/internal/api/auth"
	"rep-mrbs/internal/api/bookings"
	"rep-mrbs/internal/api/users"
	"rep-mrbs/internal/db"

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

//go:embed dist/*
var staticFiles embed.FS

func main() {
	// Configure Logger
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})

	db.Init()

	router := gin.Default()

	// API routes
	apiGroup := router.Group("/api")
	// Auth routes
	authGroup := apiGroup.Group("/auth")
	auth.RegisterAuthRoutes(authGroup)

	// Booking routes
	bookingGroup := apiGroup.Group("/bookings")
	bookings.RegisterBookingRoutes(bookingGroup)

	// User routes
	userGroup := apiGroup.Group("/users", api.AuthGuard(2))
	users.RegisterUserRoutes(userGroup)

	// Static routes
	distFS, _ := fs.Sub(staticFiles, "dist")
	router.Use(func(c *gin.Context) {
		if strings.HasPrefix(c.Request.URL.Path, "/api/") {
			c.Next()
			return
		}

		path := strings.TrimPrefix(c.Request.URL.Path, "/")
		if path == "" {
			path = "index.html"
		}

		file, err := distFS.Open(path)
		if err != nil {
			c.Next() // File not found, continue to SPA fallback
			return
		}
		defer func() {
			if err := file.Close(); err != nil {
				log.Error().Err(err).Msg("Failed to close file")
			}
		}()

		stat, _ := file.Stat()
		if stat.IsDir() {
			c.Next()
			return
		}

		http.ServeContent(c.Writer, c.Request, path, stat.ModTime(), file.(io.ReadSeeker))
		c.Abort()
	})

	// SPA fallback: serve index.html for client-side routes
	router.NoRoute(func(c *gin.Context) {
		if strings.HasPrefix(c.Request.URL.Path, "/api/") {
			c.JSON(404, gin.H{"error": "Not found"})
			return
		}

		file, _ := distFS.Open("index.html")
		stat, _ := file.Stat()
		http.ServeContent(c.Writer, c.Request, "index.html", stat.ModTime(), file.(io.ReadSeeker))
	})
	_ = router.Run()
}
