import { Button } from "@/components/ui/button";
import { Eraser } from "lucide-react";

interface EraserToolProps {
  isActive: boolean;
  onClick: () => void;
}

export const EraserTool = ({ isActive, onClick }: EraserToolProps) => {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <Button
        variant="ghost"
        size="sm"
        className={`h-9 w-9 p-0 rounded-lg transition-all duration-200 ${
          isActive
            ? "bg-white/20 text-white shadow-md"
            : "text-black"
        }`}
        onClick={onClick}
        title="Eraser"
      >
        <Eraser className={`h-4 w-4 ${isActive ? 'text-white' : 'text-black'}`} />
      </Button>
      <span className={`text-[8px] font-bold leading-none ${
        isActive ? 'text-white' : 'text-black'
      }`}>
        4
      </span>
    </div>
  );
};
