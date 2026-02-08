-- The "mrbs_admin" username is set in many places, do not change.
-- +goose Up
-- +goose StatementBegin
CREATE SCHEMA mrbs
    AUTHORIZATION "mrbs_admin";
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP SCHEMA IF EXISTS mrbs;
-- +goose StatementEnd
