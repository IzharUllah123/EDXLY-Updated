import { Button } from "@/components/ui/button";
import { Shapes } from "lucide-react";

interface ShapesToolProps {
  isActive: boolean;
  onClick: () => void;
  onShapeSelect: (shape: 'rectangle' | 'ellipse' | 'polygon' | 'line') => void;
}

export const ShapesTool = ({
  isActive,
  onClick,
  onShapeSelect,
}: ShapesToolProps) => {
  const handleShapeClick = (shape: 'rectangle' | 'ellipse' | 'polygon' | 'line') => {
    onClick();
    onShapeSelect(shape);
  };

  return (
    <div>
      {/* Toolbar Button with Enhanced Dropdown */}
      <div className="flex flex-col items-center gap-0.5">
        <Button
          variant="ghost"
          size="sm"
          className={`h-9 w-9 p-0 rounded-lg transition-all duration-200 ${
            isActive
              ? "bg-white/20 text-white shadow-md"
              : "text-black hover:bg-white hover:text-black"
          }`}
          onClick={onClick}
          title="Shapes - Draw various geometric shapes"
        >
          <Shapes className={`h-4 w-4 ${isActive ? 'text-white' : 'text-black'}`} />
        </Button>
        <span className={`text-[8px] font-bold leading-none ${
          isActive ? 'text-white' : 'text-black'
        }`}>
          8
        </span>
      </div>

      {/* REMOVE: Shape Tools Dropdown completely removed to eliminate modal */}
    </div>
  );
};
