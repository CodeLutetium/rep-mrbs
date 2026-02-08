import type { AxiosResponse } from "axios";
import axiosInstance from "./axios-interceptor";

export async function insertUsers(users: string): Promise<AxiosResponse> {
    return await axiosInstance.post("/users/new", { "users": users }, { headers: { "Content-Type": "application/json" }, validateStatus: (status) => status < 501 })
}
