-- +goose Up
-- +goose StatementBegin
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE mrbs.sessions
(
    session_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id integer NOT NULL,
    time_created timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (session_id),
    CONSTRAINT fk_users_sessions FOREIGN KEY (user_id)
        REFERENCES mrbs.users (user_id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
        NOT VALID
);

ALTER TABLE IF EXISTS mrbs.sessions
    OWNER to mrbs_admin;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP EXTENSION IF EXISTS "uuid-ossp";
DROP TABLE IF EXISTS mrbs.sessions;
-- +goose StatementEnd
