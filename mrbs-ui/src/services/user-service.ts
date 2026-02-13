import type { AxiosResponse } from "axios";
import axiosInstance from "./axios-interceptor";
import type { UserData } from "@/models/user";

export async function getUsers(): Promise<UserData[]> {
    return axiosInstance.get("/users").then(async (res) => res.data).catch((err) => {
        console.error(err);
        return []
    })
}
export async function insertUsers(users: string): Promise<AxiosResponse> {
    return await axiosInstance.post("/users/new", { "users": users }, { headers: { "Content-Type": "application/json" }, validateStatus: (status) => status < 501 })
}
