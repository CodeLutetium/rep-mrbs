/**
 * The rooms in this file are hardcoded as they are unlikely to change. If there are changes, modify the database as well as this file.
 *
 * The rooms in database is intended for Telegram bot interface.
 *
 */

export interface Room {
    room_id: number;
    area_id: number;
    display_name: string;
    description: string;
    capacity: number;
    admin_email?: string;
}

export const Rooms: Array<Room> = [
    {
        room_id: 1,
        area_id: 2,
        display_name: "Seminar Room 1",
        description: "",
        capacity: 50,
    },
    {
        room_id: 2,
        area_id: 2,
        display_name: "Seminar Room 2",
        description: "",
        capacity: 50,
    }, {
        room_id: 3,
        area_id: 2,
        display_name: "Alan Turing",
        description: "",
        capacity: 4,
    }, {
        room_id: 4,
        area_id: 2,
        display_name: "Da Vinci",
        description: "",
        capacity: 10,
    }, {
        room_id: 5,
        area_id: 2,
        display_name: "Isaac Newton",
        description: "",
        capacity: 10,
    }, {
        room_id: 6,
        area_id: 2,
        display_name: "Marie Curie",
        description: "",
        capacity: 4,
    }, {
        room_id: 7,
        area_id: 2,
        display_name: "Michael Faraday",
        description: "",
        capacity: 4,
    }, {
        room_id: 8,
        area_id: 2,
        display_name: "Nikola Tesla",
        description: "",
        capacity: 4,
    }, {
        room_id: 9,
        area_id: 2,
        display_name: "Thomas Edison",
        description: "",
        capacity: 6,
    },
]


