import { type User } from "@/models/user";
import { getCurrentUser } from "@/services/user-service";
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

  const sessionToken =
    typeof window !== "undefined" ? localStorage.getItem("session") : null;

  useEffect(() => {
    async function getUser() {
      if (sessionToken) {
        const user: User = await getCurrentUser(sessionToken);
        setUser(user);
      }
    }

    getUser();
  }, [sessionToken]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
