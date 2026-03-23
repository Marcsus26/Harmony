import {createRoot} from "react-dom/client" ;
import React, { useState, useEffect } from 'react';
import '../../static/css/index.css';
import logo from "../../static/images/logo.svg";
import ChatArea from "./ChatArea";
import Sidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import UserAccount from "./UserDetails";
import api from "../api";
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

  const [suggestedGames, setSuggestedGames] = useState([]);
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

  const [hasSteamLinked, setHasSteamLinked] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestionsRefreshKey, setSuggestionsRefreshKey] = useState(0);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!localStorage.getItem('access_token')) {
        setSuggestedGames([]);
        setHasSteamLinked(false);
        return;
      }

      try {
        setIsLoadingSuggestions(true);
        const meResponse = await api.get('/api/auth/me/');
        const steamId = meResponse.data?.steam_id;

        if (!steamId) {
          setHasSteamLinked(false);
          setSuggestedGames([]);
          return;
        }

        setHasSteamLinked(true);
        const response = await api.get('/api/games/suggestions/');
        const games = (response.data?.results || []).map((game) => ({
          id: game.appid,
          title: game.name,
          img: game.appid
            ? `https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/header.jpg`
            : logo,
        }));
        setSuggestedGames(games);
      } catch (error) {
        console.error('Failed to fetch game suggestions', error);
        setSuggestedGames([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [isAuthenticated, suggestionsRefreshKey]);

  const handleSteamLinked = () => {
    setSuggestionsRefreshKey((prev) => prev + 1);
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
                  activeServerId={activeServerId}
                  activeChannelId={activeChannelId} 
                  onSelectChannel={setActiveChannelId}
                  onChannelCreated={fetchChannels}
                  suggestedGames={suggestedGames}
                  hasSteamLinked={hasSteamLinked}
                  isLoadingSuggestions={isLoadingSuggestions}
                />
              </div>
            } />
          </Route>
          <Route path="/steam-settings" element={<UserSteamSettingsPage onSteamLinked={handleSteamLinked} />} />
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