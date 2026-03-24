import React, { useState, useEffect } from "react";
import axios from "axios";
import { api } from "../api";
import Sidebar from "../components/Sidebar";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("facebook");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // Facebook settings
  const [facebookSettings, setFacebookSettings] = useState({
    leadAds: {
      appId: "",
      appSecret: "",
      accessToken: "",
      webhookUrl: "",
      verifyToken: "",
      adAccountId: ""
    },
    messenger: {
      pageId: "",
      pageName: "",
      pageAccessToken: "",
      webhookUrl: "",
      verifyToken: ""
    }
  });

  useEffect(() => {
    generateWebhookUrls();
    fetchFacebookSettings();
  }, []);

  const generateWebhookUrls = () => {
    const baseUrl = window.location.origin;
    const backendUrl = baseUrl.replace('3000', '5001');
    
    setFacebookSettings(prev => ({
      ...prev,
      leadAds: {
        ...prev.leadAds,
        webhookUrl: `${backendUrl}/api/facebook/webhook`
      },
      messenger: {
        ...prev.messenger,
        webhookUrl: `${backendUrl}/api/messenger/webhook`
      }
    }));
  };

  const fetchFacebookSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(api.settings.getFacebook, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setFacebookSettings(res.data);
      setMessage("Facebook settings loaded successfully");
      setMessageType("info");
      
    } catch (error) {
      console.error("Error fetching Facebook settings:", error);
      setMessage("Error loading Facebook settings");
      setMessageType("error");
    }
  };

  const handleFacebookLeadAdsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // Validate required fields
      const { appId, appSecret, accessToken, verifyToken } = facebookSettings.leadAds;
      
      if (!appId || !appSecret || !accessToken || !verifyToken) {
        setMessage("All Facebook Lead Ads fields are required");
        setMessageType("error");
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("token");
      
      const res = await axios.post(
        api.settings.updateLeadAds,
        {
          appId,
          appSecret,
          accessToken,
          verifyToken,
          adAccountId: facebookSettings.leadAds.adAccountId
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setMessage(res.data.message || "Facebook Lead Ads settings saved successfully!");
      setMessageType("success");
      
    } catch (error) {
      console.error("Error saving Facebook Lead Ads settings:", error);
      setMessage(error.response?.data?.message || "Error saving Facebook Lead Ads settings");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookMessengerSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // Validate required fields
      const { pageId, pageAccessToken, verifyToken } = facebookSettings.messenger;
      
      if (!pageId || !pageAccessToken || !verifyToken) {
        setMessage("All Facebook Messenger fields are required");
        setMessageType("error");
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("token");
      
      const res = await axios.post(
        api.settings.updateMessenger,
        {
          pageId,
          pageName: facebookSettings.messenger.pageName,
          pageAccessToken,
          verifyToken
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setMessage(res.data.message || "Facebook Messenger settings saved successfully!");
      setMessageType("success");
      
    } catch (error) {
      console.error("Error saving Facebook Messenger settings:", error);
      setMessage(error.response?.data?.message || "Error saving Facebook Messenger settings");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMessage("Webhook URL copied to clipboard!");
    setMessageType("success");
    setTimeout(() => setMessage(""), 3000);
  };

  const testFacebookConnection = async (type) => {
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      
      const settings = type === 'Lead Ads' ? facebookSettings.leadAds : facebookSettings.messenger;
      
      const res = await axios.post(
        api.settings.testConnection,
        {
          type: type.toLowerCase().replace(' ', '-'),
          settings
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (res.data.success) {
        setMessage(`Facebook ${type} connection test successful!`);
        setMessageType("success");
      } else {
        setMessage(res.data.message || `Facebook ${type} connection test failed`);
        setMessageType("error");
      }
      
    } catch (error) {
      console.error("Error testing Facebook connection:", error);
      setMessage(error.response?.data?.message || `Facebook ${type} connection test failed`);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      
      <div className="flex-1 bg-gray-50">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
          
          {/* Alert Message */}
          {message && (
            <div className={`mb-4 p-4 rounded ${
              messageType === "success" ? "bg-green-100 text-green-800" :
              messageType === "error" ? "bg-red-100 text-red-800" :
              "bg-blue-100 text-blue-800"
            }`}>
              {message}
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("facebook")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "facebook"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Facebook Integration
              </button>
              <button
                onClick={() => setActiveTab("general")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "general"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                General
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "users"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Users
              </button>
            </nav>
          </div>

          {/* Facebook Integration Tab */}
          {activeTab === "facebook" && (
            <div className="space-y-8">
              {/* Facebook Lead Ads Settings */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4">Facebook Lead Ads Integration</h2>
                <p className="text-gray-600 mb-4">
                  Configure your Facebook Lead Ads to automatically import leads into your CRM.
                </p>
                
                <form onSubmit={handleFacebookLeadAdsSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Facebook App ID
                      </label>
                      <input
                        type="text"
                        value={facebookSettings.leadAds.appId}
                        onChange={(e) => setFacebookSettings(prev => ({
                          ...prev,
                          leadAds: { ...prev.leadAds, appId: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Your Facebook App ID"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Facebook App Secret
                      </label>
                      <input
                        type="password"
                        value={facebookSettings.leadAds.appSecret}
                        onChange={(e) => setFacebookSettings(prev => ({
                          ...prev,
                          leadAds: { ...prev.leadAds, appSecret: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Your Facebook App Secret"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Access Token
                      </label>
                      <input
                        type="password"
                        value={facebookSettings.leadAds.accessToken}
                        onChange={(e) => setFacebookSettings(prev => ({
                          ...prev,
                          leadAds: { ...prev.leadAds, accessToken: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Facebook Access Token"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ad Account ID
                      </label>
                      <input
                        type="text"
                        value={facebookSettings.leadAds.adAccountId}
                        onChange={(e) => setFacebookSettings(prev => ({
                          ...prev,
                          leadAds: { ...prev.leadAds, adAccountId: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="act_123456789"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Webhook URL
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={facebookSettings.leadAds.webhookUrl}
                        readOnly
                        className="flex-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded"
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(facebookSettings.leadAds.webhookUrl)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Add this URL to your Facebook Lead Ads webhook settings
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Webhook Verify Token
                    </label>
                    <input
                      type="text"
                      value={facebookSettings.leadAds.verifyToken}
                      onChange={(e) => setFacebookSettings(prev => ({
                        ...prev,
                        leadAds: { ...prev.leadAds, verifyToken: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Custom verify token for webhook"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use this token when setting up your Facebook webhook
                    </p>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? "Saving..." : "Save Lead Ads Settings"}
                    </button>
                    <button
                      type="button"
                      onClick={() => testFacebookConnection("Lead Ads")}
                      disabled={loading}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Test Connection
                    </button>
                  </div>
                </form>
              </div>

              {/* Facebook Messenger Settings */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4">Facebook Messenger Integration</h2>
                <p className="text-gray-600 mb-4">
                  Configure Facebook Messenger to handle customer conversations and create support tickets.
                </p>
                
                <form onSubmit={handleFacebookMessengerSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Facebook Page ID
                      </label>
                      <input
                        type="text"
                        value={facebookSettings.messenger.pageId}
                        onChange={(e) => setFacebookSettings(prev => ({
                          ...prev,
                          messenger: { ...prev.messenger, pageId: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Your Facebook Page ID"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Page Name
                      </label>
                      <input
                        type="text"
                        value={facebookSettings.messenger.pageName}
                        onChange={(e) => setFacebookSettings(prev => ({
                          ...prev,
                          messenger: { ...prev.messenger, pageName: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Your Facebook Page Name"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Page Access Token
                    </label>
                    <input
                      type="password"
                      value={facebookSettings.messenger.pageAccessToken}
                      onChange={(e) => setFacebookSettings(prev => ({
                        ...prev,
                        messenger: { ...prev.messenger, pageAccessToken: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Facebook Page Access Token"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Webhook URL
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={facebookSettings.messenger.webhookUrl}
                        readOnly
                        className="flex-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded"
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(facebookSettings.messenger.webhookUrl)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Add this URL to your Facebook Page webhook settings
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Webhook Verify Token
                    </label>
                    <input
                      type="text"
                      value={facebookSettings.messenger.verifyToken}
                      onChange={(e) => setFacebookSettings(prev => ({
                        ...prev,
                        messenger: { ...prev.messenger, verifyToken: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Custom verify token for webhook"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use this token when setting up your Facebook webhook
                    </p>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? "Saving..." : "Save Messenger Settings"}
                    </button>
                    <button
                      type="button"
                      onClick={() => testFacebookConnection("Messenger")}
                      disabled={loading}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Test Connection
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* General Tab */}
          {activeTab === "general" && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">General Settings</h2>
              <p className="text-gray-600">General CRM settings coming soon...</p>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">User Management</h2>
              <p className="text-gray-600">User management settings coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
