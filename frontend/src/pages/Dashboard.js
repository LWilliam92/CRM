import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import CampaignCard from "../components/CampaignCard";
import Footer from "../components/Footer";

export default function Dashboard() {
  const [stats, setStats] = useState({
    contacts: 0,
    campaigns: 0,
    whatsapp: 0,
    sms: 0
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const res = await axios.get("http://localhost:5000/api/dashboard", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (error) {
        console.error("Error fetching stats:", error);
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1">
        <Sidebar />
        <div className="p-6 w-full bg-gray-100">
          <h1 className="text-2xl font-bold mb-6">CRM Dashboard</h1>

          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded shadow">
              <h2>Total Contacts</h2>
              <p className="text-xl font-bold">{stats.contacts.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h2>WhatsApp Blast</h2>
              <p className="text-xl font-bold">{stats.whatsapp.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h2>SMS Blast</h2>
              <p className="text-xl font-bold">{stats.sms.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h2>Total Campaigns</h2>
              <p className="text-xl font-bold">{stats.campaigns.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mt-6">
            <CampaignCard type="WhatsApp" />
            <CampaignCard type="SMS" />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}