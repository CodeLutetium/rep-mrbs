import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from "./pages/Home";
import Login from "./pages/Login";
import Navbar from './components/navbar';


export function App() {
    return (
        <>
            <BrowserRouter>
                <div className='md:h-svh flex flex-col space-y-2 '>
                    <Navbar />

                    <main className='flex-1 min-h-0 my-4'>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/login" element={<Login />} />
                        </Routes>
                    </main>
                </div>
            </BrowserRouter>
        </>
    );
}

export default App;
