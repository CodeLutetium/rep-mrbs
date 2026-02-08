import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from "./pages/Home";
import Login from "./pages/Login";
import { UserProvider } from './context/user-context';
import Logout from './pages/Logout';
import { Toaster } from './components/ui/sonner';
import { MainLayout } from './components/layout';
import ChangePassword from './pages/ChangePassword';
import PrivateRoutes from './components/private-route';
import HelpPage from './pages/Help';
import ForgotPasswordPage from './pages/ForgotPassword';

export function App() {

    return (
        <>
            <UserProvider>
                <BrowserRouter>
                    <Routes>

                        {/* Routes without navbar */}
                        <Route path="/login" element={<Login />} />
                        <Route path='/reset-password' element={<ForgotPasswordPage />} />

                        {/* Main routes */}
                        <Route element={<MainLayout />}>
                            <Route path="/" element={<Home />} />
                            <Route path='/help' element={<HelpPage />} />

                            {/* Private routes */}
                            <Route element={<PrivateRoutes />}>
                                <Route path='/logout' element={<Logout />} />
                                <Route path='/change-password' element={<ChangePassword />} />
                            </Route>
                        </Route>
                    </Routes>

                    <Toaster />
                </BrowserRouter>
            </UserProvider>
        </>
    );
}

export default App;
