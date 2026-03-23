import {createRoot} from "react-dom/client" ;
import React, { useState, useEffect } from 'react';
import '../../static/css/index.css';
import logo from "../../static/images/logo.svg";
import ChatArea from "./ChatArea";
import Sidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import UserAccount from "./UserDetails";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import UserSteamSettingsPage from "./UserSteamSettingsPage";
import Login from './LoginPage';
import ProtectedRoute from './ProtectedRoute.jsx';
import Register from "./Register.js";
import MyProfile from "./MyProfile.js";
import api from "../api.js";

function App() {
  const [user, setUser] = useState(null);
  const [servers, setServers] = useState([]);
  const [activeServerId, setActiveServerId] = useState(null);
  const [channels, setChannels] = useState([]);

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

  const [suggestedGames] = useState([
    { title: "Helldivers 2", img: logo },
    { title: "Elden Ring", img: logo }
  ]);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('access_token'));

  const loadServers = async () => {
    try {
      const serverRes = await api.get('/api/servers/my-servers/');
      setServers(serverRes.data);
    } catch (err) {
      console.error("Error loading servers:", err);
    }
  };

  useEffect(() => {
    loadServers(); // Load on mount
  }, []);

  useEffect(() => {
    if (activeServerId) {
      const fetchChannels = async () => {
        try {
          const res = await api.get(`/api/servers/${activeServerId}/channels/`);
          setChannels(res.data);
        } catch (err) {
          console.error("Error fetching channels", err);
        }
      };
      fetchChannels();
    }
  }, [activeServerId]);

  return (
    <Router>
        <Routes>
        <Route path="/login" element={<Login setAuth={setIsAuthenticated}/>} />
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={
              <div className="app-container">
                <Sidebar friends={friends}
                servers={servers} 
                onServerCreated={loadServers} 
                activeServerId={activeServerId} 
                onSelectServer={setActiveServerId} />
              
                <main className="main-content">
                  <UserAccount setAuth={setIsAuthenticated} />
                  <ChatArea messages={fakeMessages} />
                </main>

                <RightSidebar channels={channels} suggestedGames={suggestedGames} />
              </div>
            } />
          </Route>
          <Route path="/steam-settings" element={<UserSteamSettingsPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<MyProfile />} />
        </Routes>
    </Router>
  );
}

export default App;

const appDiv = document.getElementById('app');

const root = createRoot(appDiv);
root.render(<App />);