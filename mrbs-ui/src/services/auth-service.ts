import axiosInstance from "./axios-interceptor";

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
