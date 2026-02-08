import { Outlet } from "react-router-dom";
import Navbar from "./navbar";

export function MainLayout() {
    return (
        <div className='md:h-svh flex flex-col space-y-2 '>
            <Navbar />
            <main className='flex-1 min-h-0 my-4 px-4'>
                <Outlet />
            </main>
        </div>
    );
}
