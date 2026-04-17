import type { AxiosResponse } from "axios";
import axiosInstance from "./axios-interceptor";
import type { UserData } from "@/models/user";
import type z from "zod";
import { editUserSchema } from "@/components/admin/edit-user-form";

/**
 * Fetches the list of all users from the server.
 * * @returns A promise that resolves to an array of {@link UserData}. 
 * Returns an empty array if the request fails.
 */
export async function getUsers(): Promise<UserData[]> {
    return axiosInstance.get("/users").then(async (res) => res.data).catch((err) => {
        console.error(err);
        return []
    })
}

/**
 * Adds new users to the database via a bulk or single string input.
 * * @param users - list of users in the format #DISPLAY_NAME# EMAIL_ADDRESS. Display name is case sensitive.
 * @returns A promise resolving to the {@link AxiosResponse}. 
 * Configured to resolve for any status code below 501.
 */
export async function insertUsers(users: string): Promise<AxiosResponse> {
    return await axiosInstance.post("/users/new", { "users": users }, { headers: { "Content-Type": "application/json" }, validateStatus: (status) => status < 501 })
}

/**
 * Deletes a specific user from the system by their username.
 * * @param username - The username (e.g. JDOE001) of the user to delete, case sensitive..
 * @returns A promise resolving to the {@link AxiosResponse}. 
 * Configured to resolve for any status code below 501.
 */
export async function deleteUser(username: string): Promise<AxiosResponse> {
    return await axiosInstance.delete(`/users/${username}`, { validateStatus: (status) => status < 501 })
}

export async function editUser(data: z.infer<typeof editUserSchema>): Promise<AxiosResponse> {
    const validatedData = editUserSchema.safeParse(data)

    if (!validatedData.success) {
        console.error(validatedData.error);
        Promise.reject(validatedData.error);
    }

    return await axiosInstance.post(`/users/${validatedData.data?.name}`, validatedData.data, { validateStatus: (status) => status < 501 })
}
