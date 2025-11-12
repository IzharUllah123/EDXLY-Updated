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

export const TextTool = ({ 
  isActive, 
  onClick, 
  showDropdown = false, 
  onSimpleClick, 
  onColorfulClick 
}: TextToolProps) => {
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

    </div>
  );
};