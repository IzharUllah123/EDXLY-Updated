import { useRef, useEffect, useCallback } from "react";

interface Point {
  x: number;
  y: number;
  pressure?: number;
}

interface Point {
  x: number;
  y: number;
  pressure?: number;
}

interface Transform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

interface DrawingElement {
  id: string;
  type: 'path' | 'group' | 'shape';
  path?: Point[];
  children?: string[];
  strokeColor?: string;
  strokeWidth?: number;
  fillColor?: string;
  transform?: Transform;
  opacity?: number;
  cap?: 'round' | 'square';
  join?: 'round' | 'miter' | 'bevel';
  dashPattern?: number[];
}

interface CanvasProps {
  canvasSize: { width: number; height: number };
  drawingElements: DrawingElement[];
  tempPath: Point[];
  activeTool: string;
  mousePosition: Point;
  eraserPath: Point[];
  eraserSettings: {
    mode: 'stroke' | 'pixel' | 'object';
    size: number;
    pressureEnabled: boolean;
    previewEnabled: boolean;
  };
  textNotes: Array<{
    id: string;
    position: Point;
    text: string;
    type: 'simple' | 'colorful';
  }>;
  zoomLevel: number;
  panOffset: Point;
  onMouseMove?: (point: Point) => void;
}

export const Canvas = ({
  canvasSize,
  drawingElements,
  tempPath,
  activeTool,
  mousePosition,
  eraserPath,
  eraserSettings,
  textNotes,
  zoomLevel,
  panOffset,
  onMouseMove
}: CanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  const redrawCanvas = () => {
    // Cancel any existing animation frame to prevent queuing
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Use requestAnimationFrame for smooth rendering
    animationFrameRef.current = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx || !canvas) return;

      // Set up high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Clear canvas efficiently
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Apply zoom and pan transform smoothly
      ctx.save();
      ctx.scale(zoomLevel, zoomLevel);

      // Smooth center translation to center the canvas
      const tx = Math.round(-canvasSize.width / 2 * (zoomLevel - 1));
      const ty = Math.round(-canvasSize.height / 2 * (zoomLevel - 1));
      ctx.translate(tx, ty);

      // Apply pan offset with sub-pixel precision
      ctx.translate(Math.round(panOffset.x * 100) / 100, Math.round(panOffset.y * 100) / 100);

      // Render drawing elements with optimized performance
      for (const element of drawingElements) {
        if (element.type === 'path' || element.type === 'shape') {
          ctx.strokeStyle = element.strokeColor || '#000';
          ctx.fillStyle = element.fillColor || element.strokeColor || '#000';
          ctx.lineWidth = Math.max(0.5, element.strokeWidth || 2);
          ctx.lineCap = element.cap || 'round';
          ctx.lineJoin = element.join || 'round';
          ctx.setLineDash(element.dashPattern || []);
          ctx.globalAlpha = element.opacity || 1;

          ctx.beginPath();

          if (element.path && element.path.length > 0) {
            ctx.moveTo(element.path[0].x, element.path[0].y);
            for (let i = 1; i < element.path.length; i++) {
              const adjustedWidth = element.path[i].pressure !== undefined
                ? getPressureAdjustedWidth(element.strokeWidth || 2, element.path[i].pressure)
                : element.strokeWidth || 2;
              ctx.lineWidth = Math.max(0.5, adjustedWidth);
              ctx.lineTo(element.path[i].x, element.path[i].y);
            }
          }

          if (element.fillColor && element.type === 'shape') {
            ctx.closePath();
            ctx.fill();
          }
          ctx.stroke();
        }
      }

      // Render temp path (current drawing) if any
      if (tempPath.length > 1) {
        const smoothedTemp = smoothPath(tempPath, getPenSettings().smoothing);
        ctx.strokeStyle = getStrokeColor();
        ctx.fillStyle = getStrokeColor();
        ctx.lineWidth = Math.max(0.5, getPenSettings().strokeWidth);
        ctx.lineCap = getPenSettings().cap;
        ctx.lineJoin = getPenSettings().join;
        ctx.setLineDash(getPenSettings().dashPattern);
        ctx.globalAlpha = 1;

        ctx.beginPath();
        ctx.moveTo(smoothedTemp[0].x, smoothedTemp[0].y);
        for (let i = 1; i < smoothedTemp.length; i++) {
          ctx.lineWidth = Math.max(0.5, getPressureAdjustedWidth(getPenSettings().strokeWidth, smoothedTemp[i].pressure));
          ctx.lineTo(smoothedTemp[i].x, smoothedTemp[i].y);
        }
        ctx.stroke();
      }

      // Render text notes
      for (const note of textNotes) {
        ctx.save();
        ctx.font = note.type === 'simple' ? '14px Arial' : '16px Arial';
        ctx.fillStyle = note.type === 'simple' ? '#000000' : '#2E7D32';
        ctx.strokeStyle = note.type === 'colorful' ? '#4CAF50' : 'transparent';
        ctx.lineWidth = note.type === 'colorful' ? 1 : 0;

        // Position text accounting for transform
        ctx.translate(note.position.x, note.position.y);

        // Draw text outline for colorful notes
        if (note.type === 'colorful') {
          ctx.strokeText(note.text, 0, 0);
        }

        // Draw text
        ctx.fillText(note.text, 0, 0);
        ctx.restore();
      }

      // Draw eraser preview cursor (only when not panning for performance)
      if (activeTool === 'eraser' && eraserSettings.previewEnabled) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 1;

        // Draw eraser cursor circle with anti-aliasing
        const cursorSize = Math.max(3, eraserSettings.size / zoomLevel);
        ctx.beginPath();
        ctx.arc(mousePosition.x, mousePosition.y, cursorSize / 2, 0, 2 * Math.PI);
        ctx.stroke();

        // Add crosshair lines without artifacts
        ctx.beginPath();
        const crosshairLength = cursorSize / 2 + 3;
        ctx.moveTo(mousePosition.x - crosshairLength, mousePosition.y);
        ctx.lineTo(mousePosition.x + crosshairLength, mousePosition.y);
        ctx.moveTo(mousePosition.x, mousePosition.y - crosshairLength);
        ctx.lineTo(mousePosition.x, mousePosition.y + crosshairLength);
        ctx.stroke();
        ctx.restore();
      }

      // Restore the context to remove zoom transform
      ctx.restore();

      animationFrameRef.current = undefined;
    });
  };

  // Helper functions (will be passed as props)
  const getPressureAdjustedWidth = (baseWidth: number, pressure?: number): number => {
    // This would need penSettings prop
    if (!true || pressure === undefined) return baseWidth; // pressureEnabled would be passed as prop
    return Math.max(1, baseWidth * (0.2 + pressure * 0.8));
  };

  const smoothPath = (points: Point[], smoothing: number): Point[] => {
    if (points.length < 3) return points;

    const smoothed: Point[] = [points[0]];
    const alpha = smoothing;

    for (let i = 1; i < points.length - 1; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];

      const x = p1.x * (1 - alpha) + (p0.x + p2.x) / 2 * alpha;
      const y = p1.y * (1 - alpha) + (p0.y + p2.y) / 2 * alpha;
      const pressure = p1.pressure;

      smoothed.push({ x, y, pressure });
    }

    smoothed.push(points[points.length - 1]);
    return smoothed;
  };

  // Temp placeholder functions - these would be passed as props
  const getPenSettings = () => ({
    strokeWidth: 2,
    smoothing: 0.5,
    pressureEnabled: true,
    cap: 'round' as const,
    join: 'round' as const,
    dashPattern: []
  });

  const getStrokeColor = () => '#000000';

  // Auto-redraw when props change
  useEffect(() => {
    redrawCanvas();
  }, [drawingElements, tempPath, textNotes, activeTool, mousePosition, eraserPath, zoomLevel, panOffset]);

  // Cleanup animation frames on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize.width}
      height={canvasSize.height}
      className="fixed inset-0"
      style={{
        width: canvasSize.width,
        height: canvasSize.height,
        backgroundColor: '#FFFFFF'
      }}
    />
  );
};
