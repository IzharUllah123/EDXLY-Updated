// ZoomControls.tsx - Separate component for bottom-left zoom controls

import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ZoomControlsProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}) => {
  return (
    <div className="fixed bottom-4 left-4 md:bottom-6 md:left-6 z-50">
      <div className="flex flex-row items-center gap-2 p-2 bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-gray-200">
        {/* Zoom In Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onZoomIn}
          className="h-9 w-9 p-0 hover:bg-gray-100 rounded-lg"
          title="Zoom In (Ctrl + +)"
        >
          <ZoomIn className="h-4 w-4 text-gray-700" />
        </Button>
        
        {/* Zoom Percentage Display - Click to Reset */}
        <button
          onClick={onZoomReset}
          className="px-2 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors min-w-[50px] text-center"
          title="Reset Zoom (Ctrl + 0)"
        >
          {Math.round(zoomLevel * 100)}%
        </button>
        
        {/* Zoom Out Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onZoomOut}
          className="h-9 w-9 p-0 hover:bg-gray-100 rounded-lg"
          title="Zoom Out (Ctrl + -)"
        >
          <ZoomOut className="h-4 w-4 text-gray-700" />
        </Button>

        {/* Divider */}
        <div className="w-10px h-px bg-gray-200 my-1"></div>

        {/* Fit to Screen Button (Optional) */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onZoomReset}
          className="h-9 w-9 p-0 hover:bg-gray-100 rounded-lg"
          title="Fit to Screen (Ctrl + 0)"
        >
          <Maximize2 className="h-4 w-4 text-gray-700" />
        </Button>
      </div>
    </div>
  );
};

export default ZoomControls;
