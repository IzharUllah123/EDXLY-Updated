import { User } from "lucide-react";

export const OnlineStatus = () => {
  return (
    <div className="fixed top-6 right-6 z-40">
      <div className="bg-white/90 backdrop-blur-md rounded-lg shadow-lg px-3 py-2 border border-white/20">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <User className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-gray-700">
            Local Mode
          </span>
        </div>
      </div>
    </div>
  );
};
