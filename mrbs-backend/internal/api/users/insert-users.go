package users

import (
	"fmt"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"

	"rep-mrbs/internal/db"
	"rep-mrbs/internal/models"

	"github.com/alexedwards/argon2id"
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm/clause"
)

type InsertUsersRequest struct {
	Users string `json:"users"`
}

func HandleInsertUsers(c *gin.Context) {
	log.Info().Msg("Insert users request received.")

	var req InsertUsersRequest

	// 1. Bind the JSON body
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// 2. Prepare regex for format: #DisplayName# email
	// ^#       : Starts with #
	// ([^#]+)  : Capture Group 1 (Display Name) - anything that isn't a #
	// #        : Closing #
	// \s+      : At least one whitespace
	// (\S+)    : Capture Group 2 (Email) - anything that isn't whitespace
	re := regexp.MustCompile(`^#([^#]+)#\s+(\S+)$`)

	var parsedUsers []models.User

	// 3. Split input by newline and iterate
	lines := strings.SplitSeq(req.Users, "\n")

	defaultPassword, exists := os.LookupEnv("DEFAULT_PASSWORD")
	if !exists {
		log.Error().Msg("DEFAULT_PASSWORD not set in config/.env")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Error inserting users, please try again later. ",
		})
		return
	}

	for line := range lines {
		// Clean up whitespace (handles \r\n from Windows or extra spaces)
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		// 4. Match regex
		matches := re.FindStringSubmatch(line)
		if len(matches) == 3 {
			displayName := matches[1]
			email := matches[2]

			// 5. Extract Username (string before '@')
			emailParts := strings.Split(email, "@")
			if len(emailParts) < 2 {
				// Skip lines with invalid emails lacking '@'
				continue
			}
			username := emailParts[0]

			pwhash, err := argon2id.CreateHash(defaultPassword, argon2id.DefaultParams)
			if err != nil {
				log.Error().Err(err).Msg("Error generating pwhash")
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": "Error inserting users, please try again later.",
				})
				return
			}

			// 6. Populate User Object
			newUser := models.User{
				PublicUser: models.PublicUser{
					Name:        username,
					DisplayName: displayName,
					Email:       email,
					Level:       1,
					TimeCreated: time.Now(),
				},
				PasswordHash: pwhash,
			}

			parsedUsers = append(parsedUsers, newUser)
		}
	}

	// Bulk Insert into Database
	if len(parsedUsers) > 0 {
		result := db.GormDB.Clauses(clause.OnConflict{
			DoNothing: true,
		}).Create(&parsedUsers)

		if result.Error != nil {
			log.Error().Err(result.Error).Msg("Error inserting users")
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Database error",
			})
			return
		}
		log.Info().Int("users inserted", int(result.RowsAffected)).Msg("Users inserted into database")
	}

	// Return the parsed users to verify
	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("%v Users inserted successfully", len(parsedUsers)),
	})
}
