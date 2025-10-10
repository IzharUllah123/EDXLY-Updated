import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from "lucide-react";

export const Canvas = () => {
  const [zoom, setZoom] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setCanvasOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const zoomIn = () => setZoom(Math.min(zoom + 25, 400));
  const zoomOut = () => setZoom(Math.max(zoom - 25, 25));
  const resetZoom = () => {
    setZoom(100);
    setCanvasOffset({ x: 0, y: 0 });
  };

  return (
    <div className="flex-1 bg-gray-100 dark:bg-gray-900 relative overflow-hidden">
      {/* Canvas Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Button variant="secondary" size="sm" onClick={zoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <div className="bg-white dark:bg-gray-800 px-3 py-1 rounded text-sm font-medium border">
          {zoom}%
        </div>
        <Button variant="secondary" size="sm" onClick={zoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="sm" onClick={resetZoom}>
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="sm">
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Canvas Area */}
      <div 
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Artboard */}
        <div 
          className="absolute bg-white dark:bg-gray-800 shadow-lg border border-gray-300 dark:border-gray-600 rounded-lg"
          style={{
            width: `${(375 * zoom) / 100}px`,
            height: `${(812 * zoom) / 100}px`,
            left: `50%`,
            top: `50%`,
            transform: `translate(-50%, -50%) translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom / 100})`,
            transformOrigin: 'center center'
          }}
        >
          {/* Mock Mobile Interface */}
          <div className="w-full h-full p-4 space-y-4">
            {/* Header */}
            <div className="h-12 bg-blue-500 rounded-lg flex items-center justify-between px-4">
              <div className="w-6 h-6 bg-white rounded"></div>
              <div className="text-white font-semibold">App Title</div>
              <div className="w-6 h-6 bg-white rounded"></div>
            </div>

            {/* Hero Section */}
            <div className="h-32 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
              <div className="text-white text-center">
                <div className="w-16 h-16 bg-white bg-opacity-30 rounded-full mx-auto mb-2"></div>
                <div className="text-sm font-medium">Welcome Message</div>
              </div>
            </div>

            {/* Content Cards */}
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center px-4 gap-3">
                  <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-1"></div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  </div>
                  <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
              ))}
            </div>

            {/* Bottom Navigation */}
            <div className="absolute bottom-4 left-4 right-4 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-around">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="w-6 h-6 bg-gray-400 dark:bg-gray-500 rounded"></div>
              ))}
            </div>
          </div>

          {/* Selection Handles */}
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 border border-white rounded-full"></div>
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 border border-white rounded-full"></div>
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 border border-white rounded-full"></div>
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 border border-white rounded-full"></div>
        </div>
      </div>

      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      ></div>
    </div>
  );
};