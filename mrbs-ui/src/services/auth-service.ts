import type { AxiosResponse } from "axios";
import axiosInstance from "./axios-interceptor";
import { changePasswordSchema, type ChangePasswordValues } from "@/components/change-password-form";

interface LoginResponse {
    success: boolean;
    error: string;
    username: string;
    display_name: string;
    email: string;
}

export async function loginUser(user: string, password: string): Promise<LoginResponse> {
    return await axiosInstance.post("/auth/login", {
        username: user,
        password: password,
    }, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    }).then(async (res) => res.data).catch((err) => {
        console.error(err);

        return;
    })

}

export async function logoutUser(): Promise<string> {
    return await axiosInstance.post("/auth/logout")
        .then(async (res) => res.data.message)
        .catch((err) => {
            console.error(err);
            return ""
        })
}

export async function changePassword(data: ChangePasswordValues): Promise<AxiosResponse> {
    const validatedData = changePasswordSchema.safeParse(data)

    if (!validatedData.success) {
        console.error(validatedData.error);
        Promise.reject();
    }

    return await axiosInstance.post("/auth/change-password", validatedData.data, { headers: { "Content-Type": "application/json" }, validateStatus: (status) => status < 501 })
}
