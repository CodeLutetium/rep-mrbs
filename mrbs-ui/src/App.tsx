import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from "./pages/Home";
import Login from "./pages/Login";
import { useAuthLoading, UserProvider } from './context/user-context';
import Logout from './pages/Logout';
import { Toaster } from './components/ui/sonner';
import { MainLayout } from './components/layout';
import ChangePassword from './pages/ChangePassword';
import PrivateRoutes from './components/private-route';
import HelpPage from './pages/Help';
import ForgotPasswordPage from './pages/ForgotPassword';
import AdminPage from './pages/Admin';
import ChangelogPage from './pages/Changelog'
import LinkTelegramPage from './pages/LinkTelegram';

function AppContent() {

  const isLoading = useAuthLoading();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#181C62]"></div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Routes without navbar */}
        <Route path="/login" element={<Login />} />
        <Route path='/reset-password' element={<ForgotPasswordPage />} />

        {/* Main routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path='/help' element={<HelpPage />} />
          <Route path="/whats-new" element={<ChangelogPage />} />

          {/* Private routes */}
          <Route element={<PrivateRoutes />}>
            <Route path='/logout' element={<Logout />} />
            <Route path='/change-password' element={<ChangePassword />} />
            <Route path='/link-telegram' element={<LinkTelegramPage />} />
          </Route>

          {/* Admin routes */}
          <Route path='/admin' element={<AdminPage />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
export function App() {


  return (
    <>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </>
  );
}

export default App;
