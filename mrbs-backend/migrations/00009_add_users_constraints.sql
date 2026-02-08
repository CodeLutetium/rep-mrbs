-- +goose Up
-- +goose StatementBegin
ALTER TABLE IF EXISTS mrbs.users
    ADD CONSTRAINT unique_name UNIQUE (name);

ALTER TABLE IF EXISTS mrbs.users
    ADD CONSTRAINT unique_email UNIQUE (email);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE IF EXISTS mrbs.users
    DROP CONSTRAINT unique_email unique_name;
-- +goose StatementEnd
