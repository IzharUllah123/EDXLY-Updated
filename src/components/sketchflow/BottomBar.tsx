import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Eye, 
  Code, 
  Download, 
  Wifi, 
  WifiOff,
  Clock,
  Users,
  MessageSquare
} from "lucide-react";
import { useState } from "react";

export const BottomBar = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [lastSaved, setLastSaved] = useState("2 minutes ago");

  return (
    <div className="h-12 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
      {/* Left Section - Actions */}
      <div className="flex items-center gap-3">
        <Button size="sm" className="h-8">
          <Play className="h-4 w-4 mr-1" />
          Run
        </Button>
        
        <Button variant="outline" size="sm" className="h-8">
          <Eye className="h-4 w-4 mr-1" />
          Preview
        </Button>
        
        <Button variant="ghost" size="sm" className="h-8">
          <Code className="h-4 w-4 mr-1" />
          Code
        </Button>
        
        <Button variant="ghost" size="sm" className="h-8">
          <Download className="h-4 w-4 mr-1" />
          Export
        </Button>
      </div>

      {/* Center Section - Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Clock className="h-4 w-4" />
          <span>Saved {lastSaved}</span>
        </div>
        
        <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
          {isConnected ? (
            <>
              <Wifi className="h-3 w-3 mr-1" />
              Connected
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3 mr-1" />
              Offline
            </>
          )}
        </Badge>
      </div>

      {/* Right Section - Collaboration */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-xs text-white font-medium">
              A
            </div>
            <div className="w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center text-xs text-white font-medium">
              B
            </div>
            <div className="w-6 h-6 bg-purple-500 rounded-full border-2 border-white flex items-center justify-center text-xs text-white font-medium">
              +2
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8">
            <Users className="h-4 w-4" />
          </Button>
        </div>
        
        <Button variant="ghost" size="sm" className="h-8">
          <MessageSquare className="h-4 w-4" />
          <Badge variant="secondary" className="ml-1 text-xs">3</Badge>
        </Button>
      </div>
    </div>
  );
};