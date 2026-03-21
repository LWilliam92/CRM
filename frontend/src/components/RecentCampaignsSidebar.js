import React from "react";

export default function RecentCampaignsSidebar({ recentCampaigns, filter, onFilterChange }) {
  const filterOptions = [
    { value: "all", label: "All", icon: "🌐" },
    { value: "whatsapp", label: "WhatsApp", icon: "💬" },
    { value: "sms", label: "SMS", icon: "📱" }
  ];

  return (
    <div className="w-80 bg-white rounded-lg shadow-lg p-4 ml-6">
      <div className="flex justify-between items-center mb-4 pb-2 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Recent Campaigns</h3>
        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
          {recentCampaigns.length}
        </div>
      </div>
      
      {/* Filter Options */}
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-2">Quick Filter</div>
        <div className="flex gap-1">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onFilterChange(option.value)}
              className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-colors duration-200 ${
                filter === option.value
                  ? "bg-blue-100 text-blue-700 border border-blue-300"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              <span className="mr-1">{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recent Campaigns List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {recentCampaigns.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-3xl text-gray-300">📭</span>
            <p className="text-sm text-gray-500 mt-2">No recent campaigns</p>
          </div>
        ) : (
          recentCampaigns.map((campaign) => (
            <div key={campaign.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-gray-900 truncate">{campaign.name}</h4>
                  <p className="text-xs text-gray-600 truncate mt-1">
                    {campaign.message.substring(0, 60)}...
                  </p>
                </div>
                <div className="flex gap-1 ml-2 flex-shrink-0">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    campaign.type === 'whatsapp' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {campaign.type.toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    campaign.status === 'completed' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {campaign.status || 'pending'}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center text-xs text-gray-500">
                <div className="flex gap-3">
                  <span>👥 {campaign.recipients}</span>
                  <span>🕒 {new Date(campaign.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => alert(`View: ${campaign.name}`)}
                    className="text-blue-500 hover:text-blue-700 font-medium"
                  >
                    View
                  </button>
                  <button
                    onClick={() => alert(`Edit: ${campaign.name}`)}
                    className="text-blue-500 hover:text-blue-700 font-medium"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats Summary */}
      <div className="border-t pt-4 mt-4">
        <div className="text-sm font-medium text-gray-700 mb-2">Summary</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-gray-500">Total Recent</div>
            <div className="font-semibold">{recentCampaigns.length}</div>
          </div>
          <div className="bg-blue-50 p-2 rounded">
            <div className="text-gray-500">Completed</div>
            <div className="font-semibold text-blue-600">
              {recentCampaigns.filter(c => c.status === 'completed').length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
