import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { api } from "../api";

export default function TicketConversation({ ticketId, onTicketUpdate }) {
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [cannedResponses, setCannedResponses] = useState([]);
  const [showCannedResponses, setShowCannedResponses] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (ticketId) {
      fetchTicketDetails();
      fetchCannedResponses();
    }
  }, [ticketId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchTicketDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${api.base}/tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setTicket(res.data.ticket);
      setMessages(res.data.messages);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching ticket details:", error);
      setLoading(false);
    }
  };

  const fetchCannedResponses = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${api.base}/tickets/canned-responses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCannedResponses(res.data);
    } catch (error) {
      console.error("Error fetching canned responses:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const token = localStorage.getItem("token");
      
      // Add message to UI immediately for better UX
      const tempMessage = {
        id: Date.now(),
        sender_type: "agent",
        content: newMessage,
        created_at: new Date().toISOString(),
        is_temp: true
      };
      setMessages(prev => [...prev, tempMessage]);

      // Send via API
      await axios.post(
        `${api.base}/messenger/send-reply`,
        {
          ticketId: ticketId,
          message: newMessage,
          agentId: 1 // Should come from auth context
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setNewMessage("");
      setShowCannedResponses(false);
      
      // Refresh messages after a short delay
      setTimeout(() => {
        fetchTicketDetails();
      }, 1000);

    } catch (error) {
      console.error("Error sending message:", error);
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => !msg.is_temp));
    } finally {
      setSending(false);
    }
  };

  const handleUseCannedResponse = (response) => {
    setNewMessage(response.content);
    setShowCannedResponses(false);
  };

  const updateTicketStatus = async (newStatus) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${api.base}/tickets/${ticketId}`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setTicket(prev => ({ ...prev, status: newStatus }));
      if (onTicketUpdate) onTicketUpdate();

    } catch (error) {
      console.error("Error updating ticket status:", error);
    }
  };

  const resolveTicket = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${api.base}/tickets/${ticketId}/resolve`,
        {
          resolution_notes: "Resolved via conversation",
          agentId: 1
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setTicket(prev => ({ ...prev, status: 'resolved' }));
      if (onTicketUpdate) onTicketUpdate();

    } catch (error) {
      console.error("Error resolving ticket:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading conversation...</div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">Ticket not found</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Ticket Header */}
      <div className="bg-white border-b p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{ticket.ticket_number}</h3>
            <p className="text-gray-600">{ticket.customer_name}</p>
            <p className="text-sm text-gray-500">{ticket.subject}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              ticket.status === 'open' ? 'bg-red-100 text-red-800' :
              ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
              ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {ticket.status.replace('_', ' ')}
            </span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
              ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
              ticket.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {ticket.priority}
            </span>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex space-x-2 mt-3">
          {ticket.status === 'open' && (
            <button
              onClick={() => updateTicketStatus('in_progress')}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              Start Working
            </button>
          )}
          {ticket.status === 'in_progress' && (
            <>
              <button
                onClick={() => updateTicketStatus('open')}
                className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
              >
                Reopen
              </button>
              <button
                onClick={resolveTicket}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                Resolve
              </button>
            </>
          )}
          {ticket.status === 'resolved' && (
            <button
              onClick={() => updateTicketStatus('open')}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              Reopen
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender_type === 'agent' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender_type === 'agent'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800'
              } ${message.is_temp ? 'opacity-70' : ''}`}
            >
              {message.message_type === 'image' && (
                <div className="mb-2">
                  <img
                    src={message.media_url}
                    alt="Shared image"
                    className="rounded max-w-full"
                  />
                </div>
              )}
              <p className="text-sm">{message.content}</p>
              <p className={`text-xs mt-1 ${
                message.sender_type === 'agent' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {new Date(message.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t p-4 bg-white">
        {showCannedResponses && (
          <div className="mb-3 p-2 bg-gray-50 rounded max-h-32 overflow-y-auto">
            <div className="text-xs text-gray-600 mb-2">Quick Responses:</div>
            <div className="space-y-1">
              {cannedResponses.map((response) => (
                <button
                  key={response.id}
                  onClick={() => handleUseCannedResponse(response)}
                  className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-200 rounded"
                >
                  {response.title}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex space-x-2">
          <button
            onClick={() => setShowCannedResponses(!showCannedResponses)}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            title="Quick Responses"
          >
            📝
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sending || ticket.status === 'resolved'}
          />
          <button
            onClick={sendMessage}
            disabled={sending || !newMessage.trim() || ticket.status === 'resolved'}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? '...' : 'Send'}
          </button>
        </div>
        
        {ticket.status === 'resolved' && (
          <p className="text-xs text-gray-500 mt-2">
            This ticket is resolved. Reopen to send messages.
          </p>
        )}
      </div>
    </div>
  );
}
