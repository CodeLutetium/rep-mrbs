-- +goose Up
-- +goose StatementBegin
WITH NH_AREA_ID AS (
    SELECT AREA_ID FROM mrbs.areas WHERE display_name='REP North Hill Rooms'
)
INSERT INTO mrbs.rooms (area_id, display_name, sort_key, description, capacity, admin_email)
SELECT NH.AREA_ID, RoomData.dn, RoomData.sk, RoomData.desc, RoomData.cap, ''
FROM NH_AREA_ID NH
CROSS JOIN (
    SELECT 'Seminar Room 1' AS dn, '1' AS sk, '' AS desc, 50 AS cap UNION ALL
    SELECT 'Seminar Room 2', '2', '', 4 UNION ALL
    SELECT 'Alan Turing', 'Alan Turing', '', 4 UNION ALL
    SELECT 'Da Vinci', 'Da Vinci', '', 10 UNION ALL
    SELECT 'Isaac Newton', 'Isaac Newton', '', 10 UNION ALL
    SELECT 'Marie Curie', 'Marie Curie', '', 4 UNION ALL
    SELECT 'Michael Faraday', 'Michael Faraday', '', 4 UNION ALL
    SELECT 'Nikola Tesla', 'Nikola Tesla', '', 4 UNION ALL
    SELECT 'Thomas Edison', 'Thomas Edison', '', 6
) AS RoomData;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DELETE FROM mrbs.rooms 
WHERE area_id = (SELECT AREA_ID FROM mrbs.areas WHERE display_name='REP North Hill Rooms')
AND display_name IN (
    'Seminar Room 1', 
    'Seminar Room 2', 
    'Alan Turing', 
    'Da Vinci', 
    'Isaac Newton', 
    'Marie Curie', 
    'Michael Faraday', 
    'Nikola Tesla', 
    'Thomas Edison'
);
-- +goose StatementEnd
