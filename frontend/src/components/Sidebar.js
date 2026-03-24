import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: "", shortcut: "Ctrl+D" },
    { name: "Contacts", path: "/contacts", icon: "", shortcut: "Ctrl+C" },
    { name: "Ticket Management", path: "/tickets", icon: "", shortcut: "Ctrl+T" },
    { name: "Lead Management", path: "/leads", icon: "", shortcut: "Ctrl+L" },
    { name: "Facebook Lead Ads", path: "/facebook-leads", icon: "", shortcut: "Ctrl+F" },
    { name: "Categories", path: "/categories", icon: "", shortcut: "Ctrl+G" },
    { name: "Campaign History", path: "/campaign-history", icon: "", shortcut: "Ctrl+H" },
    { name: "Reports", path: "/reports", icon: "", shortcut: "Ctrl+R" },
    { name: "Settings", path: "/settings", icon: "", shortcut: "Ctrl+S" },
    { name: "Logout", path: "/logout", icon: "", shortcut: "" }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleKeyDown = (event) => {
    // Check for Ctrl+N to create new campaign
    if (event.ctrlKey && event.key === 'n') {
      event.preventDefault();
      navigate('/dashboard');
    }
  };

  useEffect(() => {
    // Add keyboard event listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="w-64 h-screen bg-gray-200 text-gray-800 p-5">
      <h2 className="text-xl font-bold mb-8">CRM Dashboard</h2>
      <ul className="space-y-2">
        {menuItems.slice(0, -1).map((item) => (
          <li key={item.name}>
            <button
              onClick={() => handleNavigation(item.path)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 flex items-center gap-3 ${
                isActive(item.path)
                  ? "bg-blue-500 text-white"
                  : "hover:bg-gray-300 text-gray-700"
              }`}
              title={`${item.name} (${item.shortcut})`}
            >
              <span className="text-lg">{item.icon}</span>
              <div className="flex-1">
                <span>{item.name}</span>
                {item.shortcut && (
                  <span className="text-xs text-gray-400 ml-2">({item.shortcut})</span>
                )}
              </div>
            </button>
          </li>
        ))}
        <li className="pt-4 mt-4 border-t border-gray-300">
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 flex items-center gap-3 hover:bg-red-300 text-red-700"
            title="Logout"
          >
            <span className="text-lg">🚪</span>
            <div className="flex-1">
              <span>Logout</span>
            </div>
          </button>
        </li>
      </ul>
    </div>
  );
}