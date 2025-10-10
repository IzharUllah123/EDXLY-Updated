import { useRef, useCallback } from 'react';
import {
  Point,
  DrawingElement,
  PenSettings,
  EraserSettings,
  ShapeSettings,
  ImageElement,
  TextNote
} from '../types/DrawingCanvas.types';
import {
  getPressureAdjustedWidth,
  createShapePath
} from '../utils/DrawingCanvas.utils';
import {
  CANVAS_MAX_PAN,
  CANVAS_MIN_SCALE,
  CANVAS_MAX_SCALE,
  MIN_STROKE_WIDTH,
  SIMPLE_TEXT_FONT,
  COLORFUL_TEXT_FONT
} from '../constants/DrawingCanvas.constants';

interface UseCanvasOperationsProps {
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  canvasSize: { width: number; height: number };
  zoomLevel: number;
  panOffset: Point;

  // Drawing state
  drawingElements: DrawingElement[];
  tempPath: Point[];
  penSettings: PenSettings;
  eraserSettings: EraserSettings;
  shapeSettings: ShapeSettings;
  startPoint: Point;
  mousePosition: Point;
  isCreatingShape: boolean;
  eraserPath: Point[];
  strokeColor: string;
  isPanning: boolean;

  // Text and image state
  textNotes: TextNote[];
  images: ImageElement[];
  imagesLoaded: Set<string>;

  // Cursor management
  activeTool: string;
  hoverTextNoteId: string | null;
  CURSOR_STYLES: Record<string, string>;
}

