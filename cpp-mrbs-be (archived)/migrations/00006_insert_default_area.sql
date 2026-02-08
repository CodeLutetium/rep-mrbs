-- +goose Up
-- +goose StatementBegin
INSERT INTO mrbs.areas(
	resolution, default_duration, display_name, morning_starts, evening_ends, max_per_day, max_per_week, max_duration)
	VALUES ('30M', '1H', 'REP North Hill Rooms', '08:00 AM'::TIME, '02:00 AM'::TIME, 2, 5, '3 H');
	
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DELETE FROM mrbs.areas WHERE display_name='REP North Hill Rooms';
-- +goose StatementEnd
