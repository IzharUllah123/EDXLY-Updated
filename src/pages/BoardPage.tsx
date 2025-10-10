import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useRealtimeSync } from "../hooks/useRealtimeSync";
import { Button } from "@/components/ui/button";
import { Users, ArrowLeft, Crown, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DrawingCanvas } from "@/components/edxly/DrawingCanvas";
import { FloatingToolbar } from "@/components/edxly/FloatingToolbar";

// Drawing controls component for collaborative sessions
interface DrawingControlsProps {
  participants: any[];
  isHost: boolean;
  boardId: string;
  isDarkMode: boolean;
}

const DrawingControls = ({ participants, isHost, boardId, isDarkMode }: DrawingControlsProps) => {
  return (
    <div className="absolute top-4 right-4 z-10 space-y-4">
      {/* Participants List */}
      <div className={`backdrop-blur-md rounded-lg shadow-lg p-4 min-w-64 max-w-80 ${
        isDarkMode
          ? 'bg-green-900/95 border border-green-700'
          : 'bg-white/95'
      }`}>
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-5 w-5 text-blue-600" />
          <h3 className={`text-lg font-semibold ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Participants
          </h3>
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            {participants.length}
          </span>
        </div>

        <div className="space-y-2">
          {participants.map((participant) => (
            <div key={participant.id} className={`flex items-center gap-3 p-2 rounded-lg ${
              isDarkMode ? 'bg-emerald-800' : 'bg-gray-50'
            }`}>
              {participant.role === 'host' ? (
                <Crown className="h-4 w-4 text-yellow-600" />
              ) : (
                <UserPlus className="h-4 w-4 text-blue-600" />
              )}
              <span className={`text-sm font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                {participant.name}
              </span>
              <span className={`text-xs ml-auto ${
                isDarkMode ? 'text-emerald-400' : 'text-gray-500'
              }`}>
                {participant.role}
              </span>
            </div>
          ))}
        </div>

        {isHost && (
          <div className={`mt-4 pt-3 ${
            isDarkMode ? 'border-emerald-700' : 'border-gray-200'
          } border-t`}>
            <div className={`text-xs text-center ${
              isDarkMode ? 'text-emerald-400' : 'text-gray-600'
            }`}>
              Share link: <span className={`font-mono px-1 rounded ${
                isDarkMode ? 'bg-emerald-800 text-emerald-300' : 'bg-gray-100'
              }`}>
                /board/{boardId}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Joinee Modal Component
const JoineeModal = ({ isOpen, onJoin }: { isOpen: boolean; onJoin: (name: string) => void }) => {
  const [guestName, setGuestName] = useState("");

  const handleJoin = () => {
    if (guestName.trim()) {
      onJoin(guestName.trim());
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md bg-white rounded-2xl border-0 shadow-2xl p-8">
        <DialogHeader className="text-center space-y-4">
          <div className="text-center mb-6">
            <UserPlus className="h-12 w-12 text-blue-600 mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-blue-600">Welcome Guest!</h3>
            <p className="text-sm text-gray-600">Join the collaborative drawing session</p>
          </div>

          <DialogTitle className="text-xl font-semibold text-gray-800">Enter Your Name</DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Choose a name to participate in this drawing session
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Your name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="h-12 text-base border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
            maxLength={50}
            autoFocus
          />

          <Button
            onClick={handleJoin}
            disabled={!guestName.trim()}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium text-base rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Join as Guest
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

function BoardPage() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const [isHost, setIsHost] = useState<boolean | null>(null);
  const [guestName, setGuestName] = useState("");
  const [showJoinModal, setShowJoinModal] = useState(true);
  const [hostName, setHostName] = useState("Host");

  // Drawing tool state (dark mode always enabled)
  const [activeTool, setActiveTool] = useState("pencil");
  const [selectedColor, setSelectedColor] = useState("#000000");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDarkMode = true; // Always dark mode with gradient

  useEffect(() => {
    // Check if user is the host by comparing with stored link
    try {
      const stored = localStorage.getItem('edxly-last-shared-link');
      if (stored) {
        const linkData = JSON.parse(stored);
        if (linkData.boardId === boardId) {
          setIsHost(true);
          setHostName(linkData.hostName);
          setShowJoinModal(false);
          return;
        }
      }
    } catch (e) {
      console.error("Error checking host status:", e);
    }

    setIsHost(false);
    setShowJoinModal(false); // Remove guest modal, show canvas directly
    setGuestName("Guest " + Math.floor(Math.random() * 1000)); // Auto-assign guest name
  }, [boardId]);

  // Initialize real-time sync
  const { board, participants, isConnected, addParticipant } = useRealtimeSync(
    boardId || '',
    isHost === true ? 'host' : 'guest'
  );

  const handleGuestJoin = (name: string) => {
    setGuestName(name);
    setShowJoinModal(false);
    addParticipant(name);
    console.log(`Guest ${name} joined board ${boardId}`);
  };

  if (isHost === null) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading board...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <JoineeModal
        isOpen={showJoinModal && isHost === false}
        onJoin={handleGuestJoin}
      />

      <div className="h-screen w-full bg-white">
        {/* Header */}
        <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">EDXLY</h1>
            {isHost && (
              <div className="flex items-center gap-2 bg-yellow-600 px-3 py-1 rounded-full">
                <Crown className="h-3 w-3" />
                <span className="text-xs font-medium">Host: {hostName}</span>
              </div>
            )}
            {!isHost && guestName && (
              <div className="flex items-center gap-2 bg-blue-600 px-3 py-1 rounded-full">
                <Users className="h-3 w-3" />
                <span className="text-xs font-medium">Guest: {guestName}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="text-xs text-gray-400">
              Board: <span className="font-mono">{boardId}</span>
            </div>
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              size="sm"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              <ArrowLeft className="h-3 w-3 mr-1" />
              Exit
            </Button>
          </div>
        </div>

        {/* Main Board Area */}
        <div className="h-[calc(100vh-80px)] relative bg-white">
          {!showJoinModal ? (
            <>
              {/* Simple White Canvas for Collaboration */}
              <div className="h-full bg-white relative flex items-center justify-center">
                <div className="text-center space-y-6 max-w-md mx-auto px-6">
                  <div className="text-6xl mb-4">✏️</div>
                  <h2 className="text-2xl font-bold text-gray-800">Collaborative Drawing Ready</h2>
                  <p className="text-lg text-gray-600">
                    Drawing functionality is available through the floating toolbar.
                    Select a tool and start drawing!
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                    <h3 className="font-semibold text-blue-800 mb-2">Available Tools:</h3>
                    <ul className="space-y-1 text-sm text-blue-700">
                      <li>• Pencil - Freehand drawing</li>
                      <li>• Eraser - Remove artwork</li>
                      <li>• Shapes - Circles, rectangles, polygons</li>
                      <li>• Text - Add notes and labels</li>
                      <li>• Colors - 40+ color palette</li>
                    </ul>
                  </div>
                </div>

                {/* Floating Toolbar */}
                <FloatingToolbar
                  activeTool={activeTool}
                  onToolChange={setActiveTool}
                  selectedColor={selectedColor}
                  onColorChange={setSelectedColor}
                  textMode={null}
                  canvasRef={canvasRef}
                />

                {/* Collaboration Controls */}
                <DrawingControls
                  participants={participants}
                  isHost={isHost!}
                  boardId={boardId!}
                  isDarkMode={isDarkMode}
                />
              </div>
            </>
          ) : (
            // Temporary loading for guest
            <div className="h-full flex items-center justify-center bg-gray-900">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p>Connecting to board...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default BoardPage;
