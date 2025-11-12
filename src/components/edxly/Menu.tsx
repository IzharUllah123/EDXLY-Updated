import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Menu, 
  X, 
  Download, 
  Users, 
  Eye, 
  FileImage, 
  FileText,
  Trash2,
  AlertCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface MenuComponentProps {
  onExportPDF?: () => void;
  onExportImage?: () => void;
  onResetCanvas: () => void; // Made required
  onCollaborate?: () => void;
  onToggleUsersPanel?: () => void; // Renamed for clarity
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  boardElements?: any[];
  participants?: any[]; // Added participants
}

export const MenuComponent = ({ 
  onExportPDF,
  onExportImage,
  onResetCanvas,
  onCollaborate,
  onToggleUsersPanel,
  canvasRef,
  boardElements = [],
  participants = []
}: MenuComponentProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showUsersPanel, setShowUsersPanel] = useState(false);

  // Export as PNG Image
  const handleExportImage = () => {
    try {
      // Always get canvas directly from DOM
      const canvas = document.querySelector('#canvas-background') as HTMLCanvasElement;
      if (!canvas) {
        alert("Canvas not found. Please try again.");
        return;
      }

      // Create a temporary canvas to export the entire board
      const tempCanvas = document.createElement('canvas');
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;

      // Fill with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

      // Draw the current canvas content
      ctx.drawImage(canvas, 0, 0);

      // Convert to blob and download
      tempCanvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `edxly-board-${Date.now()}.png`;
        link.click();
        URL.revokeObjectURL(url);
      }, 'image/png');

      setIsMenuOpen(false);
      setShowExportMenu(false);
      
      if (onExportImage) {
        onExportImage();
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export image. Please try again.');
    }
  };

  // Export as PDF (using browser print)
  const handleExportPDF = () => {
    try {
      // Always get canvas directly from DOM
      const canvas = document.querySelector('#canvas-background') as HTMLCanvasElement;
      if (!canvas) {
        alert("Canvas not found. Please try again.");
        return;
      }

      // Create a new window with the canvas image
      const dataUrl = canvas.toDataURL('image/png');
      const printWindow = window.open('', '_blank');
      
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Edxly Board - ${new Date().toLocaleDateString()}</title>
              <style>
                body { 
                  margin: 0; 
                  padding: 20px;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                }
                img { 
                  max-width: 100%; 
                  height: auto;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                @media print {
                  body { padding: 0; }
                  img { box-shadow: none; }
                }
              </style>
            </head>
            <body>
              <img src="${dataUrl}" onload="window.print(); window.onafterprint = () => window.close();" />
            </body>
          </html>
        `);
        printWindow.document.close();
      }

      setIsMenuOpen(false);
      setShowExportMenu(false);
      
      if (onExportPDF) {
        onExportPDF();
      }
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  // Reset Canvas
  const handleResetCanvas = () => {
    setShowResetDialog(true);
    setIsMenuOpen(false); // Close menu when opening dialog
  };

  const confirmResetCanvas = () => {
    onResetCanvas(); // Always call the callback
    setShowResetDialog(false);
  };

  // Collaborate
  const handleCollaborate = () => {
    if (onCollaborate) {
      onCollaborate();
    } else {
      // Show share link dialog or copy current URL
      const shareUrl = window.location.href;
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Board link copied to clipboard! Share it to collaborate.');
      }).catch(() => {
        alert(`Share this link to collaborate:\n${shareUrl}`);
      });
    }
    setIsMenuOpen(false);
  };

  // Users Display
  const handleUsersDisplay = () => {
    setShowUsersPanel(!showUsersPanel);
    setIsMenuOpen(false);
    if (onToggleUsersPanel) {
      onToggleUsersPanel();
    }
  };

  return (
    <>
      <div className="relative">
        {/* Menu Button */}
        <Button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`h-10 w-10 p-0 rounded-lg transition-all duration-200 shadow-md ${
            isMenuOpen
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-white/90 backdrop-blur-md hover:bg-white text-gray-700 border border-white/20"
          }`}
          title="Menu"
        >
          {isMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>

        {/* Menu Dropdown */}
        {isMenuOpen && (
          <div className="absolute top-12 left-0 md:left-0 bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-white/20 z-[10000] min-w-[220px] max-w-[90vw] py-2">
            
            {/* Export Option - Opens Submenu */}
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-150"
            >
              <div className="flex items-center gap-3">
                <Download className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Export</span>
              </div>
              <span className="text-xs text-gray-400">›</span>
            </button>

            {/* Export Submenu */}
            {showExportMenu && (
              <div className="ml-4 pl-4 border-l-2 border-gray-200">
                <button
                  onClick={handleExportImage}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-blue-50 transition-colors duration-150 rounded"
                >
                  <FileImage className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-700">Export as Image</span>
                </button>
                
                <button
                  onClick={handleExportPDF}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-blue-50 transition-colors duration-150 rounded"
                >
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-700">Export as PDF</span>
                </button>
              </div>
            )}

            {/* Reset Canvas Option */}
            <button
              onClick={handleResetCanvas}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors duration-150"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-600">Reset Canvas</span>
            </button>

            {/* Divider */}
            <div className="my-2 border-t border-gray-200" />

            {/* Collaborate Option */}
            <button
              onClick={handleCollaborate}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-150"
            >
              <Users className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Share & Collaborate</span>
            </button>

            {/* Users Display Option */}
            <button
              onClick={handleUsersDisplay}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-150"
            >
              <div className="flex items-center gap-3">
                <Eye className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Active Users</span>
              </div>
              {participants.length > 0 && (
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  {participants.length}
                </span>
              )}
            </button>

            {/* Info Note */}
           
          </div>
        )}

        {/* Overlay to close menu when clicking outside */}
        {isMenuOpen && (
          <div
            className="fixed inset-0 z-[9999]"
            onClick={() => {
              setIsMenuOpen(false);
              setShowExportMenu(false);
            }}
          />
        )}
      </div>

      {/* Reset Canvas Confirmation Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Reset Canvas?
            </DialogTitle>
            <DialogDescription className="pt-2">
              This will permanently delete all elements on the board. This action cannot be undone.
              {boardElements.length > 0 && (
                <div className="mt-2 p-2 bg-yellow-50 rounded text-yellow-800 text-sm">
                  <strong>{boardElements.length}</strong> element{boardElements.length !== 1 ? 's' : ''} will be deleted.
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowResetDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmResetCanvas}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Reset Canvas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Users Panel */}
      {showUsersPanel && (
        <div className="fixed top-20 left-6 bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-white/20 z-[10000] min-w-[280px] max-w-[320px] p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">Active Users</h3>
              <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                {participants.length}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUsersPanel(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {participants.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active users</p>
              </div>
            ) : (
              participants.map((participant, index) => (
                <div 
                  key={participant.id || index} 
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                    {(participant.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {participant.name || 'Anonymous'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {participant.role || 'guest'}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    participant.role === 'host' 
                      ? 'bg-yellow-100 text-yellow-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {participant.role === 'host' ? '👑 Host' : 'Guest'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Overlay for Users Panel */}
      {showUsersPanel && (
        <div
          className="fixed inset-0 z-[9999]"
          onClick={() => setShowUsersPanel(false)}
        />
      )}
    </>
  );
};
