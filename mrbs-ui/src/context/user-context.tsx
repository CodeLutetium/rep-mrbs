import { type User } from "@/models/user";
import {
    createContext,
    useContext,
    useEffect,
    useState,
    type FC,
    type ReactNode,
} from "react";

type UserContextType = {
    user: User | null;
    setUser: (user: User | null) => void;
};

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const username = typeof window !== "undefined" ? localStorage.getItem("username") : null;
        const display_name = typeof window !== undefined ? localStorage.getItem("display_name") : null;
        const email = typeof window !== undefined ? localStorage.getItem("email") : null;

        if (username && display_name && email) {
            const currUser: User = {
                name: username,
                display_name: display_name,
                email: email,
            }
            setUser(currUser)
        }
    }, [])


    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    );
};

// Read only
export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context.user;
};

// Write only - use for login/logout operations
export const useSetUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useSetUser must be used within a UserProvider")
    }
    return context.setUser;
}
