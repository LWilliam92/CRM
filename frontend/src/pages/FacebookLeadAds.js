import React, { useState, useEffect } from "react";
import axios from "axios";
import { api } from "../api";
import Sidebar from "../components/Sidebar";

export default function FacebookLeadAds() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    todayLeads: 0,
    weekLeads: 0,
    monthLeads: 0,
    campaignBreakdown: []
  });
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    fetchFacebookStats();
    fetchFacebookLeads();
    generateWebhookUrl();
  }, []);

  const generateWebhookUrl = () => {
    const baseUrl = window.location.origin;
    const webhookUrl = `${baseUrl.replace('3000', '5001')}/api/facebook/webhook`;
    setWebhookUrl(webhookUrl);
  };

  const fetchFacebookStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(api.facebook.getStats, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (error) {
      console.error("Error fetching Facebook stats:", error);
    }
  };

  const fetchFacebookLeads = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${api.facebook.getLeads}?limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeads(res.data.leads);
    } catch (error) {
      console.error("Error fetching Facebook leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading Facebook Lead Ads...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      
      <div className="flex-1 bg-gray-50">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Facebook Lead Ads</h1>
            <button
              onClick={() => setShowSetup(!showSetup)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {showSetup ? "Hide Setup" : "Show Setup"}
            </button>
          </div>

          {/* Setup Instructions */}
          {showSetup && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Setup Instructions</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">1. Webhook URL:</h4>
                  <div className="flex items-center space-x-2">
                    <code className="bg-white px-3 py-2 rounded border text-sm flex-1">
                      {webhookUrl}
                    </code>
                    <button
                      onClick={() => copyToClipboard(webhookUrl)}
                      className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-blue-800 mb-2">2. Facebook Setup Steps:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-blue-700">
                    <li>Go to Facebook Business Settings</li>
                    <li>Navigate to Lead Ads {'>'} Webhooks</li>
                    <li>Add the webhook URL above</li>
                    <li>Select "Lead Generation" as the event</li>
                    <li>Verify the webhook with your verify token</li>
                  </ol>
                </div>

                <div className="bg-yellow-100 border border-yellow-300 rounded p-3">
                  <p className="text-yellow-800 text-sm">
                    <strong>Note:</strong> Configure your Facebook App ID, App Secret, and Access Token in Settings {'>'} Facebook Integration
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-2xl font-bold text-blue-600">{stats.totalLeads}</div>
              <div className="text-gray-600">Total Leads</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-2xl font-bold text-green-600">{stats.todayLeads}</div>
              <div className="text-gray-600">Today's Leads</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-2xl font-bold text-purple-600">{stats.weekLeads}</div>
              <div className="text-gray-600">This Week</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-2xl font-bold text-orange-600">{stats.monthLeads}</div>
              <div className="text-gray-600">This Month</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Campaign Breakdown */}
            {stats.campaignBreakdown && stats.campaignBreakdown.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Campaign Performance</h3>
                <div className="space-y-2">
                  {stats.campaignBreakdown.map((campaign, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">{campaign.campaign}</span>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {campaign.leads} leads
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Leads */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Recent Facebook Leads</h3>
              {leads.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No Facebook leads received yet. Make sure your webhook is properly configured.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Campaign
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {leads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                            <div className="text-xs text-green-600">Facebook Lead</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {lead.email || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {lead.phone || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {lead.source_campaign || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(lead.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => window.open('/settings', '_blank')}
                className="p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-center"
              >
                <div className="text-2xl mb-2">⚙️</div>
                <div className="font-medium">Configure Settings</div>
                <div className="text-sm">Set up Facebook API credentials</div>
              </button>
              
              <button
                onClick={fetchFacebookLeads}
                className="p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-center"
              >
                <div className="text-2xl mb-2">🔄</div>
                <div className="font-medium">Refresh Leads</div>
                <div className="text-sm">Get latest Facebook leads</div>
              </button>
              
              <button
                onClick={() => setShowSetup(true)}
                className="p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 text-center"
              >
                <div className="text-2xl mb-2">📋</div>
                <div className="font-medium">View Setup Guide</div>
                <div className="text-sm">Webhook configuration steps</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
