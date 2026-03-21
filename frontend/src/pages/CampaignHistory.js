import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";

export default function CampaignHistory() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const res = await axios.get("http://localhost:5000/api/campaigns", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCampaigns(res.data);
      } catch (error) {
        console.error("Error fetching campaigns:", error);
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [navigate]);
  
  const recentCampaigns = campaigns.slice(0, 5);
  const filteredCampaigns = campaigns.filter(campaign => {
    if (filter === "all") return true;
    return campaign.type === filter;
  });

  const filteredRecentCampaigns = recentCampaigns.filter(campaign => {
    if (filter === "all") return true;
    return campaign.type === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading campaign history...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex-1 p-6 bg-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Campaign History</h1>
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border px-3 py-2 rounded-lg bg-white"
              >
                <option value="all">All Campaigns</option>
                <option value="whatsapp">💬 WhatsApp</option>
                <option value="sms">📱 SMS</option>
              </select>
            </div>
          </div>

          {/* Campaign History Section */}
          <div className="bg-white rounded-lg shadow">
            {filteredCampaigns.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mb-4">
                  <span className="text-4xl">📋</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Campaigns Found
                </h3>
                <p className="text-gray-600">
                  {filter === "all" 
                    ? "Start by creating your first campaign" 
                    : `No ${filter} campaigns found`
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-medium">Campaign Name</th>
                      <th className="text-left p-3 font-medium">Type</th>
                      <th className="text-left p-3 font-medium">Recipients</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">File</th>
                      <th className="text-left p-3 font-medium">Created</th>
                      <th className="text-left p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCampaigns.map((campaign) => (
                      <tr key={campaign.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{campaign.name}</div>
                            <div className="text-sm text-gray-600 truncate max-w-xs">
                              {campaign.message.substring(0, 50)}...
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            campaign.type === 'whatsapp' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {campaign.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-medium">{campaign.recipients}</span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            campaign.status === 'completed' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {campaign.status || 'pending'}
                          </span>
                        </td>
                        <td className="p-3">
                          {campaign.recipients_file ? (
                            <span className="text-xs text-gray-600">
                              {campaign.recipients_file.substring(0, 20)}...
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">No file</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="text-sm text-gray-600">
                            {new Date(campaign.created_at).toLocaleDateString()}
                            <br />
                            {new Date(campaign.created_at).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button
                              className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                              onClick={() => alert(`View details for: ${campaign.name}`)}
                            >
                              View
                            </button>
                            <button
                              className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                              onClick={() => alert(`Duplicate campaign: ${campaign.name}`)}
                            >
                              Duplicate
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
