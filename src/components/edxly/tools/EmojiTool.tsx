import { Button } from "@/components/ui/button";
import { Smile } from "lucide-react";

interface EmojiToolProps {
  isActive: boolean;
  onClick: () => void;
  onEmojiPlace?: (emoji: string) => void;
}

export const EmojiTool = ({ isActive, onClick }: EmojiToolProps) => {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <Button
        variant="ghost"
        size="sm"
        className={`h-8 w-8 md:h-9 md:w-9 p-0 rounded-lg transition-all duration-200 ${
          isActive
            ? "bg-white/20 text-white shadow-md"
            : "text-black hover:bg-white hover:text-black"
        }`}
        onClick={onClick}
        title="Emoji - Add emojis to canvas"
      >
        <Smile className={`h-4 w-4 ${isActive ? 'text-white' : 'text-black'}`} />
      </Button>
      <span className={`text-[8px] font-bold leading-none ${
        isActive ? 'text-white' : 'text-black'
      }`}>
        7
      </span>
    </div>
  );
};