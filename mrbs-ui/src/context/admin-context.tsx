import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useUser } from "./user-context";
import { replace, useNavigate } from "react-router-dom";

const AdminContext = createContext<boolean | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
    const user = useUser();
    const navigate = useNavigate();
    const isAdmin = user && user.level > 1;

    useEffect(() => {
        if (!isAdmin) {
            navigate("/", { replace: true });
        }
    }, [isAdmin, navigate]);

    if (!isAdmin)
        return null;


    return (
        <AdminContext.Provider value={true}>
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
