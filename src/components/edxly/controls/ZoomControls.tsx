import { Minus, Plus } from "lucide-react";

interface ZoomControlsProps {
  zoomLevel?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

export const ZoomControls = ({
  zoomLevel = 100,
  onZoomIn,
  onZoomOut
}: ZoomControlsProps) => {
  const handleZoomIn = () => {
    onZoomIn?.();
  };

  const handleZoomOut = () => {
    onZoomOut?.();
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-md shadow-md flex items-center px-1.5 py-1">
      <button
        className="h-6 w-6 p-0 rounded-sm hover:bg-gray-100/80 text-gray-600 flex items-center justify-center transition-colors"
        onClick={handleZoomOut}
        title="Zoom out"
      >
        <Minus className="h-3 w-3" />
      </button>

      <span className="mx-2 text-xs font-medium text-gray-700 min-w-[2.5rem] text-center">
        {zoomLevel}%
      </span>

      <button
        className="h-6 w-6 p-0 rounded-sm hover:bg-gray-100/80 text-gray-600 flex items-center justify-center transition-colors"
        onClick={handleZoomIn}
        title="Zoom in"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
};
