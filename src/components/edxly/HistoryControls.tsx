// src/components/edxly/HistoryControls.tsx

import { Undo2, Redo2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HistoryControlsProps {
  onUndo: () => void;
  onRedo: () => void;
  // Optional: Add props to disable buttons if needed
  // canUndo?: boolean;
  // canRedo?: boolean;
}

export const HistoryControls: React.FC<HistoryControlsProps> = ({
  onUndo,
  onRedo,
  // canUndo = true, // Default to enabled
  // canRedo = true, // Default to enabled
}) => {
  return (
    // Positioned fixed at the bottom right
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50">
      <div className="flex items-center gap-2 p-2 bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-gray-200">
        {/* Undo Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onUndo}
          className="h-8 w-8 p-0 hover:bg-gray-100 rounded-md"
          title="Undo (Ctrl + Z)"
          // disabled={!canUndo} // Uncomment if you add disable logic
        >
          <Undo2 className="h-4 w-4 text-gray-700" />
        </Button>

        {/* Redo Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onRedo}
          className="h-8 w-8 p-0 hover:bg-gray-100 rounded-md"
          title="Redo (Ctrl + Y)"
          // disabled={!canRedo} // Uncomment if you add disable logic
        >
          <Redo2 className="h-4 w-4 text-gray-700" />
        </Button>
      </div>
    </div>
  );
};

export default HistoryControls;
