import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CampaignHistory from "./pages/CampaignHistory";
import Contacts from "./pages/Contacts";
import LeadManagement from "./pages/LeadManagement";
import FloatingAIAssistant from "./components/FloatingAIAssistant";
import axios from "axios";

function App() {
  const [contacts, setContacts] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
      fetchContacts();
    } else {
      setIsAuthenticated(false);
      setContacts([]);
    }
  }, []);

  // Listen for storage changes (logout from other tabs)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        const token = e.newValue;
        if (token) {
          setIsAuthenticated(true);
          fetchContacts();
        } else {
          setIsAuthenticated(false);
          setContacts([]);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const fetchContacts = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.get("http://localhost:5000/api/contacts", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContacts(res.data);
    } catch (error) {
      console.error("Error fetching contacts for AI:", error);
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/campaign-history" element={<CampaignHistory />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/leads" element={<LeadManagement />} />
      </Routes>
      
      {/* Floating AI Assistant - only show when authenticated */}
      {isAuthenticated && <FloatingAIAssistant contacts={contacts} />}
    </Router>
  );
}

export default App;