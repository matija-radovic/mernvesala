import React from 'react';
import './App.css';
import { Routes, Route, BrowserRouter } from 'react-router-dom'

import Welcome from './components/Welcome';
import MainMenu from './components/MainMenu';
import CreateLobby from './components/CreateLobby';
import JoinGame from './components/JoinGame';
import Stats from './components/Stats';

import Login from './components/auth/Login';
import Register from './components/auth/Register';
import RequireAuthLayout from './components/RequireAuthLayout';
import SignOutLogo from './images/components/SignOutLogo';
import Settings from './components/Settings';
import Game from './components/game/Game';

function App() {
    return (
        <div className="App">
            <BrowserRouter className="BrowserRouter">
                <Routes className="Routes">
                    <Route element={<RequireAuthLayout auth="guest-access" />}>
                        <Route path='/' exact element={<Welcome />} />
                        <Route path='/login' element={<Login />} />
                        <Route path='/register' element={<Register />} />
                    </Route>
                    <Route element={<RequireAuthLayout auth="auth-required" />}>
                        <Route path='/main-menu' element={<MainMenu />} />
                        <Route path='/settings' element={<Settings/>} />
                        <Route path='/stats' element={<Stats />} />
                        <Route path='/create' element={<CreateLobby />} />
                        <Route path='/join' element={<JoinGame />} />
                        <Route path='/game/:roomID' element={<Game/>} />
                    </Route>
                    <Route path='*' element={<h1>Nothing here :(</h1>} />
                </Routes>
            </BrowserRouter>
        </div>
    );
}
export default App;
