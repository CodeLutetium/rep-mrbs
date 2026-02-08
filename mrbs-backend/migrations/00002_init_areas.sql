-- +goose Up
-- +goose StatementBegin
CREATE TABLE mrbs.areas
(
    area_id serial NOT NULL,
    resolution interval NOT NULL DEFAULT '30 M',
    default_duration interval NOT NULL DEFAULT '1 H',
    display_name text,
    morning_starts time without time zone NOT NULL,
    evening_ends time without time zone NOT NULL,
    max_per_day integer,
    max_per_week integer,
    max_duration interval,
    PRIMARY KEY (area_id)
);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS mrbs.areas;
-- +goose StatementEnd
