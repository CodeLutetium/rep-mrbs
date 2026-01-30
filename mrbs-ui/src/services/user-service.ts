import { type User } from "@/models/user";
import axiosInstance from "./axios-interceptor";

/** Get current user details from sessionToken for rendering */
export async function getCurrentUser(sessionToken: string): Promise<User> {
    return await axiosInstance.get(`/users/sessions/${sessionToken}`).then(async (res) => res.data).catch((err) => {
        console.error(err);
        return null;
    });
}
