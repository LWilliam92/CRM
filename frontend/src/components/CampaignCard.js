import React, { useState } from "react";
import axios from "axios";

export default function CampaignCard({ type }) {
  const [message, setMessage] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const downloadSample = () => {
    window.open('/sample_recipients.csv', '_blank');
  };

  const insertVariable = (variable) => {
    setMessage(prev => prev + `{${variable}}`);
  };

  const sendCampaign = async () => {
    if (!campaignName || !message || !file) {
      alert("Please provide a campaign name, message and upload a recipients file");
      return;
    }

    // Check file type
    if (!file.name.endsWith('.csv')) {
      alert("Please upload a CSV file");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append('name', campaignName);
      formData.append('type', type.toLowerCase());
      formData.append('message', message);
      formData.append('recipientsFile', file);

      const res = await axios.post(
        "http://localhost:5000/api/campaigns",
        formData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Show sample messages if available
      let successMessage = `Campaign "${campaignName}" sent successfully to ${res.data.recipients} recipients!`;
      if (res.data.sampleMessages && res.data.sampleMessages.length > 0) {
        successMessage += "\n\nSample messages:\n";
        res.data.sampleMessages.forEach((sample, index) => {
          successMessage += `${index + 1}. ${sample.message}\n`;
        });
      }
      
      alert(successMessage);
      setCampaignName("");
      setMessage("");
      setFile(null);
      // Reset file input
      document.getElementById('file-input').value = '';
    } catch (error) {
      console.error("Error sending campaign:", error);
      alert("Failed to send campaign: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-lg font-bold mb-4">{type} Campaign</h2>
      
      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Campaign Name</label>
        <input
          type="text"
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
          className="border p-2 w-full mb-2"
          placeholder={`Enter ${type} campaign name`}
        />
      </div>
      
      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Recipients File (CSV)</label>
        <div className="flex items-center gap-2 mb-2">
          <input
            id="file-input"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="border p-2 flex-1"
          />
          <button
            type="button"
            onClick={downloadSample}
            className="bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600"
          >
            Sample
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Upload a CSV file with columns: name, phone, email | 
          <button 
            onClick={downloadSample}
            className="text-blue-500 underline ml-1"
          >
            Download sample CSV
          </button>
        </p>
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Message Template</label>
        <div className="mb-2">
          <p className="text-xs text-gray-600 mb-2">Available variables:</p>
          <div className="flex flex-wrap gap-1">
            {['name', 'phone', 'email'].map(variable => (
              <button
                key={variable}
                type="button"
                onClick={() => insertVariable(variable)}
                className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-300"
              >
                {`{${variable}}`}
              </button>
            ))}
          </div>
        </div>
        <textarea
          className="border p-2 w-full"
          placeholder={`Enter your message template here... Use {'{name}'}, {'{phone}'}, {'{email}'} as variables`}
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-1">
          Example: "Hello {'{name}'}, your phone is {'{phone}'} and email is {'{email}'}"
        </p>
      </div>

      {file && (
        <div className="mb-3 p-2 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">
            Selected file: {file.name}
          </p>
        </div>
      )}

      <button
        className={`w-full py-2 rounded text-white ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
        onClick={sendCampaign}
        disabled={loading}
      >
        {loading ? "Sending..." : "Send Campaign"}
      </button>
    </div>
  );
}