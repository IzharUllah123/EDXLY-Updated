import React, { useEffect } from 'react';
// NEW: Import new icons
import { Trash2, Copy, Download, RotateCw, Maximize2, Lock, Unlock, Crop } from 'lucide-react';

// ContextMenu Component
interface ContextMenuProps {
  isVisible: boolean;
  position: { x: number; y: number };
  onDelete: () => void;
  onDuplicate?: () => void;
  onDownload?: () => void;
  onRotate?: () => void;
  onBringToFront?: () => void;
  onClose: () => void;
  // --- NEW PROPS ---
  isElementLocked?: boolean;
  onLock?: () => void;
  onUnlock?: () => void;
  onCrop?: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  isVisible,
  position,
  onDelete,
  onDuplicate,
  onDownload,
  onRotate,
  onBringToFront,
  onClose,
  // --- NEW PROPS ---
  isElementLocked,
  onLock,
  onUnlock,
  onCrop,
}) => {
  useEffect(() => {
    if (isVisible) {
      const handleClickOutside = (e: MouseEvent) => {
        onClose();
      };
      
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      
      // Add slight delay to prevent immediate closing
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const menuItems = [
    // --- NEW: Lock / Unlock ---
    {
      label: 'Lock',
      icon: Lock,
      onClick: onLock,
      className: 'text-gray-700 hover:bg-gray-100',
      show: !isElementLocked && !!onLock,
    },
    {
      label: 'Unlock',
      icon: Unlock,
      onClick: onUnlock,
      className: 'text-gray-700 hover:bg-gray-100',
      show: isElementLocked && !!onUnlock,
    },
    // --- NEW: Crop ---
    {
      label: 'Crop',
      icon: Crop,
      onClick: onCrop,
      className: 'text-gray-700 hover:bg-gray-100',
      show: !!onCrop && !isElementLocked, // Don't show crop if locked
    },
    {
      label: 'Duplicate',
      icon: Copy,
      onClick: onDuplicate,
      className: 'text-gray-700 hover:bg-gray-100',
      show: !!onDuplicate && !isElementLocked, // Don't show duplicate if locked
    },
    {
      label: 'Rotate 90°',
      icon: RotateCw,
      onClick: onRotate,
      className: 'text-gray-700 hover:bg-gray-100',
      show: !!onRotate && !isElementLocked, // Don't show rotate if locked
    },
    {
      label: 'Bring to Front',
      icon: Maximize2,
      onClick: onBringToFront,
      className: 'text-gray-700 hover:bg-gray-100',
      show: !!onBringToFront, // This can still work if locked
    },
    {
      label: 'Download',
      icon: Download,
      onClick: onDownload,
      className: 'text-gray-700 hover:bg-gray-100',
      show: !!onDownload,
    },
    {
      label: 'Delete',
      icon: Trash2,
      onClick: onDelete,
      className: 'text-red-600 hover:bg-red-50',
      show: true && !isElementLocked, // Don't show delete if locked
    },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        zIndex: 10000,
      }}
      className="bg-white rounded-lg shadow-2xl border border-gray-200 py-1 min-w-[180px]"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <ul className="py-1">
        {menuItems.filter(item => item.show).map((item, index) => (
          <li key={index}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                item.onClick?.();
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${item.className}`}
            >
              <item.icon className="h-4 w-4" />
              <span className="font-medium">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Helper function to check if a point is inside an image element
export const hitTestImageElement = (
  elements: any[],
  x: number,
  y: number
): { element: any | null; isHit: boolean } => {
  // Search in reverse order (topmost elements first)
  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i];
    
    if (el.type === 'image' && el.position && el.width && el.height) {
      const { position, width, height } = el;
      
      // Check if point is within image bounds
      if (
        x >= position.x &&
        x <= position.x + width &&
        y >= position.y &&
        y <= position.y + height
      ) {
        console.log('✅ Found image element:', el.id);
        return { element: el, isHit: true };
      }
    }
  }
  
  console.log('❌ No image element found at position');
  return { element: null, isHit: false };
};

// Demo component showing the integration
export default function ContextMenuDemo() {
  const [contextMenu, setContextMenu] = React.useState<{
    visible: boolean;
    position: { x: number; y: number };
  }>({
    visible: false,
    position: { x: 0, y: 0 },
  });

  const [isLocked, setIsLocked] = React.useState(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('🖱️ Right-click detected at:', e.clientX, e.clientY);
    setContextMenu({
      visible: true,
      position: { x: e.clientX, y: e.clientY },
    });
  };

  const closeMenu = () => {
    console.log('Closing menu');
    setContextMenu({ visible: false, position: { x: 0, y: 0 } });
  };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div
        onContextMenu={handleContextMenu}
        className="w-96 h-64 bg-white rounded-xl shadow-xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
      >
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🖼️</div>
          <p className="text-gray-600 font-medium mb-2">
            Right-click here to see the context menu
          </p>
          <p className="text-sm text-gray-400">
            (Simulates right-clicking on an image)
          </p>
           <p className="text-sm text-gray-500 mt-2 font-mono">
            Locked: {isLocked ? 'true' : 'false'}
          </p>
        </div>
      </div>

      <ContextMenu
        isVisible={contextMenu.visible}
        position={contextMenu.position}
        onDelete={() => console.log('Delete clicked')}
        onDuplicate={() => console.log('Duplicate clicked')}
        onDownload={() => console.log('Download clicked')}
        onRotate={() => console.log('Rotate clicked')}
        onBringToFront={() => console.log('Bring to front clicked')}
        onClose={closeMenu}
        // --- Demo props for new items ---
        isElementLocked={isLocked}
        onLock={() => setIsLocked(true)}
        onUnlock={() => setIsLocked(false)}
        onCrop={() => console.log('Crop clicked')}
      />

      {/* Info panel */}
      <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg max-w-sm">
        <h3 className="font-bold text-lg mb-2">🎨 Context Menu Ready!</h3>
        <p className="text-sm text-gray-600 mb-3">
          Your DrawingCanvas.tsx has been updated with:
        </p>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>✅ Right-click detection on images</li>
          <li>✅ Delete functionality</li>
          <li>✅ Duplicate image</li>
          <li>✅ Download image</li>
          <li>✅ Proper event handling</li>
          <li>✅ Click outside to close</li>
          <li className="font-bold text-blue-600">✅ Lock, Unlock, & Crop</li>
        </ul>
      </div>
    </div>
  );
}