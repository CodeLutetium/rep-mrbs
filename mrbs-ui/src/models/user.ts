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

export const UserRoleLevel = {
    Default: 1,
    Admin: 2,
} as const;

export type UserLevelType = (typeof UserRoleLevel)[keyof typeof UserRoleLevel]

