import React from "react";

export default function CampaignHistoryNav({ historyCount, filter, onFilterChange }) {
  const filterOptions = [
    { value: "all", label: "All Campaigns", icon: "🌐" },
    { value: "whatsapp", label: "WhatsApp", icon: "💬" },
    { value: "sms", label: "SMS", icon: "📱" }
  ];

  return (
    <div className="w-64 bg-white rounded-lg shadow-lg p-4 mr-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
        Campaign Options
      </h3>
      
      {/* Filter Section */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Filter by Type</h4>
        <div className="space-y-1">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onFilterChange(option.value)}
              className={`w-full text-left px-3 py-2 rounded-md transition-colors duration-200 flex items-center gap-2 ${
                filter === option.value
                  ? "bg-blue-100 text-blue-700 border border-blue-300"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              <span>{option.icon}</span>
              <span className="text-sm">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Campaign Stats</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-gray-500">Total</div>
            <div className="font-semibold">{historyCount}</div>
          </div>
          <div className="bg-blue-50 p-2 rounded">
            <div className="text-gray-500">Filtered</div>
            <div className="font-semibold text-blue-600">{historyCount}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
