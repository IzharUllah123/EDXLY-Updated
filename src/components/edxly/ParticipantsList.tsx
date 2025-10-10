import { Users, Crown, Circle, X } from "lucide-react";

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

interface ParticipantsListProps {
  users: User[];
  currentUserId?: string;
  onClose?: () => void;
}

export const ParticipantsList = ({ users, currentUserId, onClose }: ParticipantsListProps) => {
  if (users.length === 0) return null;

  return (
    <div className="fixed top-16 right-6 z-50 max-w-xs">
      <div className="bg-white/90 backdrop-blur-md rounded-lg shadow-lg border border-white/20 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              Participants ({users.length})
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          )}
        </div>
        
        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                user.id === currentUserId 
                  ? 'bg-blue-50 border border-blue-200' 
                  : 'hover:bg-gray-50'
              }`}
            >
              {/* User Color Indicator */}
              <div className="relative">
                <div
                  className="w-3 h-3 rounded-full border border-white shadow-sm"
                  style={{ backgroundColor: user.color }}
                />
                {user.isActive && (
                  <Circle 
                    className="absolute -top-1 -right-1 w-2 h-2 text-green-500 fill-current" 
                  />
                )}
              </div>
              
              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-gray-800 truncate">
                    {user.name}
                  </span>
                  {user.id === currentUserId && (
                    <span className="text-xs text-blue-600">(You)</span>
                  )}
                </div>
                
                {/* Role Indicators */}
                <div className="flex items-center gap-1 mt-0.5">
                  {user.isHost && (
                    <div className="flex items-center gap-1">
                      <Crown className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs text-yellow-600 font-medium">Host</span>
                    </div>
                  )}
                  {!user.isHost && (
                    <span className="text-xs text-gray-500">Joined</span>
                  )}
                </div>
              </div>
              
              {/* Active Status */}
              <div className="flex items-center">
                {user.isActive ? (
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                ) : (
                  <div className="w-2 h-2 bg-gray-300 rounded-full" />
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Connection Status */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>All participants</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Live</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};