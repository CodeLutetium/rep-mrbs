-- +goose Up
-- +goose StatementBegin
CREATE TABLE mrbs.rooms
(
    room_id serial NOT NULL,
    area_id serial NOT NULL,
    display_name text NOT NULL,
    sort_key text NOT NULL,
    description text,
    capacity integer,
    admin_email text,
    PRIMARY KEY (room_id),
    CONSTRAINT fk_areas_rooms FOREIGN KEY (area_id)
        REFERENCES mrbs.areas (area_id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
        NOT VALID
);

ALTER TABLE IF EXISTS mrbs.rooms
    OWNER to mrbs_admin;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS mrbs.rooms;
-- +goose StatementEnd
