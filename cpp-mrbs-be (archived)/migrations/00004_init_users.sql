-- +goose Up
-- +goose StatementBegin
CREATE TABLE mrbs.users
(
    user_id serial NOT NULL,
    level integer NOT NULL DEFAULT 1,
    name text,
    display_name text,
    password_hash text,
    email text,
    time_created timestamp with time zone NOT NULL DEFAULT now(),
    last_login timestamp with time zone,
    reset_key_hash text,
    PRIMARY KEY (user_id)
);

ALTER TABLE IF EXISTS mrbs.users
    OWNER to mrbs_admin;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS mrbs.users;
-- +goose StatementEnd
