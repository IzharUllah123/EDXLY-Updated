import { Button } from "@/components/ui/button";
import { MousePointer2 } from "lucide-react";

interface PointerToolProps {
  isActive: boolean;
  onClick: () => void;
}

export const PointerTool = ({ isActive, onClick }: PointerToolProps) => {
  return (
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
        title="Select & transform objects — Click to select, drag to marquee"
      >
        <MousePointer2 className={`h-4 w-4 ${isActive ? 'text-white' : 'text-black'}`} />
      </Button>
      <span className={`text-[8px] font-bold leading-none ${
        isActive ? 'text-white' : 'text-black'
      }`}>
        2
      </span>
    </div>
  );
};
