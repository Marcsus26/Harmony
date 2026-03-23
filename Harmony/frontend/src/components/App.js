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
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [messages, setMessages] = useState([]);

  const friends = [
    { id: 1, name: "Nelly", status: "online", avatar: logo },
    { id: 2, name: "User123", status: "offline", avatar: logo },
    { id: 3, name: "CodingWizard", status: "online", avatar: logo },
    { id: 4, name: "Gamer99", status: "online", avatar: logo },
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
    loadServers();
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

  useEffect(() => {
    if (servers.length > 0) {
      setActiveServerId(servers[0].id);
    }
  }, [servers])

  useEffect(() => {
  if (channels.length > 0) {
    setActiveChannelId(channels[0].id);
  } else {
    setActiveChannelId(null);
    setMessages([]);
  }
  }, [channels]);

  useEffect(() => {
  if (activeChannelId) {
    const fetchMessagesOG = async () => {
      try {
        const res = await api.get(`/api/channels/${activeChannelId}/messages/`);
        setMessages(res.data);
      } catch (err) {
        console.error("Error fetching messages", err);
      }
    };
    fetchMessagesOG();
  }
  }, [activeChannelId]);

  const fetchChannels = async () => {
  if (!activeServerId) return;
  try {
    const res = await api.get(`/api/servers/${activeServerId}/channels/`);
    setChannels(res.data);
  } catch (err) {
    console.error(err);
  }
  };

  useEffect(() => {
    fetchChannels();
  }, [activeServerId]);

  const fetchMessages = async () => {
    if (!activeChannelId) return;
    const res = await api.get(`/api/channels/${activeChannelId}/messages/`);
    setMessages(res.data);
  };

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
                  <ChatArea messages={messages}
                  activeChannelId={activeChannelId} 
                  onMessageSent={fetchMessages}/>
                </main>

                <RightSidebar channels={channels} 
                suggestedGames={suggestedGames}
                activeServerId={activeServerId}
                activeChannelId={activeChannelId} 
                onSelectChannel={setActiveChannelId}
                onChannelCreated={fetchChannels} />
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