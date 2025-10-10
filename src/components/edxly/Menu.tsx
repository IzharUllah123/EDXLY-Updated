import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu as MenuIcon, X, Download, Users, Eye } from "lucide-react";

export const Menu = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleExport = () => {
    alert("Export feature will be available after backend integration");
    setIsMenuOpen(false);
  };

  const handleCollaborate = () => {
    alert("Collaboration feature is currently disabled for redevelopment");
    setIsMenuOpen(false);
  };

  const handleUsersDisplay = () => {
    alert("Users display feature will be available after backend integration");
    setIsMenuOpen(false);
  };

  return (
    <div className="relative">
      {/* Menu Button */}
      <Button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={`h-10 w-10 p-0 rounded-lg transition-all duration-200 shadow-md ${
          isMenuOpen
            ? "bg-red-500 hover:bg-red-600 text-white"
            : "bg-white/90 backdrop-blur-md hover:bg-white text-gray-700 border border-white/20"
        }`}
        title="Menu"
      >
        {isMenuOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <MenuIcon className="h-5 w-5" />
        )}
      </Button>

      {/* Menu Dropdown */}
      {isMenuOpen && (
        <div className="absolute top-12 left-0 bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-white/20 z-50 min-w-[200px] py-2">
          {/* Export Option */}
          <button
            onClick={handleExport}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-150"
          >
            <Download className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Export</span>
          </button>

          {/* Collaborate Option */}
          <button
            onClick={handleCollaborate}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-150"
          >
            <Users className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Collaborate</span>
          </button>

          {/* Users Display Option */}
          <button
            onClick={handleUsersDisplay}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-150"
          >
            <Eye className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Users Display</span>
          </button>

          {/* Status Note */}
          <div className="mt-2 px-4 py-2 bg-orange-50 border-t border-orange-100">
            <p className="text-xs text-orange-600 leading-relaxed">
              Some features disabled for redevelopment
            </p>
          </div>
        </div>
      )}

      {/* Overlay to close menu when clicking outside */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </div>
  );
};
