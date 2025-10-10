import { useRef, useCallback } from 'react';
import {
  Point,
  DrawingElement,
  PenSettings,
  EraserSettings,
  ShapeSettings,
  DrawingCanvasProps,
  ImageElement,
  TextNote
} from '../types/DrawingCanvas.types';
import {
  getCanvasCoordinates,
  smoothPath,
  isPointOnPath,
  createShapePath,
  snapToGrid,
  getElementAtPoint
} from '../utils/DrawingCanvas.utils';
import {
  CANVAS_MAX_PAN,
  CANVAS_PAN_SPEED,
  DOUBLE_CLICK_THRESHOLD
} from '../constants/DrawingCanvas.constants';

// Import the exact master implementation
// These would need to be properly imported or copied from master
interface LocalPoint {
  x: number;
  y: number;
}

// Complete implementation from master Excalidraw for smooth pen drawing
import { getStroke } from "perfect-freehand";

// Advanced stroke generation matching master's renderElement.ts
function getSvgPathFromStroke(points: number[][]): string {
  if (!points.length) {
    return "";
  }

  const max = points.length - 1;

  return points
    .reduce(
      (acc, point, i, arr) => {
        if (i === max) {
          acc.push(point, med(point, arr[0]), "L", arr[0], "Z");
        } else {
          acc.push(point, med(point, arr[i + 1]));
        }
        return acc;
      },
      ["M", points[0], "Q"],
    )
    .join(" ")
    .replace(/(\s?[A-Z]?,?-?[0-9]*\.[0-9]{0,2})(([0-9]|e|-)*)/g, "$1");
}

