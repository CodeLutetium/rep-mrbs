-- +goose Up
-- +goose StatementBegin
CREATE TABLE mrbs.bookings
(
    booking_id serial NOT NULL,
    user_id serial NOT NULL,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    room_id serial NOT NULL,
    time_created timestamp with time zone NOT NULL DEFAULT now(),
    title text NOT NULL,
    description text,
    ical_uid text,
    ical_seq integer,
    PRIMARY KEY (booking_id),
    CONSTRAINT fk_users_bookings FOREIGN KEY (user_id)
        REFERENCES mrbs.users (user_id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
        NOT VALID,
    CONSTRAINT fk_rooms_bookings FOREIGN KEY (room_id)
        REFERENCES mrbs.rooms (room_id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
        NOT VALID
);

ALTER TABLE IF EXISTS mrbs.bookings
    OWNER to mrbs_admin;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS mrbs.bookings;
-- +goose StatementEnd
