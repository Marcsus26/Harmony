import {createRoot} from "react-dom/client" ;
import React, { useState } from 'react';
import '../../static/css/index.css';
import logo from "../../static/images/logo.svg";
import ChatArea from "./ChatArea";
import Sidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import UserAccount from "./UserDetails";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import UserSettingsPage from "./UserSettingsPage";
import Login from './LoginPage';
import ProtectedRoute from './ProtectedRoute.jsx';
import Register from "./Register.js";

function App() {

  const friends = [
    { id: 1, name: "Nelly", status: "online", avatar: logo },
    { id: 2, name: "User123", status: "offline", avatar: logo },
    { id: 3, name: "CodingWizard", status: "online", avatar: logo },
    { id: 4, name: "Gamer99", status: "online", avatar: logo },
  ];
  const fakeMessages = [
    { id: 1, user: "Nelly", time: "Today at 12:00 PM", text: "Yo, did you see the new update?", avatar: logo },
    { id: 2, user: "User123", time: "Today at 12:01 PM", text: "The CSS is finally working!", avatar: logo },
  ];

  const servers = [
    { id: 1, name: "The Dev Hub", icon: "DH" },
    { id: 2, name: "Gaming Zone", icon: "GZ" },
    { id: 3, name: "Study Group", icon: "SG" },
  ];

  const [channels] = useState(["general", "dev-log", "voice-chat"]);
  const [suggestedGames] = useState([
    { title: "Helldivers 2", img: logo },
    { title: "Elden Ring", img: logo }
  ]);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('access_token'));
  return (
    <Router>
        <Routes>
        <Route path="/login" element={<Login setAuth={setIsAuthenticated}/>} />
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={
              <div className="app-container">
                <Sidebar friends={friends} servers={servers} />
              
                <main className="main-content">
                  <UserAccount avatar={logo} />
                  <ChatArea messages={fakeMessages} />
                </main>

                <RightSidebar channels={channels} suggestedGames={suggestedGames} />
              </div>
            } />
          </Route>
          <Route path="/account" element={<UserSettingsPage />} />
          <Route path="/register" element={<Register />} />
        </Routes>
    </Router>
  );
}

export default App;

const appDiv = document.getElementById('app');

const root = createRoot(appDiv);
root.render(<App />);