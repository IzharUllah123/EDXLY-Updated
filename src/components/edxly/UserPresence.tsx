import { Pencil, MousePointer, Hand, Square, Eraser, Move } from "lucide-react";
import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  isActive: boolean;
  isHost?: boolean;
  timestamp: number;
}

interface PenState {
  x: number;
  y: number;
  isDrawing: boolean;
  isHovering: boolean;
  isSelecting: boolean;
  tool: 'pen' | 'eraser' | 'select';
  color: string;
  width: number;
  timestamp: number;
}

interface ToolState {
  tool: 'pen' | 'eraser' | 'select';
  color: string;
  width: number;
  timestamp: number;
}

interface UserPresenceProps {
  users: User[];
  currentUserId?: string;
  roomId?: string;
}

export const UserPresence = ({ users, currentUserId, roomId }: UserPresenceProps) => {
  const [userPenStates, setUserPenStates] = useState<Record<string, PenState>>({});
  const [userToolStates, setUserToolStates] = useState<Record<string, ToolState>>({});

  useEffect(() => {
    if (!roomId) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith(`edxly_pen_${roomId}_`) && e.newValue) {
        try {
          const userId = e.key.split('_').pop();
          if (userId && userId !== currentUserId) {
            const penState = JSON.parse(e.newValue);
            setUserPenStates(prev => ({
              ...prev,
              [userId]: penState
            }));
          }
        } catch (error) {
          console.error("Error parsing pen state:", error);
        }
      }

      if (e.key?.startsWith(`edxly_tools_${roomId}_`) && e.newValue) {
        try {
          const userId = e.key.split('_').pop();
          if (userId && userId !== currentUserId) {
            const toolState = JSON.parse(e.newValue);
            setUserToolStates(prev => ({
              ...prev,
              [userId]: toolState
            }));
          }
        } catch (error) {
          console.error("Error parsing tool state:", error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    const loadExistingStates = () => {
      const penStates: Record<string, PenState> = {};
      const toolStates: Record<string, ToolState> = {};
      
      users.forEach(user => {
        if (user.id !== currentUserId) {
          const penStateKey = `edxly_pen_${roomId}_${user.id}`;
          const penStateStr = localStorage.getItem(penStateKey);
          if (penStateStr) {
            try {
              const penState = JSON.parse(penStateStr);
              if (Date.now() - penState.timestamp < 10000) {
                penStates[user.id] = penState;
              }
            } catch (error) {
              console.error("Error parsing stored pen state:", error);
            }
          }

          const toolStateKey = `edxly_tools_${roomId}_${user.id}`;
          const toolStateStr = localStorage.getItem(toolStateKey);
          if (toolStateStr) {
            try {
              const toolState = JSON.parse(toolStateStr);
              if (Date.now() - toolState.timestamp < 30000) {
                toolStates[user.id] = toolState;
              }
            } catch (error) {
              console.error("Error parsing stored tool state:", error);
            }
          }
        }
      });
      
      setUserPenStates(penStates);
      setUserToolStates(toolStates);
    };

    loadExistingStates();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [roomId, currentUserId, users]);

  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setUserPenStates(prev => {
        const now = Date.now();
        const cleaned: Record<string, PenState> = {};
        Object.entries(prev).forEach(([userId, penState]) => {
          if (now - penState.timestamp < 10000) {
            cleaned[userId] = penState;
          }
        });
        return cleaned;
      });

      setUserToolStates(prev => {
        const now = Date.now();
        const cleaned: Record<string, ToolState> = {};
        Object.entries(prev).forEach(([userId, toolState]) => {
          if (now - toolState.timestamp < 30000) {
            cleaned[userId] = toolState;
          }
        });
        return cleaned;
      });
    }, 5000);

    return () => clearInterval(cleanupInterval);
  }, []);

  const getPenIcon = (penState: PenState, toolState?: ToolState) => {
    const currentTool = penState.tool || toolState?.tool || 'pen';
    
    if (penState.isDrawing) {
      if (currentTool === 'eraser') {
        return <Eraser className="w-4 h-4 text-white" />;
      } else {
        return <Pencil className="w-4 h-4 text-white" />;
      }
    } else if (penState.isSelecting || currentTool === 'select') {
      return <Move className="w-4 h-4 text-white" />;
    } else if (penState.isHovering) {
      if (currentTool === 'eraser') {
        return <Eraser className="w-4 h-4 text-white" />;
      } else {
        return <MousePointer className="w-4 h-4 text-white" />;
      }
    } else {
      return <Hand className="w-4 h-4 text-white" />;
    }
  };

  const getPenStateLabel = (penState: PenState, toolState?: ToolState) => {
    const currentTool = penState.tool || toolState?.tool || 'pen';
    
    if (penState.isDrawing) {
      return currentTool === 'eraser' ? "Erasing" : "Drawing";
    }
    if (penState.isSelecting || currentTool === 'select') {
      return "Selecting";
    }
    if (penState.isHovering) {
      return `${currentTool.charAt(0).toUpperCase() + currentTool.slice(1)} Ready`;
    }
    return "Idle";
  };

  const getPenColor = (user: User, penState: PenState, toolState?: ToolState) => {
    const currentTool = penState.tool || toolState?.tool || 'pen';
    
    if (currentTool === 'eraser') {
      return '#6b7280'; 
    }
    
    return penState.color || toolState?.color || user.color;
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {users.map((user) => {
        if (user.id === currentUserId) return null;
        
        const penState = userPenStates[user.id];
        const toolState = userToolStates[user.id];
        
        if (!penState || !penState.isHovering) return null;

        const penColor = getPenColor(user, penState, toolState);
        const currentTool = penState.tool || toolState?.tool || 'pen';

        return (
          <div
            key={user.id}
            className="absolute transition-all duration-150 ease-out"
            style={{
              left: penState.x,
              top: penState.y,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="relative">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white transition-all duration-200 ${
                  penState.isDrawing ? 'scale-110 shadow-xl' : 'scale-100'
                } ${
                  currentTool === 'eraser' ? 'bg-gray-500' : ''
                }`}
                style={{ 
                  backgroundColor: currentTool === 'eraser' ? '#6b7280' : penColor,
                  boxShadow: penState.isDrawing ? `0 0 20px ${penColor}40` : undefined
                }}
              >
                {getPenIcon(penState, toolState)}
              </div>
              
              <div 
                className="absolute top-12 left-1/2 transform -translate-x-1/2 px-3 py-1.5 rounded-lg text-xs font-medium text-white shadow-lg whitespace-nowrap transition-all duration-200"
                style={{ backgroundColor: penColor }}
              >
                <div className="flex items-center gap-2">
                  <span>{user.name}</span>
                  <span className="text-xs opacity-80">
                    • {getPenStateLabel(penState, toolState)}
                  </span>
                  {toolState?.width && (
                    <span className="text-xs opacity-70">
                      ({toolState.width}px)
                    </span>
                  )}
                </div>
              </div>
              
              {penState.isDrawing && (
                <div className="absolute inset-0 rounded-full animate-ping">
                  <div 
                    className="w-10 h-10 rounded-full opacity-75"
                    style={{ backgroundColor: penColor }}
                  />
                </div>
              )}
              
              {penState.isDrawing && (
                <div className="absolute inset-0">
                  <div 
                    className={`w-16 h-16 rounded-full opacity-30 animate-pulse ${
                      currentTool === 'eraser' ? 'opacity-50' : ''
                    }`}
                    style={{ 
                      backgroundColor: penColor,
                      transform: 'translate(-15%, -15%)',
                      width: currentTool === 'eraser' ? '20px' : '16px',
                      height: currentTool === 'eraser' ? '20px' : '16px'
                    }}
                  />
                </div>
              )}

              <div 
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center"
                style={{ fontSize: '10px' }}
              >
                {currentTool === 'pen' && '✏️'}
                {currentTool === 'eraser' && '🧹'}
                {currentTool === 'select' && '👆'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};