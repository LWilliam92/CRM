import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";

export default function LeadManagement() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, leadId: null });
  const [selectedLeads, setSelectedLeads] = useState([]);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    company: "",
    source: "",
    status: "new",
    priority: "medium",
    notes: ""
  });

  const leadSources = ["website", "referral", "campaign", "cold_call", "social_media", "email", "other"];
  const leadStatuses = ["new", "contacted", "qualified", "proposal", "negotiation", "converted", "lost"];
  const priorities = ["low", "medium", "high", "urgent"];

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const res = await axios.get("http://localhost:5000/api/contacts", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter only leads
      const leadsData = res.data.filter(contact => contact.category === 'lead');
      setLeads(leadsData);
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const leadData = {
        ...formData,
        category: "lead"
      };

      if (editingLead) {
        await axios.put(
          `http://localhost:5000/api/contacts/${editingLead.id}`,
          leadData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("Lead updated successfully!");
      } else {
        await axios.post(
          "http://localhost:5000/api/contacts",
          leadData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("Lead added successfully!");
      }

      fetchLeads();
      resetForm();
    } catch (error) {
      console.error("Error saving lead:", error);
      alert("Failed to save lead: " + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = (lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name || "",
      phone: lead.phone || "",
      email: lead.email || "",
      company: lead.company || "",
      source: lead.source || "",
      status: lead.status || "new",
      priority: lead.priority || "medium",
      notes: lead.notes || ""
    });
    setShowAddForm(true);
  };

  const handleDelete = (id) => {
    setDeleteConfirm({ show: true, leadId: id });
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/contacts/${deleteConfirm.leadId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Lead deleted successfully!");
      fetchLeads();
      setDeleteConfirm({ show: false, leadId: null });
    } catch (error) {
      console.error("Error deleting lead:", error);
      alert("Failed to delete lead: " + (error.response?.data?.message || error.message));
    }
  };

  const handleStatusUpdate = async (leadId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/contacts/${leadId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchLeads();
    } catch (error) {
      console.error("Error updating lead status:", error);
    }
  };

  const handleConvertToCustomer = async (leadId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/contacts/${leadId}`,
        { category: "customer", status: "converted" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Lead converted to customer successfully!");
      fetchLeads();
    } catch (error) {
      console.error("Error converting lead:", error);
      alert("Failed to convert lead: " + (error.response?.data?.message || error.message));
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      company: "",
      source: "",
      status: "new",
      priority: "medium",
      notes: ""
    });
    setEditingLead(null);
    setShowAddForm(false);
  };

  const handleSelectLead = (leadId) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleBulkAction = async (action) => {
    if (selectedLeads.length === 0) {
      alert("Please select leads first");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      if (action === "delete") {
        if (window.confirm(`Are you sure you want to delete ${selectedLeads.length} leads?`)) {
          await Promise.all(
            selectedLeads.map(id => 
              axios.delete(`http://localhost:5000/api/contacts/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
              })
            )
          );
          alert(`${selectedLeads.length} leads deleted successfully!`);
        }
      } else if (action === "convert") {
        await Promise.all(
          selectedLeads.map(id => 
            axios.put(`http://localhost:5000/api/contacts/${id}`, 
              { category: "customer", status: "converted" },
              { headers: { Authorization: `Bearer ${token}` } }
            )
          )
        );
        alert(`${selectedLeads.length} leads converted to customers!`);
      }
      
      setSelectedLeads([]);
      fetchLeads();
    } catch (error) {
      console.error("Error performing bulk action:", error);
      alert("Failed to perform action: " + (error.response?.data?.message || error.message));
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        lead.phone?.includes(searchTerm) ||
                        lead.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || lead.status === filterStatus;
    const matchesPriority = filterPriority === "all" || lead.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "new": return "bg-blue-100 text-blue-800";
      case "contacted": return "bg-purple-100 text-purple-800";
      case "qualified": return "bg-indigo-100 text-indigo-800";
      case "proposal": return "bg-pink-100 text-pink-800";
      case "negotiation": return "bg-orange-100 text-orange-800";
      case "converted": return "bg-green-100 text-green-800";
      case "lost": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getLeadStats = () => {
    const total = leads.length;
    const newLeads = leads.filter(l => l.status === 'new').length;
    const qualified = leads.filter(l => l.status === 'qualified').length;
    const proposals = leads.filter(l => l.status === 'proposal').length;
    const negotiations = leads.filter(l => l.status === 'negotiation').length;
    const urgent = leads.filter(l => l.priority === 'urgent' || l.priority === 'high').length;

    return { total, newLeads, qualified, proposals, negotiations, urgent };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading leads...</div>
      </div>
    );
  }

  const stats = getLeadStats();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex-1 p-6 bg-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Lead Management</h1>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              ➕ Add Lead
            </button>
          </div>

          {/* Lead Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">Total Leads</div>
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">New</div>
              <div className="text-2xl font-bold text-blue-600">{stats.newLeads}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">Qualified</div>
              <div className="text-2xl font-bold text-indigo-600">{stats.qualified}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">Proposals</div>
              <div className="text-2xl font-bold text-pink-600">{stats.proposals}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">Negotiations</div>
              <div className="text-2xl font-bold text-orange-600">{stats.negotiations}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">Urgent</div>
              <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border p-2 rounded"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border p-2 rounded"
              >
                <option value="all">All Statuses</option>
                {leadStatuses.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="border p-2 rounded"
              >
                <option value="all">All Priorities</option>
                {priorities.map(priority => (
                  <option key={priority} value={priority}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction("convert")}
                  disabled={selectedLeads.length === 0}
                  className="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 disabled:opacity-50 text-sm"
                >
                  Convert Selected
                </button>
                <button
                  onClick={() => handleBulkAction("delete")}
                  disabled={selectedLeads.length === 0}
                  className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 disabled:opacity-50 text-sm"
                >
                  Delete Selected
                </button>
              </div>
            </div>
          </div>

          {/* Leads Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLeads(filteredLeads.map(l => l.id));
                          } else {
                            setSelectedLeads([]);
                          }
                        }}
                        checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                      />
                    </th>
                    <th className="text-left p-3">Lead</th>
                    <th className="text-left p-3">Company</th>
                    <th className="text-left p-3">Source</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Priority</th>
                    <th className="text-left p-3">Created</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={() => handleSelectLead(lead.id)}
                        />
                      </td>
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{lead.name}</div>
                          <div className="text-sm text-gray-600">{lead.email}</div>
                          <div className="text-sm text-gray-600">{lead.phone}</div>
                        </div>
                      </td>
                      <td className="p-3">{lead.company || "-"}</td>
                      <td className="p-3">
                        <span className="text-sm text-gray-600 capitalize">
                          {lead.source?.replace('_', ' ') || "-"}
                        </span>
                      </td>
                      <td className="p-3">
                        <select
                          value={lead.status || "new"}
                          onChange={(e) => handleStatusUpdate(lead.id, e.target.value)}
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(lead.status || "new")}`}
                        >
                          {leadStatuses.map(status => (
                            <option key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(lead.priority || "medium")}`}>
                          {(lead.priority || "medium").charAt(0).toUpperCase() + (lead.priority || "medium").slice(1)}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(lead)}
                            className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleConvertToCustomer(lead.id)}
                            className="text-green-500 hover:text-green-700 text-sm font-medium"
                          >
                            Convert
                          </button>
                          <button
                            onClick={() => handleDelete(lead.id)}
                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredLeads.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {leads.length === 0 ? "No leads found. Add your first lead to get started!" : "No leads match your filters."}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Lead Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingLead ? "Edit Lead" : "Add New Lead"}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone *</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Company</label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Source</label>
                  <select
                    name="source"
                    value={formData.source}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                  >
                    <option value="">Select Source</option>
                    {leadSources.map(source => (
                      <option key={source} value={source}>
                        {source.charAt(0).toUpperCase() + source.slice(1).replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                  >
                    {leadStatuses.map(status => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                  >
                    {priorities.map(priority => (
                      <option key={priority} value={priority}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                    rows="3"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  {editingLead ? "Update Lead" : "Add Lead"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this lead? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmDelete}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm({ show: false, leadId: null })}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
