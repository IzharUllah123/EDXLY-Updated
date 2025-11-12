// DrawingCanvas.tsx - Updated with IMMEDIATE IMAGE UPLOAD (no placement click)
import React, { useCallback, useEffect, useRef, useState, useImperativeHandle } from "react";
import { getStroke } from "perfect-freehand";
import { handlePenDown, handlePenMove, handlePenUp } from"@/components/edxly/logictools/PenTool"
import { handleHandDown, handleHandMove, handleHandUp } from "@/components/edxly/logictools/HandTool";
import {
  handleSelectionDown,
  hitTestElement,
  getHoveredTextElementId,
  handleSelectionDragMove,
  handleSelectionMarqueeMove,
  handleSelectionUp,
  calculateTransformHandles,
  calculateBounds,
  getHoveredHandle,
  handleSelectionResize,
  SelectionHandle
} from "@/components/edxly/logictools/SelectionTool";
import { ContextMenu } from "./ContextMenu";
import { handleEraserDown, handleEraserMove, handleEraserUp, EraserSettingsPanel, EraserSettings } from "@/components/edxly/logictools/EraserTool";
import { handleTextDown, handleTextEditStart, handleTextKeyDown, handleTextEditStop } from "@/components/edxly/logictools/TextTool";
import {
  handleShapeDown,
  handleShapeMove,
  handleShapeUp,
  ShapeSettings
} from "@/components/edxly/logictools/ShapeTool";

import { handleGraphDown } from "@/components/edxly/logictools/GraphTool";
import PenSettingsPanel from "@/components/edxly/logictools/PenSettingPannel";
import FlowchartDropdown from "@/components/edxly/logictools/FlowchartDropdown";
import AutonomousShapeTool from "@/components/edxly/logictools/AutonomousShapeTool";
import { DrawingElement } from "./types/DrawingCanvas.types";


export interface Point { x: number; y: number; pressure?: number; }
export type ShapeType = 
  | "rectangle" 
  | "rounded-rectangle"
  | "ellipse" 
  | "circle"
  | "diamond" 
  | "line" 
  | "arrow"
  | "polygon"
  | "star";



export interface DrawingCanvasProps {
  activeTool?: string;
  strokeColor?: string;
  strokeWidth?: number;
  penSettings?: {
    strokeWidth: number;
    smoothing: number;
    pressureEnabled: boolean;
    cap?: 'round' | 'square' | 'butt';
    join?: 'round' | 'bevel' | 'miter';
    dashPattern?: number[];
  };
  zoomLevel?: number;
  selectedEmoji?: string | null;
  onEmojiPlaced?: () => void;
  boardId?: string;
  userName?: string;
  userRole?: "host" | "guest";
  shapeColor?: string;
  isDarkMode?: boolean;
  onShapeSelect?: () => void;
  textMode?: 'simple' | 'colorful' | null;
  onImageUpload?: (file: File) => void;
  onToolChange?: (tool: string) => void;
  forwardedRef?: React.Ref<any>;
  board: any;
  addElement: (element: DrawingElement) => void;
  updateElement: (id: string, element: Partial<DrawingElement>) => void;
  deleteElement: (id: string) => void;
  updateViewport: (viewport: { scrollX: number; scrollY: number; zoomLevel: number }) => void;

  // --- MODIFICATION: Add new props ---
  isCreatingText?: boolean;
  onTextCreationDone?: () => void;
  // --- END MODIFICATION ---
}

const CANVAS_MAX_PAN = 2000;
const NUDGE_DISTANCE_BASE = 1;
const NUDGE_DISTANCE_ALT = 10;
const DOUBLE_CLICK_THRESHOLD = 300;
// --- NEW: Clamp function for zoom ---
const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
// ---

const defaultPen = {
  strokeWidth: 4,
  smoothing: 0.5,
  pressureEnabled: true,
  cap: 'round' as 'round' | 'square' | 'butt',
  join: 'round' as 'round' | 'bevel' | 'miter',
  dashPattern: []
};

const isEmojiText = (text?: string) => {
  if (!text) return false;
  try {
    return /\p{Extended_Pictographic}/u.test(text);
  } catch {
    return /[\u{1F300}-\u{1FAFF}]/u.test(text || "");
  }
};

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const gradientTypes: Array<'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'teal'> =
  ['blue', 'purple', 'green', 'orange', 'pink', 'teal'];

const pickRandomGradient = () => gradientTypes[Math.floor(Math.random() * gradientTypes.length)];

const smoothPath = (points: Point[], smoothing: number): Point[] => {
  if (points.length < 2) return points;
  const filteredPoints = [points[0]];
  const minDistance = 2;
  for (let i = 1; i < points.length; i++) {
    const last = filteredPoints[filteredPoints.length - 1];
    const dist = Math.hypot(points[i].x - last.x, points[i].y - last.y);
    if (dist > minDistance) filteredPoints.push(points[i]);
  }
  if (filteredPoints.length < 3) return filteredPoints;
  const smoothed: Point[] = [filteredPoints[0]];
  for (let i = 1; i < filteredPoints.length - 1; i++) {
    const prev = filteredPoints[i - 1];
    const cur = filteredPoints[i];
    const next = filteredPoints[i + 1];
    const sx = (prev.x + cur.x + next.x) / 3;
    const sy = (prev.y + cur.y + next.y) / 3;
    const sp = ((prev.pressure || 0.5) + (cur.pressure || 0.5) + (next.pressure || 0.5)) / 3;
    smoothed.push({ x: sx, y: sy, pressure: sp });
  }
  smoothed.push(filteredPoints[filteredPoints.length - 1]);
  return smoothed;
};

const getCanvasCoordinates = (
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement | null,
  scrollX: number,
  scrollY: number,
  zoomLevel: number
): Point => {
  if (!canvas) return { x: 0, y: 0 };
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const rawX = clientX - rect.left;
  const rawY = clientY - rect.top;
  const centerX = canvas.width / 2 / dpr;
  const centerY = canvas.height / 2 / dpr;
  
  const sceneX = (rawX - centerX) / zoomLevel + (centerX - scrollX);
  const sceneY = (rawY - centerY) / zoomLevel + (centerY - scrollY);
  return { x: sceneX, y: sceneY };
};

// --- NEW CROP RESIZE LOGIC ---
// --- *** SMOOTH, EXCALIDRAW-STYLE CROP RESIZE LOGIC *** ---
const handleCropResize = (
  handle: SelectionHandle,
  scenePt: Point, // Current mouse scene position
  originalBounds: { minX: number; minY: number; maxX: number; maxY: number }, // Bounds *at drag start*
  originalElement: DrawingElement, // Element state *at drag start*
  startScenePt: Point, // Mouse position *at drag start*
  updateElement: (id: string, element: Partial<DrawingElement>) => void,
  isShiftPressed: boolean // Aspect ratio lock not fully implemented here
) => {
  if (
    !originalElement.originalWidth || !originalElement.originalHeight ||
    !originalElement.width || !originalElement.height || !originalElement.position
  ) return;

  const MIN_SOURCE_SIZE = 10; // Minimum size in *source* pixels

  // Original destination rect properties at drag start
  const origDestX = originalElement.position.x;
  const origDestY = originalElement.position.y;
  const origDestW = originalElement.width;
  const origDestH = originalElement.height;

  // Original source rect (crop data) at drag start
  const sRect = originalElement.crop || {
    sx: 0, sy: 0,
    sWidth: originalElement.originalWidth, sHeight: originalElement.originalHeight,
  };

  // Original scaling factors (source pixels per destination pixel)
  const sourcePerDestX = origDestW > 1e-6 ? sRect.sWidth / origDestW : 1;
  const sourcePerDestY = origDestH > 1e-6 ? sRect.sHeight / origDestH : 1;
  const handleType = handle.type;

  // Calculate mouse delta in destination (scene) coordinates SINCE DRAG START
  const deltaXScene = scenePt.x - startScenePt.x;
  const deltaYScene = scenePt.y - startScenePt.y;

  // Convert mouse delta to source coordinates
  const deltaXSource = deltaXScene * sourcePerDestX;
  const deltaYSource = deltaYScene * sourcePerDestY;

  // Initialize new source rect values from original (at drag start)
  let newSx = sRect.sx;
  let newSy = sRect.sy;
  let newSWidth = sRect.sWidth;
  let newSHeight = sRect.sHeight;

  // Apply source delta based on handle type
  if (handleType.includes("e")) {
    newSWidth = sRect.sWidth + deltaXSource;
  }
  if (handleType.includes("w")) {
    newSx = sRect.sx + deltaXSource;
    newSWidth = sRect.sWidth - deltaXSource;
  }
  if (handleType.includes("s")) {
    newSHeight = sRect.sHeight + deltaYSource;
  }
  if (handleType.includes("n")) {
    newSy = sRect.sy + deltaYSource;
    newSHeight = sRect.sHeight - deltaYSource;
  }

  // --- Clamp source coordinates and dimensions ---
  // 1. Enforce minimum source dimensions
   if (newSWidth < MIN_SOURCE_SIZE) {
    const deficit = MIN_SOURCE_SIZE - newSWidth;
    if (handleType.includes("w")) { // Prevent sx from increasing too much if shrinking left
      newSx -= deficit;
    }
    newSWidth = MIN_SOURCE_SIZE;
  }
  if (newSHeight < MIN_SOURCE_SIZE) {
     const deficit = MIN_SOURCE_SIZE - newSHeight;
    if (handleType.includes("n")) { // Prevent sy from increasing too much if shrinking top
      newSy -= deficit;
    }
    newSHeight = MIN_SOURCE_SIZE;
  }

  // 2. Clamp source position (sx, sy) to image bounds [0, originalSize]
  newSx = Math.max(0, newSx);
  newSy = Math.max(0, newSy);

  // 3. Clamp source dimensions based on clamped position and image bounds
  newSWidth = Math.min(newSWidth, originalElement.originalWidth - newSx);
  newSHeight = Math.min(newSHeight, originalElement.originalHeight - newSy);

 // 4. Final check: Ensure min size respected *after* clamping to bounds
  if (newSWidth < MIN_SOURCE_SIZE) {
      if (newSx + MIN_SOURCE_SIZE <= originalElement.originalWidth) { // Can we expand right?
          newSWidth = MIN_SOURCE_SIZE;
      } else { // Cannot expand right, try shifting left
          const neededShift = MIN_SOURCE_SIZE - newSWidth;
          if (newSx >= neededShift) {
              newSx -= neededShift;
              newSWidth = MIN_SOURCE_SIZE;
          } else { // Cannot shift left enough, use max possible width at sx=0
              newSWidth += newSx; // Add back the clamped amount
              newSx = 0;
               if (newSWidth > originalElement.originalWidth) newSWidth = originalElement.originalWidth; // Should not happen but safety
          }
      }
  }
   if (newSHeight < MIN_SOURCE_SIZE) {
       if (newSy + MIN_SOURCE_SIZE <= originalElement.originalHeight) { // Can we expand down?
          newSHeight = MIN_SOURCE_SIZE;
      } else { // Cannot expand down, try shifting up
          const neededShift = MIN_SOURCE_SIZE - newSHeight;
           if (newSy >= neededShift) {
               newSy -= neededShift;
               newSHeight = MIN_SOURCE_SIZE;
           } else { // Cannot shift up enough, use max possible height at sy=0
               newSHeight += newSy;
               newSy = 0;
                if (newSHeight > originalElement.originalHeight) newSHeight = originalElement.originalHeight;
           }
      }
  }


  // Final safety check for strictly positive dimensions
  if (newSWidth <= 1e-6 || newSHeight <= 1e-6) {
    console.warn("Preventing update due to near-zero source crop dimensions", { newSWidth, newSHeight });
    return;
  }

  const finalCrop = {
    sx: newSx,
    sy: newSy,
    sWidth: newSWidth,
    sHeight: newSHeight,
  };

  // --- Recalculate destination based on the *original* destination scaling ---
  const deltaFinalSourceX = finalCrop.sx - sRect.sx; // Delta from original source start
  const deltaFinalSourceY = finalCrop.sy - sRect.sy;

  const invScaleX = sRect.sWidth > 1e-6 ? origDestW / sRect.sWidth : 1;
  const invScaleY = sRect.sHeight > 1e-6 ? origDestH / sRect.sHeight : 1;

  // Final destination position based on original pos + scaled source delta
  const finalDestX = origDestX + deltaFinalSourceX * invScaleX;
  const finalDestY = origDestY + deltaFinalSourceY * invScaleY;

  // Final destination size based on final source size
  const finalDestWidth = finalCrop.sWidth * invScaleX;
  const finalDestHeight = finalCrop.sHeight * invScaleY;

  // Final safety check for positive destination dimensions
  if (finalDestWidth <= 1e-6 || finalDestHeight <= 1e-6) {
    console.warn("Preventing update due to near-zero destination crop dimensions", { finalDestWidth, finalDestHeight });
    return; // Prevent update
  }

  updateElement(originalElement.id, {
    position: { x: finalDestX, y: finalDestY },
    width: finalDestWidth,
    height: finalDestHeight,
    crop: finalCrop,
    aspectRatio: finalDestWidth / finalDestHeight,
  });
};

