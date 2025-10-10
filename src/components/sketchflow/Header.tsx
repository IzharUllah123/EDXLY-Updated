import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  Menu, 
  Sun, 
  Moon, 
  Share2, 
  Play, 
  Users, 
  Settings,
  ChevronDown
} from "lucide-react";
import { useState } from "react";

export const Header = () => {
  const [isDark, setIsDark] = useState(false);

  return (
    <header className="h-12 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="p-1">
          <Menu className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded"></div>
          <span className="font-semibold text-sm">Sketchflow</span>
        </div>
        
        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
          <span>Untitled Project</span>
          <ChevronDown className="h-3 w-3" />
        </div>
      </div>

      {/* Center Section */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm">
          <Play className="h-4 w-4 mr-1" />
          Preview
        </Button>
        <Button variant="ghost" size="sm">
          <Share2 className="h-4 w-4 mr-1" />
          Share
        </Button>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm">
          <Users className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-2">
          <Sun className="h-4 w-4" />
          <Switch 
            checked={isDark} 
            onCheckedChange={setIsDark}
            className="scale-75"
          />
          <Moon className="h-4 w-4" />
        </div>
        
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
};