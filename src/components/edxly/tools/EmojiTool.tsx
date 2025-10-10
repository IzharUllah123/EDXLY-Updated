import { Button } from "@/components/ui/button";
import { Smile } from "lucide-react";
import { useState } from "react";

interface EmojiToolProps {
  isActive: boolean;
  onClick: () => void;
  onEmojiPlace?: (emoji: string) => void;
  canvasRef?: any;
}

export const EmojiTool = ({ isActive, onClick, onEmojiPlace }: EmojiToolProps) => {
  const placeEmoji = (emoji: string) => {
    onEmojiPlace?.(emoji);
  };

  const emojis = [
    { emoji: '😊', title: 'Smiling' },
    { emoji: '😍', title: 'Hearts Eyes' },
    { emoji: '😎', title: 'Cool' },
    { emoji: '☹️', title: 'Sad' },
    { emoji: '❤️', title: 'Heart' },
    { emoji: '👍🏻', title: 'Like' },
    { emoji: '👎', title: 'Unlike' },
  ];

  return (
    <div>
      {/* Toolbar Button */}
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

      {/* Emoji Picker Panel */}
      {isActive && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-md rounded-lg shadow-lg p-4 z-50">
          <div className="flex gap-2 max-w-fit">
            {emojis.map(({ emoji, title }) => (
              <button
                key={emoji}
                onClick={() => placeEmoji(emoji)}
                className="text-2xl p-2 rounded-lg hover:bg-gray-200 transition-colors"
                title={title}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
