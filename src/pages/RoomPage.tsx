import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, ArrowLeft } from "lucide-react";

function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">EDXLY</h1>
          <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto rounded-full"></div>
        </div>

        <div className="mb-6">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Collaboration Feature Disabled
          </h2>
          <p className="text-lg text-gray-600 mb-4">
            The collaborative drawing features have been temporarily disabled for redevelopment.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">Room ID:</span>
            <span className="font-mono bg-white px-2 py-1 rounded border">{roomId}</span>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            The local drawing canvas on the main page is fully functional.
            Collaborative features will be re-implemented in a future update.
          </p>

          <Button
            onClick={() => navigate("/")}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium text-base rounded-lg"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Local Drawing
          </Button>
        </div>
      </div>
    </div>
  );
}

export default RoomPage;
