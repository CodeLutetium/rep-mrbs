-- +goose Up
-- +goose StatementBegin
CREATE TABLE mrbs.telegram_auth (
    user_id INT PRIMARY KEY REFERENCES mrbs.users(user_id) ON DELETE CASCADE,
    telegram_chat_id BIGINT UNIQUE,
    auth_token TEXT, 
    created_at TIMESTAMP DEFAULT NOW()
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF exists mrbs.telegram_auth;
-- +goose StatementEnd
