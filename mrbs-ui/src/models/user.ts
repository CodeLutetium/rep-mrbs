export interface User {
    name: string;
    display_name: string;
    email: string;
    level: number;
}

// Models PublicUser that is returned from the backend.
// All columns (except password fields) from db are returned
export interface UserData {
    user_id: string;
    level: number;
    name: string;
    display_name: string;
    email: string;
    time_created: string;
    last_login: string;
}
