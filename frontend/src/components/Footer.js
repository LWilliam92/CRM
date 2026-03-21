import React from "react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white py-4 px-6 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm">
            © {currentYear} Devsphere IT Solutions. All rights reserved.
          </div>
          <div className="flex gap-4 mt-2 md:mt-0">
            <span className="text-xs text-gray-400">
              Customer Relationship Management System
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
