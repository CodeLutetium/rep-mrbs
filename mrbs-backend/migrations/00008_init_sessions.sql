-- +goose Up
-- +goose StatementBegin
CREATE TABLE mrbs.sessions
(
    session_key text NOT NULL,
    user_id integer NOT NULL,
    time_created timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (session_key)
);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS mrbs.sessions;
-- +goose StatementEnd
