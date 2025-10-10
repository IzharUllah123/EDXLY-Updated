import { useRef, useState, useEffect, useCallback } from "react";

interface SimpleCanvasProps {
  currentUser?: {
    id: string;
    name: string;
    color: string;
  } | null;
  roomId?: string;
}

export const SimpleCanvas = ({ currentUser, roomId }: SimpleCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isDrawing, setIsDrawing] = useState(false);

  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#000000');
  const [width, setWidth] = useState(2);

  useEffect(() => {
    const updateCanvasSize = () => {
      setCanvasSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = currentUser?.color || color;
    }

    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
  }, [tool, currentUser, color, width]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing]);

  const handleMouseUp = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.globalCompositeOperation = 'source-over';
    }
    setIsDrawing(false);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp]);

  return (
    <div className="fixed inset-0 bg-gray-50">
      {/* Grid Background */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      />

      {/* Simple Tool Panel */}
      <div className="absolute top-20 left-6 bg-white/90 backdrop-blur-md rounded-lg shadow-lg border border-white/20 p-4 z-50">
        <div className="flex flex-col gap-3">
          <div className="text-sm font-medium text-gray-700 mb-2">Local Drawing Tools</div>

          {/* Tool Selection */}
          <div className="flex gap-2">
            <button
              onClick={() => setTool('pen')}
              className={`p-2 rounded-lg transition-colors ${
                tool === 'pen'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-black hover:bg-white/10'
              }`}
            >
              ✏️ Pen
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`p-2 rounded-lg transition-colors ${
                tool === 'eraser'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-black hover:bg-white/10'
              }`}
            >
              🧹 Eraser
            </button>
          </div>

          {/* Color Picker (only for pen) */}
          {tool === 'pen' && (
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-600">Color</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-8"
              />
            </div>
          )}

          {/* Stroke Width */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-600">Width: {width}px</label>
            <input
              type="range"
              min="1"
              max="20"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Clear Canvas */}
          <button
            onClick={clearCanvas}
            className="p-2 bg-red-500 text-white rounded-lg text-black hover:bg-white/10 transition-colors text-sm"
          >
            🗑️ Clear All
          </button>

          {/* Info */}
          <div className="text-xs text-gray-500 mt-2">
            <div>Local drawing canvas</div>
            <div>Collaboration disabled</div>
          </div>
        </div>
      </div>

      {/* Drawing Canvas */}
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className={`absolute inset-0 ${tool === 'eraser' ? 'cursor-cell' : 'cursor-crosshair'}`}
        style={{
          width: canvasSize.width,
          height: canvasSize.height
        }}
      />

      {/* Empty State */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-gray-400 text-center">
          <div className="text-6xl mb-4">🎨</div>
          <div className="text-xl font-medium">Local Drawing Canvas</div>
          <div className="text-sm mt-2">Draw locally - your work is private</div>
        </div>
      </div>
    </div>
  );
};
