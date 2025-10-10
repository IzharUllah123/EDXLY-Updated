import React from "react";
import clsx from "clsx";
import { Type } from "lucide-react";

interface TextToolProps {
  isActive: boolean;
  onClick: () => void;
  showDropdown?: boolean;
  onSimpleClick?: () => void;
  onColorfulClick?: () => void;
}

export const TextTool = ({ isActive, onClick, showDropdown = false, onSimpleClick, onColorfulClick }: TextToolProps) => {
  const value = "text";
  const label = "Text Tool";
  const letter = "5";
  const shortcut = "T or 5";

  return (
    <div className="relative flex flex-col items-center gap-0.5">
      <button
        className={clsx(
          "h-9 w-9 p-2 rounded-lg transition-all duration-200 relative flex items-center justify-center hover:bg-white",
          isActive
            ? "bg-white/20 text-white shadow-md border border-white/30"
            : "text-black"
        )}
        onClick={onClick}
        title={`${label} — ${shortcut}`}
        aria-label={label}
        aria-keyshortcuts={shortcut}
      >
        <Type className={`h-4 w-4 ${isActive ? 'text-white' : 'text-black'}`} />
      </button>

      {/* Keyboard shortcut display */}
      <span className={`text-[8px] font-bold leading-none ${
        isActive ? 'text-white' : 'text-black'
      }`}>
        {letter}
      </span>

      {/* Text Type Selection Dropdown - Enhanced with Atools styling */}
      {isActive && showDropdown && (
        <div className="absolute top-12 left-0 z-60 bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-gray-200 p-2 min-w-[180px]">
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-800 border-b pb-1">Text Types</h4>
            <div className="grid grid-cols-2 gap-1">
              <button
                className="flex flex-col items-center gap-1 p-2 rounded hover:bg-blue-50 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onSimpleClick?.();
                }}
                title="Simple Text Notes"
              >
                <div className="h-6 w-6 text-gray-700 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </div>
                <span className="text-[8px] font-medium text-gray-600">Simple</span>
              </button>

              <button
                className="flex flex-col items-center gap-1 p-2 rounded hover:bg-orange-50 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onColorfulClick?.();
                }}
                title="Colorful Tiny Notes"
              >
                <div className="h-6 w-6 text-orange-600 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 8l3-3 3 3-3 3-3-3z" fill="currentColor" stroke="currentColor" strokeWidth="1" />
                    <path d="M8 4l4 4-4 4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-[8px] font-medium text-gray-600">Colorful</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