function med(A: number[], B: number[]) {
  return [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
}

// Complete stroke options from master renderElement.ts
function getFreeDrawSvgPath(element: any) {
  const inputPoints = element.simulatePressure
    ? element.points
    : element.points.length
    ? element.points.map(([x, y], i) => [x, y, element.pressures[i]])
    : [[0, 0, 0.5]];

  const options = {
    simulatePressure: element.simulatePressure,
    size: element.strokeWidth * 4.25,  // master's exact sizing
    thinning: 0.6,
    smoothing: 0.5,
    streamline: 0.5,
    easing: (t) => Math.sin((t * Math.PI) / 2), // easeOutSine
    last: !!element.lastCommittedPoint,
  };

  return getSvgPathFromStroke(getStroke(inputPoints as number[][], options));
}

// Full master's newFreeDrawElement implementation
const newFreeDrawElement = (opts: any) => {
  return {
    id: opts.id || Date.now().toString(),
    type: 'freedraw' as const,
    x: opts.x || 0,
    y: opts.y || 0,
    strokeColor: opts.strokeColor || '#000000',
    backgroundColor: 'transparent',
    fillStyle: 'hachure' as const,
    strokeWidth: opts.strokeWidth || 2,
    strokeStyle: opts.strokeStyle || 'solid',
    roundness: null,
    roughness: opts.roughness || 1,
    opacity: 100,
    width: opts.width || 0,
    height: opts.height || 0,
    angle: 0,
    seed: Math.floor(Math.random() * 1000),
    version: 1,
    versionNonce: Math.floor(Math.random() * 1000),
    index: null,
    isDeleted: false,
    groupIds: [],
    frameId: null,
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: false,
    points: opts.points || [],
    pressures: opts.pressures || [],
    simulatePressure: opts.simulatePressure || false,
    lastCommittedPoint: opts.lastCommittedPoint || null,
  };
};

interface UseDrawingHandlersProps {
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  activeTool: string;
  drawingTool: string;

  // State
  drawingElements: DrawingElement[];
  setDrawingElements: React.Dispatch<React.SetStateAction<DrawingElement[]>>;
  selectedElementIds: string[];
  setSelectedElementIds: React.Dispatch<React.SetStateAction<string[]>>;
  tempPath: Point[];
  setTempPath: React.Dispatch<React.SetStateAction<Point[]>>;
  isDrawing: boolean;
  setIsDrawing: React.Dispatch<React.SetStateAction<boolean>>;
  penSettings: PenSettings;
  eraserSettings: EraserSettings;
  shapeSettings: ShapeSettings;
  eraserPath: Point[];
  setEraserPath: React.Dispatch<React.SetStateAction<Point[]>>;
  mousePosition: Point;
  setMousePosition: React.Dispatch<React.SetStateAction<Point>>;
  isPanning: boolean;
  setIsPanning: React.Dispatch<React.SetStateAction<boolean>>;
  lastPanPoint: Point;
  setLastPanPoint: React.Dispatch<React.SetStateAction<Point>>;
  setPanOffset: React.Dispatch<React.SetStateAction<Point>>;
  textNotes: TextNote[];
  setTextNotes: React.Dispatch<React.SetStateAction<TextNote[]>>;
  editingTextNoteId: string | null;
  setEditingTextNoteId: React.Dispatch<React.SetStateAction<string | null>>;
  lastClickTime: number;
  setLastClickTime: React.Dispatch<React.SetStateAction<number>>;
  lastClickPos: Point;
  setLastClickPos: React.Dispatch<React.SetStateAction<Point>>;
  images: ImageElement[];
  setImages: React.Dispatch<React.SetStateAction<ImageElement[]>>;
  selectedImageId: string | null;
  setSelectedImageId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedTextNoteId: string | null;
  setSelectedTextNoteId: React.Dispatch<React.SetStateAction<string | null>>;
  hoverTextNoteId: string | null;
  setHoverTextNoteId: React.Dispatch<React.SetStateAction<string | null>>;

  // State for shape creation
  startPoint: Point;
  setStartPoint: React.Dispatch<React.SetStateAction<Point>>;
  isCreatingShape: boolean;
  setIsCreatingShape: React.Dispatch<React.SetStateAction<boolean>>;
  isCreatingFlowchart: boolean;
  setIsCreatingFlowchart: React.Dispatch<React.SetStateAction<boolean>>;
  lastShiftKey: boolean;
  setLastShiftKey: React.Dispatch<React.SetStateAction<boolean>>;

  // Utility functions
  saveInitialState: () => void;
  saveDrawingState: () => void;
  redrawCanvas: () => void;
  createTextNote: (position: Point) => void;
  editTextNote: (noteId: string) => void;
  undo: () => void;
  redo: () => void;

  // Callback functions from props
  onUndoAction?: () => void;
  onRedoAction?: () => void;
  onColorChange?: (color: string) => void;
  strokeColor: string;
  zoomLevel: number;
  panOffset: Point;
  textMode?: 'simple' | 'colorful' | null;
  onImageUpload?: (file: File) => void;
  onEmojiPlace?: (emoji: string, position: { x: number; y: number }) => void;
  onGraphPlace?: () => void;
  canvasSize: { width: number; height: number };
  undoHistory: DrawingElement[][];
  setUndoHistory: React.Dispatch<React.SetStateAction<DrawingElement[][]>>;
  redoHistory: DrawingElement[][];
  setRedoHistory: React.Dispatch<React.SetStateAction<DrawingElement[][]>>;
  graphSettings: any; // We'll define this type later
}

export const useDrawingHandlers = (props: UseDrawingHandlersProps) => {

  // Eraser stroke mode - finds and deletes intersecting strokes
  const eraseStrokes = useCallback((eraserPath: Point[]) => {
    props.setDrawingElements(prevElements => {
      const newElements = [];

      for (const element of prevElements) {
        if (element.type !== 'path' && element.type !== 'shape') {
          newElements.push(element);
          continue;
        }

        if (!element.path || element.path.length === 0) {
          newElements.push(element);
          continue;
        }

        let shouldKeep = true;
        for (const eraserPoint of eraserPath) {
          if (isPointOnPath(eraserPoint, element.path, element.strokeWidth || 2, props.eraserSettings.size / 2)) {
            shouldKeep = false;
            break;
          }
        }

        if (shouldKeep) {
          newElements.push(element);
        }
      }

      return newElements;
    });
  }, [props.eraserSettings.size]);

  // Eraser object mode - deletes entire object on click
  const eraseObject = useCallback((point: Point) => {
    props.setDrawingElements(prevElements => {
      const newElements = [];

      for (const element of prevElements) {
        if (element.type === 'path' || element.type === 'shape') {
          if (element.path && element.path.length > 0) {
            let shouldKeep = true;
            for (const pathPoint of element.path) {
              const dist = Math.sqrt((point.x - pathPoint.x) ** 2 + (point.y - pathPoint.y) ** 2);
              if (dist <= props.eraserSettings.size) {
                shouldKeep = false;
                break;
              }
            }
            if (shouldKeep) newElements.push(element);
          } else {
            newElements.push(element);
          }
        } else {
          newElements.push(element);
        }
      }

      return newElements;
    });
  }, [props.eraserSettings.size]);

  const handlePointerDown = useCallback((e: PointerEvent) => {
    e.preventDefault();
    const { x, y } = getCanvasCoordinates(e, props.canvasRef.current, props.canvasSize, props.zoomLevel, props.panOffset);

    console.log('Pointer down:', { tool: props.activeTool, textMode: props.textMode, x, y });

    // Check if clicking on an existing text note (for editing)
    // This is a simplified check - in the real implementation we'd use the utility function
    for (const note of props.textNotes) {
      const textWidth = note.text.length * 7;
      const textHeight = note.type === 'simple' ? 16 : 18;

      if (x >= note.position.x && x <= note.position.x + textWidth &&
          y >= note.position.y && y <= note.position.y + textHeight) {
        // Double-click detection for editing
        const currentTime = Date.now();
        const doubleClickThreshold = DOUBLE_CLICK_THRESHOLD;

        if (props.lastClickPos.x === x && props.lastClickPos.y === y &&
            (currentTime - props.lastClickTime) < doubleClickThreshold) {
          // Double-click detected - start editing
          props.setSelectedTextNoteId(note.id);
          props.editTextNote(note.id);
        }

        props.setLastClickTime(currentTime);
        props.setLastClickPos({ x, y });
        return;
      }
    }

    // Reset click tracking for new clicks
    props.setLastClickTime(Date.now());
    props.setLastClickPos({ x, y });

    if (props.activeTool === "hand") {
      // Pan the canvas
      props.setIsPanning(true);
      props.setLastPanPoint({ x, y });
    } else if (props.activeTool === "pencil") {
      // Save initial state before starting to draw
      props.saveInitialState();
      props.setIsDrawing(true);
      const newPoint: Point = { x, y, pressure: e.pressure };
      props.setTempPath([newPoint]);
    } else if (props.activeTool === "text" && (props.textMode === 'simple' || props.textMode === 'colorful')) {
      // Create a text note at the click position
      console.log('Creating text note:', { textMode: props.textMode, position: { x, y } });
      props.createTextNote({ x, y });
    } else if (props.activeTool === "eraser") {
      // Save initial state before starting to erase
      props.saveInitialState();
      props.setIsDrawing(true);
      const newPoint: Point = { x, y, pressure: e.pressure };
      props.setEraserPath([newPoint]);

      if (props.eraserSettings.mode === 'object') {
        eraseObject(newPoint);
      }
    } else if (props.activeTool === "shapes") {
      // Start creating a shape
      props.saveInitialState();
      props.setStartPoint({ x, y });
      props.setIsCreatingShape(true);
    }
    // Handle other tools like emoji, graph, etc.
  }, [props]);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    const { x, y } = getCanvasCoordinates(e, props.canvasRef.current, props.canvasSize, props.zoomLevel, props.panOffset);

    // Track shift key state for shapes
    if (e.shiftKey !== props.lastShiftKey) {
      props.setLastShiftKey(e.shiftKey);
    }

    // Handle panning when hand tool is active
    if (props.activeTool === "hand" && props.isPanning) {
      const dx = x - props.lastPanPoint.x;
      const dy = y - props.lastPanPoint.y;

      const panSpeed = CANVAS_PAN_SPEED;
      const smoothDx = dx * panSpeed;
      const smoothDy = dy * panSpeed;

      props.setPanOffset(prev => ({
        x: Math.max(-CANVAS_MAX_PAN, Math.min(CANVAS_MAX_PAN, prev.x + smoothDx)),
        y: Math.max(-CANVAS_MAX_PAN, Math.min(CANVAS_MAX_PAN, prev.y + smoothDy))
      }));

      const smoothedLastX = props.lastPanPoint.x + (x - props.lastPanPoint.x) * 0.8;
      const smoothedLastY = props.lastPanPoint.y + (y - props.lastPanPoint.y) * 0.8;
      props.setLastPanPoint({ x: smoothedLastX, y: smoothedLastY });

      props.redrawCanvas();
      return;
    }

    // Always track mouse position for eraser preview and text hover detection
    props.setMousePosition({ x, y });

    if (props.activeTool === "pencil" && props.isDrawing) {
      props.setTempPath(prev => [...prev, { x, y, pressure: e.pressure }]);
      props.redrawCanvas();
    } else if (props.activeTool === "eraser" && props.isDrawing && props.eraserSettings.mode === 'stroke') {
      props.setEraserPath(prev => [...prev, { x, y, pressure: e.pressure }]);
    }

    // Update text note hover detection for cursor changes
    // Simplified hover detection
    let currentHovered = null;
    for (const note of props.textNotes) {
      const textWidth = note.text.length * 7;
      const textHeight = note.type === 'simple' ? 16 : 18;

      if (x >= note.position.x && x <= note.position.x + textWidth &&
          y >= note.position.y && y <= note.position.y + textHeight) {
        currentHovered = note.id;
        break;
      }
    }
    props.setHoverTextNoteId(currentHovered);
  }, [props]);

  const handlePointerUp = useCallback(() => {
    // Stop panning
    if (props.isPanning) {
      props.setIsPanning(false);
    }

    if (props.isDrawing) {
      if (props.activeTool === "pencil" && props.tempPath.length > 1) {
        // Convert Point[] to LocalPoint[] and extract pressures
        const points: LocalPoint[] = props.tempPath.map(p => ({ x: p.x, y: p.y }));
        const pressures: number[] = props.tempPath.map(p => p.pressure || 0.5);

        // Use master's exact newFreeDrawElement implementation
        const newElement = newFreeDrawElement({
          x: Math.min(...points.map(p => p.x)),
          y: Math.min(...points.map(p => p.y)),
          strokeColor: props.strokeColor,
          strokeWidth: props.penSettings.strokeWidth,
          strokeStyle: props.penSettings.strokeStyle,
          roughness: props.penSettings.roughness,
          points: points,
          pressures: pressures,
          simulatePressure: props.penSettings.pressureEnabled,
        });

        props.setDrawingElements(prev => [...prev, newElement as unknown as DrawingElement]);
      } else if (props.activeTool === "eraser" && props.eraserPath.length > 1 && props.eraserSettings.mode === 'stroke') {
        eraseStrokes(props.eraserPath);
      }
    }

    if (props.isCreatingShape) {
      // Apply Shift key constraint for perfect proportions
      let endPoint = { x: props.mousePosition.x, y: props.mousePosition.y };
      if (props.lastShiftKey) {
        const dx = Math.abs(endPoint.x - props.startPoint.x);
        const dy = Math.abs(endPoint.y - props.startPoint.y);
        const minExtent = Math.min(dx, dy);
        endPoint.x = props.startPoint.x + (endPoint.x > props.startPoint.x ? minExtent : -minExtent);
        endPoint.y = props.startPoint.y + (endPoint.y > props.startPoint.y ? minExtent : -minExtent);
      }

      // Create the shape element
      const shapePath = createShapePath(props.startPoint, endPoint, props.shapeSettings);
      const newElement: DrawingElement = {
        id: Date.now().toString(),
        type: 'shape',
        path: shapePath,
        strokeColor: props.shapeSettings.strokeEnabled ? props.shapeSettings.strokeColor : undefined,
        strokeWidth: props.shapeSettings.strokeEnabled ? props.shapeSettings.strokeWidth : 0,
        fillColor: props.shapeSettings.fillEnabled ? props.shapeSettings.fillColor : undefined,
        shapeType: props.shapeSettings.selectedShape,
        opacity: 1,
      };

      props.setDrawingElements(prev => [...prev, newElement]);

      // Reset shape creation state
      props.setIsCreatingShape(false);
    }

    props.setTempPath([]);
    props.setEraserPath([]);
    props.setIsDrawing(false);
  }, [props]);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp
  };
};
