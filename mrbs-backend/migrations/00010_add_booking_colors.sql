-- +goose Up
-- +goose StatementBegin
ALTER TABLE mrbs.bookings ADD colour integer DEFAULT 1 NULL;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE mrbs.bookings DROP COLUMN IF EXISTS colour;
-- +goose StatementEnd