// --- NEW: GRADIENT HELPER FUNCTIONS ---

/**
 * Gets the bounding box of a drawing element.
 */
const getElementBounds = (el: DrawingElement): { x: number, y: number, width: number, height: number } => {
  if (el.type === "shape" && el.position && el.size) {
    return { x: el.position.x, y: el.position.y, width: el.size.width, height: el.size.height };
  }
  if (el.type === "path" && el.path && el.path.length > 0) {
    const xs = el.path.map(p => p.x);
    const ys = el.path.map(p => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }
  // Fallback for other types like images
  if (el.position && el.width && el.height) {
     return { x: el.position.x, y: el.position.y, width: el.width, height: el.height };
  }
  return { x: 0, y: 0, width: 0, height: 0 };
}

/**
 * Parses a CSS gradient string and returns a CanvasGradient object or a color string.
 */
const createGradientStyle = (
  ctx: CanvasRenderingContext2D,
  colorString: string | undefined,
  bounds: { x: number, y: number, width: number, height: number }
): string | CanvasGradient => {
  if (!colorString || (!colorString.startsWith('linear-gradient') && !colorString.startsWith('radial-gradient'))) {
    return colorString || 'transparent';
  }

  const { x, y, width, height } = bounds;
  // Avoid errors on zero-size elements, but allow for lines (width or height might be 0)
  if (width === 0 && height === 0) return 'transparent'; 

  // Extract colors
  const colorRegex = /#(?:[0-9a-fA-F]{3}){1,2}/g;
  const colors = colorString.match(colorRegex);
  if (!colors || colors.length === 0) return colorString; // Fallback

  const stops = colors.map((color, index) => ({
    color,
    stop: index / (colors.length - 1 || 1),
  }));

  try {
    if (colorString.startsWith('linear-gradient')) {
      const paramsMatch = colorString.match(/linear-gradient\((.+?),/);
      const direction = paramsMatch ? paramsMatch[1].trim() : 'to bottom';

      let x0 = x, y0 = y, x1 = x, y1 = y + height; // Default: 'to bottom'
      const effectiveWidth = width === 0 ? 1 : width; // Avoid 0-width for lines
      const effectiveHeight = height === 0 ? 1 : height; // Avoid 0-height for lines

      if (direction.includes('to right') && !direction.includes('to top') && !direction.includes('to bottom')) {
         x0 = x; y0 = y; x1 = x + effectiveWidth; y1 = y;
      }
      else if (direction.includes('to left')) { 
        x0 = x + effectiveWidth; y0 = y; x1 = x; y1 = y; 
      }
      else if (direction.includes('to top') && !direction.includes('to right') && !direction.includes('to left')) { 
        x0 = x; y0 = y + effectiveHeight; x1 = x; y1 = y; 
      }
      else if (direction.includes('to bottom right')) { 
        x0 = x; y0 = y; x1 = x + effectiveWidth; y1 = y + effectiveHeight; 
      }
      else if (direction.includes('to bottom left')) { 
        x0 = x + effectiveWidth; y0 = y; x1 = x; y1 = y + effectiveHeight; 
      }
      else if (direction.includes('to top right')) { 
        x0 = x; y0 = y + effectiveHeight; x1 = x + effectiveWidth; y1 = y; 
      }
      else if (direction.includes('to top left')) { 
        x0 = x + effectiveWidth; y0 = y + effectiveHeight; x1 = x; y1 = y; 
      }
      // Handle '45deg'
      else if (direction.includes('45deg')) { 
        x0 = x; y0 = y + effectiveHeight; x1 = x + effectiveWidth; y1 = y; 
      }
      // Default 'to bottom'
      else {
         x0 = x; y0 = y; x1 = x; y1 = y + effectiveHeight;
      }
      
      const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
      stops.forEach(s => gradient.addColorStop(s.stop, s.color));
      return gradient;

    } else if (colorString.startsWith('radial-gradient')) {
      const cx = x + width / 2;
      const cy = y + height / 2;
      const r = Math.max(width, height) / 2;

      // Handle divide by zero if r is 0
      if (r === 0) return colors[0] || 'transparent'; 

      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      stops.forEach(s => gradient.addColorStop(s.stop, s.color));
      return gradient;
    }
  } catch (e) {
    console.error("Failed to parse gradient:", colorString, e);
    return colors[0] || 'transparent'; // Fallback to first color
  }

  return colorString; // Fallback
};

// --- END GRADIENT HELPER FUNCTIONS ---


export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  activeTool = "hand",
  strokeColor = "#000",
  strokeWidth = 2,
  penSettings: propPen = defaultPen,
  selectedEmoji = null,
  onEmojiPlaced,
  boardId = "default-board",
  userName = "Anonymous",
  userRole = "guest",
  zoomLevel: externalZoom = 1,
  shapeColor = "#fff",
  isDarkMode = false,
  textMode: propTextMode = 'simple',
  onImageUpload,
  onToolChange,
  forwardedRef,
  board,
  addElement,
  updateElement,
  deleteElement,
  updateViewport,

  // --- MODIFICATION: Receive new props ---
  isCreatingText = false,
  onTextCreationDone,
  // --- END MODIFICATION ---
}) => {
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    position: { x: number; y: number };
    elementId: string | null;
    isLocked: boolean; 
  }>({
    visible: false,
    position: { x: 0, y: 0 },
    elementId: null,
    isLocked: false, 
  });

  // --- NEW: Crop State ---
  const [croppingElementId, setCroppingElementId] = useState<string | null>(null);

  const drawingElements: DrawingElement[] = board?.elements || [];
  
  const viewport = board?.viewport || { scrollX: 0, scrollY: 0, zoomLevel: externalZoom || 1 };
  const zoomLevel = externalZoom;
  const [localScrollX, setLocalScrollX] = useState(viewport.scrollX);
  const [localScrollY, setLocalScrollY] = useState(viewport.scrollY);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // --- MODIFICATION: Add ref for hidden text input ---
  const textInputRef = useRef<HTMLTextAreaElement | null>(null); // <-- CHANGED
  // --- END MODIFICATION ---

  const [showPenPanel, setShowPenPanel] = useState(false);
  const [showEraserPanel, setShowEraserPanel] = useState(false);
  // --- NEW: State for Eraser Panel Collapse ---
  const [isEraserPanelCollapsed, setIsEraserPanelCollapsed] = useState(false);
  // ---
  const [showFlowchartPanel, setShowFlowchartPanel] = useState(false);
  const [showShapePanel, setShowShapePanel] = useState(false);
  const [imageCache, setImageCache] = useState<Map<string, HTMLImageElement>>(new Map());

  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [tempPath, setTempPath] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isStraightLineMode, setIsStraightLineMode] = useState(false);
  const [penSettings, setPenSettings] = useState(propPen);
  const [eraserSettings, setEraserSettings] = useState<EraserSettings>({
    mode: 'stroke',
    size: 20,
    pressureEnabled: true,
    previewEnabled: true
  });
  const [eraserPath, setEraserPath] = useState<Point[]>([]);
  const [startPoint, setStartPoint] = useState<Point>({ x: 0, y: 0 });
  const [mousePosition, setMousePosition] = useState<Point>({ x: 0, y: 0 });
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [textMode, setTextMode] = useState<'simple' | 'colorful' | null>(propTextMode || 'simple');
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [lastClickPos, setLastClickPos] = useState<Point>({ x: 0, y: 0 });

  const [isHandActive, setIsHandActive] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState<Point>({ x: 0, y: 0 });
  const [previousTool, setPreviousTool] = useState<string>("");
  const [isSpacebarActive, setIsSpacebarActive] = useState(false);

  // --- NEW: Refs for Pinch-to-Zoom ---
  const activePointersRef = useRef<Map<number, { x: number, y: number }>>(new Map());
  const initialPinchStateRef = useRef<{ zoom: number, scrollX: number, scrollY: number, distance: number, midPoint: Point } | null>(null);
  const isPinchingRef = useRef(false);
  // ---

  const [selectionMode, setSelectionMode] = useState<'single' | 'marquee' | null>(null);
  const [selectionStart, setSelectionStart] = useState<Point>({ x: 0, y: 0 });
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [dragOffsets, setDragOffsets] = useState<{ [elementId: string]: { x: number, y: number } }>({});
  const [marqueeRect, setMarqueeRect] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
  const [transformHandles, setTransformHandles] = useState<SelectionHandle[]>([]);
  const [activeHandle, setActiveHandle] = useState<SelectionHandle | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [originalBounds, setOriginalBounds] = useState<{ minX: number; minY: number; maxX: number; maxY: number } | null>(null);
  const [originalElements, setOriginalElements] = useState<DrawingElement[]>([]);

  const [isCreatingShape, setIsCreatingShape] = useState(false);
  const [lastShiftKey, setLastShiftKey] = useState(false);

  const [shapeSettings, setShapeSettings] = useState<ShapeSettings>({
    selectedShape: 'rectangle',
    strokeWidth: 2,
    cornerRadius: 10,
    sides: 6,
    points: 5,
  });
  const [shapeStartPoint, setShapeStartPoint] = useState<Point | null>(null);

  // --- MODIFIED: Removed pendingImage and isPlacingImage states ---
  // const [pendingImage, setPendingImage] = useState<{ file: File; dataUrl: string } | null>(null);
  // const [isPlacingImage, setIsPlacingImage] = useState(false);
  // ---
  const [imagePreviewPosition, setImagePreviewPosition] = useState<Point>({ x: 0, y: 0 });

  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const gridSize = 20;
  const snapEnabled = true;

  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateCanvasSize = () => {
      setCanvasSize({ width: window.innerWidth, height: window.innerHeight });
    };
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  useEffect(() => {
    drawingElements.forEach(el => {
      if (el.type === "image" && el.imageData && !imageCache.has(el.id)) {
        const img = new Image();
        img.onload = () => {
          setImageCache(prev => {
            const newCache = new Map(prev);
            newCache.set(el.id, img);
            return newCache;
          });
          redrawCanvas();
        };
        img.onerror = () => {
          console.error('Failed to load image:', el.id);
        };
        img.src = el.imageData;
      }
    });
  }, [drawingElements, imageCache]);

  // --- FIX: Add this useEffect to handle canceled image uploads ---
  useEffect(() => {
    const handleFocus = () => {
      // This is a workaround for the UploadMediaTool (StickyNoteTool).
      // That tool's onClick sets the activeTool to "sticky" immediately.
      // It then opens a file dialog. If the user *cancels* that dialog,
      // onImageUpload is never called, and the tool remains "sticky".
      // This causes clicks on the canvas to drop sticky notes, which is
      // not the user's intent.
      //
      // This effect detects when the window regains focus. If the
      // active tool is "sticky"
      // we assume the user canceled the dialog and reset the tool
      // to "selection".
      //
      // --- MODIFIED: Removed isPlacingImage check ---
      if (activeTool === "sticky") {
        onToolChange?.("selection");
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [activeTool, onToolChange]); // --- MODIFIED: Removed isPlacingImage dependency
  // --- END OF FIX ---

  // --- MODIFICATION: Add useEffect to manage keyboard focus ---
  useEffect(() => {
    if (editingElementId && textInputRef.current) {
      
      // --- NEW: Find the element and set the textarea's value ---
      const element = drawingElements.find(e => e.id === editingElementId);
      if (element && element.type === 'text') {
        textInputRef.current.value = element.text || '';
      }
      // --- END NEW ---

      // Focus the hidden input to open the keyboard
      // Add a small delay for mobile browsers
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
    } else if (!editingElementId && textInputRef.current) {
      
      // --- NEW: Clear the value on blur ---
      if (textInputRef.current) {
        textInputRef.current.value = '';
      }
      // --- END NEW ---

      // Blur it when done
      textInputRef.current.blur();
    }
  }, [editingElementId, drawingElements]); // <-- CHANGED
  // --- END MODIFICATION ---


  // --- MODIFICATION: Add useEffect to create text element automatically ---
  useEffect(() => {
    if (isCreatingText) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // 1. Calculate the center of the viewport
      const dpr = window.devicePixelRatio || 1;
      const centerX = canvas.width / 2 / dpr;
      const centerY = canvas.height / 2 / dpr;
      
      // This finds the scene coordinate currently at the center of your screen
      const scenePt = { 
        x: -localScrollX + (centerX / zoomLevel), 
        y: -localScrollY + (centerY / zoomLevel) 
      };

      // 2. Create the new text element
      const newNote = handleTextDown(scenePt, userName, textMode || 'simple');
      
      // 3. Add it to the canvas
      addElement(newNote);
      
      // 4. Immediately set it to editing mode (this triggers the focus useEffect)
      setSelectedElementIds([newNote.id]);
      setEditingElementId(newNote.id);

      // 5. Reset the trigger flag in BoardPage
      onTextCreationDone?.();
    }
  }, [isCreatingText, addElement, localScrollX, localScrollY, zoomLevel, userName, textMode, onTextCreationDone, setSelectedElementIds, setEditingElementId]);
  // --- END MODIFICATION ---

  const handleLockElement = useCallback(() => {
    if (contextMenu.elementId) {
      updateElement(contextMenu.elementId, { locked: true });
      setSelectedElementIds(prev => prev.filter(id => id !== contextMenu.elementId));
    }
  }, [contextMenu.elementId, updateElement]);

  const handleUnlockElement = useCallback(() => {
    if (contextMenu.elementId) {
      updateElement(contextMenu.elementId, { locked: false });
    }
  }, [contextMenu.elementId, updateElement]);

  // --- MODIFIED: handleCropElement ---
  const handleCropElement = useCallback(() => {
    if (contextMenu.elementId) {
      const element = drawingElements.find(e => e.id === contextMenu.elementId);
      if (element && element.type === 'image' && !element.locked) {
        setCroppingElementId(element.id);
        setSelectedElementIds([element.id]); // Keep it selected
        onToolChange?.('selection'); // Switch to selection tool
      }
    }
  }, [contextMenu.elementId, drawingElements, onToolChange]);

  const handleBringToFront = useCallback(() => {
    if (contextMenu.elementId) {
      const element = drawingElements.find(e => e.id === contextMenu.elementId);
      if (element) {
        deleteElement(element.id);
        setTimeout(() => addElement(element), 10);
      }
    }
  }, [contextMenu.elementId, drawingElements, deleteElement, addElement]);

  const handleSendToBack = useCallback(() => {
    if (contextMenu.elementId) {
      const element = drawingElements.find(e => e.id === contextMenu.elementId);
      if (element) {
        deleteElement(element.id);
        setTimeout(() => addElement({ ...element, timestamp: 0 }), 10);
      }
    }
  }, [contextMenu.elementId, drawingElements, deleteElement, addElement]);

  const handleRotateImage = useCallback(() => {
    if (contextMenu.elementId) {
      const element = drawingElements.find(e => e.id === contextMenu.elementId);
      if (element && element.type === 'image' && !element.locked) {
        const currentRotation = element.rotation || 0;
        updateElement(element.id, { 
          ...element, 
          rotation: (currentRotation + 90) % 360 
        });
      }
    }
  }, [contextMenu.elementId, drawingElements, updateElement]);

  // --- *** MODIFIED: handleImageUpload *** ---
  // This function now creates the image element directly in the viewport center.
  const handleImageUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      
      // --- START of logic moved from handlePointerDown ---
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // 1. Calculate viewport center
        const dpr = window.devicePixelRatio || 1;
        const centerX = canvas.width / 2 / dpr;
        const centerY = canvas.height / 2 / dpr;
        const scenePt = { 
          x: -localScrollX + (centerX / zoomLevel), 
          y: -localScrollY + (centerY / zoomLevel) 
        };

        // 2. Calculate image properties
        const aspectRatio = img.width / img.height;
        const maxWidth = 400;
        const width = Math.min(maxWidth, img.width);
        const height = width / aspectRatio;

        // 3. Create the element at the viewport center
        const imageElement: DrawingElement = {
          id: `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: "image",
          imageData: dataUrl,
          position: {
            x: scenePt.x - width / 2, // <-- USE VIEWPORT CENTER
            y: scenePt.y - height / 2, // <-- USE VIEWPORT CENTER
          },
          width,
          height,
          originalWidth: img.width,
          originalHeight: img.height,
          aspectRatio,
          strokeColor: "#000000",
          strokeWidth: 0,
          timestamp: Date.now(),
          author: userName,
          selectable: true,
          evented: true,
          rotation: 0,
          locked: false,
          crop: null,
        };

        // 4. Add the element
        addElement(imageElement);
        
        // 5. No need to set pending/placing state.
        // We can just switch the tool back to selection.
        onToolChange?.("selection");
      };
      img.src = dataUrl;
      // --- END of logic ---
    };
    reader.readAsDataURL(file);
  }, [
      onToolChange, 
      canvasRef, 
      localScrollX, 
      localScrollY, 
      zoomLevel, 
      userName, 
      addElement 
  ]); // <-- Added new dependencies
  // --- *** END OF MODIFICATION *** ---

  useImperativeHandle(forwardedRef, () => ({
    handleImageUpload,
  }), [handleImageUpload]);

  const handleDragOver = useCallback((ev: React.DragEvent<HTMLCanvasElement>) => {
    ev.preventDefault();
    ev.stopPropagation();
    setIsDraggingOver(true);
  }, []);

  const handleDragEnter = useCallback((ev: React.DragEvent<HTMLCanvasElement>) => {
    ev.preventDefault();
    ev.stopPropagation();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((ev: React.DragEvent<HTMLCanvasElement>) => {
    ev.preventDefault();
    ev.stopPropagation();
    setIsDraggingOver(false);
  }, []);

  const handleDrop = useCallback((ev: React.DragEvent<HTMLCanvasElement>) => {
    ev.preventDefault();
    ev.stopPropagation();
    setIsDraggingOver(false);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const scenePt = getCanvasCoordinates(
      ev.clientX, 
      ev.clientY, 
      canvas, 
      localScrollX, 
      localScrollY, 
      zoomLevel
    );

    const files = ev.dataTransfer?.files;
    if (files && files.length > 0) {
      const imageFiles = Array.from(files).filter(file => 
        file.type.startsWith('image/')
      );

      if (imageFiles.length === 0) {
        console.warn('No image files found in drop');
        return;
      }

      imageFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          const img = new Image();
          
          img.onload = () => {
            const aspectRatio = img.width / img.height;
            const maxWidth = 400;
            const width = Math.min(maxWidth, img.width);
            const height = width / aspectRatio;

            const offset = index * 20;

            const imageElement: DrawingElement = {
              id: `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              type: "image",
              imageData: dataUrl,
              position: {
                x: scenePt.x - width / 2 + offset,
                y: scenePt.y - height / 2 + offset,
              },
              width,
              height,
              originalWidth: img.width,
              originalHeight: img.height,
              aspectRatio,
              strokeColor: "#000000",
              strokeWidth: 0,
              timestamp: Date.now(),
              author: userName,
              selectable: true,
              evented: true,
              rotation: 0,
              locked: false,
              crop: null, // --- NEW ---
            };

            addElement(imageElement);
          };

          img.onerror = () => {
            console.error('Failed to load dropped image');
          };

          img.src = dataUrl;
        };
        
        reader.onerror = () => {
          console.error('Failed to read dropped file');
        };
        
        reader.readAsDataURL(file);
      });
    }
  }, [localScrollX, localScrollY, zoomLevel, userName, addElement]);

  const handlePaste = useCallback((ev: ClipboardEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (editingElementId) return;

    const items = ev.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        ev.preventDefault();
        const file = items[i].getAsFile();
        if (!file) continue;

        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          const img = new Image();
          
          img.onload = () => {
            const aspectRatio = img.width / img.height;
            const maxWidth = 400;
            const width = Math.min(maxWidth, img.width);
            const height = width / aspectRatio;

            const viewCenterX = -localScrollX + (canvas.width / 2 / (window.devicePixelRatio || 1)) / zoomLevel;
            const viewCenterY = -localScrollY + (canvas.height / 2 / (window.devicePixelRatio || 1)) / zoomLevel;

            const imageElement: DrawingElement = {
              id: `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              type: "image",
              imageData: dataUrl,
              position: {
                x: viewCenterX - width / 2,
                y: viewCenterY - height / 2,
              },
              width,
              height,
              originalWidth: img.width,
              originalHeight: img.height,
              aspectRatio,
              strokeColor: "#000000",
              strokeWidth: 0,
              timestamp: Date.now(),
              author: userName,
              selectable: true,
              evented: true,
              rotation: 0,
              locked: false,
              crop: null, // --- NEW ---
            };

            addElement(imageElement);
          };

          img.onerror = () => {
            console.error('Failed to load pasted image');
          };

          img.src = dataUrl;
        };
        
        reader.readAsDataURL(file);
        break;
      }
    }
  }, [localScrollX, localScrollY, zoomLevel, userName, addElement, editingElementId]);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  useEffect(() => {
    if (propTextMode) setTextMode(propTextMode);
  }, [propTextMode]);

  useEffect(() => {
    if (activeTool === "pencil" || activeTool === "pen" || activeTool === "+") {
      setShowPenPanel(true);
    } else {
      setShowPenPanel(false);
    }
  }, [activeTool]);

  useEffect(() => {
    if (activeTool === "eraser") {
      setShowEraserPanel(true);
    } else {
      setShowEraserPanel(false);
    }
  }, [activeTool]);

  useEffect(() => {
    if (activeTool === "graph") {
      setShowFlowchartPanel(true);
    } else {
      setShowFlowchartPanel(false);
    }
  }, [activeTool]);

  useEffect(() => {
    if (activeTool === "shapes") {
      setShowShapePanel(true);
    } else {
      setShowShapePanel(false);
    }
  }, [activeTool]);

  useEffect(() => {
    if (selectedElementIds.length > 0 && !isResizing && !isDraggingSelection) {
      const handles = calculateTransformHandles(selectedElementIds, drawingElements);
      setTransformHandles(handles);
    } else {
      setTransformHandles([]);
    }
  }, [selectedElementIds, drawingElements, isResizing, isDraggingSelection]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // --- MODIFIED: Removed isPlacingImage check ---
    if (activeTool === "hand") {
      canvas.style.cursor = isHandActive ? "grabbing" : "grab";
    } else if (activeTool === "pencil" || activeTool === "pen" || activeTool === "+") {
      canvas.style.cursor = "crosshair";
    } else if (activeTool === "eraser") {
      canvas.style.cursor = "none";
    } else {
      canvas.style.cursor = "default";
    }
  }, [activeTool, isHandActive]); // --- MODIFIED: Removed isPlacingImage dependency

  // --- MODIFIED: Removed useEffect for isPlacingImage ---
  // (This is no longer needed as we don't enter that state)
  /*
  useEffect(() => {
    const handleKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape' && isPlacingImage) {
        setPendingImage(null);
        setIsPlacingImage(false);
        if (canvasRef.current) {
          canvasRef.current.style.cursor = 'default';
        }
        onToolChange?.("selection");
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlacingImage, onToolChange]);
  */

  const convertExcalidrawElement = (el: any): DrawingElement | null => {
    const commonProps: Partial<DrawingElement> = {
      id: el.id || generateId(),
      timestamp: Date.now(),
      author: userName,
      selectable: true,
      evented: true,
      strokeColor: el.strokeColor || "#000000",
      strokeWidth: el.strokeWidth || 2,
      opacity: el.opacity ? el.opacity / 100 : 1,
      fillColor: el.backgroundColor === "transparent" ? undefined : el.backgroundColor,
      backgroundColor: el.backgroundColor === "transparent" ? undefined : el.backgroundColor,
      locked: false,
    };

    if (el.type === 'rectangle' || el.type === 'ellipse' || el.type === 'diamond') {
      const { x, y, width, height } = el;
      return {
        ...commonProps,
        type: "shape", 
        position: { x, y },
        size: { width, height },
        shapeType: el.type,
      } as DrawingElement;
    }

    if (el.type === 'line' || el.type === 'arrow') {
      if (!el.points) return null; 
      const { x, y } = el;
      const path: Point[] = el.points.map((p: number[]) => ({
        x: x + p[0],
        y: y + p[1]
      }));
      return {
        ...commonProps,
        type: "path", 
        path: path,
        position: { x, y },
        shapeType: el.type, 
      } as DrawingElement;
    }

    if (el.type === 'text') {
      return {
        ...commonProps,
        type: "text",
        text: el.text || "",
        position: { x: el.x, y: el.y },
        size: { width: el.width, height: el.height },
        fontSize: el.fontSize || 16,
        textType: 'simple', 
      } as DrawingElement;
    }
    
    console.warn("Unknown element type from template:", el.type);
    return null;
  };

  const addElementsViaAction = useCallback((elements: any[]) => {
    if (!elements || elements.length === 0) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const viewCenterX = -localScrollX + (canvas.width / 2 / (window.devicePixelRatio || 1)) / zoomLevel;
    const viewCenterY = -localScrollY + (canvas.height / 2 / (window.devicePixelRatio || 1)) / zoomLevel;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    elements.forEach(el => {
      if (el.x !== undefined) {
        minX = Math.min(minX, el.x);
        minY = Math.min(minY, el.y);
        maxX = Math.max(maxX, el.x + (el.width || 0));
        maxY = Math.max(maxY, el.y + (el.height || 0));
      }
    });

    if (minX === Infinity) { minX = 0; minY = 0; maxX = 0; maxY = 0; }

    const templateCenterX = minX + (maxX - minX) / 2;
    const templateCenterY = minY + (maxY - minY) / 2;
    
    const offsetX = viewCenterX - templateCenterX;
    const offsetY = viewCenterY - templateCenterY;

    elements.forEach(el => {
      const newElement = convertExcalidrawElement(el);
      if (!newElement) return;

      if (newElement.path) {
        newElement.path = newElement.path.map(p => ({
          ...p,
          x: p.x + offsetX,
          y: p.y + offsetY
        }));
      }
      if (newElement.position) {
        newElement.position = {
          x: newElement.position.x + offsetX,
          y: newElement.position.y + offsetY
        };
      }
      
      addElement(newElement); 
    });

  }, [addElement, localScrollX, localScrollY, zoomLevel, canvasRef, canvasSize, userName]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(canvas.offsetWidth * dpr);
    canvas.height = Math.floor(canvas.offsetHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    ctx.save();
    const centerX = canvas.width / 2 / dpr;
    const centerY = canvas.height / 2 / dpr;
    ctx.translate(centerX, centerY);
    ctx.scale(zoomLevel, zoomLevel);
    ctx.translate(-centerX + localScrollX, -centerY + localScrollY);

    // Draw elements
    for (const el of drawingElements) {
      
      if (el.type === "image" && el.position && el.imageData && el.width && el.height) {
        const cachedImage = imageCache.get(el.id);
      
        if (cachedImage && cachedImage.complete) {
          ctx.save();
          ctx.globalAlpha = el.opacity || 1;
      
          const imageCenterX = el.position.x + el.width / 2;
          const imageCenterY = el.position.y + el.height / 2;
      
          ctx.translate(imageCenterX, imageCenterY);
      
          const angleInRadians = ((el.rotation || 0) * Math.PI) / 180;
          ctx.rotate(angleInRadians);
      
          // --- CROP LOGIC ---
          let sx = 0;
          let sy = 0;
          let sWidth = el.originalWidth || cachedImage.width;
          let sHeight = el.originalHeight || cachedImage.height;

          if (el.crop) {
            sx = el.crop.sx;
            sy = el.crop.sy;
            sWidth = el.crop.sWidth;
            sHeight = el.crop.sHeight;
          }
          // --- END CROP LOGIC ---

          try {
            ctx.drawImage(
              cachedImage,
              sx,
              sy,
              sWidth,
              sHeight,
              -el.width / 2, // dx
              -el.height / 2, // dy
              el.width,       // dWidth
              el.height       // dHeight
            );
          } catch (err) {
            console.error('Error drawing image:', el.id, err);
          }
          
          ctx.restore();
      
          if (selectedElementIds.includes(el.id)) {
            // --- MODIFIED: Show red if locked, orange if cropping ---
            ctx.strokeStyle = el.locked ? '#e11d48' : (croppingElementId === el.id ? '#f59e0b' : '#007acc');
            ctx.lineWidth = 2 / zoomLevel;
            ctx.strokeRect(
              el.position.x,
              el.position.y,
              el.width,
              el.height
            );
          }
        } else {
          ctx.save();
          ctx.fillStyle = '#f3f4f6';
          ctx.strokeStyle = '#d1d5db';
          ctx.lineWidth = 2;
          ctx.fillRect(el.position.x, el.position.y, el.width, el.height);
          ctx.strokeRect(el.position.x, el.position.y, el.width, el.height);
          
          ctx.fillStyle = '#6b7280';
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            '⏳ Loading image...',
            el.position.x + el.width / 2,
            el.position.y + el.height / 2
          );
          ctx.restore();
        }
        
        continue;
      }
      
      // --- MODIFIED: This block now supports gradients ---
      else if (el.type === "shape" && el.shapeType && el.position && el.size) {
        ctx.save();
        ctx.globalAlpha = el.opacity || 1;
        
        // --- NEW: Get bounds and create gradient styles ---
        const bounds = getElementBounds(el);
        ctx.strokeStyle = createGradientStyle(ctx, el.strokeColor, bounds);
        const fillStyle = el.fillColor || el.backgroundColor || 'transparent';
        ctx.fillStyle = createGradientStyle(ctx, fillStyle, bounds);
        // --- END NEW ---
        
        ctx.lineWidth = el.strokeWidth || 2;
        
        ctx.beginPath();
        
        const { x, y } = el.position;
        const { width, height } = el.size;
        const cx = x + width / 2;
        const cy = y + height / 2;
        
        if (el.shapeType === 'ellipse') {
            ctx.ellipse(cx, cy, width / 2, height / 2, 0, 0, 2 * Math.PI);
        } else if (el.shapeType === 'diamond') {
            ctx.moveTo(cx, y);
            ctx.lineTo(x + width, cy);
            ctx.lineTo(cx, y + height);
            ctx.lineTo(x, cy);
            ctx.closePath();
        } else {
            ctx.rect(x, y, width, height);
        }
        
        if (fillStyle !== 'transparent') {
            ctx.fill();
        }
        ctx.stroke();

        if (selectedElementIds.includes(el.id)) {
          ctx.strokeStyle = el.locked ? '#e11d48' : '#007acc'; // Selection box remains solid
          ctx.lineWidth = 2 / zoomLevel;
          ctx.strokeRect(x, y, width, height);
        }
        
        ctx.restore();
      } 
      // --- END MODIFICATION ---

     else if (el.type === "path" && el.path && el.path.length > 0) {
        ctx.save();
        ctx.globalAlpha = el.opacity || 1;
        
        const isShape = el.shapeType && 
                      (el.shapeType === 'rectangle' || 
                        el.shapeType === 'rounded-rectangle' ||
                        el.shapeType === 'circle' ||
                        el.shapeType === 'ellipse' ||
                        el.shapeType === 'diamond' || 
                        el.shapeType === 'polygon' || 
                        el.shapeType === 'star' || 
                        el.shapeType === 'line' ||
                        el.shapeType === 'arrow');
        
        // --- MODIFIED: This block now supports gradients ---
        if (isShape) {
          // --- NEW: Get bounds and create gradient styles ---
          const bounds = getElementBounds(el);
          ctx.strokeStyle = createGradientStyle(ctx, el.strokeColor, bounds);
          const fillColor = el.fillColor || el.backgroundColor;
          const fillStyle = (fillColor === 'transparent' || !fillColor) ? 'transparent' : fillColor;
          ctx.fillStyle = createGradientStyle(ctx, fillStyle, bounds);
          // --- END NEW ---
          
          ctx.lineWidth = el.strokeWidth || 2;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          ctx.beginPath();
          ctx.moveTo(el.path[0].x, el.path[0].y);
          for (let i = 1; i < el.path.length; i++) {
            ctx.lineTo(el.path[i].x, el.path[i].y);
          }
          
          if (el.shapeType !== 'line' && el.shapeType !== 'arrow') {
            ctx.closePath();
          }
          
          if (fillStyle && fillStyle !== 'transparent') {
            ctx.fill();
          }
          
          ctx.stroke();
          
          if (selectedElementIds.includes(el.id)) {
            const xs = el.path.map(p => p.x);
            const ys = el.path.map(p => p.y);
            const minX = Math.min(...xs);
            const minY = Math.min(...ys);
            const maxX = Math.max(...xs);
            const maxY = Math.max(...ys);
            
            ctx.strokeStyle = el.locked ? '#e11d48' : '#007acc'; // Selection box remains solid
            ctx.lineWidth = 2 / zoomLevel;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(minX - 5, minY - 5, maxX - minX + 10, maxY - minY + 10);
            ctx.setLineDash([]);
          }
        // --- END MODIFICATION ---
        } else {
          // This is regular pencil/pen drawing
          const inputPoints = el.path.map(p => [p.x, p.y, p.pressure || 0.5]);
          try {
            const strokeOptions = {
              simulatePressure: penSettings.pressureEnabled,
              size: Math.max(1, (el.strokeWidth || 2)),
              thinning: 0.6,
              smoothing: 0.5,
              streamline: 0.5,
              easing: (t: number) => Math.sin((t * Math.PI) / 2),
              last: true
            };
            const strokePath = getStroke(inputPoints as number[][], strokeOptions);
            
            if (strokePath.length > 0) {
              ctx.save();
              // --- MODIFIED: Use gradient for pen stroke too ---
              const bounds = getElementBounds(el);
              ctx.fillStyle = createGradientStyle(ctx, el.strokeColor, bounds);
              // --- END MODIFICATION ---

              ctx.beginPath();
              ctx.moveTo(strokePath[0][0], strokePath[0][1]);
              for (let i = 1; i < strokePath.length; i++) {
                ctx.lineTo(strokePath[i][0], strokePath[i][1]);
              }
              ctx.closePath();
              
              ctx.fill();

              ctx.restore();
            }
          } catch {
            // Fallback for simple path
            const bounds = getElementBounds(el);
            ctx.strokeStyle = createGradientStyle(ctx, el.strokeColor, bounds);
            ctx.fillStyle = 'transparent';
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.lineWidth = el.strokeWidth || 2;
            ctx.beginPath();
            ctx.moveTo(el.path[0].x, el.path[0].y);
            for (let i = 1; i < el.path.length; i++) ctx.lineTo(el.path[i].x, el.path[i].y);
            
            ctx.stroke();
          }
        }
        ctx.restore();
      }
      
      else if (el.type === "text" && el.position) {
        ctx.save();
        const baseFontSize = el.fontSize || (el.textType === 'simple' ? 15 : 17);
        const fontFamily = el.textType === 'simple'
          ? 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif'
          : 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';

        ctx.font = el.textType === 'simple'
          ? `500 ${baseFontSize}px ${fontFamily}`
          : `600 ${baseFontSize}px ${fontFamily}`;

        const textColor = el.textType === 'simple' ? '#1a1a1a' : '#ffffff';
        const shadowColor = el.textType === 'simple' ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.3)';
        
        // --- MODIFIED: Allow gradient for text color ---
        const bounds = getElementBounds(el); // Use a rough guess for bounds
        ctx.fillStyle = createGradientStyle(ctx, el.strokeColor || textColor, bounds);
        // --- END MODIFICATION ---
        
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = el.textType === 'simple' ? 2 : 3;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = el.textType === 'simple' ? 1 : 2;

        ctx.translate(el.position.x, el.position.y);

        if (el.textType === 'colorful' && el.gradientType && el.text) {
          const metrics = ctx.measureText(el.text);
          const padding = 8;
          const bgWidth = metrics.width + padding * 2;
          const bgHeight = baseFontSize + padding * 1.5;
          const gradient = ctx.createLinearGradient(0, 0, bgWidth, bgHeight);
          switch (el.gradientType) {
            case 'blue':
              gradient.addColorStop(0, '#4F46E5'); gradient.addColorStop(1, '#3B82F6'); break;
            case 'purple':
              gradient.addColorStop(0, '#8B5CF6'); gradient.addColorStop(1, '#A855F7'); break;
            case 'green':
              gradient.addColorStop(0, '#10B981'); gradient.addColorStop(1, '#059669'); break;
            case 'orange':
              gradient.addColorStop(0, '#F97316'); gradient.addColorStop(1, '#EA580C'); break;
            case 'pink':
              gradient.addColorStop(0, '#EC4899'); gradient.addColorStop(1, '#DB2777'); break;
            case 'teal':
              gradient.addColorStop(0, '#14B8A6'); gradient.addColorStop(1, '#0D9488'); break;
          }
          const cornerRadius = 6;
          ctx.save();
          ctx.fillStyle = gradient;
          ctx.strokeStyle = 'rgba(255,255,255,0.2)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-padding + cornerRadius, -padding);
          ctx.lineTo(bgWidth - padding - cornerRadius, -padding);
          ctx.quadraticCurveTo(bgWidth - padding, -padding, bgWidth - padding, -padding + cornerRadius);
          ctx.lineTo(bgWidth - padding, bgHeight - padding - cornerRadius);
          ctx.quadraticCurveTo(bgWidth - padding, bgHeight - padding, bgWidth - padding - cornerRadius, bgHeight - padding);
          ctx.lineTo(-padding + cornerRadius, bgHeight - padding);
          ctx.quadraticCurveTo(-padding, bgHeight - padding, -padding, bgHeight - padding - cornerRadius);
          ctx.lineTo(-padding, -padding + cornerRadius);
          ctx.quadraticCurveTo(-padding, -padding, -padding + cornerRadius, -padding);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }

        const lines = (el.text || '').split('\n');
        const lineHeight = baseFontSize * 1.2;
        lines.forEach((line, index) => ctx.fillText(line, 0, index * lineHeight));

        if (editingElementId === el.id) {
          const lastLine = lines[lines.length - 1] || '';
          const metrics = ctx.measureText(lastLine);
          const cursorX = metrics.width;
          const cursorY = (lines.length - 1) * lineHeight;
          ctx.save();
          ctx.fillStyle = textColor;
          if (Math.floor(Date.now() / 500) % 2 === 0) {
            ctx.fillRect(cursorX + 1, cursorY, 2, baseFontSize);
          }
          ctx.restore();
        }

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.restore();
      }
    }

    // Draw temp pencil path preview
    if (tempPath.length > 1 && activeTool === "pencil") {
      const inputPoints = tempPath.map(p => [p.x, p.y, p.pressure || 0.5]);
      try {
        const strokePath = getStroke(inputPoints as number[][], {
          simulatePressure: penSettings.pressureEnabled,
          size: Math.max(1, penSettings.strokeWidth / zoomLevel),
          thinning: 0.6,
          smoothing: 0.5,
          streamline: 0.5,
          easing: (t: number) => Math.sin((t * Math.PI) / 2),
          last: false
        });
        if (strokePath.length > 0) {
          ctx.save();
          // --- MODIFIED: Gradient for pencil preview ---
          const tempBounds = getElementBounds({ type: "path", path: tempPath } as DrawingElement);
          ctx.fillStyle = createGradientStyle(ctx, strokeColor, tempBounds);
          // --- END MODIFICATION ---
          const path = new Path2D();
          path.moveTo(strokePath[0][0], strokePath[0][1]);
          for (let i = 1; i < strokePath.length; i++) path.lineTo(strokePath[i][0], strokePath[i][1]);
          ctx.fill(path);
          ctx.restore();
        }
      } catch { }
    }

    // --- MODIFIED: Draw temporary shape preview with gradients ---
    if (tempPath.length > 1 && activeTool === "shapes" && isCreatingShape) {
      ctx.save();

      // --- NEW: Gradient preview ---
      const tempBounds = getElementBounds({ type: "path", path: tempPath } as DrawingElement);
      ctx.strokeStyle = createGradientStyle(ctx, strokeColor, tempBounds);
      const fillStyle = (shapeColor === 'transparent' || !shapeColor) ? 'transparent' : shapeColor;
      ctx.fillStyle = createGradientStyle(ctx, fillStyle, tempBounds);
      // --- END NEW ---

      ctx.lineWidth = shapeSettings.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(tempPath[0].x, tempPath[0].y);
      for (let i = 1; i < tempPath.length; i++) {
        ctx.lineTo(tempPath[i].x, tempPath[i].y);
      }
      
      if (shapeSettings.selectedShape !== 'line' && shapeSettings.selectedShape !== 'arrow') {
        ctx.closePath();
        if (fillStyle !== 'transparent') {
          ctx.fill();
        }
      }
      
      ctx.stroke();
      ctx.restore();
    }
    // --- END MODIFICATION ---

    // Draw eraser preview cursor
    if (activeTool === 'eraser' && eraserSettings.previewEnabled) {
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 2 / zoomLevel;
      ctx.fillStyle = 'rgba(255, 68, 68, 0.1)';

      const cursorSize = Math.max(8, eraserSettings.size);
      const halfSize = cursorSize / 2;
      const cornerRadius = 2;

      ctx.beginPath();
      ctx.moveTo(mousePosition.x - halfSize + cornerRadius, mousePosition.y - halfSize);
      ctx.lineTo(mousePosition.x + halfSize - cornerRadius, mousePosition.y - halfSize);
      ctx.quadraticCurveTo(mousePosition.x + halfSize, mousePosition.y - halfSize, mousePosition.x + halfSize, mousePosition.y - halfSize + cornerRadius);
      ctx.lineTo(mousePosition.x + halfSize, mousePosition.y + halfSize - cornerRadius);
      ctx.quadraticCurveTo(mousePosition.x + halfSize, mousePosition.y + halfSize, mousePosition.x + halfSize - cornerRadius, mousePosition.y + halfSize);
      ctx.lineTo(mousePosition.x - halfSize + cornerRadius, mousePosition.y + halfSize);
      ctx.quadraticCurveTo(mousePosition.x - halfSize, mousePosition.y + halfSize, mousePosition.x - halfSize, mousePosition.y + halfSize - cornerRadius);
      ctx.lineTo(mousePosition.x - halfSize, mousePosition.y - halfSize + cornerRadius);
      ctx.quadraticCurveTo(mousePosition.x - halfSize, mousePosition.y - halfSize, mousePosition.x - halfSize + cornerRadius, mousePosition.y - halfSize);
      ctx.closePath();

      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Draw eraser path trail
    if (eraserPath.length > 1 && activeTool === 'eraser' && isDrawing) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = eraserSettings.size / 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash([5, 5]);

      ctx.beginPath();
      ctx.moveTo(eraserPath[0].x, eraserPath[0].y);
      for (let i = 1; i < eraserPath.length; i++) {
        ctx.lineTo(eraserPath[i].x, eraserPath[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // marquee selection rectangle
    if (marqueeRect && selectionMode === 'marquee') {
      ctx.save();
      ctx.strokeStyle = '#007bff';
      ctx.fillStyle = 'rgba(0, 123, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      const normalizedRect = {
        x: Math.min(marqueeRect.x, marqueeRect.x + marqueeRect.width),
        y: Math.min(marqueeRect.y, marqueeRect.y + marqueeRect.height),
        width: Math.abs(marqueeRect.width),
        height: Math.abs(marqueeRect.height)
      };
      ctx.fillRect(normalizedRect.x, normalizedRect.y, normalizedRect.width, normalizedRect.height);
      ctx.strokeRect(normalizedRect.x, normalizedRect.y, normalizedRect.width, normalizedRect.height);
      ctx.restore();
    }

    // selection bounding box with transform handles
    if (selectedElementIds.length > 0) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      selectedElementIds.forEach(id => {
        const el = drawingElements.find(e => e.id === id);
        if (!el) return;
        if (el.path && el.path.length > 0) {
          el.path.forEach(p => {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
          });
        } else if (el.position) {
          if (el.type === 'text') {
            const lines = (el.text || '').split('\n');
            const baseFontSize = el.fontSize || (el.textType === 'simple' ? 15 : 17);
            const lineHeight = baseFontSize * 1.2;
            const textHeight = lines.length * lineHeight;

            const fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
            ctx.font = el.textType === 'simple'
              ? `500 ${baseFontSize}px ${fontFamily}`
              : `600 ${baseFontSize}px ${fontFamily}`;

            let maxWidth = 0;
            lines.forEach(line => {
              const metrics = ctx.measureText(line);
              if (metrics.width > maxWidth) {
                maxWidth = metrics.width;
              }
            });
            
            minX = Math.min(minX, el.position.x);
            minY = Math.min(minY, el.position.y);
            maxX = Math.max(maxX, el.position.x + maxWidth);
            maxY = Math.max(maxY, el.position.y + textHeight - (baseFontSize * 0.2)); 
          } else if (el.type === 'image' && el.width && el.height) {
            minX = Math.min(minX, el.position.x);
            minY = Math.min(minY, el.position.y);
            maxX = Math.max(maxX, el.position.x + el.width);
            maxY = Math.max(maxY, el.position.y + el.height);
          } else if (el.type === 'shape' && el.size) {
            minX = Math.min(minX, el.position.x);
            minY = Math.min(minY, el.position.y);
            maxX = Math.max(maxX, el.position.x + el.size.width);
            maxY = Math.max(maxY, el.position.y + el.size.height);
          } else {
            minX = Math.min(minX, el.position.x);
            minY = Math.min(minY, el.position.y);
            maxX = Math.max(maxX, el.position.x);
            maxY = Math.max(maxY, el.position.y);
          }
        }
      });
      if (minX !== Infinity) {
        ctx.save();
        const isAnyLocked = selectedElementIds.some(id => drawingElements.find(e => e.id === id)?.locked);
        // --- MODIFIED: Show orange if cropping ---
        const isCropping = croppingElementId && selectedElementIds.includes(croppingElementId);
        ctx.strokeStyle = isAnyLocked ? '#e11d48' : (isCropping ? '#f59e0b' : '#007acc');
        ctx.lineWidth = 2 / zoomLevel;
        const padding = 6 / zoomLevel;
        ctx.strokeRect(minX - padding, minY - padding, (maxX - minX) + 2 * padding, (maxY - minY) + 2 * padding);
        ctx.restore();
      }
    }

    ctx.restore();
  }, [
    drawingElements, localScrollX, localScrollY, zoomLevel, tempPath, isDrawing,
    penSettings, strokeColor, selectedElementIds, activeTool, mousePosition,
    isCreatingShape, marqueeRect, selectionMode, editingElementId, transformHandles, 
    eraserSettings, eraserPath, imagePreviewPosition, // <-- MODIFIED: Removed pendingImage/isPlacingImage
    imageCache, shapeSettings, shapeColor, shapeStartPoint,
    croppingElementId // --- NEW DEPENDENCY ---
  ]);

  useEffect(() => {
    redrawCanvas();
  }, [
    drawingElements,
    redrawCanvas,
    imageCache
  ]);

  const hitTestImageElement = (
    elements: DrawingElement[],
    x: number,
    y: number
  ): DrawingElement | null => {
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      
      if (el.type === 'image' && el.position && el.width && el.height) {
        const { position, width, height } = el;
        
        if (
          x >= position.x &&
          x <= position.x + width &&
          y >= position.y &&
          y <= position.y + height
        ) {
          return el;
        }
      }
    }
    
    return null;
  };

  const handleContextMenu = useCallback((ev: React.MouseEvent<HTMLCanvasElement>) => {
    ev.preventDefault();
    ev.stopPropagation();

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const scenePt = getCanvasCoordinates(ev.clientX, ev.clientY, canvas, localScrollX, localScrollY, zoomLevel);
    
    const clickedImage = hitTestImageElement(drawingElements, scenePt.x, scenePt.y);
    if (clickedImage) {
      setContextMenu({
        visible: true,
        position: { x: ev.clientX, y: ev.clientY },
        elementId: clickedImage.id,
        isLocked: clickedImage.locked || false, 
      });
      return;
    }
    
    const hitResult = hitTestElement(drawingElements, scenePt, strokeWidth);
    const clickedElement = hitResult.element;

    if (clickedElement) {
      setContextMenu({
        visible: true,
        position: { x: ev.clientX, y: ev.clientY },
        elementId: clickedElement.id,
        isLocked: clickedElement.locked || false, 
      });
    } else {
      closeContextMenu();
    }
  }, [drawingElements, localScrollX, localScrollY, zoomLevel, strokeWidth]);

  const handleDeleteFromContextMenu = useCallback(() => {
    if (contextMenu.elementId) {
      const element = drawingElements.find(e => e.id === contextMenu.elementId);
      if (element && !element.locked) {
        deleteElement(contextMenu.elementId);
        setSelectedElementIds(prev => prev.filter(id => id !== contextMenu.elementId));
      }
    }
  }, [contextMenu.elementId, deleteElement, drawingElements]);

  const handleDuplicateElement = useCallback(() => {
    if (contextMenu.elementId) {
      const element = drawingElements.find(e => e.id === contextMenu.elementId);
      if (element && element.type === 'image' && !element.locked) {
        const newElement: DrawingElement = {
          ...element,
          id: `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          position: element.position ? {
            x: element.position.x + 20,
            y: element.position.y + 20,
          } : undefined,
          locked: false,
          crop: element.crop ? {...element.crop} : null, // --- NEW: Copy crop data ---
        };
        addElement(newElement);
      }
    }
  }, [contextMenu.elementId, drawingElements, addElement]);

  const handleDownloadImage = useCallback(() => {
    if (contextMenu.elementId) {
      const element = drawingElements.find(e => e.id === contextMenu.elementId);
      if (element?.imageData) {
        // --- MODIFIED: Download the CROPPED version ---
        const img = imageCache.get(element.id);
        if (!img) return;
        
        const sRect = element.crop || {
          sx: 0,
          sy: 0,
          sWidth: element.originalWidth || img.width,
          sHeight: element.originalHeight || img.height,
        };

        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = sRect.sWidth;
        offscreenCanvas.height = sRect.sHeight;
        const ctx = offscreenCanvas.getContext('2d');
        if (!ctx) return;
        
        ctx.drawImage(
          img,
          sRect.sx, sRect.sy, sRect.sWidth, sRect.sHeight,
          0, 0, sRect.sWidth, sRect.sHeight
        );
        
        const link = document.createElement('a');
        link.href = offscreenCanvas.toDataURL(); // Get data from offscreen canvas
        link.download = `edxly-image-${Date.now()}.png`;
        link.click();
      }
    }
  }, [contextMenu.elementId, drawingElements, imageCache]);

  const closeContextMenu = useCallback(() => {
    setContextMenu({ visible: false, position: { x: 0, y: 0 }, elementId: null, isLocked: false });
  }, []);

  const handlePointerDown = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    if (ev.button === 2) {
      return;
    }
    ev.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    // --- NEW: Track all pointers ---
    activePointersRef.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    // ---

    // --- *** MODIFIED: UNIVERSAL PINCH-TO-ZOOM START *** ---
    // If a second finger touches the screen, START PINCHING.
    // This runs before any tool logic.
    if (activePointersRef.current.size === 2) {
      isPinchingRef.current = true;
      
      // Stop any other actions that might have started (like drawing)
      setIsHandActive(false); 
      setIsDrawing(false);
      setIsCreatingShape(false);
      setIsResizing(false);
      setTempPath([]);
      setEraserPath([]);

      const pointers = Array.from(activePointersRef.current.values());
      const p1 = pointers[0];
      const p2 = pointers[1];

      const distance = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      const midPoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

      initialPinchStateRef.current = { zoom: zoomLevel, scrollX: localScrollX, scrollY: localScrollY, distance, midPoint };
      return; // IMPORTANT: Stop processing to prevent tool actions
    }
    // --- *** END UNIVERSAL PINCH-TO-ZOOM *** ---


    const scenePt = getCanvasCoordinates(ev.clientX, ev.clientY, canvas, localScrollX, localScrollY, zoomLevel);
    setStartPoint(scenePt);
    setMousePosition(scenePt);

    const currentTime = Date.now();

    // --- *** MODIFIED: Removed isPlacingImage logic *** ---
    // (This block is no longer needed)
    /*
    if (isPlacingImage && pendingImage) {
      ...
      return;
    }
    */
    // --- *** END MODIFICATION *** ---

    
    const clickedTextId = getHoveredTextElementId(drawingElements, scenePt.x, scenePt.y);

    // --- *** THIS IS THE FIX FOR SINGLE-TAP EDIT *** ---
    if (clickedTextId) {
      
      const clickedElement = drawingElements.find(e => e.id === clickedTextId);
      
      // If we are in selection mode and tap a text element...
      if (activeTool === "selection" && clickedElement && !clickedElement.locked) {
         // Check if it's the *same element* we just tapped (for double-tap)
         const isDoubleClick = lastClickTime && scenePt.x === lastClickPos.x && scenePt.y === lastClickPos.y &&
            (currentTime - lastClickTime) < DOUBLE_CLICK_THRESHOLD;

         // If it's a double-tap OR if it's NOT already being edited, start editing.
         // This makes single-tap start editing.
         if (isDoubleClick || editingElementId !== clickedTextId) {
            setEditingElementId(clickedTextId);
         }
         
         // We always select it
         setSelectedElementIds([clickedTextId]);
         setLastClickTime(currentTime);
         setLastClickPos(scenePt);
         return; // Stop further processing
      }

    } else {
      if (editingElementId) {
        setEditingElementId(null);
      }
    }
    // --- *** END OF FIX *** ---

    setLastClickTime(currentTime);
    setLastClickPos(scenePt);

    // --- MODIFIED: Gated pan start ---
    // Only start a single-finger pan if we are NOT pinching
    if ((activeTool === "hand" || isSpacebarActive) && !isPinchingRef.current) {
      setIsHandActive(true);
      setLastPanPoint({ x: ev.clientX, y: ev.clientY });
      return;
    }
    // ---

    if (activeTool === "selection") {
      const isAnySelectedLocked = selectedElementIds.some(id => 
        drawingElements.find(e => e.id === id)?.locked
      );

      const hoveredHandle = getHoveredHandle(scenePt.x, scenePt.y, transformHandles);
      if (hoveredHandle && selectedElementIds.length > 0 && !isAnySelectedLocked) {
        setActiveHandle(hoveredHandle);
        setIsResizing(true);
        const bounds = calculateBounds(selectedElementIds, drawingElements);
        setOriginalBounds(bounds);
        const elementsToResize = drawingElements.filter(el => selectedElementIds.includes(el.id));
        setOriginalElements(JSON.parse(JSON.stringify(elementsToResize))); 
        return;
      }
      
      const hitResult = hitTestElement(drawingElements, scenePt, strokeWidth);
      const hitElement = hitResult.element;

      if (hitElement && hitElement.locked) {
        setSelectedElementIds([hitElement.id]);
        return; 
      }

      // --- NEW: Exit crop mode if clicking away ---
      if (!hitElement && croppingElementId) {
        setCroppingElementId(null);
      }
      
      // If we hit a *different* element...
      if (hitElement && croppingElementId && hitElement.id !== croppingElementId) {
          setCroppingElementId(null);
      }
      // --- END ---

      const isElementAlreadySelected = hitElement && selectedElementIds.includes(hitElement.id);

      if (isElementAlreadySelected && !isAnySelectedLocked) {
        setIsDraggingSelection(true);
        setSelectionMode(null);
        setMarqueeRect(null);

        const newDragOffsets: { [id: string]: { x: number, y: number } } = {};
        selectedElementIds.forEach(id => {
          const el = drawingElements.find(e => e.id === id);
          if (!el) return;

          if (el.position) {
            newDragOffsets[id] = {
              x: el.position.x - scenePt.x,
              y: el.position.y - scenePt.y,
            };
          } else if (el.path && el.path.length > 0) {
            newDragOffsets[id] = {
              x: el.path[0].x - scenePt.x,
              y: el.path[0].y - scenePt.y,
            };
          }
        });
        setDragOffsets(newDragOffsets);
        setStartPoint(scenePt);
      } else {
        const selectionResult = handleSelectionDown(hitResult, scenePt);
        setSelectedElementIds(selectionResult.selectedElementIds);
        setIsDraggingSelection(selectionResult.isDraggingSelection);
        setDragOffsets(selectionResult.dragOffsets);
        setSelectionMode(selectionResult.selectionMode);
        setSelectionStart(selectionResult.selectionStart);
        setMarqueeRect(null);
        
        // --- NEW: Exit crop mode if selecting something new ---
        if (croppingElementId && selectionResult.selectedElementIds[0] !== croppingElementId) {
          setCroppingElementId(null);
        }
      }
      return;
    }

    if (activeTool === "pencil") {
      setIsDrawing(true);
      setIsStraightLineMode(ev.shiftKey || ev.ctrlKey);
      setTempPath([{ ...scenePt, pressure: ev.pressure }]);
      return;
    }

   if (activeTool === "eraser") {
      const eraserResult = handleEraserDown();
      setIsDrawing(eraserResult.isDrawing);
      setEraserPath([{ ...scenePt, pressure: ev.pressure }]);
      
      // --- FIX: Check for element to delete on pointer down ---
      // This works for 'object' mode AND fixes 'stroke' mode for dots.
      const hitResult = hitTestElement(drawingElements, scenePt, strokeWidth);
      if (hitResult.element && !hitResult.element.locked) {
        deleteElement(hitResult.element.id);
        
        // Prevent starting a drag-erase path if we just clicked to delete.
        setIsDrawing(false); 
        setEraserPath([]);
      }
      // We still return here to prevent other tools from firing.
      return;
    }

    if (activeTool === "emoji") {
      if (selectedEmoji) {
        const newEl: DrawingElement = {
          id: `emoji-${generateId()}`,
          type: "text",
          text: selectedEmoji,
          position: scenePt,
          fontSize: 48,
          strokeColor: "#000",
          strokeWidth: 0,
          timestamp: Date.now(),
          author: userName,
          selectable: true,
          evented: true,
          locked: false,
        };
        addElement(newEl);
        onEmojiPlaced?.();
      }
      return;
    }

    if (activeTool === "text") {
      const newNote: DrawingElement = {
        id: `text-${generateId()}`,
        type: "text",
        text: "",
        position: scenePt,
        fontSize: textMode === 'simple' ? 15 : 17,
        strokeColor: "#000",
        strokeWidth: 0,
        timestamp: Date.now(),
        author: userName,
        selectable: true,
        evented: true,
        textType: textMode || 'simple',
        gradientType: textMode === 'colorful' ? pickRandomGradient() : undefined,
        locked: false,
      };
      addElement(newNote);
      setSelectedElementIds([newNote.id]);
      setEditingElementId(newNote.id);
      return;
    }

    if (activeTool === "shapes") {
      const shapeDownResult = handleShapeDown(scenePt);
      setShapeStartPoint(shapeDownResult.startPoint);
      setIsCreatingShape(shapeDownResult.isCreatingShape);
      setTempPath(shapeDownResult.tempPath);
      return;
    }

    if (activeTool === "sticky") {
      const el: DrawingElement = {
        id: `sticky-${generateId()}`,
        type: "shape",
        position: { x: scenePt.x - 80, y: scenePt.y - 50 },
        size: { width: 160, height: 100 },
        shapeType: 'rectangle',
        strokeWidth: 2,
        strokeColor: "#333",
        fillColor: "#fff7b2",
        backgroundColor: "#fff7b2",
        timestamp: Date.now(),
        author: userName,
        selectable: true,
        evented: true,
        locked: false,
      };
      addElement(el);
      return;
    }

    if (activeTool === "graph") {
      const newGraphElement = handleGraphDown(scenePt, userName);
      addElement(newGraphElement);
      return;
    }
  };

  const handlePointerMove = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // --- NEW: Update pointer in map ---
    if (activePointersRef.current.has(ev.pointerId)) {
      activePointersRef.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    }
    // ---

    const scenePt = getCanvasCoordinates(ev.clientX, ev.clientY, canvas, localScrollX, localScrollY, zoomLevel);
    setMousePosition(scenePt);

    // --- MODIFIED: Removed isPlacingImage logic ---
    /*
    if (isPlacingImage) {
      setImagePreviewPosition(scenePt);
    }
    */
    // ---

    if (ev.shiftKey !== lastShiftKey) setLastShiftKey(ev.shiftKey);

    const isAnySelectedLocked = selectedElementIds.some(id => 
      drawingElements.find(e => e.id === id)?.locked
    );

    // --- NEW: Pinch-to-Zoom Logic ---
    // This runs *before* any tool logic and will override it.
    if (isPinchingRef.current && activePointersRef.current.size === 2) {
      const pointers = Array.from(activePointersRef.current.values());
      const p1 = pointers[0];
      const p2 = pointers[1];

      const newDistance = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      const newMidPoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

      const initialPinch = initialPinchStateRef.current;
      if (!initialPinch) return;

      // 1. Calculate new Zoom
      const zoomDelta = newDistance / initialPinch.distance;
      const newZoom = clamp(initialPinch.zoom * zoomDelta, 0.1, 10);

      // 2. Calculate Pan
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const centerX = canvas.width / 2 / dpr;
      const centerY = canvas.height / 2 / dpr;

      // Screen coords of initial midpoint, relative to canvas top-left
      const rawInitialMidX = initialPinch.midPoint.x - rect.left;
      const rawInitialMidY = initialPinch.midPoint.y - rect.top;

      // Scene point under the initial midpoint at the initial zoom
      const sceneX = (rawInitialMidX - centerX) / initialPinch.zoom + (centerX - initialPinch.scrollX);
      const sceneY = (rawInitialMidY - centerY) / initialPinch.zoom + (centerY - initialPinch.scrollY);

      // Screen coords of new midpoint, relative to canvas top-left
      const rawNewMidX = newMidPoint.x - rect.left;
      const rawNewMidY = newMidPoint.y - rect.top;

      // Solve for newScrollX/Y to keep sceneX/Y under rawNewMidX/Y
      const newScrollX = centerX - (sceneX - (rawNewMidX - centerX) / newZoom);
      const newScrollY = centerY - (sceneY - (rawNewMidY - centerY) / newZoom);

      setLocalScrollX(newScrollX);
      setLocalScrollY(newScrollY);
      // Update the zoom prop for the next calculation
      updateViewport({ scrollX: newScrollX, scrollY: newScrollY, zoomLevel: newZoom });
      
      redrawCanvas();
      return;
    }
    // --- END PINCH LOGIC ---

    if (activeTool === "selection" && !isResizing && !isDraggingSelection && !isAnySelectedLocked) {
      const hoveredHandle = getHoveredHandle(scenePt.x, scenePt.y, transformHandles);
      if (hoveredHandle && canvas) {
        canvas.style.cursor = hoveredHandle.cursor;
      } else if (canvas) {
        canvas.style.cursor = "default";
      }
    }

    // --- MODIFIED: Don't pan if pinching ---
    if (activeTool === "hand" && isHandActive && !isPinchingRef.current) {
      const moveResult = handleHandMove(isHandActive, ev.nativeEvent, lastPanPoint, localScrollX, localScrollY, CANVAS_MAX_PAN);
      if (moveResult) {
        setLocalScrollX(moveResult.newScrollX);
        setLocalScrollY(moveResult.newScrollY);
        setLastPanPoint(moveResult.newLastPanPoint);
        redrawCanvas();
        return;
      }
    }

    if (isSpacebarActive && isHandActive && !isPinchingRef.current) {
      const moveResult = handleHandMove(true, ev.nativeEvent, lastPanPoint, localScrollX, localScrollY, CANVAS_MAX_PAN);
      if (moveResult) {
        setLocalScrollX(moveResult.newScrollX);
        setLocalScrollY(moveResult.newScrollY);
        setLastPanPoint(moveResult.newLastPanPoint);
        redrawCanvas();
        return;
      }
    }
    // ---

    // --- MODIFIED: Handle Crop Resize ---
    if (activeTool === "selection" && isResizing && activeHandle && originalBounds) {
      const isCropping = croppingElementId && originalElements.length === 1 && originalElements[0].id === croppingElementId;

      if (isCropping) {
        handleCropResize(
          activeHandle,
          scenePt,
          originalBounds,
          originalElements[0],
          startPoint,
          updateElement,
          ev.shiftKey
        );
      } else {
        handleSelectionResize(
          activeHandle, 
          scenePt, 
          originalBounds, 
          originalElements, 
          updateElement
        );
      }
      redrawCanvas();
      return;
    }

    if (activeTool === "selection" && isDraggingSelection && !isAnySelectedLocked) {
      handleSelectionDragMove(
        isDraggingSelection,
        selectedElementIds,
        scenePt,
        dragOffsets,
        drawingElements,
        updateElement
      );
      redrawCanvas();
      return;
    }

    if (activeTool === "selection" && selectionMode === 'marquee' && selectionStart) {
      const marqueeResult = handleSelectionMarqueeMove(selectionMode, scenePt, selectionStart);
      if (marqueeResult) {
        setMarqueeRect(marqueeResult.marqueeRect);
        redrawCanvas();
        return;
      }
    }

    if (activeTool === "pencil" && isDrawing) {
      const moveResult = handlePenMove(tempPath, scenePt, ev.nativeEvent);
      setTempPath(moveResult);
      redrawCanvas();
      return;
    }

    if (activeTool === "eraser" && isDrawing && eraserSettings.mode === 'stroke') {
      setEraserPath(prev => [...prev, { ...scenePt, pressure: ev.pressure }]);
      
      handleEraserMove(isDrawing, drawingElements, scenePt, deleteElement, eraserSettings.size);
      redrawCanvas();
      return;
    }

    if (activeTool === "shapes" && isCreatingShape && shapeStartPoint) {
      const shapeMoveResult = handleShapeMove(
        isCreatingShape,
        shapeStartPoint,
        scenePt,
        ev.shiftKey,
        shapeSettings
      );
      setTempPath(shapeMoveResult.tempPath);
      redrawCanvas();
      return;
    }
  };

  const handlePointerUp = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    // --- NEW: Remove pointer from map ---
    activePointersRef.current.delete(ev.pointerId);
    // ---

    const canvas = canvasRef.current;
    if (!canvas) return;
    const scenePt = getCanvasCoordinates(ev.clientX, ev.clientY, canvas, localScrollX, localScrollY, zoomLevel);

    // --- NEW: Check for pinch end ---
    if (isPinchingRef.current && activePointersRef.current.size < 2) {
      isPinchingRef.current = false;
      initialPinchStateRef.current = null;
      
      // Check if we should transition to single-finger pan
      if ((activeTool === 'hand' || isSpacebarActive) && activePointersRef.current.size === 1) {
        setIsHandActive(true);
        const remainingPointer = Array.from(activePointersRef.current.values())[0];
        setLastPanPoint({ x: remainingPointer.x, y: remainingPointer.y });
      }
    }
    // ---

    if (activeTool === "hand" && isHandActive) {
      const handUpResult = handleHandUp();
      setIsHandActive(handUpResult.isHandActive);
      return;
    }
    
    if (isSpacebarActive && isHandActive) {
      const spaceHandUpResult = handleHandUp();
      setIsHandActive(spaceHandUpResult.isHandActive);
      return;
    }

    if (activeTool === "selection") {
      if (isResizing) {
        // --- NEW: Apply final crop data ---
        if (croppingElementId) {
          const croppedElement = drawingElements.find(e => e.id === croppingElementId);
          if (croppedElement) {
            // At this point, the crop is "live". If we want to "finalize" it
            // (e.g., create a new imageData), we'd do it here.
            // For now, we just stop resizing.
            console.log("Crop applied:", croppedElement.crop);
          }
        }
        // --- END ---

        setIsResizing(false);
        setActiveHandle(null);
        setOriginalBounds(null);
        setOriginalElements([]);
        const handles = calculateTransformHandles(selectedElementIds, drawingElements);
        setTransformHandles(handles);
        return;
      }
      
      const selectionUpResult = handleSelectionUp(selectionMode || '', marqueeRect || { x: 0, y: 0, width: 0, height: 0 }, drawingElements);
      if ('selectedElementIds' in selectionUpResult) {
        setSelectedElementIds(selectionUpResult.selectedElementIds);
        setSelectionMode(selectionUpResult.selectionMode);
        setMarqueeRect(selectionUpResult.marqueeRect);
        redrawCanvas();
        return;
      } else {
        setIsDraggingSelection(selectionUpResult.isDraggingSelection);
        selectedElementIds.forEach(id => {
          const element = drawingElements.find(e => e.id === id);
          if (element) updateElement(id, element);
        });
        return;
      }
    }

    if (activeTool === "pencil" && isDrawing) {
      const penUpResult = handlePenUp(tempPath, userName, strokeColor, penSettings, isStraightLineMode, addElement);
      setTempPath(penUpResult.tempPath);
      setIsDrawing(penUpResult.isDrawing);
      setIsStraightLineMode(penUpResult.isStraightLineMode);
      return;
    }

    if (activeTool === "shapes" && isCreatingShape && tempPath.length > 0) {
      const shapeUpResult = handleShapeUp(
        tempPath,
        shapeSettings,
        strokeColor,
        shapeColor,
        userName,
        addElement
      );
      setIsCreatingShape(shapeUpResult.isCreatingShape);
      setTempPath(shapeUpResult.tempPath);
      setShapeStartPoint(null);
      return;
    }

    if (activeTool === "eraser" && isDrawing) {
      const eraseUpResult = handleEraserUp();
      setIsDrawing(eraseUpResult.isDrawing);
      setEraserPath([]);
      return;
    }

    setIsDrawing(false);
    setTempPath([]);
    setEraserPath([]);
  };

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.code === 'Space' && !ev.repeat) {
        if (activeTool !== "hand") {
          setPreviousTool(activeTool);
          setIsSpacebarActive(true);
          setIsHandActive(true);
        }
      }

      if (activeTool === 'eraser') {
        if (ev.key === '[') {
          ev.preventDefault();
          setEraserSettings(prev => ({ ...prev, size: Math.max(5, prev.size - 2) }));
        } else if (ev.key === ']') {
          ev.preventDefault();
          setEraserSettings(prev => ({ ...prev, size: Math.min(100, prev.size + 2) }));
        }
      }

      if (editingElementId) {
        ev.stopPropagation();
        
        // --- MODIFIED: Text input is now handled by the textarea's onInput event ---
        // We only listen for 'Escape' to stop editing.
        if (ev.key === 'Escape') {
          const editStopResult = handleTextEditStop();
          setEditingElementId(editStopResult.editingElementId);
          ev.preventDefault();
        }
        // --- END MODIFICATION ---
        
        return; // Prevent keydown from bubbling
      }

      // --- NEW: Exit crop mode on Escape ---
      if (ev.key === 'Escape' && croppingElementId) {
        setCroppingElementId(null);
      }

      const isAnySelectedLocked = selectedElementIds.some(id => 
        drawingElements.find(e => e.id === id)?.locked
      );

      // Can't delete/nudge if locked OR if cropping
      if (isAnySelectedLocked || croppingElementId) {
        return;
      }

      if (!editingElementId && (ev.key === "Delete" || ev.key === "Backspace") && selectedElementIds.length > 0) {
        ev.preventDefault();
        selectedElementIds.forEach(id => deleteElement(id));
        setSelectedElementIds([]);
      }

      if (!editingElementId && selectedElementIds.length > 0 && ev.key.startsWith('Arrow')) {
        ev.preventDefault();
        const nudgeDistance = ev.shiftKey ? NUDGE_DISTANCE_ALT : NUDGE_DISTANCE_BASE;
        let dx = 0, dy = 0;
        switch (ev.key) {
          case 'ArrowUp': dy = -nudgeDistance; break;
          case 'ArrowDown': dy = nudgeDistance; break;
          case 'ArrowLeft': dx = -nudgeDistance; break;
          case 'ArrowRight': dx = nudgeDistance; break;
        }
        selectedElementIds.forEach(id => {
          const element = drawingElements.find(e => e.id === id);
          if (!element) return;
          const updatedElement = { ...element };
          if (updatedElement.path) {
            updatedElement.path = updatedElement.path.map(p => ({ ...p, x: p.x + dx, y: p.y + dy }));
          }
          if (updatedElement.position) {
            updatedElement.position = { x: (updatedElement.position.x || 0) + dx, y: (updatedElement.position.y || 0) + dy };
          }
          updateElement(id, updatedElement);
        });
      }

      if (!editingElementId && selectedElementIds.length > 0) {
        const selectedElement = drawingElements.find(e => e.id === selectedElementIds[0]);
        
        if ((ev.ctrlKey || ev.metaKey) && ev.key === 'd') {
          ev.preventDefault();
          if (selectedElement?.type === 'image') {
            handleDuplicateElement();
          }
        }
        
        if (ev.key === 'r' && selectedElementIds.length === 1) {
          ev.preventDefault();
          if (selectedElement?.type === 'image') {
            handleRotateImage();
          }
        }
        
        if ((ev.ctrlKey || ev.metaKey) && ev.key === 's') {
          ev.preventDefault();
          if (selectedElement?.type === 'image') {
            handleDownloadImage();
          }
        }
        
        if ((ev.ctrlKey || ev.metaKey) && ev.key === ']') {
          ev.preventDefault();
          handleBringToFront();
        }
        
        if ((ev.ctrlKey || ev.metaKey) && ev.key === '[') {
          ev.preventDefault();
          handleSendToBack();
        }
      }
    };

    const onKeyUp = (ev: KeyboardEvent) => {
      if (ev.code === 'Space') {
        if (isSpacebarActive) {
          setIsSpacebarActive(false);
          setIsHandActive(false);
          setPreviousTool("");
        }
      }
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [
    editingElementId, 
    drawingElements, 
    selectedElementIds, 
    activeTool, 
    deleteElement, 
    updateElement, 
    isSpacebarActive, 
    eraserSettings, 
    handleDuplicateElement, 
    handleRotateImage, 
    handleDownloadImage, 
    handleBringToFront, 
    handleSendToBack,
    croppingElementId // --- NEW DEPENDENCY ---
  ]);

  useEffect(() => {
    const onResize = () => redrawCanvas();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [redrawCanvas]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      
      {/* --- MODIFICATION: Changed to textarea for mobile support --- */}
      <textarea
        ref={textInputRef}
        style={{
          position: 'absolute',
          top: '-9999px',
          left: '-9999px',
          opacity: 0,
          pointerEvents: 'none', // Prevent it from capturing any clicks
          width: '100px', // Give it a nominal size
          height: '50px',
        }}
        onBlur={() => {
          // When the input loses focus (e.g., user hides keyboard),
          // stop editing.
          setEditingElementId(null);
        }}
        // --- THIS IS THE FIX ---
        // Read from onInput instead of keydown for mobile/IME support
        onInput={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
          if (editingElementId) {
            const newText = e.target.value;
            updateElement(editingElementId, { text: newText });
          }
        }}
        // --- END ---
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck="false"
      />
      {/* --- END MODIFICATION --- */}

      <canvas
        ref={canvasRef}
        id="canvas-background"
        style={{
          width: "100%",
          height: "100%",
          touchAction: "none",
          outline: isDraggingOver ? '3px dashed #007acc' : 'none',
          outlineOffset: '-3px',
          backgroundColor: isDraggingOver ? 'rgba(0, 122, 204, 0.05)' : 'transparent',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp} // Use onPointerCancel for robustness
        onPointerLeave={handlePointerUp} // Treat pointer leaving as an 'up' event
        onContextMenu={handleContextMenu}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      />

      {isDraggingOver && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 1000,
            backgroundColor: 'rgba(0, 122, 204, 0.95)',
            color: 'white',
            padding: '24px 32px',
            borderRadius: '12px',
            fontSize: '18px',
            fontWeight: '600',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '32px' }}>📸</span>
          <span>Drop image here</span>
        </div>
      )}

      {contextMenu.visible && (
        <ContextMenu
          isVisible={contextMenu.visible}
          position={contextMenu.position}
          onDelete={handleDeleteFromContextMenu}
          onDuplicate={handleDuplicateElement}
          onDownload={handleDownloadImage}
          onRotate={handleRotateImage}
          onBringToFront={handleBringToFront}
          onClose={closeContextMenu}
          isElementLocked={contextMenu.isLocked}
          onLock={handleLockElement}
          onUnlock={handleUnlockElement}
          onCrop={
            drawingElements.find(e => e.id === contextMenu.elementId)?.type === 'image' 
            ? handleCropElement 
            : undefined
          }
        />
      )}

      {/* --- PEN PANEL ---
        (This component now has its own internal collapse logic)
      --- */}
      {showPenPanel && (
        <div className="fixed top-0 right-60 md:top-16 md:left-2 md:right-auto z-50">
          <PenSettingsPanel
            penSettings={penSettings}
            setPenSettings={setPenSettings}
          />
        </div>
      )}

      {/* --- ERASER PANEL (with collapse) --- */}
      {showEraserPanel && (
        <div className="fixed top-16 right-4 lg:absolute lg:top-20 lg:left-2 lg:right-auto z-50">
          <div className="bg-white rounded-xl shadow-2xl p-4 w-56 max-w-[calc(100vw-2rem)] border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-800">🗑️ Eraser Tool</h3>
              {/* --- NEW COLLAPSE BUTTON --- */}
              <button
                onClick={() => setIsEraserPanelCollapsed(!isEraserPanelCollapsed)}
                className="p-1 rounded-md hover:bg-gray-100 text-gray-500"
                title={isEraserPanelCollapsed ? "Show" : "Hide"}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                {isEraserPanelCollapsed ? '▼' : '▲'}
              </button>
              {/* --- END NEW BUTTON --- */}
            </div>
            
            {/* --- CONDITIONALLY RENDER CONTENT --- */}
            {!isEraserPanelCollapsed && (
              <EraserSettingsPanel
                eraserSettings={eraserSettings}
                setEraserSettings={setEraserSettings}
              />
            )}
            {/* --- END CONDITIONAL RENDER --- */}
          </div>
        </div>
      )}

      {/* --- FLOWCHART PANEL ---
        (This component now has its own internal collapse logic)
      --- */}
      {showFlowchartPanel && (
        <div className="fixed top-16 right-4 md:top-20 md:left-4
         md:right-auto z-50 animate-in slide-in-from-right md:slide-in-from-left">
          <FlowchartDropdown
            addElementsViaAction={addElementsViaAction}
            onClose={() => {
              onToolChange?.("selection");
            }}
          />
        </div>
      )}

      {showShapePanel && (
       <div className="fixed top-16 right-4 md:top-20 md:left-4
        md:right-auto z-50 animate-in slide-in-from-right md:slide-in-from-left">
          <AutonomousShapeTool
            shapeSettings={shapeSettings}
            onShapeSettingsChange={setShapeSettings}
            startPoint={shapeStartPoint || undefined}
            mousePosition={mousePosition}
            isVisible={showShapePanel}
            onClose={() => {
              setShowShapePanel(false);
              onToolChange?.("selection");
            }}
          />
        </div>
      )}

      <style>
        {`
          @keyframes slideIn {
            from { transform: translate(-20px, 0); opacity: 0; }
            to { transform: translate(0, 0); opacity: 1; }
          }
        `}
      </style>
    </div>
  );
};

export default DrawingCanvas;