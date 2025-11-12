import { Pencil, MousePointer, Move } from "lucide-react";
import { UserAwareness } from "@/hooks/useRealtimeSync";
interface UserPresenceProps {
  awarenessStates: Map<number, UserAwareness>;
  currentClientId: number;
}

export const UserPresence = ({ awarenessStates, currentClientId }: UserPresenceProps) => {
  const otherUsers: UserAwareness[] = [];
  awarenessStates.forEach((state, clientId) => {
    if (clientId !== currentClientId && state.cursor) {
      otherUsers.push(state);
    }
  });

  if (otherUsers.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      {otherUsers.map((user) => {
        if (!user.cursor) return null;

        return (
          <div
            key={user.id}
            className="absolute transition-transform duration-100 ease-linear"
            style={{
              left: `${user.cursor.x}px`,
              top: `${user.cursor.y}px`,
            }}
          >
            {/* You can choose your preferred cursor style */}
            <MousePointer className="w-5 h-5" style={{ color: user.color, transform: 'translate(-2px, -2px)' }} />
            <div
              className="absolute top-5 left-3 px-2 py-1 rounded-md text-xs font-medium text-white shadow-lg whitespace-nowrap"
              style={{ backgroundColor: user.color }}
            >
              {user.name}
            </div>
          </div>
        );
      })}
    </div>
  );
};