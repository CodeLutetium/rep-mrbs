-- +goose Up
ALTER TABLE mrbs.bookings ADD colour integer DEFAULT 1 NULL;

-- +goose Down
ALTER TABLE mrbs.bookings DROP COLUMN IF EXISTS colour;
