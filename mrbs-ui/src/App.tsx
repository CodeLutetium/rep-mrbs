import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from "./pages/Home";
import Login from "./pages/Login";
import Navbar from './components/navbar';
import { UserProvider } from './context/user-context';
import Logout from './pages/Logout';

export function App() {

    return (
        <>
            <UserProvider>
                <BrowserRouter>
                    <div className='md:h-svh flex flex-col space-y-2 '>
                        <Navbar />

                        <main className='flex-1 min-h-0 my-4'>
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/login" element={<Login />} />
                                <Route path='/logout' element={<Logout />} />
                            </Routes>
                        </main>
                    </div>
                </BrowserRouter>
            </UserProvider>
        </>
    );
}

export default App;
