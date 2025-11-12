// BoardPage.tsx
// --- IMPORTS ---
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useRealtimeSync } from "../hooks/useRealtimeSync";
import { Button } from "@/components/ui/button";
import { UserPlus, Loader2, Users, Crown, Link as LinkIcon, Check, Copy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// --- YOUR COMPONENTS ---
import { DrawingCanvas } from "@/components/edxly/DrawingCanvas";
import { FloatingToolbar } from "@/components/edxly/FloatingToolbar";
import { MenuComponent } from "@/components/edxly/Menu";
import { HistoryControls } from "@/components/edxly/HistoryControls";
import { ZoomControls } from "@/components/edxly/ZoomControl";

// --- HELPER: Random Name Generator ---
const generateRandomName = () => {
  const adjectives = ["Curious", "Creative", "Helpful", "Keen", "Agile"];
  const nouns = ["Fox", "Badger", "Owl", "Panda", "Koala"];
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${
    nouns[Math.floor(Math.random() * nouns.length)]
  }`;
};

// --- Joinee Modal ---
const JoineeModal = ({
  isOpen,
  onJoin,
  defaultName,
}: {
  isOpen: boolean;
  onJoin: (name: string) => void;
  defaultName: string;
}) => {
  const [guestName, setGuestName] = useState(defaultName);

  useEffect(() => {
    if (defaultName) {
      setGuestName(defaultName);
    }
  }, [defaultName]);

  const handleJoin = () => {
    const nameToJoin = guestName.trim() || defaultName;
    onJoin(nameToJoin);
    localStorage.setItem("edxly-guest-name", nameToJoin);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (guestName.trim() || defaultName)) {
      handleJoin();
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md w-[90vw] mx-4 max-h-[90vh] p-6">
        <DialogHeader className="text-center space-y-4">
          <div className="text-center mb-6">
            <UserPlus className="h-12 w-12 text-blue-600 mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-blue-600">Join Live Session</h3>
          </div>
          <DialogTitle className="text-xl font-semibold text-gray-800">Enter Your Name</DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Choose a display name to join this session
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Your name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            onKeyPress={handleKeyPress}
            className="h-12 text-base border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
            maxLength={50}
            autoFocus
          />
          <Button
            onClick={handleJoin}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium text-base rounded-lg"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Join Session
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// --- Main BoardPage Component ---
function BoardPage() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // --- Canvas State ---
  const [activeTool, setActiveTool] = useState("pencil");
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [fillColor, setFillColor] = useState("transparent");
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  
  // --- MODIFICATION: Wrap setTextMode to trigger text creation ---
  const [textMode, _setTextMode] = useState<'simple' | 'colorful' | null>(null);
  const [isCreatingText, setIsCreatingText] = useState(false);

  const setTextMode = (mode: 'simple' | 'colorful' | null) => {
    _setTextMode(mode);
    if (mode !== null) {
      // This is our new trigger!
      setIsCreatingText(true); 
      // Also ensure the active tool is set
      setActiveTool("text");
    } else {
      setIsCreatingText(false);
    }
  };
  // --- END MODIFICATION ---

  // --- Zoom State ---
  const [zoomLevel, setZoomLevel] = useState(1);

  interface CanvasHandle {
    handleImageUpload: (file: File) => void;
  }
  const canvasRef = useRef<CanvasHandle>(null);

  // --- User/Guest State ---
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState<"host" | "guest">("guest");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [modalDefaultName, setModalDefaultName] = useState("");
  const [isJoining, setIsJoining] = useState(true);

  // --- Host vs Guest Logic ---
  useEffect(() => {
    if (!boardId) {
      navigate('/');
      return;
    }
    const isHost = location.state?.isHost || false;

    if (isHost) {
      const storedHostName = localStorage.getItem('edxly-host-name');
      const hostName = storedHostName || location.state.userName || "Host";
      setUserName(hostName);
      setUserRole("host");
      setShowJoinModal(false);
      setIsJoining(false);

      if (!storedHostName) {
        localStorage.setItem('edxly-host-name', hostName);
      }

    } else {
      setUserRole("guest");
      const storedName = localStorage.getItem("edxly-guest-name");
      if (storedName) {
        setUserName(storedName);
        setShowJoinModal(false);
        setIsJoining(false);
      } else {
        setModalDefaultName(generateRandomName());
        setShowJoinModal(true);
        setIsJoining(false);
      }
    }
  }, [boardId, navigate, location.state]);

  // --- Realtime Sync Hook ---
  const {
    board,
    participants,
    isConnected,
    addElement,
    updateElement,
    deleteElement,
    updateViewport,
    undo,
    redo
  } = useRealtimeSync(boardId || '', userRole, userName);
console.log("🔥 Firebase Connection Status (from component):", isConnected);
  // --- Set initial zoom from board ---
  useEffect(() => {
    if (board?.viewport?.zoomLevel) {
      setZoomLevel(board.viewport.zoomLevel);
    }
  }, [board?.viewport?.zoomLevel]);

  // --- Guest Join Handler ---
  const handleGuestJoin = (name: string) => {
    setIsJoining(true);
    setUserName(name);
    setTimeout(() => {
      setShowJoinModal(false);
      setIsJoining(false);
    }, 300);
  };

  // --- Canvas Handlers ---
  const handleImageUpload = (file: File) => {
    if (canvasRef.current) {
      canvasRef.current.handleImageUpload(file);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setActiveTool("emoji");
    setSelectedEmoji(emoji);
  };

  const handleEmojiPlaced = () => {
    setSelectedEmoji(null);
    setActiveTool("selection");
  };

  // --- Zoom Handlers ---
  const handleZoom = (newZoom: number) => {
    const clampedZoom = Math.max(0.1, Math.min(newZoom, 2));
    setZoomLevel(clampedZoom);
  };

  const handleZoomIn = () => {
    handleZoom(zoomLevel + 0.1);
  };

  const handleZoomOut = () => {
    handleZoom(zoomLevel - 0.1);
  };

  const handleZoomReset = () => {
    handleZoom(1);
  };

  // --- Reset Canvas Handler ---
  const handleResetCanvas = () => {
    if (board?.elements) {
      board.elements.forEach(el => {
        if (el.id) {
          deleteElement(el.id);
        }
      });
    }

    updateViewport({ scrollX: 0, scrollY: 0, zoomLevel: 1 });
    setZoomLevel(1);

    setTimeout(() => {
      alert('Canvas has been reset successfully!');
    }, 100);
  };

  // --- Collaborate Handler ---
  const handleCollaborate = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('✅ Board link copied to clipboard!\n\nShare this link with others to collaborate in real-time.');
    }).catch(() => {
      prompt('Copy this link to share:', shareUrl);
    });
  };

  // --- Render Logic ---
  if (!boardId) {
    return null;
  }

  return (
    <>
      <JoineeModal
        isOpen={showJoinModal}
        onJoin={handleGuestJoin}
        defaultName={modalDefaultName}
      />

      <div className="h-screen w-full bg-gray-50">
        {isJoining || (showJoinModal && !userName) ? (
          // Loading state
          <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
              <p className="text-gray-700 font-medium">Joining session...</p>
            </div>
          </div>
        ) : (
          <>
            {/* === Mobile Top Bar: Menu + Live Session side-by-side === */}
            <div className="fixed top-0 left-0 right-0 z-[9999] md:hidden bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-lg">
              <div className="flex items-stretch h-14">
                {/* Menu - 50% width */}
                <div className="flex-1 flex items-center justify-center border-r border-gray-200">
                  <MenuComponent
                    canvasRef={canvasRef as any}
                    boardElements={board?.elements || []}
                    participants={participants}
                    onResetCanvas={handleResetCanvas}
                    onCollaborate={handleCollaborate}
                    onExportPDF={() => {
                      console.log('PDF exported successfully');
                    }}
                    onExportImage={() => {
                      console.log('Image exported successfully');
                    }}
                  />
                </div>
                
                {/* Live Session - 50% width */}
                {isConnected && userRole === 'host' && participants.length > 0 && (
                  <div className="flex-1 flex items-center justify-center">
                    <DrawingControls
                      participants={participants}
                      boardId={boardId}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* === Desktop: Menu Component === */}
            <div className="hidden md:block fixed top-4 left-6 z-[9999]">
              <MenuComponent
                canvasRef={canvasRef as any}
                boardElements={board?.elements || []}
                participants={participants}
                onResetCanvas={handleResetCanvas}
                onCollaborate={handleCollaborate}
                onExportPDF={() => {
                  console.log('PDF exported successfully');
                }}
                onExportImage={() => {
                  console.log('Image exported successfully');
                }}
              />
            </div>

            {/* === DrawingCanvas === */}
            <DrawingCanvas
              forwardedRef={canvasRef}
              board={board}
              addElement={addElement}
              updateElement={updateElement}
              deleteElement={deleteElement}
              updateViewport={updateViewport}
              boardId={boardId}
              userName={userName}
              userRole={userRole}
              activeTool={activeTool}
              strokeColor={strokeColor}
              shapeColor={fillColor}
              selectedEmoji={selectedEmoji}
              onEmojiPlaced={handleEmojiPlaced}
              textMode={textMode}
              onToolChange={setActiveTool}
              zoomLevel={zoomLevel}
              // --- MODIFICATION: Pass new props down ---
              isCreatingText={isCreatingText}
              onTextCreationDone={() => setIsCreatingText(false)}
              // --- END MODIFICATION ---
            />

            {/* === FloatingToolbar === */}
            <FloatingToolbar
              activeTool={activeTool}
              onToolChange={setActiveTool}
              selectedStrokeColor={strokeColor}
              onStrokeColorChange={setStrokeColor}
              selectedFillColor={fillColor}
              onFillColorChange={setFillColor}
              textMode={textMode}
              onTextModeChange={setTextMode} // This now points to our new wrapped function
              canvasRef={canvasRef}
              onImageUpload={handleImageUpload}
              onEmojiPlace={handleEmojiSelect}
              selectedEmoji={selectedEmoji}
              onEmojiPlaced={handleEmojiPlaced}
              addElementsViaAction={(elements) => {
                console.log('Add elements:', elements);
              }}
              userName={userName}
              onUserNameChange={setUserName}
            />

            {/* === Desktop: Live Session Controls === */}
            {isConnected && userRole === 'host' && (
              <>
                {participants.length > 0 && (
                  <div className="hidden md:block">
                    <DrawingControls
                      participants={participants}
                      boardId={boardId}
                    />
                  </div>
                )}
              </>
            )}

            {/* === History (Undo/Redo) Controls === */}
            <HistoryControls
              onUndo={undo}
              onRedo={redo}
            />

            {/* === Zoom Controls === */}
            <ZoomControls
              zoomLevel={zoomLevel}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onZoomReset={handleZoomReset}
            />
          </>
        )}
      </div>
    </>
  );
}

export default BoardPage;

// --- Drawing Controls ---
const DrawingControls = ({ participants, boardId }: { participants: any[]; boardId: string; }) => {
  const [copied, setCopied] = useState(false);
  const shareLink = window.location.href;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const participantCount = participants.length;

  return (
    <div className="md:fixed md:top-5 md:right-6 lg:top-5 z-50">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="h-auto px-3 py-2 bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 data-[state=open]:bg-gray-100 md:shadow-lg"
          >
            <div className="flex items-center gap-1.5 md:gap-2">
              <Users className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
              <h3 className="text-xs md:text-sm font-semibold text-gray-800 hidden sm:inline">Live</h3>
              <span className="bg-green-100 text-green-700 text-xs font-medium px-1.5 md:px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                {participantCount}
              </span>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 max-w-[90vw] p-4 bg-white/95 backdrop-blur-md border-gray-200 shadow-xl rounded-lg" align="end">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Live Session</h3>
            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              {participantCount}
            </span>
          </div>

          <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <LinkIcon className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-900">Share this link to collaborate</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 px-2 py-1.5 text-xs bg-white border border-blue-300 rounded font-mono text-gray-700 min-w-0"
              />
              <Button size="sm" onClick={handleCopyLink} className={`px-3 ${copied ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {participants.map((participant) => (
              <div key={participant.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                {participant.role === 'host' ? (
                  <Crown className="h-4 w-4 text-yellow-600" />
                ) : (
                  <UserPlus className="h-4 w-4 text-blue-600" />
                )}
                <span className="text-sm font-medium text-gray-800 flex-1 truncate" title={participant.name}>{participant.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${participant.role === 'host' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                  {participant.role}
                </span>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};