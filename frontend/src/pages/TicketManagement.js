import React, { useState, useEffect } from "react";
import axios from "axios";
import { api } from "../api";
import TicketConversation from "../components/TicketConversation";
import Sidebar from "../components/Sidebar";

export default function TicketManagement() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'open',
    assigned_to: 'all',
    priority: 'all',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [stats, setStats] = useState({
    total_tickets: 0,
    open_tickets: 0,
    in_progress_tickets: 0,
    resolved_tickets: 0,
    unassigned_tickets: 0
  });

  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, [filters, pagination.page]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      const res = await axios.get(`${api.base}/tickets?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setTickets(res.data.tickets);
      setPagination(res.data.pagination);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${api.base}/tickets/stats/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleTicketSelect = (ticket) => {
    setSelectedTicket(ticket);
  };

  const handleTicketUpdate = () => {
    fetchTickets();
    fetchStats();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      
      <div className="flex-1 flex">
        {/* Tickets List */}
        <div className={`${selectedTicket ? 'w-1/3' : 'w-full'} bg-gray-50 border-r`}>
          <div className="p-4 bg-white border-b">
            <h2 className="text-xl font-bold mb-4">Ticket Management</h2>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-lg font-bold text-blue-600">{stats.open_tickets}</div>
                <div className="text-xs text-gray-600">Open</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded">
                <div className="text-lg font-bold text-yellow-600">{stats.in_progress_tickets}</div>
                <div className="text-xs text-gray-600">In Progress</div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="text-lg font-bold text-green-600">{stats.resolved_tickets}</div>
                <div className="text-xs text-gray-600">Resolved</div>
              </div>
              <div className="bg-red-50 p-3 rounded">
                <div className="text-lg font-bold text-red-600">{stats.unassigned_tickets}</div>
                <div className="text-xs text-gray-600">Unassigned</div>
              </div>
            </div>

            {/* Filters */}
            <div className="space-y-2">
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>

              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <input
                type="text"
                placeholder="Search tickets..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Tickets List */}
          <div className="overflow-y-auto" style={{ height: 'calc(100vh - 400px)' }}>
            {loading ? (
              <div className="p-4 text-center">
                <div className="text-gray-600">Loading tickets...</div>
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-4 text-center">
                <div className="text-gray-500">No tickets found</div>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => handleTicketSelect(ticket)}
                    className={`p-3 bg-white rounded cursor-pointer hover:bg-gray-50 border ${
                      selectedTicket?.id === ticket.id ? 'border-blue-500' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{ticket.ticket_number}</div>
                        <div className="text-sm text-gray-600">{ticket.customer_name}</div>
                        <div className="text-xs text-gray-500 truncate">{ticket.subject}</div>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{ticket.assigned_agent_name || 'Unassigned'}</span>
                      <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                    </div>
                    {ticket.message_count > 0 && (
                      <div className="mt-1 text-xs text-blue-600">
                        {ticket.message_count} messages
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="p-4 bg-white border-t">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Conversation View */}
        {selectedTicket ? (
          <div className="flex-1 bg-white">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <div>
                  <h3 className="font-semibold">{selectedTicket.ticket_number}</h3>
                  <p className="text-sm text-gray-600">{selectedTicket.customer_name}</p>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1">
                <TicketConversation
                  ticketId={selectedTicket.id}
                  onTicketUpdate={handleTicketUpdate}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="text-gray-500 mb-4">Select a ticket to view conversation</div>
              <div className="text-sm text-gray-400">
                Click on any ticket from the list to start messaging
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
