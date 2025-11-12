import { useRef, useState, useEffect, useCallback } from "react";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

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
  const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [isDrawing, setIsDrawing] = useState(false);

  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [color, setColor] = useState("#000000");
  const [width, setWidth] = useState(2);

  const {
    board,
    addElement,
    isConnected,
  } = useRealtimeSync(roomId || "default-room", "guest", currentUser?.name || "Guest");

  const currentPathRef = useRef<{ x: number; y: number }[]>([]);

  // ✅ Console: Log connection status
  useEffect(() => {
    console.log("🔌 Connection Status:", isConnected ? "CONNECTED" : "DISCONNECTED");
  }, [isConnected]);

  // ✅ Console: Log board updates
  useEffect(() => {
    console.log("📊 Board Updated:", {
      elementCount: board?.elements?.length || 0,
      participants: board?.participants?.length || 0,
      elements: board?.elements,
    });
  }, [board]);

  // ✅ Resize listener - NOW with initial size
  useEffect(() => {
    const updateCanvasSize = () => {
      const newSize = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      console.log("📐 Canvas resized to:", newSize);
      setCanvasSize(newSize);
    };
    
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  // ✅ Canvas initialization check
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      console.log("✅ Canvas element found:", {
        width: canvas.width,
        height: canvas.height,
        clientWidth: canvas.clientWidth,
        clientHeight: canvas.clientHeight,
      });
    } else {
      console.warn("❌ Canvas element not found!");
    }
  }, [canvasSize]);

  // ✅ Draw everything from shared Yjs state
  const redrawFromBoard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.warn("⚠️ Canvas ref not available in redraw");
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.warn("⚠️ Canvas context not available");
      return;
    }

    console.log("🎨 Redrawing board with", board?.elements?.length || 0, "elements");

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const elements = board?.elements || [];
    console.log("🖌️ Drawing elements:", elements);

    elements.forEach((el: any, idx: number) => {
      if (el.type !== "path") {
        console.log(`⏭️ Skipping non-path element ${idx}:`, el.type);
        return;
      }

      console.log(`📝 Drawing path ${idx}:`, {
        pathLength: el.path?.length,
        color: el.color,
        width: el.width,
        tool: el.tool,
      });

      ctx.beginPath();
      ctx.lineWidth = el.width || 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = el.color || "#000";
      ctx.globalCompositeOperation = el.tool === "eraser" ? "destination-out" : "source-over";

      if (el.path && Array.isArray(el.path)) {
        el.path.forEach((pt: any, i: number) => {
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
      } else {
        console.warn(`⚠️ Path element ${idx} has invalid path:`, el.path);
      }
    });
  }, [board]);

  // ✅ Redraw when board changes (remote updates)
  useEffect(() => {
    console.log("🔄 Board changed, triggering redraw");
    redrawFromBoard();
  }, [board, redrawFromBoard]);

  // ====== 🎨 Drawing Handlers ======
  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        console.warn("❌ Canvas not available on mousedown");
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      console.log("🖱️ Mouse Down at:", { x, y }, "Tool:", tool);

      setIsDrawing(true);
      currentPathRef.current = [{ x, y }];

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.warn("❌ Context not available on mousedown");
        return;
      }

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = currentUser?.color || color;
      ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
    },
    [tool, currentUser, color, width]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDrawing) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      currentPathRef.current.push({ x, y });

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.lineTo(x, y);
      ctx.stroke();

      // Log every 10 points to avoid spam
      if (currentPathRef.current.length % 10 === 0) {
        console.log("✏️ Drawing, points:", currentPathRef.current.length);
      }
    },
    [isDrawing]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return;

    setIsDrawing(false);
    const path = currentPathRef.current;

    console.log("🖱️ Mouse Up - Path captured:", {
      pointCount: path.length,
      tool,
      color: currentUser?.color || color,
    });

    if (!path.length) {
      console.log("⏭️ Empty path, skipping");
      return;
    }

    // ✅ Broadcast to Yjs (shared)
    const element = {
      id: crypto.randomUUID(),
      type: "path",
      path,
      color: currentUser?.color || color,
      width,
      tool,
    };

    console.log("📤 Adding element to Yjs:", element);
    addElement(element);

    currentPathRef.current = [];
  }, [isDrawing, addElement, currentUser, color, width, tool]);

  // Attach & detach mouse listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.warn("❌ Canvas not available for attaching listeners");
      return;
    }

    console.log("🔗 Attaching mouse listeners to canvas");

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);

    return () => {
      console.log("🔓 Detaching mouse listeners from canvas");
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp]);

  // ====== 🧹 Clear ======
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) {
      console.log("🗑️ Clearing canvas");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  // ====== 🧩 Render ======
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
          backgroundSize: "20px 20px",
        }}
      />

      {/* Tool Panel */}
      <div className="absolute top-20 left-6 bg-white/90 backdrop-blur-md rounded-lg shadow-lg border border-white/20 p-4 z-50">
        <div className="flex flex-col gap-3">
          <div className="text-sm font-medium text-gray-700 mb-2">
            {isConnected ? "🟢 Connected" : "🔴 Offline"} Drawing Tools
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                console.log("🔧 Switched to PEN tool");
                setTool("pen");
              }}
              className={`p-2 rounded-lg transition-colors ${
                tool === "pen"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-black hover:bg-white/10"
              }`}
            >
              ✏️ Pen
            </button>
            <button
              onClick={() => {
                console.log("🔧 Switched to ERASER tool");
                setTool("eraser");
              }}
              className={`p-2 rounded-lg transition-colors ${
                tool === "eraser"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-black hover:bg-white/10"
              }`}
            >
              🧹 Eraser
            </button>
          </div>

          {tool === "pen" && (
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-600">Color</label>
              <input
                type="color"
                value={color}
                onChange={(e) => {
                  console.log("🎨 Color changed to:", e.target.value);
                  setColor(e.target.value);
                }}
                className="w-full h-8"
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-600">Width: {width}px</label>
            <input
              type="range"
              min="1"
              max="20"
              value={width}
              onChange={(e) => {
                console.log("📏 Width changed to:", e.target.value);
                setWidth(Number(e.target.value));
              }}
              className="w-full"
            />
          </div>

          <button
            onClick={clearCanvas}
            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
          >
            🗑️ Clear All
          </button>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className={`absolute inset-0 ${
          tool === "eraser" ? "cursor-cell" : "cursor-crosshair"
        }`}
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
        }}
      />
    </div>
  );
};