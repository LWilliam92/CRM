import React, { useState } from "react";
import axios from "axios";

export default function CampaignForm() {
  const [formData, setFormData] = useState({
    name: "",
    type: "whatsapp",
    message: ""
  });
  const [file, setFile] = useState(null);
  const [importToContacts, setImportToContacts] = useState(true);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const downloadSample = () => {
    window.open('/sample_recipients.csv', '_blank');
  };

  const insertVariable = (variable) => {
    setFormData(prev => ({
      ...prev,
      message: prev.message + `{${variable}}`
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.message || !file) {
      alert("Please fill in all fields and upload a recipients file");
      return;
    }

    // Check file type
    if (!file.name.endsWith('.csv')) {
      alert("Please upload a CSV file");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('type', formData.type);
      formDataToSend.append('message', formData.message);
      formDataToSend.append('recipientsFile', file);
      formDataToSend.append('importToContacts', importToContacts);

      const res = await axios.post(
        "http://localhost:5000/api/campaigns",
        formDataToSend,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Show sample messages if available
      let successMessage = `Campaign "${formData.name}" created successfully with ${res.data.recipients} recipients!`;
      if (res.data.sampleMessages && res.data.sampleMessages.length > 0) {
        successMessage += "\n\nSample messages:\n";
        res.data.sampleMessages.forEach((sample, index) => {
          successMessage += `${index + 1}. ${sample.message}\n`;
        });
      }
      
      alert(successMessage);
      setFormData({
        name: "",
        type: "whatsapp",
        message: ""
      });
      setFile(null);
      // Reset file input
      document.getElementById('campaign-file-input').value = '';
    } catch (error) {
      console.error("Error creating campaign:", error);
      alert("Failed to create campaign: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow">
      <h2 className="text-lg font-bold mb-4">Create New Campaign</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Campaign Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="border p-2 w-full"
          placeholder="Enter campaign name"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Campaign Type</label>
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          className="border p-2 w-full"
        >
          <option value="whatsapp">WhatsApp</option>
          <option value="sms">SMS</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Recipients File (CSV)</label>
        <div className="flex items-center gap-2 mb-2">
          <input
            id="campaign-file-input"
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

      <div className="mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={importToContacts}
            onChange={(e) => setImportToContacts(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            Import recipients to contacts list
          </span>
        </label>
        <p className="text-xs text-gray-500 mt-1">
          {importToContacts 
            ? "Recipients from this CSV will be added to your contacts database for future use."
            : "Recipients will only be used for this campaign and won't be saved to contacts."
          }
        </p>
      </div>

      <div className="mb-4">
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
          name="message"
          value={formData.message}
          onChange={handleChange}
          className="border p-2 w-full"
          placeholder={`Enter your message template here... Use {'{name}'}, {'{phone}'}, {'{email}'} as variables`}
          rows={4}
        />
        <p className="text-xs text-gray-500 mt-1">
          Example: "Hello {'{name}'}, your phone is {'{phone}'} and email is {'{email}'}"
        </p>
      </div>

      {file && (
        <div className="mb-4 p-2 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">
            Selected file: {file.name}
          </p>
        </div>
      )}

      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
      >
        Create Campaign
      </button>
    </form>
  );
}