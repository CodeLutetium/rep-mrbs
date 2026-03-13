import { type User } from "@/models/user";
import { getCurrentUser } from "@/services/auth-service";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type FC,
  type ReactNode,
} from "react";
import { toast } from "sonner";

type UserContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
};

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await getCurrentUser();

        if (res.success && res.username && res.display_name && res.email && res.level) {
          setUser({
            name: res.username,
            display_name: res.display_name,
            email: res.email,
            level: Number(res.level),
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        toast.error("Auth verification failed");
        console.error("Auth verification failed", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {!loading && children}
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
