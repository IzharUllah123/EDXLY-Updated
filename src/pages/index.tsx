import { useState, useCallback, useRef } from "react";
import { FloatingToolbar } from "@/components/edxly/FloatingToolbar";
import { Menu } from "@/components/edxly/Menu";
import { OnlineStatus } from "@/components/edxly/OnlineStatus";
import { DrawingCanvas } from "@/components/edxly/DrawingCanvas";

interface PenSettings {
  strokeWidth: number;
  smoothing: number;
  pressureEnabled: boolean;
  mode: 'vector' | 'raster';
  cap: 'round' | 'square';
  join: 'round' | 'miter' | 'bevel';
  dashPattern: number[];
  stabilizerLevel: number;
  strokeStyle: 'solid';
  roughness: number;
}

function App() {
  const [activeTool, setActiveTool] = useState("hand");
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [zoomLevel, setZoomLevel] = useState(100);
  const [textMode, setTextMode] = useState<'simple' | 'colorful' | null>(null);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);

  const [penSettings, setPenSettings] = useState<PenSettings>({
    strokeWidth: 2,
    smoothing: 0.5,
    pressureEnabled: true,
    mode: 'vector',
    cap: 'round',
    join: 'round',
    dashPattern: [],
    stabilizerLevel: 0.5,
    strokeStyle: 'solid',
    roughness: 1
  });
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);




  

  interface CanvasMethods {
    undo: () => void;
    redo: () => void;
    handleImageUpload: (file: File) => void;
    placeEmoji: (emoji: string, position: { x: number; y: number }) => void;
    placeGraph: () => void;
    placeFlowchartShape: (shapeType: 'oval' | 'rectangle' | 'diamond') => void;
    activateSelectionTool: () => void;
    addElementsViaAction: (elements: any[]) => void;
  }

  const canvasRef = useRef<CanvasMethods | null>(null);

  const handleToolChange = (tool: string) => {
    setActiveTool(tool);
  };

  const handleColorChange = (color: string) => {
    setStrokeColor(color);
  };

  const handlePenSettingsChange = (newSettings: PenSettings) => {
    setPenSettings(newSettings);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 500)); // Fixed 10% increment
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 10)); // Fixed 10% decrement
  };

  const actualZoom = zoomLevel / 100; // Convert percentage to actual zoom ratio

  const handleZoomChange = useCallback((newZoomLevel: number) => {
    // Convert decimal zoom back to percentage for state management
    const percentageZoom = newZoomLevel * 100;
    setZoomLevel(percentageZoom);
  }, []);

  const handleUndo = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.undo();
    }
  }, []);

  const handleRedo = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.redo();
    }
  }, []);

  const handleUndoStatus = useCallback((can: boolean) => {
    setCanUndo(can);
  }, []);

  const handleRedoStatus = useCallback((can: boolean) => {
    setCanRedo(can);
  }, []);

  const handleImageUpload = useCallback((file: File) => {
    // Pass the file to the canvas for processing
    if (canvasRef.current && typeof canvasRef.current.handleImageUpload === 'function') {
      canvasRef.current.handleImageUpload(file);
    }
  }, []);

  // Handler for emoji placement
  const handleEmojiPlace = useCallback((emoji: string) => {
    setActiveTool('emoji'); // Ensure emoji tool is active
    setSelectedEmoji(emoji);
  }, []);

  const handleEmojiPlaced = useCallback(() => {
    setSelectedEmoji(null);
    setActiveTool('hand');
  }, []);

  // Handler for graph placement
  const handleGraphPlace = useCallback(() => {
    setActiveTool('graph'); // Ensure graph tool is active
  }, []);

  return (
    <div className="h-screen w-full relative overflow-hidden transition-colors duration-300 bg-gray-50 text-gray-900">
      {/* Drawing Canvas (Background) */}
      <DrawingCanvas
        activeTool={activeTool}
        strokeColor={strokeColor}
        penSettings={penSettings}
        onPenSettingsChange={handlePenSettingsChange}
        zoomLevel={actualZoom}
        onZoomChange={handleZoomChange}
        onUndo={handleUndoStatus}
        onRedo={handleRedoStatus}
        forwardedRef={canvasRef}
        onUndoAction={handleUndo}
        onRedoAction={handleRedo}
        textMode={textMode}
        onEmojiPlace={handleEmojiPlace}
        onGraphPlace={handleGraphPlace}
        selectedEmoji={selectedEmoji}
        onEmojiPlaced={handleEmojiPlaced}
      />

      {/* Left Menu with Graph Panel */}
      <div className="fixed top-6 left-6 z-50">
        <div className="space-y-2">
          <Menu />

          {/* Graph & Flowchart Panel - appears when graph tool is active */}
        
        </div>
      </div>

      {/* Floating Toolbar */}
      <FloatingToolbar
        activeTool={activeTool}
        onToolChange={handleToolChange}
        selectedColor={strokeColor}
        onColorChange={handleColorChange}
        textMode={textMode}
        onTextModeChange={setTextMode}
        onImageUpload={handleImageUpload}
        onEmojiPlace={handleEmojiPlace}
        canvasRef={canvasRef}
        selectedEmoji={selectedEmoji}
        onEmojiPlaced={handleEmojiPlaced}
        addElementsViaAction={(elements) => {
          if (canvasRef.current?.addElementsViaAction) {
            console.log('Forwarding addElementsViaAction with elements:', elements);
            canvasRef.current.addElementsViaAction(elements);
          } else {
            console.error('addElementsViaAction not available on canvasRef');
          }
        }}
      />

      {/* Online Status (Shows local/single user) */}
      <OnlineStatus />
    </div>
  );
}

export default App;
