import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useUser } from "./user-context";
import { useNavigate } from "react-router-dom";

interface AdminContextType {
  isAdmin: boolean;
  refreshUserData: () => void;
  refresh: number;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const user = useUser();
  const navigate = useNavigate();
  const isAdmin = user && user.level > 1;
  const [refresh, setRefresh] = useState(0);

  const refreshUserData = () => setRefresh(prev => prev + 1);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/", { replace: true });
    }
  }, [isAdmin, navigate]);

  if (!isAdmin)
    return null;

  return (
    <AdminContext.Provider value={{ isAdmin, refreshUserData, refresh }}>
      {children}
    </AdminContext.Provider>
  )
}

// Guard hook 
export function useAdmin() {
  const context = useContext(AdminContext);


  // If context is undefined, means component is used outside of provider.
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }

  return context;
}
