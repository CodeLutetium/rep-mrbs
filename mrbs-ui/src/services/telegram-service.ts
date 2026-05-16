import axiosInstance from "./axios-interceptor";

export interface GetTelegramCodeResponse {
    message?: string;
    error?: string;
    code?: string;
}

export async function getTelegramCode(): Promise<GetTelegramCodeResponse> {
    return (await axiosInstance.get("/telegram/get-code", { validateStatus: (status) => status < 501 })).data;
}
