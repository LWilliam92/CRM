const API_BASE_URL = "http://localhost:5001/api";

export const api = {
  base: API_BASE_URL,
  auth: {
    login: `${API_BASE_URL}/auth/login`
  },
  contacts: {
    getAll: `${API_BASE_URL}/contacts`,
    getById: (id) => `${API_BASE_URL}/contacts/${id}`,
    create: `${API_BASE_URL}/contacts`,
    update: (id) => `${API_BASE_URL}/contacts/${id}`,
    delete: (id) => `${API_BASE_URL}/contacts/${id}`
  },
  campaigns: {
    getAll: `${API_BASE_URL}/campaigns`,
    create: `${API_BASE_URL}/campaigns`
  },
  dashboard: {
    getStats: `${API_BASE_URL}/dashboard`
  },
  facebook: {
    getStats: `${API_BASE_URL}/facebook/stats`,
    getLeads: `${API_BASE_URL}/facebook/leads`
  },
  tickets: {
    getAll: `${API_BASE_URL}/tickets`,
    getById: (id) => `${API_BASE_URL}/tickets/${id}`,
    update: (id) => `${API_BASE_URL}/tickets/${id}`,
    assign: (id) => `${API_BASE_URL}/tickets/${id}/assign`,
    resolve: (id) => `${API_BASE_URL}/tickets/${id}/resolve`,
    stats: `${API_BASE_URL}/tickets/stats/dashboard`,
    cannedResponses: `${API_BASE_URL}/tickets/canned-responses`
  },
  messenger: {
    webhook: `${API_BASE_URL}/messenger/webhook`,
    sendReply: `${API_BASE_URL}/messenger/send-reply`
  },
  settings: {
    getFacebook: `${API_BASE_URL}/settings/facebook`,
    updateLeadAds: `${API_BASE_URL}/settings/facebook/lead-ads`,
    updateMessenger: `${API_BASE_URL}/settings/facebook/messenger`,
    testConnection: `${API_BASE_URL}/settings/facebook/test-connection`,
    getGeneral: `${API_BASE_URL}/settings/general`,
    updateGeneral: `${API_BASE_URL}/settings/general`
  }
};

export default API_BASE_URL;
