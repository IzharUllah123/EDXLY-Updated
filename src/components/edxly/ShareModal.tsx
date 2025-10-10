import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Copy, Link2, Users, FileImage, Code, Clock, Plus } from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Store last shared link in localStorage
const getStoredLink = () => {
  try {
    const stored = localStorage.getItem('edxly-last-shared-link');
    return stored ? JSON.parse(stored) : null;
  } catch (e) { return null; }
};

const storeLink = (hostName: string, boardId: string, url: string) => {
  const linkData = { hostName, boardId, url, timestamp: Date.now() };
  localStorage.setItem('edxly-last-shared-link', JSON.stringify(linkData));
  return linkData;
};

export const ShareModal = ({ isOpen, onClose }: ShareModalProps) => {
  const [hostName, setHostName] = useState("");
  const [lastSharedLink, setLastSharedLink] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredLink();
    setLastSharedLink(stored);
  }, []);

  const baseUrl = window.location.origin;

  const generateNewLink = async () => {
    if (!hostName.trim()) return;

    setIsGenerating(true);

    try {
      // Generate unique board ID
      const boardId = Math.random().toString(36).substring(2, 15) +
                     Math.random().toString(36).substring(2, 15);
      const boardUrl = `${baseUrl}/board/${boardId}`;

      // Store the link
      const linkData = storeLink(hostName.trim(), boardId, boardUrl);
      setLastSharedLink(linkData);

      // Also store the board data in localStorage so guests can load it
      const initialBoard = {
        id: boardId,
        hostName: hostName.trim(),
        createdAt: new Date(),
        lastModified: new Date(),
        elements: [],
        participants: [{
          id: 'host-1',
          name: hostName.trim(),
          role: 'host',
          joinedAt: new Date()
        }]
      };
      localStorage.setItem(`board-${boardId}`, JSON.stringify(initialBoard));
    } catch (error) {
      console.error("Failed to generate link:", error);
      alert("Failed to generate sharing link. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleClose = () => {
    setHostName("");
    setCopied(null);
    onClose();
  };

  const copyLastSharedLink = async () => {
    if (!lastSharedLink) return;
    await copyToClipboard(lastSharedLink.url, "last-link");
  };

  const copyShareUrl = async (url: string) => {
    await copyToClipboard(url, "share-url");
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
            <h2 className="text-2xl font-bold text-gray-800">Start Sharing</h2>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Host Name Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Host Name</label>
            <Input
              placeholder="Enter your name as Host"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              className="h-12 text-base border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
              maxLength={50}
            />
          </div>

          {/* Generate New Link Button */}
          <Button
            onClick={generateNewLink}
            disabled={!hostName.trim() || isGenerating}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium text-base rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isGenerating ? "Generating..." : "Generate New Link"}
          </Button>

          {/* Last Shared Link */}
          {lastSharedLink && (
            <>
              {/* Separator */}
              <div className="flex items-center gap-4 my-4">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-sm text-gray-500 font-medium">or use</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <h4 className="text-md font-medium text-gray-800">Last Shared Link</h4>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Host: {lastSharedLink.hostName}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(lastSharedLink.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={lastSharedLink.url}
                      readOnly
                      className="h-10 text-sm border-gray-300 rounded bg-white"
                    />
                    <Button
                      onClick={copyLastSharedLink}
                      className="h-10 px-3 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Copy className="h-3 w-3" />
                      {copied === "last-link" ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                </div>

                <div className="text-center text-green-600 text-sm font-medium">
                  ✓ Link generated successfully! Copy and share with your collaborators.
                </div>
              </div>
            </>
          )}

          {/* Info Section */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg mt-6">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800 leading-relaxed">
                <p className="font-medium mb-1">How sharing works:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>You become the Host and control the board</li>
                  <li>Guests can join via the shared link (no login required)</li>
                  <li>Real-time collaboration with WebSockets/Firebase</li>
                  <li>All changes sync automatically between Host and Guests</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
