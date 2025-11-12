import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Copy, Link2, Users, Check } from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareLink: string;
  userName?: string;
  onNameChange?: (newName: string) => void; // ← NEW: Callback to update parent's userName
}

export const ShareModal = ({ 
  isOpen, 
  onClose, 
  shareLink, 
  userName = "",
  onNameChange 
}: ShareModalProps) => {
  const [hostName, setHostName] = useState("");
  const [copied, setCopied] = useState(false);

  // ← Sync hostName with userName when modal opens
  useEffect(() => {
    if (isOpen && userName) {
      setHostName(userName);
    }
  }, [isOpen, userName]);

  const copyCurrentBoardLink = async () => {
    if (!hostName.trim()) {
      alert("Please enter your name as Host");
      return;
    }

    try {
      // Copy the current board link to clipboard
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      // ← NEW: Update parent component's userName if it changed
      if (onNameChange && hostName.trim() !== userName) {
        onNameChange(hostName.trim());
      }
      
      // Store host name in localStorage
      localStorage.setItem('edxly-host-name', hostName.trim());
    } catch (error) {
      console.error("Failed to copy link:", error);
      alert("Failed to copy link. Please try again.");
    }
  };

  const handleClose = () => {
    // ← MODIFIED: Don't reset hostName to empty, keep the userName
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-white rounded-2xl border-0 shadow-2xl p-8">
        <DialogHeader className="text-center space-y-4">
          {/* EDXLY Branding */}
          <div className="text-center">
            <h3 className="text-2xl font-bold text-blue-600 mb-2">EDXLY</h3>
            <p className="text-sm text-gray-600">Collaborative Drawing Board</p>
          </div>

          {/* Share Options Title */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <Link2 className="h-8 w-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">Share This Board</h2>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Host Name Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Host Name (Editable)</label>
            <Input
              placeholder="Enter your name as Host"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              className="h-12 text-base border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
              maxLength={50}
              autoFocus
            />
            <p className="text-xs text-gray-500">
              This is your current name. You can edit it before sharing.
            </p>
          </div>

          {/* Current Board Link Display */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <Link2 className="h-4 w-4 text-blue-600" />
              <h4 className="text-sm font-medium text-blue-900">Current Board Link</h4>
            </div>
            <div className="flex gap-2">
              <Input
                value={shareLink}
                readOnly
                className="h-10 text-sm border-blue-300 rounded bg-white font-mono text-gray-700"
              />
            </div>
          </div>

          {/* Copy Board Link Button */}
          <Button
            onClick={copyCurrentBoardLink}
            disabled={!hostName.trim()}
            className={`w-full h-12 font-medium text-base rounded-lg transition-all ${
              copied 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied to Clipboard!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy Board Link
              </>
            )}
          </Button>

          {/* Success Message */}
          {copied && (
            <div className="text-center text-green-600 text-sm font-medium bg-green-50 p-3 rounded-lg border border-green-200">
              ✓ Link copied successfully! Share it with your collaborators.
            </div>
          )}

          {/* Info Section */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg mt-6">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800 leading-relaxed">
                <p className="font-medium mb-1">How sharing works:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>You are the Host and control this board</li>
                  <li>Guests can join via the shared link (no login required)</li>
                  <li>Real-time collaboration with live sync</li>
                  <li>All changes sync automatically between Host and Guests</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}