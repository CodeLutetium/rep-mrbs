import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from "./pages/Home";
import Login from "./pages/Login";
import { UserProvider } from './context/user-context';
import Logout from './pages/Logout';
import { Toaster } from './components/ui/sonner';
import { MainLayout } from './components/layout';

export function App() {

    return (
        <>
            <UserProvider>
                <BrowserRouter>
                    <Routes>

                        {/* Public routes */}
                        <Route path="/login" element={<Login />} />
                        <Route path='/logout' element={<Logout />} />

                        {/* Main routes */}
                        <Route element={<MainLayout />}>
                            <Route path="/" element={<Home />} />
                        </Route>
                    </Routes>

                    <Toaster />
                </BrowserRouter>
            </UserProvider>
        </>
    );
}

export default App;
