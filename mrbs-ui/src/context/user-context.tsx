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
    const [user, setUser] = useState<User | null>(() => {
        if (typeof window === "undefined")
            return null;

        const username = localStorage.getItem("username");
        const display_name = localStorage.getItem("display_name");
        const email = localStorage.getItem("email");
        const level = localStorage.getItem("level");

        if (username && display_name && email && level) {
            return {
                name: username,
                display_name: display_name,
                email: email,
                level: Number(level),
            };
        }
        return null;
    });

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
