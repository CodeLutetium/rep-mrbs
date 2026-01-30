// Package db manage connections to the Postgres DB instance through a connection pool
package db

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose"
	"github.com/rs/zerolog/log"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/schema"
)

var (
	Pool   *pgxpool.Pool // can be removed if not used, this was taken from another project which used pgx instead of gorm.
	GormDB *gorm.DB
)

func Init() {
	pgPassword, exists := os.LookupEnv("POSTGRES_PW")
	if !exists {
		log.Panic().Msg("POSTGRES_DB not found in .env")
	}

	pgDatabase, exists := os.LookupEnv("POSTGRES_DB")
	if !exists {
		log.Panic().Msg("POSTGRES_DB not found in .env")
	}

	pgUsername, exists := os.LookupEnv("PG_USERNAME")
	if !exists {
		log.Panic().Msg("POSTGRES_USERNAME not found in .env")
	}

	pgPort := "5432" // hardcoded val

	pgSSLMode, exists := os.LookupEnv("PG_SSL_MODE")
	if !exists {
		log.Panic().Msg("PG_SSL_MODE not found in .env")
	}

	pgNetLoc, exists := os.LookupEnv("PG_NET_LOC")
	if !exists {
		log.Panic().Msg("PG_NET_LOC not found in .env")
	}

	connStr := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s", pgUsername, pgPassword, pgNetLoc, pgPort, pgDatabase, pgSSLMode)

	pool, err := pgxpool.New(context.Background(), connStr)
	if err != nil {
		log.Panic().Err(err).Msg("")
	}

	Pool = pool

	db := stdlib.OpenDBFromPool(Pool)

	gormDB, err := gorm.Open(postgres.New(postgres.Config{Conn: db}), &gorm.Config{NamingStrategy: schema.NamingStrategy{
		TablePrefix:   "mrbs.",
		SingularTable: false,
	}})
	if err != nil {
		log.Panic().Err(err).Msg("")
	}
	GormDB = gormDB
	log.Info().Msg("Postgres connection pool established")

	// Perform migrations
	if err := goose.Up(db, "migrations"); err != nil {
		log.Panic().Err(err)
	}
	log.Info().Msg("Goose migrations applied")
}