export const useCanvasOperations = (props: UseCanvasOperationsProps) => {
  const animationFrameRef = useRef<number>();

  // Optimized redraw with requestAnimationFrame for smooth panning
  const redrawCanvas = useCallback(() => {
    // Cancel any existing animation frame to prevent queuing
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Use requestAnimationFrame for smooth rendering
    animationFrameRef.current = requestAnimationFrame(() => {
      const canvas = props.canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx || !canvas) return;

      // Set up high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Clear canvas efficiently
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Apply zoom and pan transform smoothly
      ctx.save();
      ctx.scale(props.zoomLevel, props.zoomLevel);

      // Smooth center translation to center the canvas
      const tx = Math.round(-props.canvasSize.width / 2 * (props.zoomLevel - 1));
      const ty = Math.round(-props.canvasSize.height / 2 * (props.zoomLevel - 1));
      ctx.translate(tx, ty);

      // Apply pan offset with sub-pixel precision
      ctx.translate(Math.round(props.panOffset.x * 100) / 100, Math.round(props.panOffset.y * 100) / 100);

      // Render drawing elements with optimized performance
      for (const element of props.drawingElements) {
        if (element.type === 'path' || element.type === 'shape') {
          ctx.strokeStyle = element.strokeColor || '#000';
          ctx.fillStyle = element.fillColor || element.strokeColor || '#000';
          ctx.lineWidth = Math.max(MIN_STROKE_WIDTH, element.strokeWidth || 2);
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
              ctx.lineWidth = Math.max(MIN_STROKE_WIDTH, adjustedWidth);
              ctx.lineTo(element.path[i].x, element.path[i].y);
            }
          }

          if (element.fillColor && element.type === 'shape') {
            ctx.closePath();
            ctx.fill();
          }
          ctx.stroke();
        }

        // Special handling for graph objects - draw grid lines on top
        if (element.id?.startsWith('graph-') && element.size) {
          const graphX = element.position?.x || element.path?.[0].x || 0;
          const graphY = element.position?.y || element.path?.[0].y || 0;
          const graphWidth = element.size.width / 2;
          const graphHeight = element.size.height / 2;

          ctx.save();
          ctx.strokeStyle = '#CCCCCC';
          ctx.lineWidth = 0.5;
          ctx.globalAlpha = 0.7;
          ctx.setLineDash([]);

          // Draw vertical grid lines inside graph
          const spacing = 40;
          for (let x = -graphWidth + spacing; x < graphWidth; x += spacing) {
            ctx.beginPath();
            ctx.moveTo(graphX + x, graphY - graphHeight);
            ctx.lineTo(graphX + x, graphY + graphHeight);
            ctx.stroke();
          }

          // Draw horizontal grid lines inside graph
          for (let y = -graphHeight + spacing; y < graphHeight; y += spacing) {
            ctx.beginPath();
            ctx.moveTo(graphX - graphWidth, graphY + y);
            ctx.lineTo(graphX + graphWidth, graphY + y);
            ctx.stroke();
          }

          // Draw X and Y axes with tick marks
          ctx.strokeStyle = '#666666';
          ctx.lineWidth = 1;

          // X-axis with ticks
          ctx.beginPath();
          ctx.moveTo(graphX - graphWidth, graphY);
          ctx.lineTo(graphX + graphWidth, graphY);
          // Tick marks on X-axis
          for (let x = -graphWidth + 50; x < graphWidth; x += 50) {
            ctx.moveTo(graphX + x, graphY - 3);
            ctx.lineTo(graphX + x, graphY + 3);
          }
          ctx.stroke();

          // Y-axis with ticks
          ctx.beginPath();
          ctx.moveTo(graphX, graphY - graphHeight);
          ctx.lineTo(graphX, graphY + graphHeight);
          // Tick marks on Y-axis
          for (let y = -graphHeight + 50; y < graphHeight; y += 50) {
            ctx.moveTo(graphX - 3, graphY + y);
            ctx.lineTo(graphX + 3, graphY + y);
          }
          ctx.stroke();

          ctx.restore();
        }
      }

      // Render temp path (current drawing) if any
      if (props.tempPath.length > 1) {
        const smoothedTemp = props.tempPath; // In real implementation, we'd use smoothPath
        ctx.strokeStyle = props.strokeColor;
        ctx.fillStyle = props.strokeColor;
        ctx.lineWidth = Math.max(MIN_STROKE_WIDTH, props.penSettings.strokeWidth);
        ctx.lineCap = props.penSettings.cap;
        ctx.lineJoin = props.penSettings.join;
        ctx.setLineDash(props.penSettings.dashPattern);
        ctx.globalAlpha = 1;

        ctx.beginPath();
        ctx.moveTo(smoothedTemp[0].x, smoothedTemp[0].y);
        for (let i = 1; i < smoothedTemp.length; i++) {
          ctx.lineWidth = Math.max(MIN_STROKE_WIDTH, getPressureAdjustedWidth(props.penSettings.strokeWidth, smoothedTemp[i].pressure));
          ctx.lineTo(smoothedTemp[i].x, smoothedTemp[i].y);
        }
        ctx.stroke();
      }

      // Draw eraser preview cursor (only when not panning for performance)
      if (props.activeTool === 'eraser' && props.eraserSettings.previewEnabled && !props.isPanning) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 1;

        // Draw eraser cursor circle with anti-aliasing
        const cursorSize = Math.max(3, props.eraserSettings.size / props.zoomLevel);
        ctx.beginPath();
        ctx.arc(props.mousePosition.x, props.mousePosition.y, cursorSize / 2, 0, 2 * Math.PI);
        ctx.stroke();

        // Add crosshair lines without artifacts
        ctx.beginPath();
        const crosshairLength = cursorSize / 2 + 3;
        ctx.moveTo(props.mousePosition.x - crosshairLength, props.mousePosition.y);
        ctx.lineTo(props.mousePosition.x + crosshairLength, props.mousePosition.y);
        ctx.moveTo(props.mousePosition.x, props.mousePosition.y - crosshairLength);
        ctx.lineTo(props.mousePosition.x, props.mousePosition.y + crosshairLength);
        ctx.stroke();
        ctx.restore();
      }

      // Draw eraser path preview during drawing (only when not panning)
      if (props.eraserPath.length > 1 && props.activeTool === 'eraser' && !props.isPanning) {
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);

        ctx.beginPath();
        ctx.moveTo(props.eraserPath[0].x, props.eraserPath[0].y);
        for (let i = 1; i < props.eraserPath.length; i++) {
          ctx.lineTo(props.eraserPath[i].x, props.eraserPath[i].y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Render text notes with Helvetica font
      for (const note of props.textNotes) {
        ctx.save();
        // Use Helvetica font instead of Arial
        ctx.font = note.type === 'simple'
          ? SIMPLE_TEXT_FONT
          : COLORFUL_TEXT_FONT;
        ctx.fillStyle = note.type === 'simple' ? '#000000' : '#2E7D32';
        ctx.strokeStyle = note.type === 'colorful' ? '#4CAF50' : 'transparent';
        ctx.lineWidth = note.type === 'colorful' ? 1 : 0;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // Position text accounting for transform
        ctx.translate(note.position.x, note.position.y);

        // Add background for better readability with colorful notes
        if (note.type === 'colorful') {
          const metrics = ctx.measureText(note.text);
          const padding = 4;
          const bgWidth = metrics.width + padding * 2;
          const bgHeight = 18; // Fixed height for colorful notes

          ctx.save();
          ctx.fillStyle = '#FFD54F';
          ctx.strokeStyle = '#4CAF50';
          ctx.lineWidth = 1;
          ctx.strokeRect(-padding, -padding + 2, bgWidth, bgHeight);
          ctx.fillRect(-padding, -padding + 2, bgWidth, bgHeight);
          ctx.restore();

          // Draw text outline for colorful notes
          ctx.strokeText(note.text, 0, 0);
        }

        // Draw text
        ctx.fillText(note.text, 0, 0);
        ctx.restore();
      }

      // Render uploaded images on the canvas (no blinking - use cached images)
      for (const image of props.images) {
        // Only render if image is loaded
        if (image.img && props.imagesLoaded.has(image.id) && image.img.complete) {
          ctx.save();

          // Calculate dimensions maintaining aspect ratio
          const img = image.img;
          const aspectRatio = img.naturalWidth / img.naturalHeight;
          let drawWidth = image.size.width;
          let drawHeight = image.size.height;

          // If aspect ratio differs from 1:1, adjust dimensions
          if (Math.abs(aspectRatio - (drawWidth / drawHeight)) > 0.1) {
            if (aspectRatio > drawWidth / drawHeight) {
              drawHeight = drawWidth / aspectRatio;
            } else {
              drawWidth = drawHeight * aspectRatio;
            }
          }

          // Position the image and draw it centered
          ctx.drawImage(
            img,
            image.position.x - drawWidth / 2,
            image.position.y - drawHeight / 2,
            drawWidth,
            drawHeight
          );

          // Add selection border if selected
          if (image.selected) {
            ctx.strokeStyle = '#007acc';
            ctx.lineWidth = 2;
            ctx.strokeRect(
              image.position.x - drawWidth / 2 - 4,
              image.position.y - drawHeight / 2 - 4,
              drawWidth + 8,
              drawHeight + 8
            );
          }

          ctx.restore();
        }
      }

      // Draw shape preview during creation
      if (props.isCreatingShape && props.activeTool === 'shapes') {
        ctx.save();
        ctx.strokeStyle = props.shapeSettings.strokeEnabled ? props.shapeSettings.strokeColor : '#000';
        ctx.fillStyle = props.shapeSettings.fillEnabled ? props.shapeSettings.fillColor : 'transparent';
        ctx.lineWidth = props.shapeSettings.strokeEnabled ? props.shapeSettings.strokeWidth : 0;
        ctx.setLineDash([5, 5]);
        ctx.globalAlpha = 0.7;

        const previewShapePath = createShapePath(props.startPoint, props.mousePosition, props.shapeSettings);

        ctx.beginPath();
        ctx.moveTo(previewShapePath[0].x, previewShapePath[0].y);
        for (let i = 1; i < previewShapePath.length; i++) {
          ctx.lineTo(previewShapePath[i].x, previewShapePath[i].y);
        }

        if (props.shapeSettings.fillEnabled && props.shapeSettings.selectedShape !== 'line') {
          ctx.closePath();
          ctx.fill();
        }
        if (props.shapeSettings.strokeEnabled) {
          ctx.stroke();
        }
        ctx.restore();
      }

      // Restore the context to remove zoom transform
      ctx.restore();
    });
  }, [props]);

  // Dynamic cursor style based on selected tool
  const getCursorStyle = useCallback(() => {
    let cursor = "default";

    switch (props.activeTool) {
      case "hand":
        cursor = "grab";
        break;
      case "selection":
        cursor = "selection";
        break;
      case "pencil":
        cursor = props.CURSOR_STYLES.pencil;
        break;
      case "eraser":
        cursor = props.CURSOR_STYLES.eraser;
        break;
      case "text":
        cursor = props.hoverTextNoteId ? "text" : "text";
        break;
      case "sticky":
        cursor = "pointer";
        break;
      case "emoji":
        cursor = "pointer";
        break;
      case "shapes":
        cursor = props.CURSOR_STYLES.shapes;
        break;
      case "graph":
        cursor = "pointer";
        break;
      default:
        cursor = props.CURSOR_STYLES.default;
        break;
    }

    return cursor;
  }, [props.activeTool, props.hoverTextNoteId, props.CURSOR_STYLES]);

  return {
    redrawCanvas,
    getCursorStyle
  };
};
