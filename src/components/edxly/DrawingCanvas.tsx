import React from 'react';
import { useRef, useState, useEffect, useCallback } from "react";
import { FileText, StickyNote, Plus, Minus, Undo2, Redo2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Add perfect-freehand import for smooth stroke rendering
import { getStroke } from "perfect-freehand";

// Import types, constants, utils, components, and hooks
import {
  Point,
  DrawingElement,
  DrawingCanvasProps,
  PenSettings,
  EraserSettings,
  ShapeSettings,
  ImageElement,
  SelectionHandle,
} from './types/DrawingCanvas.types';
import {
  CANVAS_MAX_PAN,
  CANVAS_MIN_SCALE,
  CANVAS_MAX_SCALE,
  DOUBLE_CLICK_THRESHOLD,
  NUDGE_DISTANCE_BASE,
  NUDGE_DISTANCE_ALT,
  CURSOR_STYLES,
  MIN_STROKE_WIDTH,
} from './constants/DrawingCanvas.constants';
import {
  getCanvasCoordinates,
  smoothPath,
  isPointOnPath,
  snapToGrid,
  getDistance,
  createShapePath,
  getPressureAdjustedWidth,
  getElementAtPoint,
  generateId,
} from './utils/DrawingCanvas.utils';

// Import components
import { AutonomousPenTool, AutonomousPenToolRef } from './components/toolpanels/AutonomousPenTool';
import { AutonomousEraserTool, AutonomousEraserToolRef } from './components/toolpanels/AutonomousEraserTool';
import { AutonomousShapeTool, AutonomousShapeToolRef } from './components/toolpanels/AutonomousShapeTool';
import { AutonomousSelectionTool, AutonomousSelectionToolRef } from './components/toolpanels/AutonomousSelectionTool';
import { BackgroundPanel } from './components/toolpanels/BackgroundPanel';
import { FlowchartPanel, FlowchartPanelRef } from './components/toolpanels/FlowchartPanel';


// Import hooks
import { useDrawingHandlers } from './hooks/useDrawingHandlers';
import { useCanvasOperations } from './hooks/useCanvasOperations';



export const DrawingCanvas = ({
  activeTool = "hand",
  strokeColor = "#000000",
  strokeWidth = 2,
  onColorChange,
  panSettings = { panSpeedMultiplier: 1, enableInertia: true },
  isSinglePageMode = false,
  penSettings: propPenSettings = {
    strokeWidth: 4,
    smoothing: 0.5,
    pressureEnabled: true,
    mode: 'raster',
    cap: 'round',
    join: 'round',
    dashPattern: [],
    stabilizerLevel: 0.5,
    strokeStyle: 'solid',
    roughness: 1
  },
  onPenSettingsChange,
  onUndo,
  onRedo,
  onUndoAction,
  onRedoAction,
  zoomLevel = 1.0,
  onZoomChange,
  forwardedRef,
  textMode: initialTextMode,
  onImageUpload,
  onEmojiPlace,
  onGraphPlace,
  isDarkMode = false,
  selectedEmoji,
  onEmojiPlaced,
  onShapeSelect,
  shapeColor,
}: DrawingCanvasProps) => {
  console.log('DrawingCanvas activeTool:', activeTool);

  // Add debug logging for activeTool changes
  useEffect(() => {
    console.log('DrawingCanvas activeTool changed to:', activeTool);
  }, [activeTool]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const penToolRef = useRef<AutonomousPenToolRef>(null);
  const eraserToolRef = useRef<AutonomousEraserToolRef>(null);
  const shapeToolRef = useRef<AutonomousShapeToolRef>(null);
  const selectionToolRef = useRef<AutonomousSelectionToolRef>(null);


  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateCanvasSize = () => {
      console.log('🔧 Updating canvas size:', window.innerWidth, window.innerHeight);
      setCanvasSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  const [drawingElements, setDrawingElements] = useState<DrawingElement[]>([]);
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [tempPath, setTempPath] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penSettings, setPenSettings] = useState<PenSettings>(propPenSettings);
  const [eraserSettings, setEraserSettings] = useState<EraserSettings>({
    mode: 'stroke',
    size: 20,
    pressureEnabled: true,
    previewEnabled: true
  });
  const [undoHistory, setUndoHistory] = useState<DrawingElement[][]>([]);
  const [redoHistory, setRedoHistory] = useState<DrawingElement[][]>([]);
  const [isStraightLineMode, setIsStraightLineMode] = useState(false);
  const [eraserPath, setEraserPath] = useState<Point[]>([]);
  const [mousePosition, setMousePosition] = useState<Point>({ x: 0, y: 0 });
  const [scrollX, setScrollX] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  // Hand tool state
  const [isHandActive, setIsHandActive] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState<Point>({ x: 0, y: 0 });
  const [previousTool, setPreviousTool] = useState<string>("");
  const [isSpacebarActive, setIsSpacebarActive] = useState(false);

  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [textMode, setTextMode] = useState<'simple' | 'colorful' | null>(initialTextMode || null);

  useEffect(() => {
    if (initialTextMode) {
      setTextMode(initialTextMode);
    }
  }, [initialTextMode]);
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [lastClickPos, setLastClickPos] = useState<Point>({ x: 0, y: 0 });
  const [images, setImages] = useState<Array<{
    id: string;
    data: string;
    position: Point;
    size: { width: number; height: number };
    selected: boolean;
    img?: HTMLImageElement;
  }>>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState<Set<string>>(new Set());
  const animationFrameRef = useRef<number>();


  // Graph & Flowchart settings state


  // Create emoji at position function
  const createEmojiAtPosition = (emoji: string, position: Point) => {
    const emojiElement: DrawingElement = {
      id: `emoji-${Date.now()}`,
      type: 'text',
      text: emoji,
      fontSize: 48,
      position: { x: position.x, y: position.y },
      selectable: true,
      evented: true,
      lockMovementX: false,
      lockMovementY: false
    };

    saveInitialState();
    setDrawingElements(prev => [...prev, emojiElement]);
  };

  // Create graph object function
  const createGraphObject = (position: Point) => {
    const graphWidth = 400;
    const graphHeight = 300;

    const graphElement: DrawingElement = {
      id: `graph-${Date.now()}`,
      type: 'shape',
      path: [
        { x: position.x - graphWidth/2, y: position.y - graphHeight/2 },
        { x: position.x + graphWidth/2, y: position.y - graphHeight/2 },
        { x: position.x + graphWidth/2, y: position.y + graphHeight/2 },
        { x: position.x - graphWidth/2, y: position.y + graphHeight/2 }
      ],
      fillColor: '#FFFFFF',
      strokeColor: '#333',
      strokeWidth: 2,
      position: { x: position.x, y: position.y },
      size: { width: graphWidth, height: graphHeight },
      selectable: true,
      evented: true,
      lockMovementX: false,
      lockMovementY: false
    };

    saveInitialState();
    setDrawingElements(prev => [...prev, graphElement]);
  };

  // Place flowchart shape on canvas
  const placeFlowchartShape = (position: Point) => {
    let shapePath: Point[];
    let width = 120;
    let height = 60;

  



  
  };

  // The New tool9 code


  // tool9 till here
  // Shape settings state
  const [shapeSettings, setShapeSettings] = useState<ShapeSettings>({
    selectedShape: 'rectangle',
    strokeWidth: 2,
    cornerRadius: 8,
    sides: 6,
    points: 5,
  });
  const [startPoint, setStartPoint] = useState<Point>({ x: 0, y: 0 });
  const [isCreatingShape, setIsCreatingShape] = useState(false);
  const [isCreatingFlowchart, setIsCreatingFlowchart] = useState(false);
  const [lastShiftKey, setLastShiftKey] = useState(false);
  const [canvasBackground, setCanvasBackground] = useState('#ffffff'); // Default to white background

  // Professional Zoom Tool State
  const [zoomToolActive, setZoomToolActive] = useState(false);
  const [zoomRectStart, setZoomRectStart] = useState<Point>({ x: 0, y: 0 });
  const [isDrawingZoomRect, setIsDrawingZoomRect] = useState(false);


  const CANVAS_MAX_PAN = 2000;
  const CANVAS_MIN_SCALE = 0.1;
  const CANVAS_MAX_SCALE = 5.0;

  // Handle resize operation during transform
  const handleResize = (mouseX: number, mouseY: number) => {
    if (isTransforming && draggedHandle && originalBounds && lastMousePos) {
      const { minX: origMinX, minY: origMinY, maxX: origMaxX, maxY: origMaxY } = originalBounds;
      const origWidth = origMaxX - origMinX;
      const origHeight = origMaxY - origMinY;
      const centerX = origMinX + origWidth / 2;
      const centerY = origMinY + origHeight / 2;

      // Calculate scale factors relative to original bounds
      let scaleX = 1, scaleY = 1;

      switch (draggedHandle.id) {
        case 'nw':
          if (origWidth > 0 && origHeight > 0) {
            scaleX = Math.max(0.1, (origMaxX - mouseX) / origWidth);
            scaleY = Math.max(0.1, (origMaxY - mouseY) / origHeight);
          }
          break;
        case 'ne':
          if (origWidth > 0 && origHeight > 0) {
            scaleX = Math.max(0.1, (mouseX - origMinX) / origWidth);
            scaleY = Math.max(0.1, (origMaxY - mouseY) / origHeight);
          }
          break;
        case 'sw':
          if (origWidth > 0 && origHeight > 0) {
            scaleX = Math.max(0.1, (origMaxX - mouseX) / origWidth);
            scaleY = Math.max(0.1, (mouseY - origMinY) / origHeight);
          }
          break;
        case 'se':
          if (origWidth > 0 && origHeight > 0) {
            scaleX = Math.max(0.1, (mouseX - origMinX) / origWidth);
            scaleY = Math.max(0.1, (mouseY - origMinY) / origHeight);
          }
          break;
        case 'n':
          if (origHeight > 0) {
            scaleY = Math.max(0.1, (origMaxY - mouseY) / origHeight);
          }
          break;
        case 'e':
          if (origWidth > 0) {
            scaleX = Math.max(0.1, (mouseX - origMinX) / origWidth);
          }
          break;
        case 's':
          if (origHeight > 0) {
            scaleY = Math.max(0.1, (mouseY - origMinY) / origHeight);
          }
          break;
        case 'w':
          if (origWidth > 0) {
            scaleX = Math.max(0.1, (origMaxX - mouseX) / origWidth);
          }
          break;
      }

      // Clamp scales to reasonable values
      scaleX = Math.min(20, scaleX);
      scaleY = Math.min(20, scaleY);

      // Apply scaling to selected elements
      setDrawingElements(prev => prev.map(element => {
        if (selectedElementIds.includes(element.id)) {
          if (element.path && element.path.length > 0) {
            // Scale path points around original center
            const newPath = element.path.map(point => ({
              ...point,
              x: centerX + (point.x - centerX) * scaleX,
              y: centerY + (point.y - centerY) * scaleY
            }));
            return { ...element, path: newPath };
          }

          if (element.position) {
            return {
              ...element,
              position: {
                x: centerX + (element.position.x - centerX) * scaleX,
                y: centerY + (element.position.y - centerY) * scaleY
              }
            };
          }
        }
        return element;
      }));

      // Apply scaling to images
      setImages(prev => prev.map(image => {
        if (image.id === selectedImageId) {
          return {
            ...image,
            position: {
              x: centerX + (image.position.x - centerX) * scaleX,
              y: centerY + (image.position.y - centerY) * scaleY
            },
            size: {
              width: image.size.width * scaleX,
              height: image.size.height * scaleY
            }
          };
        }
        return image;
      }));


      redrawCanvas();
    }
  };

  useEffect(() => {
    setPenSettings(propPenSettings);
  }, [propPenSettings]);

  // Cleanup animation frames on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Handle image file upload and processing
  const handleImageUpload = useCallback((file: File) => {
    console.log('Processing uploaded image file:', file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;

      // Preload image to get natural dimensions before adding to canvas
      const preloadImg = new Image();
      preloadImg.onload = () => {
        const imageId = `image-${Date.now()}`;
        const canvasImg = new Image(); // Create separate image for canvas rendering
        canvasImg.onload = () => {
          setImagesLoaded(prev => new Set(prev).add(imageId));
        };
        canvasImg.src = dataUrl;

        const newImage = {
          id: imageId,
          data: dataUrl,
          img: canvasImg, // Store preloaded image for rendering
          position: {
            x: (-scrollX + window.innerWidth / 2) / zoomLevel,
            y: (-scrollY + window.innerHeight / 2) / zoomLevel
          },
          size: { width: 200, height: 200 }, // Will be adjusted based on natural dimensions
          selected: false
        };

        setImages(prev => [...prev, newImage]);
        console.log('Image added to canvas:', imageId);
      };

      preloadImg.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, [scrollX, scrollY, zoomLevel]);

  // Call onImageUpload callback when it's available
  useEffect(() => {
    if (onImageUpload) {
      onImageUpload = handleImageUpload;
    }
  }, [onImageUpload, handleImageUpload]);

  // Handle keyboard input for text notes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editingElementId) return;

      // Stop propagation to prevent other shortcuts from firing
      e.stopPropagation();

      setDrawingElements(prev =>
        prev.map(el => {
          if (el.id === editingElementId && el.type === 'text') {
            let newText = el.text || '';
            if (e.key === 'Backspace') {
              newText = newText.slice(0, -1);
            } else if (e.key === 'Enter') {
              newText += '\n';
            } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) { // Handle printable characters
              newText += e.key;
            }
            return { ...el, text: newText };
          }
          return el;
        })
      );
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [editingElementId]);

  // Create a text note at the specified position
  const createTextNote = (position: Point) => {
    if (!textMode) {
      console.error('No text mode selected:', textMode);
      return;
    }

    console.log('Creating text note at position:', position);

    const noteId = `text-${Date.now()}`;
    const gradientTypes: Array<'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'teal'> =
      ['blue', 'purple', 'green', 'orange', 'pink', 'teal'];

    const newNote: DrawingElement = {
      id: noteId,
      position,
      text: '', // Start with empty text
      type: 'text',
      textType: textMode,
      gradientType: textMode === 'colorful'
        ? gradientTypes[Math.floor(Math.random() * gradientTypes.length)]
        : undefined
    };

    saveInitialState();
    setDrawingElements(prev => [...prev, newNote]);
    setEditingElementId(noteId);
  };

  // Save initial state when starting a drawing operation
  const saveInitialState = useCallback(() => {
    setUndoHistory(prev => [...prev.slice(-49), drawingElements]);
    setRedoHistory([]);
  }, [drawingElements]);

  // Save state after completing a drawing operation
  const saveDrawingState = useCallback(() => {
    setUndoHistory(prev => [...prev.slice(-49), drawingElements]);
    setRedoHistory([]);
  }, [drawingElements]);

  // Update undo/redo status for parent components
  useEffect(() => {
    onUndo?.(undoHistory.length > 0);
    onRedo?.(redoHistory.length > 0);
  }, [undoHistory.length, redoHistory.length, onUndo, onRedo]);

  const undo = useCallback(() => {
    if (undoHistory.length > 0) {
      const previousState = undoHistory[undoHistory.length - 1];
      setRedoHistory(prev => [...prev, drawingElements]);
      setDrawingElements(previousState);
      setUndoHistory(prev => prev.slice(0, -1));
    }
  }, [undoHistory, drawingElements]);

  const redo = useCallback(() => {
    if (redoHistory.length > 0) {
      const nextState = redoHistory[redoHistory.length - 1];
      setUndoHistory(prev => [...prev, drawingElements]);
      setDrawingElements(nextState);
      setRedoHistory(prev => prev.slice(0, -1));
    }
  }, [redoHistory, drawingElements]);

  const getCanvasCoordinates = (e: PointerEvent | MouseEvent | Touch): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    // Use real-time bounding rect for accurate screen-to-canvas conversion
    const rect = canvas.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    // FIX: Coordinate conversion for center-based zoom transform
    // Inverse of: translate(center) → scale → translate(-center + scroll)
    // Transform: rawCoords → finalCoords where sceneX = ((rawX - centerX) / zoomLevel + centerX - scrollX)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const sceneX = (rawX - centerX) / zoomLevel + centerX - scrollX;
    const sceneY = (rawY - centerY) / zoomLevel + centerY - scrollY;

    return {
      x: sceneX,
      y: sceneY
    };
  };

  // States for selection functionality
  const [selectionMode, setSelectionMode] = useState<'single' | 'marquee' | null>(null);
  const [selectionStart, setSelectionStart] = useState<Point>({ x: 0, y: 0 });
  const [selectionEnd, setSelectionEnd] = useState<Point>({ x: 0, y: 0 });
  const [marqueeRect, setMarqueeRect] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
  const [transformHandles, setTransformHandles] = useState<SelectionHandle[]>([]);
  const [isTransforming, setIsTransforming] = useState(false);
  const [dragStartElementId, setDragStartElementId] = useState<string | null>(null);
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [dragOffsets, setDragOffsets] = useState<{ [elementId: string]: { x: number; y: number } }>({});
  const [draggedHandle, setDraggedHandle] = useState<SelectionHandle | null>(null);
  const [lastMousePos, setLastMousePos] = useState<Point>({ x: 0, y: 0 });
  const [originalBounds, setOriginalBounds] = useState<{ minX: number, minY: number, maxX: number, maxY: number } | null>(null);
  const [snapEnabled, setSnapEnabled] = useState(true);

  // Helper function to calculate bounds of selected elements
  const calculateBounds = (elementIds: string[]): { minX: number, minY: number, maxX: number, maxY: number } => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    elementIds.forEach(id => {
      const element = drawingElements.find(el => el.id === id);
      if (!element) return;

      if (element.path && element.path.length > 0) {
        element.path.forEach(point => {
          minX = Math.min(minX, point.x);
          minY = Math.min(minY, point.y);
          maxX = Math.max(maxX, point.x);
          maxY = Math.max(maxY, point.y);
        });
      } else if (element.position) {
        // For elements with position (shapes, emojis, graphs), consider them as points
        minX = Math.min(minX, element.position.x);
        minY = Math.min(minY, element.position.y);
        maxX = Math.max(maxX, element.position.x);
        maxY = Math.max(maxY, element.position.y);
      }
    });

    // Handle images and text notes
    images.forEach(image => {
      if (image.id === selectedImageId) {
        const left = image.position.x - image.size.width / 2;
        const top = image.position.y - image.size.height / 2;
        const right = image.position.x + image.size.width / 2;
        const bottom = image.position.y + image.size.height / 2;
        minX = Math.min(minX, left);
        minY = Math.min(minY, top);
        maxX = Math.max(maxX, right);
        maxY = Math.max(maxY, bottom);
      }
    });


    return { minX: minX === Infinity ? 0 : minX, minY: minY === Infinity ? 0 : minY, maxX, maxY };
  };
  const [gridSize, setGridSize] = useState(20);
  const [isGridVisible, setIsGridVisible] = useState(false);
  const [selectionSettings, setSelectionSettings] = useState({
    selectionMode: 'marquee' as 'single' | 'marquee',
    snapEnabled: true,
    gridSize: 20
  });


  // Selection snap and alignment
  const snapToGrid = (pos: Point): Point => {
    if (!snapEnabled) return pos;
return {
      x: Math.round(pos.x / gridSize) * gridSize,
      y: Math.round(pos.y / gridSize) * gridSize
    };
  };

  // Calculate transform handles for selected elements
  const calculateTransformHandles = () => {
    const handles: SelectionHandle[] = [];
    if (selectedElementIds.length === 0) return handles;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    // Calculate bounding box
    selectedElementIds.forEach(id => {
      const element = drawingElements.find(el => el.id === id);
      if (!element) return;

      // Find element bounds
      if (element.path && element.path.length > 0) {
        element.path.forEach(point => {
          minX = Math.min(minX, point.x);
          minY = Math.min(minY, point.y);
          maxX = Math.max(maxX, point.x);
          maxY = Math.max(maxY, point.y);
        });
      }
    });

    if (minX === Infinity) return handles;

    // Create 8 corner/edge handles
    const width = maxX - minX;
    const height = maxY - minY;
    const centerX = minX + width / 2;
    const centerY = minY + height / 2;

    handles.push(
      { id: 'nw', type: 'corner', position: { x: minX, y: minY }, cursor: 'nw-resize' },
      { id: 'ne', type: 'corner', position: { x: maxX, y: minY }, cursor: 'ne-resize' },
      { id: 'sw', type: 'corner', position: { x: minX, y: maxY }, cursor: 'sw-resize' },
      { id: 'se', type: 'corner', position: { x: maxX, y: maxY }, cursor: 'se-resize' },
      { id: 'n', type: 'edge', position: { x: centerX, y: minY }, cursor: 'n-resize' },
      { id: 'e', type: 'edge', position: { x: maxX, y: centerY }, cursor: 'e-resize' },
      { id: 's', type: 'edge', position: { x: centerX, y: maxY }, cursor: 's-resize' },
      { id: 'w', type: 'edge', position: { x: minX, y: centerY }, cursor: 'w-resize' },
      { id: 'rotation', type: 'rotation', position: { x: centerX, y: minY - 20 }, cursor: 'crosshair' }
    );

    setTransformHandles(handles);
    return handles;
  };

  // Check if point is over any element
  const getElementAtPoint = (x: number, y: number): string | null => {
    // Check images first (top priority)
    for (const image of images) {
      const left = image.position.x - image.size.width / 2;
      const right = image.position.x + image.size.width / 2;
      const top = image.position.y - image.size.height / 2;
      const bottom = image.position.y + image.size.height / 2;

      if (x >= left && x <= right && y >= top && y <= bottom) {
        return image.id;
      }
    }

    // Check text notes
    const textElementId = getHoveredTextElementId(x, y);
    if (textElementId) return textElementId;

    // Check drawing elements (bottom to top)
    for (let i = drawingElements.length - 1; i >= 0; i--) {
      const element = drawingElements[i];
      if (element.type === 'path' || element.type === 'shape') {
        if (element.path && element.path.length > 0) {
          // Simple point-in-path check (for exact implementation, would need proper geometry)
          for (const point of element.path) {
            const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
            if (distance <= (element.strokeWidth || 2) / 2 + 5) {
              return element.id;
            }
          }
        }
      }
    }

    return null;
  };

  // Check if mouse position is over a text note
  const getHoveredTextElementId = (mouseX: number, mouseY: number): string | null => {
    for (const element of drawingElements) {
      if (element.type !== 'text' || !element.position) continue;

      const tempCanvas = document.createElement('canvas');
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) continue;

      const baseFontSize = element.fontSize || (element.textType === 'simple' ? 15 : 17);
      const fontFamily = element.textType === 'simple'
        ? 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif'
        : 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';

      ctx.font = element.textType === 'simple'
        ? `500 ${baseFontSize}px ${fontFamily}`
        : `600 ${baseFontSize}px ${fontFamily}`;

      const lines = (element.text || '').split('\n');
      const lineHeight = baseFontSize * 1.2;

      let maxWidth = 0;
      lines.forEach(line => {
        const metrics = ctx.measureText(line);
        if (metrics.width > maxWidth) {
          maxWidth = metrics.width;
        }
      });

      const textWidth = maxWidth;
      const textHeight = lines.length * lineHeight;

      const isHovering = mouseX >= element.position.x &&
        mouseX <= element.position.x + textWidth &&
        mouseY >= element.position.y &&
        mouseY <= element.position.y + textHeight;

      if (isHovering) {
        return element.id;
      }
    }
    return null;
  };

  // Check if point is inside rectangle (for marquee selection)
  const isPointInRect = (point: Point, rect: { x: number, y: number, width: number, height: number }) => {
    const minX = Math.min(rect.x, rect.x + rect.width);
    const maxX = Math.max(rect.x, rect.x + rect.width);
    const minY = Math.min(rect.y, rect.y + rect.height);
    const maxY = Math.max(rect.y, rect.y + rect.height);

    return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
  };

// Check if element is inside marquee rectangle
const isElementInMarquee = (element: DrawingElement | any, marqueeRect: { x: number, y: number, width: number, height: number }) => {
  if (!marqueeRect) return false;

  if (element.type === 'path' && element.path) {
    // For paths, check if any point is inside the rectangle (more accurate than single points)
    return element.path.some(point => isPointInRect(point, marqueeRect));
  } else if (element.type === 'text') {
    // For text notes, check bounds properly
    const textWidth = element.text ? element.text.length * 12 : 50;
    const textHeight = element.fontSize || 16;
    // Use proper bounds checking for text
    const left = element.position?.x || element.x || 0;
    const top = element.position?.y || element.y || 0;
    const right = left + textWidth;
    const bottom = top + textHeight;

    return isPointInRect({ x: left, y: top }, marqueeRect) ||
           isPointInRect({ x: right, y: top }, marqueeRect) ||
           isPointInRect({ x: left, y: bottom }, marqueeRect) ||
           isPointInRect({ x: right, y: bottom }, marqueeRect);
  } else if (element.position) {
    // For elements with position (shapes, emojis, graphs)
    return isPointInRect(element.position, marqueeRect);
  } else if (element.path && element.path.length > 0) {
    // For shapes without specific position, check all path points
    return element.path.some(point => isPointInRect(point, marqueeRect));
  }

  return false;
};

  // Select all elements
  const selectAll = useCallback(() => {
    const allElementIds = drawingElements.map(el => el.id);
    const allImageIds = images.map(img => img.id);
    setSelectedElementIds(allElementIds);
    setSelectedImageId(allImageIds.length > 0 ? allImageIds[0] : null);

    if (allElementIds.length > 0) {
      calculateTransformHandles();
    }
  }, [drawingElements, images]);

  // Flip selected elements
  const flipSelectedElements = (direction: 'horizontal' | 'vertical') => {
    if (selectedElementIds.length === 0) return;

    // Calculate bounding box center
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    selectedElementIds.forEach(id => {
      const element = drawingElements.find(el => el.id === id);
      if (!element) return;

      if (element.path && element.path.length > 0) {
        element.path.forEach(point => {
          minX = Math.min(minX, point.x);
          minY = Math.min(minY, point.y);
          maxX = Math.max(maxX, point.x);
          maxY = Math.max(maxY, point.y);
        });
      }
    });

    if (minX === Infinity) return;

    const centerX = minX + (maxX - minX) / 2;
    const centerY = minY + (maxY - minY) / 2;

    // Save initial state
    saveInitialState();

    // Flip elements
    setDrawingElements(prev => prev.map(element => {
      if (selectedElementIds.includes(element.id)) {
        if (element.path && element.path.length > 0) {
          // Flip path points around center axis
          const newPath = element.path.map(point => ({
            ...point,
            x: direction === 'horizontal' ? centerX + (centerX - point.x) : point.x,
            y: direction === 'vertical' ? centerY + (centerY - point.y) : point.y
          }));
          return { ...element, path: newPath };
        }

        if (element.position) {
          // Flip position-based elements
          return {
            ...element,
            position: {
              x: direction === 'horizontal' ? centerX + (centerX - element.position.x) : element.position.x,
              y: direction === 'vertical' ? centerY + (centerY - element.position.y) : element.position.y
            }
          };
        }
      }
      return element;
    }));

    // Handle images
    if (selectedImageId) {
      setImages(prev => prev.map(image => {
        if (image.id === selectedImageId) {
          const newPosition = {
            x: direction === 'horizontal' ? centerX + (centerX - image.position.x) : image.position.x,
            y: direction === 'vertical' ? centerY + (centerY - image.position.y) : image.position.y
          };
          return {
            ...image,
            position: newPosition
          };
        }
        return image;
      }));
    }

    // Handle text notes

    redrawCanvas();
  };

  // Reset selected elements to original scale
  const resetSelectedElements = () => {
    // This is a simplified implementation - in a real application,
    // you'd store original transforms and restore them
    console.log('Reset selected elements functionality - not fully implemented');
    // For now, just recalculate transform handles
    if (selectedElementIds.length > 0) {
      calculateTransformHandles();
    }
  };

  // Move selected elements
  const getBounds = (element: DrawingElement) => {
    if (element.path) {
      const x = element.path.map(p => p.x);
      const y = element.path.map(p => p.y);
      return {
        minX: Math.min(...x),
        minY: Math.min(...y),
        maxX: Math.max(...x),
        maxY: Math.max(...y),
      };
    }
    if (element.position && element.size) {
      return {
        minX: element.position.x,
        minY: element.position.y,
        maxX: element.position.x + element.size.width,
        maxY: element.position.y + element.size.height,
      };
    }
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  };

  const moveSelectedElements = (dx: number, dy: number) => {
    if (selectedElementIds.length === 0 && selectedImageId === null) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const bounds = {
      minX: 0,
      minY: 0,
      maxX: canvas.width / zoomLevel,
      maxY: canvas.height / zoomLevel,
    };

    // Move selected drawing elements
    setDrawingElements(prev => prev.map(element => {
      if (selectedElementIds.includes(element.id)) {
        const elementBounds = getBounds(element);
        const newDx = Math.max(bounds.minX - elementBounds.minX, Math.min(dx, bounds.maxX - elementBounds.maxX));
        const newDy = Math.max(bounds.minY - elementBounds.minY, Math.min(dy, bounds.maxY - elementBounds.maxY));

        if (element.path) {
          const newPath = element.path.map(point => ({
            ...point,
            x: point.x + newDx,
            y: point.y + newDy
          }));
          return { ...element, path: newPath };
        }

        if (element.position) {
          return {
            ...element,
            position: {
              x: element.position.x + newDx,
              y: element.position.y + newDy
            }
          };
        }
      }
      return element;
    }));

    // Move selected images
    setImages(prev => prev.map(image => {
      if (image.id === selectedImageId) {
        const elementBounds = {
          minX: image.position.x,
          minY: image.position.y,
          maxX: image.position.x + image.size.width,
          maxY: image.position.y + image.size.height,
        };
        const newDx = Math.max(bounds.minX - elementBounds.minX, Math.min(dx, bounds.maxX - elementBounds.maxX));
        const newDy = Math.max(bounds.minY - elementBounds.minY, Math.min(dy, bounds.maxY - elementBounds.maxY));
        return {
          ...image,
          position: {
            x: image.position.x + newDx,
            y: image.position.y + newDy
          }
        };
      }
      return image;
    }));

    // Move selected text notes

    // Update transform handles
    calculateTransformHandles();
  };

  // Handle keyboard shortcuts for selection
  const handleSelectionKeys = (e: KeyboardEvent) => {
    if (activeTool !== 'selection') return;

    const nudgeDistance = e.shiftKey ? 10 : 1;

    switch (e.key.toLowerCase()) {
      case 'arrowleft':
        e.preventDefault();
        moveSelectedElements(-nudgeDistance, 0);
        break;
      case 'arrowright':
        e.preventDefault();
        moveSelectedElements(nudgeDistance, 0);
        break;
      case 'arrowup':
        e.preventDefault();
        moveSelectedElements(0, -nudgeDistance);
        break;
      case 'arrowdown':
        e.preventDefault();
        moveSelectedElements(0, nudgeDistance);
        break;
      case 'delete':
      case 'backspace':
        e.preventDefault();
        // Delete selected elements
        setDrawingElements(prev => prev.filter(el => !selectedElementIds.includes(el.id)));
        setImages(prev => prev.map(img => ({ ...img, selected: false })));
        setSelectedElementIds([]);
        setSelectedImageId(null);
        setTransformHandles([]);
        break;
      case 'g':
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
          if (e.shiftKey) {
            // Ungroup (Ctrl/Cmd+Shift+G)
            setDrawingElements(prev => {
              const newElements: DrawingElement[] = [];
              selectedElementIds.forEach(id => {
                const element = prev.find(el => el.id === id);
                if (element) {
                  if (element.children) {
                    // Unpack group elements
                    element.children.forEach(childId => {
                      const child = prev.find(el => el.id === childId);
                      if (child) newElements.push(child);
                    });
                  } else {
                    newElements.push(element);
                  }
                }
              });
              return newElements;
            });
            setSelectedElementIds([]);
          } else {
            // Group (Ctrl/Cmd+G)
            const groupElement: DrawingElement = {
              id: `group-${Date.now()}`,
              type: 'group',
              children: [...selectedElementIds]
            };
            setDrawingElements(prev => [
              ...prev.filter(el => !selectedElementIds.includes(el.id)),
              groupElement
            ]);
            setSelectedElementIds([groupElement.id]);
          }
        }
        break;
    }
  };





  // Check if mouse is over a transform handle
  const getHoveredHandle = (mouseX: number, mouseY: number): SelectionHandle | null => {
    if (transformHandles.length === 0) return null;

    const handleSize = 8;
    for (const handle of transformHandles) {
      const dx = mouseX - handle.position.x;
      const dy = mouseY - handle.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (handle.type === 'rotation') {
        if (distance <= handleSize / 2) return handle;
      } else {
        if (Math.abs(dx) <= handleSize / 2 && Math.abs(dy) <= handleSize / 2) return handle;
      }
    }

    return null;
  };

  // Enhanced smooth path using Cubic Bezier curves for more natural strokes
  const smoothPath = (points: Point[], smoothing: number): Point[] => {
    if (points.length < 3) return points;

    const smoothed: Point[] = [];
    const tension = Math.min(smoothing * 0.8, 0.5); // Control point distance factor

    // Use Catmull-Rom spline for smoother curves
    for (let i = 0; i < points.length; i++) {
      if (i === 0) {
        // First point - use next point as control point
        const current = points[i];
        const next = points[i + 1];
        const control = {
          x: current.x + (next.x - current.x) * tension,
          y: current.y + (next.y - current.y) * tension,
          pressure: current.pressure
        };
        smoothed.push(current, control);
      } else if (i === points.length - 1) {
        // Last point
        smoothed.push(points[i]);
      } else {
        // Middle points
        const prev = points[i - 1];
        const current = points[i];
        const next = points[i + 1];

        // Calculate control point for smooth curve
        const dx = next.x - prev.x;
        const dy = next.y - prev.y;
        const controlOffset = tension * Math.sqrt(dx * dx + dy * dy) / 100;

        const control = {
          x: current.x + dx * controlOffset,
          y: current.y + dy * controlOffset,
          pressure: current.pressure
        };

        // Add control point and current point
        smoothed.push(control, current);
      }
    }

    return smoothed;
  };

  // Advanced smoothing with velocity-based width calculation
  const smoothPathAdvanced = (points: Point[], smoothing: number): Point[] => {
    if (points.length < 2) return points;

    const smoothed: Point[] = [points[0]];
    const minDistance = 2; // Minimum distance between points
    const maxDistance = 15; // Maximum distance for curve smoothness

    // Remove points that are too close (reduces noise)
    let filteredPoints = [points[0]];
    for (let i = 1; i < points.length; i++) {
      const last = filteredPoints[filteredPoints.length - 1];
      const dist = Math.sqrt(Math.pow(points[i].x - last.x, 2) + Math.pow(points[i].y - last.y, 2));
      if (dist > minDistance) {
        filteredPoints.push(points[i]);
      } else {
        // Average points that are too close
        last.x = (last.x + points[i].x) / 2;
        last.y = (last.y + points[i].y) / 2;
        if (points[i].pressure !== undefined) {
          last.pressure = last.pressure !== undefined
            ? (last.pressure + points[i].pressure) / 2
            : points[i].pressure;
        }
      }
    }

    points = filteredPoints;

    if (points.length < 3) return points;

    // Apply advanced smoothing algorithm
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const current = points[i];
      const next = points[i + 1];

      // Calculate velocity for variable width
      const velocity = Math.sqrt(
        Math.pow(current.x - prev.x, 2) + Math.pow(current.y - prev.y, 2)
      );

      // Distance-based smoothing
      const distance = Math.sqrt(
        Math.pow(next.x - prev.x, 2) + Math.pow(next.y - prev.y, 2)
      );

      const alpha = smoothing * (1 + velocity / 50); // Velocity-based smoothing

      const smoothX = current.x * (1 - alpha) + prev.x * alpha * 0.3 + next.x * alpha * 0.3;
      const smoothY = current.y * (1 - alpha) + prev.y * alpha * 0.3 + next.y * alpha * 0.3;


    }

    smoothed.push(points[points.length - 1]);
    return smoothed;
  };

  const getPressureAdjustedWidth = (baseWidth: number, pressure?: number): number => {
    if (!penSettings.pressureEnabled || pressure === undefined) return baseWidth;
    return Math.max(1, baseWidth * (0.2 + pressure * 0.8));
  };

  // Helper function to check if a point is on a stroke path
  const isPointOnPath = (point: Point, path: Point[], strokeWidth: number): boolean => {
    const eraserRadius = eraserSettings.size / 2;
    const tolerance = strokeWidth + eraserRadius;

    for (let i = 0; i < path.length - 1; i++) {
      const p1 = path[i];
      const p2 = path[i + 1];

      // Calculate distance from point to line segment
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length === 0) {
        const dist = Math.sqrt((point.x - p1.x) ** 2 + (point.y - p1.y) ** 2);
        if (dist <= tolerance) return true;
      } else {
        const t = ((point.x - p1.x) * dx + (point.y - p1.y) * dy) / (length ** 2);
        const clampedT = Math.max(0, Math.min(1, t));
        const closestX = p1.x + clampedT * dx;
        const closestY = p1.y + clampedT * dy;
        const dist = Math.sqrt((point.x - closestX) ** 2 + (point.y - closestY) ** 2);
        if (dist <= tolerance) return true;
      }
    }
    return false;
  };

  // Helper function to check if eraser path intersects with text element
  const eraserPathIntersectsText = (eraserPath: Point[], element: DrawingElement): boolean => {
    if (!element.position) return false;

    // Calculate text bounds (approximate)
    const textWidth = (element.text || '').length * (element.fontSize || 16) * 0.6;
    const textHeight = element.fontSize || 16;
    const elementLeft = element.position.x;
    const elementTop = element.position.y;
    const elementRight = element.position.x + textWidth;
    const elementBottom = element.position.y + textHeight;

    // Check if any eraser point is within the text bounds
    for (const eraserPoint of eraserPath) {
      if (
        eraserPoint.x >= elementLeft - eraserSettings.size &&
        eraserPoint.x <= elementRight + eraserSettings.size &&
        eraserPoint.y >= elementTop - eraserSettings.size &&
        eraserPoint.y <= elementBottom + eraserSettings.size
      ) {
        return true;
      }
    }

    return false;
  };

  // Helper function to check if eraser path intersects with position-based element (emoji, graph)
  const eraserPathIntersectsPosition = (eraserPath: Point[], element: DrawingElement): boolean => {
    if (!element.position) return false;

    const tolerance = eraserSettings.size + 20; // Extra tolerance for emojis

    for (const eraserPoint of eraserPath) {
      const distance = Math.sqrt(
        (eraserPoint.x - element.position.x) ** 2 +
        (eraserPoint.y - element.position.y) ** 2
      );
      if (distance <= tolerance) {
        return true;
      }
    }

    return false;
  };

  // Helper function to check if eraser path intersects with image
  const eraserPathIntersectsImage = (eraserPath: Point[], image: any): boolean => {
    const left = image.position.x - image.size.width / 2;
    const right = image.position.x + image.size.width / 2;
    const top = image.position.y - image.size.height / 2;
    const bottom = image.position.y + image.size.height / 2;

    // Check if any eraser point overlaps with image bounds
    for (const eraserPoint of eraserPath) {
      if (
        eraserPoint.x >= left - eraserSettings.size &&
        eraserPoint.x <= right + eraserSettings.size &&
        eraserPoint.y >= top - eraserSettings.size &&
        eraserPoint.y <= bottom + eraserSettings.size
      ) {
        return true;
      }
    }

    return false;
  };

  // Eraser stroke mode - finds and deletes all intersecting elements
  const eraseStrokes = (eraserPath: Point[]) => {
    // Erase drawing elements
    setDrawingElements(prevElements => {
      return prevElements.filter(element => {
        // Check paths and shapes (original logic)
        if (element.type === 'path' || element.type === 'shape') {
          if (!element.path || element.path.length === 0) return true;

          for (const eraserPoint of eraserPath) {
            if (isPointOnPath(eraserPoint, element.path, element.strokeWidth || 2)) {
              return false; // Remove this element
            }
          }
        }
        // Check text elements
        else if (element.type === 'text') {
          if (eraserPathIntersectsText(eraserPath, element)) {
            return false; // Remove this element
          }
        }
        // Check position-based elements (emojis, graphs)
        else if (element.position) {
          if (eraserPathIntersectsPosition(eraserPath, element)) {
            return false; // Remove this element
          }
        }

        return true; // Keep this element
      });
    });

    // Erase images
    setImages(prevImages => {
      return prevImages.filter(image => {
        return !eraserPathIntersectsImage(eraserPath, image);
      });
    });
  };

  


  // New Updted Code

  const eraseObject = (point: Point) => {
    // Save state before erasing
    saveInitialState();
    
    // Erase drawing elements (paths, shapes, text, etc.)
    setDrawingElements(prevElements => {
      const newElements = [];

      for (const element of prevElements) {
        let shouldKeep = true;
        
        // Check if eraser touches this element
        if (element.type === 'path' || element.type === 'shape') {
          // For paths and shapes, check all points
          if (element.path && element.path.length > 0) {
            for (const pathPoint of element.path) {
              const dist = Math.sqrt((point.x - pathPoint.x) ** 2 + (point.y - pathPoint.y) ** 2);
              if (dist <= eraserSettings.size) {
                shouldKeep = false;
                break;
              }
            }
          }
        } else if (element.type === 'text' && element.position) {
          // For text elements, check position and approximate bounds
          const textWidth = (element.text || '').length * (element.fontSize || 16) * 0.6;
          const textHeight = element.fontSize || 16;
          
          // Check if eraser overlaps text bounds
          const isOverlapping = 
            point.x >= element.position.x - eraserSettings.size &&
            point.x <= element.position.x + textWidth + eraserSettings.size &&
            point.y >= element.position.y - eraserSettings.size &&
            point.y <= element.position.y + textHeight + eraserSettings.size;
          
          if (isOverlapping) {
            shouldKeep = false;
          }
        } else if (element.position) {
          // For other position-based elements (emojis, etc.)
          const dist = Math.sqrt(
            (point.x - element.position.x) ** 2 + 
            (point.y - element.position.y) ** 2
          );
          if (dist <= eraserSettings.size + 20) { // Extra tolerance for emojis
            shouldKeep = false;
          }
        }
        
        if (shouldKeep) {
          newElements.push(element);
        }
      }

      return newElements;
    });
    
    // Also erase images
    setImages(prevImages => {
      return prevImages.filter(image => {
        const left = image.position.x - image.size.width / 2;
        const right = image.position.x + image.size.width / 2;
        const top = image.position.y - image.size.height / 2;
        const bottom = image.position.y + image.size.height / 2;
        
        // Check if eraser point is within image bounds
        const isOverlapping = 
          point.x >= left - eraserSettings.size &&
          point.x <= right + eraserSettings.size &&
          point.y >= top - eraserSettings.size &&
          point.y <= bottom + eraserSettings.size;
        
        return !isOverlapping; // Keep if NOT overlapping
      });
    });
  };

  const handlePointerDown = (e: PointerEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    const screenX = rect ? e.clientX - rect.left : 0;
    const screenY = rect ? e.clientY - rect.top : 0;
    const { x, y } = getCanvasCoordinates(e);
    const currentTool = activeTool;

    console.log('Pointer down:', { currentTool, textMode, x, y });

    // Check if clicking on an existing text note (for editing/selection)
    const clickedTextElementId = getHoveredTextElementId(x, y);

    // If editing and click is outside, stop editing
    if (editingElementId && editingElementId !== clickedTextElementId) {
      setEditingElementId(null);
    }

    // Track click timing for double-click detection
    const currentTime = Date.now();
    const doubleClickThreshold = 300; // 300ms

    if (clickedTextElementId) {
      // Handle double-click to edit text note
      if (lastClickPos.x === x && lastClickPos.y === y && (currentTime - lastClickTime) < doubleClickThreshold) {
        // Double-click detected - start editing
        setEditingElementId(clickedTextElementId);
        return;
      }

      // If selection tool is active and it's a text note click, allow selection
      if (currentTool === "selection") {
        setSelectedElementIds(prev => [...prev, clickedTextElementId]);
        setSelectedImageId(null);
        console.log('Text element selected:', clickedTextElementId);
      }

      setLastClickTime(currentTime);
      setLastClickPos({ x, y });
      return;
    }

    // Reset click tracking for non-text clicks
    setLastClickTime(currentTime);
    setLastClickPos({ x, y });

    if (currentTool === "pencil") {
      // Save initial state before starting to draw
      saveInitialState();
      setIsDrawing(true);
      const newPoint: Point = { x, y, pressure: e.pressure };
      setTempPath([newPoint]);
      setIsStraightLineMode(e.shiftKey || e.ctrlKey);
    } else if (currentTool === "text" && textMode) {
      // Create a text note at the click position
      console.log('Creating text note:', { textMode, position: { x, y } });
      createTextNote({ x, y });
    } else if (currentTool === "eraser") {
      // Save initial state before starting to erase
      saveInitialState();
      setIsDrawing(true);
      const newPoint: Point = { x, y, pressure: e.pressure };
      setEraserPath([newPoint]);
      setIsStraightLineMode(e.shiftKey || e.ctrlKey);

      if (eraserSettings.mode === 'object') {
        eraseObject(newPoint);
      }
    } else if (currentTool === "shapes") {
      // Start creating a shape
      saveInitialState();
      setStartPoint({ x, y });
      setIsCreatingShape(true);
    }  else if (currentTool === "emoji") {
      if (selectedEmoji) {
        createEmojiAtPosition(selectedEmoji, { x, y });
        onEmojiPlaced?.();
      }
    } else if (currentTool === "hand") {
      // Hand tool - start panning
      setIsHandActive(true);
      setLastPanPoint({ x: screenX, y: screenY });
      console.log('Hand tool activated - Starting pan at:', { screenX, screenY });
    } else if (isSpacebarActive) {
      // Temporary hand tool activation via Spacebar
      setIsHandActive(true);
      setLastPanPoint({ x: screenX, y: screenY });
      console.log('Temporary hand tool activated via Spacebar');
    } else if (currentTool === "selection") {
      const clickedElementId = getElementAtPoint(x, y);
      const clickedImageId = images.find(image => {
        const left = image.position.x - image.size.width / 2;
        const right = image.position.x + image.size.width / 2;
        const top = image.position.y - image.size.height / 2;
        const bottom = image.position.y + image.size.height / 2;
        return x >= left && x <= right && y >= top && y <= bottom;
      })?.id;
      const clickedTextElementId = getHoveredTextElementId(x, y);
      const clickedHandle = getHoveredHandle(x, y);

      if (clickedHandle && selectedElementIds.length > 0) {
        setDraggedHandle(clickedHandle);
        setIsTransforming(true);
        setLastMousePos({ x, y });
        const bounds = calculateBounds(selectedElementIds);
        setOriginalBounds(bounds);
        saveInitialState();
      } else if (clickedElementId || clickedImageId || clickedTextElementId) {
        const multiSelect = e.shiftKey || e.ctrlKey || e.metaKey;

        if (clickedElementId) {
          const isSelected = selectedElementIds.includes(clickedElementId);
          if (multiSelect) {
            setSelectedElementIds(prev => isSelected ? prev.filter(id => id !== clickedElementId) : [...prev, clickedElementId]);
          } else if (!isSelected) {
            setSelectedElementIds([clickedElementId]);
          }
        } else if (!clickedTextElementId) {
          if (!multiSelect) setSelectedElementIds([]);
        }

        if (clickedImageId) {
          setSelectedImageId(clickedImageId);
        } else {
          if (!multiSelect) setSelectedImageId(null);
        }

        if (clickedTextElementId) {
          const isSelected = selectedElementIds.includes(clickedTextElementId);
          if (multiSelect) {
            setSelectedElementIds(prev => isSelected ? prev.filter(id => id !== clickedTextElementId) : [...prev, clickedTextElementId]);
          } else if (!isSelected) {
            setSelectedElementIds([clickedTextElementId]);
          }
        }

        setSelectionStart({ x, y });
        setIsDraggingSelection(true);

        const offsets: { [elementId: string]: { x: number; y: number } } = {};
        [...selectedElementIds, selectedImageId].forEach(id => {
          if (!id) return;
          const element = drawingElements.find(el => el.id === id);
          const image = images.find(img => img.id === id);

          if (element?.position) offsets[id] = { x: element.position.x - x, y: element.position.y - y };
          if (image?.position) offsets[id] = { x: image.position.x - x, y: image.position.y - y };
        });
        setDragOffsets(offsets);
        calculateTransformHandles();

      } else {
        // Clicked on empty space
        if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
          setSelectedElementIds([]);
          setSelectedImageId(null);
          setTransformHandles([]);
        }
        setSelectionMode('marquee');
        setSelectionStart({ x, y });
        setSelectionEnd({ x, y });
        setMarqueeRect({ x, y, width: 0, height: 0 });
      }
    }
  };

    const handlePointerMove = (e: PointerEvent) => {
    const { x, y } = getCanvasCoordinates(e);

    // Track shift key state for shapes
    if (e.shiftKey !== lastShiftKey) {
      setLastShiftKey(e.shiftKey);
    }

    // Always track mouse position for eraser preview and text hover detection
    setMousePosition({ x, y });

    // Mouse tracking handled by parent for zoom centering

    // Update text note hover detection for cursor changes

    if (activeTool === "hand" && isHandActive) {
      // Hand tool panning - work with screen coordinates for smooth panning
      const canvas = canvasRef.current;
      const rect = canvas?.getBoundingClientRect();
      const currentScreenX = rect ? e.clientX - rect.left : 0;
      const currentScreenY = rect ? e.clientY - rect.top : 0;

      // Calculate delta for natural panning: when mouse moves right, canvas moves right
      // when mouse moves down, canvas moves down (revealing content in that direction)
      const deltaX = currentScreenX - lastPanPoint.x;
      const deltaY = currentScreenY - lastPanPoint.y;

      // Update scroll position with pan constraints
      setScrollX(prevScrollX => {
        const newScrollX = prevScrollX + deltaX;
        return Math.max(-CANVAS_MAX_PAN, Math.min(CANVAS_MAX_PAN, newScrollX));
      });

      setScrollY(prevScrollY => {
        const newScrollY = prevScrollY + deltaY;
        return Math.max(-CANVAS_MAX_PAN, Math.min(CANVAS_MAX_PAN, newScrollY));
      });

      // Update last pan point for next move
      setLastPanPoint({ x: currentScreenX, y: currentScreenY });

      console.log('Hand tool panning:', { deltaX, deltaY, scrollX, scrollY });
      redrawCanvas();
    } else if (isSpacebarActive && isHandActive) {
      // Temporary hand tool via spacebar
      const canvas = canvasRef.current;
      const rect = canvas?.getBoundingClientRect();
      const currentScreenX = rect ? e.clientX - rect.left : 0;
      const currentScreenY = rect ? e.clientY - rect.top : 0;

      // Use same natural delta calculation as regular hand tool
      const deltaX = currentScreenX - lastPanPoint.x;
      const deltaY = currentScreenY - lastPanPoint.y;

      setScrollX(prevScrollX => {
        const newScrollX = prevScrollX + deltaX;
        return Math.max(-CANVAS_MAX_PAN, Math.min(CANVAS_MAX_PAN, newScrollX));
      });

      setScrollY(prevScrollY => {
        const newScrollY = prevScrollY + deltaY;
        return Math.max(-CANVAS_MAX_PAN, Math.min(CANVAS_MAX_PAN, newScrollY));
      });

      setLastPanPoint({ x: currentScreenX, y: currentScreenY });
      redrawCanvas();
    } else if (activeTool === "selection" && isDraggingSelection && !isTransforming) {
      // Drag multiple selected elements (only if not transforming)
      const offsets = dragOffsets;

      // Move drawing elements
      setDrawingElements(prev => prev.map(element => {
       if (selectedElementIds.includes(element.id)) {
         const newElement = { ...element };
         const dx = x - selectionStart.x;
         const dy = y - selectionStart.y;

         if (!newElement.lockMovementX) {
           if (newElement.path) {
             newElement.path = newElement.path.map(p => ({ ...p, x: p.x + dx }));
           } else if (newElement.position) {
             newElement.position = { ...newElement.position, x: newElement.position.x + dx };
           }
         }

         if (!newElement.lockMovementY) {
           if (newElement.path) {
             newElement.path = newElement.path.map(p => ({ ...p, y: p.y + dy }));
           } else if (newElement.position) {
             newElement.position = { ...newElement.position, y: newElement.position.y + dy };
           }
         }
         return newElement;
       }
       return element;
     }));
     setSelectionStart({ x, y });

      // Move images
      setImages(prev => prev.map(image => {
        const offset = offsets[image.id];
        if (offset) {
          const newX = x + offset.x;
          const newY = y + offset.y;
          return {
            ...image,
            position: { x: newX, y: newY }
          };
        }
        return image;
      }));


      redrawCanvas();
    } else if (activeTool === "selection" && isTransforming) {
      // Handle transform/resize operations separately
      handleResize(x, y);
    } else if (activeTool === "selection" && selectionMode === 'marquee' && selectionStart) {
      // Update marquee rectangle
      const width = x - selectionStart.x;
      const height = y - selectionStart.y;
      setMarqueeRect({
        x: selectionStart.x,
        y: selectionStart.y,
        width,
        height
      });
      redrawCanvas();
    } else if (activeTool === "pencil" && isDrawing) {
      if (isStraightLineMode && tempPath.length >= 1) {
        const startPoint = tempPath[0];
        setTempPath([startPoint, { x, y, pressure: e.pressure }]);
      } else {
        setTempPath(prev => [...prev, { x, y, pressure: e.pressure }]);
      }
      redrawCanvas();
    } else if (activeTool === "eraser" && isDrawing && eraserSettings.mode === 'stroke') {
      if (isStraightLineMode && eraserPath.length >= 1) {
        const startPoint = eraserPath[0];
        setEraserPath([startPoint, { x, y, pressure: e.pressure }]);
      } else {
        setEraserPath(prev => [...prev, { x, y, pressure: e.pressure }]);
      }
      redrawCanvas();
    }
  }

  const handlePointerUp = (e: PointerEvent) => {
    if (selectionMode === 'marquee' && marqueeRect) {
      const normalizedRect = {
        x: Math.min(marqueeRect.x, marqueeRect.x + marqueeRect.width),
        y: Math.min(marqueeRect.y, marqueeRect.y + marqueeRect.height),
        width: Math.abs(marqueeRect.width),
        height: Math.abs(marqueeRect.height)
      };

      const elementsInMarquee = drawingElements.filter(el => isElementInMarquee(el, normalizedRect)).map(el => el.id);
      const imagesInMarquee = images.filter(img => isElementInMarquee(img, normalizedRect)).map(img => img.id);
      const textElementsInMarquee = drawingElements.filter(el => el.type === 'text' && isElementInMarquee(el, normalizedRect)).map(el => el.id);

      const multiSelect = e.shiftKey || e.ctrlKey || e.metaKey;

      if (multiSelect) {
        setSelectedElementIds(prev => [...new Set([...prev, ...elementsInMarquee, ...textElementsInMarquee])]);
        if (imagesInMarquee.length > 0) {
          setSelectedImageId(prev => prev || imagesInMarquee[0]);
        }
      } else {
        setSelectedElementIds([...elementsInMarquee, ...textElementsInMarquee]);
        setSelectedImageId(imagesInMarquee.length > 0 ? imagesInMarquee[0] : null);
      }

      setSelectionMode(null);
      setMarqueeRect(null);
      calculateTransformHandles();
    }

    if (isDrawing) {
      if (activeTool === "pencil" && tempPath.length > 1) {
        const smoothedPath = smoothPath(tempPath, penSettings.smoothing);
        const newElement: DrawingElement = {
          id: Date.now().toString(),
          type: penSettings.mode === 'vector' ? 'path' : 'shape',
          path: smoothedPath,
          strokeColor: strokeColor,
          strokeWidth: penSettings.strokeWidth,
          opacity: 1,
          cap: penSettings.cap,
          join: penSettings.join,
          dashPattern: penSettings.dashPattern,
          selectable: true,
          evented: true,
          lockMovementX: false,
          lockMovementY: false
        };
        setDrawingElements(prev => [...prev, newElement]);
      } else if (activeTool === "eraser" && eraserPath.length > 1 && eraserSettings.mode === 'stroke') {
        eraseStrokes(eraserPath);
      }
    }

    if (isCreatingShape) {
      // Apply Shift key constraint for perfect proportions
      let endPoint = { x: mousePosition.x, y: mousePosition.y };
      if (lastShiftKey) {
        const dx = Math.abs(endPoint.x - startPoint.x);
        const dy = Math.abs(endPoint.y - startPoint.y);
        const minExtent = Math.min(dx, dy);
        endPoint.x = startPoint.x + (endPoint.x > startPoint.x ? minExtent : -minExtent);
        endPoint.y = startPoint.y + (endPoint.y > startPoint.y ? minExtent : -minExtent);
      }

      // Create the shape element
      const shapePath = createShapePath(startPoint, endPoint, shapeSettings);
      const newElement: DrawingElement = {
        id: Date.now().toString(),
        type: 'shape',
        path: shapePath,
        strokeColor: shapeColor || strokeColor,
        strokeWidth: shapeSettings.strokeWidth,
        fillColor: shapeColor || strokeColor,
        shapeType: shapeSettings.selectedShape,
        opacity: 1,
        selectable: true,
        evented: true,
        lockMovementX: false,
        lockMovementY: false
      };

      setDrawingElements(prev => [...prev, newElement]);

      // Reset shape creation state
      setIsCreatingShape(false);
    }

    // Reset hand tool on release
    if (isHandActive) {
      setIsHandActive(false);
      console.log('Hand tool released - stopped panning');
    }

    // Reset dragging state
    if (isDraggingSelection) {
      setIsDraggingSelection(false);
      setDragOffsets({});
      setSelectionStart({ x: 0, y: 0 });
      console.log('Selection dragging ended');
    }

    // Reset transform state and clear selections when resizing ends
    if (isTransforming) {
      setIsTransforming(false);
      setDraggedHandle(null);
      setOriginalBounds(null);
      setLastMousePos({ x: 0, y: 0 });

      // Clear all selections after resize operation completes
      setSelectedElementIds([]);
      setSelectedImageId(null);
      setTransformHandles([]);
      console.log('Transform operation ended - clearing selections');
    }

    // Removed old connector creation code - now handled via flowchart tool

    setTempPath([]);
    setEraserPath([]);
    setIsDrawing(false);
    setIsStraightLineMode(false);
  };

  // Professional Zoom Tool Implementation - Mouse wheel and keyboard
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      // Fixed 10% increments for professional Z-axis zoom only - no diagonal drifting
      const newZoom = e.deltaY > 0
        ? zoomLevel * 0.9  // Zoom out: fixed 10% decrement
        : zoomLevel * 1.1; // Zoom in: fixed 10% increment

      if (typeof onZoomChange === 'function') {
        onZoomChange(newZoom);
      }
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
    };
  }, [zoomLevel, scrollX, scrollY, onZoomChange, activeTool, isDrawing, isStraightLineMode, tempPath, eraserPath, penSettings, strokeColor, eraserSettings, mousePosition]);

  // Spacebar hand tool activation/deactivation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        if (activeTool !== "hand") {
          setPreviousTool(activeTool);
          setIsSpacebarActive(true);
          setIsHandActive(false); // Reset any existing hand state
        }
        console.log('Spacebar pressed - temporary hand tool activated');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (isSpacebarActive) {
          setIsSpacebarActive(false);
          setIsHandActive(false);
        }
        console.log('Spacebar released - returned to previous tool');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeTool, isSpacebarActive]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        redo();
        onRedoAction?.();
      } else {
        undo();
        onUndoAction?.();
      }
    }

    // Select all with Ctrl+A
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      selectAll();
    }

      // Eraser size shortcuts
      if (activeTool === 'eraser') {
        if (e.key === '[') {
          e.preventDefault();
          setEraserSettings(prev => ({ ...prev, size: Math.max(5, prev.size - 2) }));
        } else if (e.key === ']') {
          e.preventDefault();
          setEraserSettings(prev => ({ ...prev, size: Math.min(100, prev.size + 2) }));
        }
      }

      // Shapes tool shortcuts
      if (activeTool === 'shapes') {
        if (!isCreatingShape) { // Only allow shortcuts when not actively drawing
          switch (e.key.toLowerCase()) {
            case 'r':
              e.preventDefault();
              setShapeSettings(prev => ({ ...prev, selectedShape: 'rectangle' }));
              break;
            case 'o':
              e.preventDefault();
              setShapeSettings(prev => ({ ...prev, selectedShape: 'rounded-rectangle' }));
              break;
            case 'e':
              e.preventDefault();
              setShapeSettings(prev => ({ ...prev, selectedShape: 'ellipse' }));
              break;
            case 'c':
              e.preventDefault();
              setShapeSettings(prev => ({ ...prev, selectedShape: 'circle' }));
              break;
            case 'l':
              e.preventDefault();
              setShapeSettings(prev => ({ ...prev, selectedShape: 'line' }));
              break;
            case 'p':
              e.preventDefault();
              setShapeSettings(prev => ({ ...prev, selectedShape: 'polygon' }));
              break;
            case 's':
              e.preventDefault();
              setShapeSettings(prev => ({ ...prev, selectedShape: 'star' }));
              break;
          }
        }
      }

      // Professional Zoom Tool keyboard shortcuts with fixed 10% increments
      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        const newZoom = (Math.floor((zoomLevel * 100) / 10) * 10 + 10) / 100; // Next 10% increment
        if (typeof onZoomChange === 'function') {
          onZoomChange(newZoom);
        }
      } else if (e.key === '-') {
        e.preventDefault();
        const newZoom = (Math.max(Math.floor((zoomLevel * 100) / 10) * 10 - 10, 10)) / 100; // Previous 10% decrement
        if (typeof onZoomChange === 'function') {
          onZoomChange(newZoom);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        // Reset to fit canvas in viewport
        const newZoom = 1.0;
        if (typeof onZoomChange === 'function') {
          onZoomChange(newZoom);
        }
        // Also center the view
        setScrollX(0);
        setScrollY(0);
      } else if ((e.ctrlKey || e.metaKey) && e.key === '1') {
        e.preventDefault();
        // Zoom to 100% and center content
        const newZoom = 1.0;
        if (typeof onZoomChange === 'function') {
          onZoomChange(newZoom);
        }
        // Center on content (simple center on origin for now)
        setScrollX(0);
        setScrollY(0);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, activeTool, onUndoAction, onRedoAction, isCreatingShape]);

  // Optimized redraw with requestAnimationFrame for smooth rendering
  const redrawCanvas = (forceRedraw = false) => {
    // Allow immediate redraw for responsive UI

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

      // Draw grid
      if (isGridVisible) {
        drawGrid(ctx);
      }

      // Apply correct inverse transform of getCanvasCoordinates
      ctx.save();

      // FIX: Proper zoom transform order - scale first, then translate around canvas center
      // This ensures zoom is centered and prevents distortion issues
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      ctx.translate(centerX, centerY);
      ctx.scale(zoomLevel, zoomLevel);
      ctx.translate(-centerX + scrollX, -centerY + scrollY);

      // Render drawing elements using master's smooth stroke algorithm
      for (const element of drawingElements) {
        if (element.type === 'path') {
          // Handle freehand paths using perfect-freehand
          ctx.strokeStyle = element.strokeColor || '#000';
          ctx.fillStyle = element.fillColor || element.strokeColor || '#000';
          ctx.globalAlpha = element.opacity || 1;

          if (element.path && element.path.length > 0) {
            // Use master's complete stroke algorithm for smooth curves
            const inputPoints = element.path.map(p => [p.x, p.y, p.pressure || 0.5]);
            const strokeOptions = {
              simulatePressure: penSettings.pressureEnabled,
              size: Math.max(1, (element.strokeWidth || 2) / zoomLevel),  // Scale stroke width for zoom consistency
              thinning: 0.6,    // Variable line width
              smoothing: 0.5,   // Curve smoothness
              streamline: 0.5,  // Path optimization
              easing: (t: number) => Math.sin((t * Math.PI) / 2), // easeOutSine
              last: true,       // Mark as finalized stroke
            };

            const strokePath = getStroke(inputPoints as number[][], strokeOptions);

            if (strokePath.length > 0) {
              const path = new Path2D();
              path.moveTo(strokePath[0][0], strokePath[0][1]);

              for (let i = 1; i < strokePath.length; i++) {
                path.lineTo(strokePath[i][0], strokePath[i][1]);
              }

              // Fill for smooth stroke appearance
              ctx.fill(path);

              // Apply dash pattern if defined
              if (element.dashPattern) {
                ctx.save();
                ctx.setLineDash(element.dashPattern);
                ctx.stroke(path);
                ctx.restore();
              }
            }
          }
        } else if (element.type === 'shape') {
          // Handle geometric shapes with proper fill/stroke
          ctx.globalAlpha = element.opacity || 1;

          if (element.path && element.path.length > 0) {
            const shapePath = new Path2D();
            shapePath.moveTo(element.path[0].x, element.path[0].y);

            for (let i = 1; i < element.path.length; i++) {
              shapePath.lineTo(element.path[i].x, element.path[i].y);
            }

            // For closed shapes (not lines), close the path
            if (element.shapeType !== 'line') {
              shapePath.closePath();
            }

            // Fill the shape if it has a fill color
            if (element.fillColor) {
              ctx.fillStyle = element.fillColor;
              ctx.fill(shapePath);
            }

            // Stroke the shape if it has a stroke color and width
            if (element.strokeColor && element.strokeWidth && element.strokeWidth > 0) {
              ctx.strokeStyle = element.strokeColor;
              ctx.lineWidth = element.strokeWidth / zoomLevel; // Scale stroke width for zoom
              ctx.stroke(shapePath);
            }
          }
        } else if (element.type === 'text' && element.position) {
          ctx.save();

          const baseFontSize = element.fontSize || (element.textType === 'simple' ? 15 : 17);
          const fontFamily = element.textType === 'simple'
            ? 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif'
            : 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';

          ctx.font = element.textType === 'simple'
            ? `500 ${baseFontSize}px ${fontFamily}`
            : `600 ${baseFontSize}px ${fontFamily}`;

          const textColor = element.textType === 'simple' ? '#1a1a1a' : '#ffffff';
          const shadowColor = element.textType === 'simple' ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.3)';

          ctx.fillStyle = textColor;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';

          ctx.shadowColor = shadowColor;
          ctx.shadowBlur = element.textType === 'simple' ? 2 : 3;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = element.textType === 'simple' ? 1 : 2;

          ctx.translate(element.position.x, element.position.y);

          if (element.textType === 'colorful' && element.gradientType) {
            const metrics = ctx.measureText(element.text || '');
            const padding = 8;
            const bgWidth = metrics.width + padding * 2;
            const bgHeight = baseFontSize + padding * 1.5;

            const gradient = ctx.createLinearGradient(0, 0, bgWidth, bgHeight);

            switch (element.gradientType) {
              case 'blue':
                gradient.addColorStop(0, '#4F46E5');
                gradient.addColorStop(1, '#3B82F6');
                break;
              case 'purple':
                gradient.addColorStop(0, '#8B5CF6');
                gradient.addColorStop(1, '#A855F7');
                break;
              case 'green':
                gradient.addColorStop(0, '#10B981');
                gradient.addColorStop(1, '#059669');
                break;
              case 'orange':
                gradient.addColorStop(0, '#F97316');
                gradient.addColorStop(1, '#EA580C');
                break;
              case 'pink':
                gradient.addColorStop(0, '#EC4899');
                gradient.addColorStop(1, '#DB2777');
                break;
              case 'teal':
                gradient.addColorStop(0, '#14B8A6');
                gradient.addColorStop(1, '#0D9488');
                break;
            }

            const cornerRadius = 6;
            ctx.save();
            ctx.fillStyle = gradient;
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.moveTo(-padding + cornerRadius, -padding);
            ctx.lineTo(bgWidth - padding - cornerRadius, -padding);
            ctx.arcTo(bgWidth - padding, -padding, bgWidth - padding, -padding + cornerRadius, cornerRadius);
            ctx.lineTo(bgWidth - padding, bgHeight - padding - cornerRadius);
            ctx.arcTo(bgWidth - padding, bgHeight - padding, bgWidth - padding - cornerRadius, bgHeight - padding, cornerRadius);
            ctx.lineTo(-padding + cornerRadius, bgHeight - padding);
            ctx.arcTo(-padding, bgHeight - padding, -padding, bgHeight - padding - cornerRadius, cornerRadius);
            ctx.lineTo(-padding, -padding + cornerRadius);
            ctx.arcTo(-padding, -padding, -padding + cornerRadius, -padding, cornerRadius);
            ctx.closePath();

            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }

          const lines = (element.text || '').split('\n');
          const lineHeight = baseFontSize * 1.2;

          lines.forEach((line, index) => {
            ctx.fillText(line, 0, index * lineHeight);
          });

          if (editingElementId === element.id) {
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

      // Render temp path (current drawing) using master's smooth algorithm
      if (tempPath.length > 1) {
        // Use master's perfect-freehand implementation for ultra-smooth strokes
        const inputPoints = tempPath.map(p => [p.x, p.y, p.pressure || 0.5]);
        const strokeOptions = {
          simulatePressure: penSettings.pressureEnabled,
          size: Math.max(1, penSettings.strokeWidth / zoomLevel),  // Scale stroke width for zoom consistency (preview)
          thinning: 0.6,
          smoothing: 0.5,
          streamline: 0.5,
          easing: (t: number) => Math.sin((t * Math.PI) / 2), // easeOutSine
          last: false,
        };

        const strokePath = getStroke(inputPoints as number[][], strokeOptions);

        if (strokePath.length > 0) {
          ctx.save();

          // Configure context like master's implementation
          ctx.strokeStyle = strokeColor;
          ctx.fillStyle = strokeColor;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.globalAlpha = 1;

          // Use Path2D for smooth curves (like master)
          const path = new Path2D();
          path.moveTo(strokePath[0][0], strokePath[0][1]);

          for (let i = 1; i < strokePath.length; i++) {
            path.lineTo(strokePath[i][0], strokePath[i][1]);
          }

          // Fill the stroke path for ultra smooth result
          ctx.fill(path);
          ctx.restore();
        }
      }

      // Draw eraser preview cursor as a little square with slightly rounded corners
      if (activeTool === 'eraser' && eraserSettings.previewEnabled) {
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(255, 68, 68, 0.1)';

        const cursorSize = Math.max(8, eraserSettings.size / zoomLevel);
        const halfSize = cursorSize / 2;
        const cornerRadius = 2 / zoomLevel; // Slightly rounded corners

        // Draw rounded square (using manual path for broader compatibility)
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

      // Draw eraser path preview during drawing
      if (eraserPath.length > 1 && activeTool === 'eraser') {
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);

        ctx.beginPath();
        ctx.moveTo(eraserPath[0].x, eraserPath[0].y);
        for (let i = 1; i < eraserPath.length; i++) {
          ctx.lineTo(eraserPath[i].x, eraserPath[i].y);
        }
        ctx.stroke();
        ctx.restore();
      }


      // Render uploaded images on the canvas (no blinking - use cached images)
      for (const image of images) {
        // Only render if image is loaded
        if (image.img && imagesLoaded.has(image.id) && image.img.complete) {
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
      if (isCreatingShape && activeTool === 'shapes') {
        ctx.save();
        ctx.strokeStyle = '#000';
        ctx.fillStyle = 'transparent';
        ctx.lineWidth = shapeSettings.strokeWidth;
        ctx.setLineDash([5, 5]);
        ctx.globalAlpha = 0.7;

        const previewShapePath = createShapePath(startPoint, mousePosition, shapeSettings);

        ctx.beginPath();
        ctx.moveTo(previewShapePath[0].x, previewShapePath[0].y);
        for (let i = 1; i < previewShapePath.length; i++) {
          ctx.lineTo(previewShapePath[i].x, previewShapePath[i].y);
        }

        if (shapeSettings.selectedShape !== 'line') {
          ctx.closePath();
          ctx.fill();
        }
        ctx.stroke();
        ctx.restore();
      }

      // Draw marquee selection rectangle
      if (marqueeRect && selectionMode === 'marquee') {
        ctx.save();
        ctx.strokeStyle = '#007bff';
        ctx.fillStyle = 'rgba(0, 123, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);

        ctx.fillRect(marqueeRect.x, marqueeRect.y, marqueeRect.width, marqueeRect.height);
        ctx.strokeRect(marqueeRect.x, marqueeRect.y, marqueeRect.width, marqueeRect.height);

        ctx.restore();
      }

      // Draw transform handles for selected elements
      if (transformHandles.length > 0) {
        ctx.save();
        ctx.strokeStyle = '#007acc';
        ctx.fillStyle = '#007acc';
        ctx.lineWidth = 1;

        // Draw handle rectangles
        const handleSize = 8;
        transformHandles.forEach(handle => {
          ctx.save();
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#007acc';
          ctx.lineWidth = 2;

          if (handle.type === 'rotation') {
            // Draw rotation handle as circle
            ctx.beginPath();
            ctx.arc(handle.position.x, handle.position.y, handleSize / 2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
          } else {
            // Draw corner and edge handles as squares
            ctx.fillRect(
              handle.position.x - handleSize / 2,
              handle.position.y - handleSize / 2,
              handleSize,
              handleSize
            );
            ctx.strokeRect(
              handle.position.x - handleSize / 2,
              handle.position.y - handleSize / 2,
              handleSize,
              handleSize
            );
          }
          ctx.restore();
        });

        ctx.restore();
      }

      // Removed connector preview - using shapes only for Tool 9

      // Restore the context to remove zoom transform
      ctx.restore();
    });
  };

  useEffect(() => {
    redrawCanvas();
  }, [drawingElements, tempPath, activeTool, mousePosition, eraserSettings, eraserPath, zoomLevel, scrollX, scrollY, images, editingElementId]);

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gridSize = 20;
    const scaledGridSize = gridSize * zoomLevel;

    const startX = -scrollX % scaledGridSize;
    const startY = -scrollY % scaledGridSize;

    ctx.save();
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;

    for (let x = startX; x < canvas.width; x += scaledGridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    for (let y = startY; y < canvas.height; y += scaledGridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    ctx.restore();
  };

  // Public method for placing emojis
  const placeEmoji = (emoji: string, screenPosition: { x: number; y: number }) => {
    console.log('🎨 DrawingCanvas.placeEmoji called with:', emoji, 'at screen position:', screenPosition);

    // Create a synthetic pointer event at the screen position to get canvas coordinates
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('❌ Canvas ref is null');
      return;
    }

    const rect = canvas.getBoundingClientRect();
    console.log('Canvas rect:', rect);

    // Convert screen coordinates using Excalidraw-style coordinate system
    const rawX = screenPosition.x - rect.left;
    const rawY = screenPosition.y - rect.top;
    const canvasX = (rawX + scrollX) / zoomLevel;
    const canvasY = (rawY + scrollY) / zoomLevel;

    const canvasPosition = { x: canvasX, y: canvasY };

    console.log('📍 Converted screen to canvas position:', canvasPosition);
    console.log('Scroll:', scrollX, scrollY, 'Zoom:', zoomLevel);

    try {
      createEmojiAtPosition(emoji, canvasPosition);
      console.log('✅ Emoji placed successfully');
    } catch (error) {
      console.error('❌ Error placing emoji:', error);
    }
  };

  // Public method for placing graphs
  const placeGraph = () => {
    console.log('Placing graph on canvas');

    // Create graph at center of current view
    const centerX = -scrollX;
    const centerY = -scrollY;

    createGraphObject({ x: centerX, y: centerY });
  };

  // Public method for placing flowchart shapes
  const placeFlowCharthenartShape = (shapeType: 'oval' | 'rectangle' | 'diamond') => {
    console.log('Placing flowchart shape:', shapeType);

    // Create shape at center of current view
    const centerX = -scrollX;
    const centerY = -scrollY;

    const position = { x: centerX, y: centerY };

    // Temporarily update graph settings to indicate the selected shape
    // setGraphSettings(prev => ({ ...prev, selectedAction: shapeType as any }));

    // Place the shape using existing logic
    placeFlowchartShape(position);
  };

  const activateSelectionTool = useCallback(() => {
   setDrawingElements(prevElements =>
     prevElements.map(el => ({
       ...el,
       selectable: true,
       evented: true,
       lockMovementX: false,
       lockMovementY: false,
     }))
   );
   // setActiveTool('selection'); // This should be handled by the parent component by changing the prop
   console.log('Selection tool activated for all elements.');
 }, []);

  // Add elements via action (used by FlowCharts component)
  // const addElementsViaAction = useCallback((elements: any[]) => {
  //   console.log('Adding elements via action:', elements);
  //   saveInitialState();
  //   setDrawingElements(prev => [...prev, ...elements]);
  // }, []);
// Add the conversion helper function RIGHT BEFORE addElementsViaAction
const convertExcalidrawToDrawingElement = (excalidrawElement: any): DrawingElement | null => {
  const baseElement: Partial<DrawingElement> = {
    id: excalidrawElement.id || `element-${Date.now()}-${Math.random()}`,
    strokeColor: excalidrawElement.strokeColor || '#000000',
    strokeWidth: excalidrawElement.strokeWidth || 2,
    opacity: (excalidrawElement.opacity || 100) / 100,
    selectable: true,
    evented: true,
    lockMovementX: false,
    lockMovementY: false,
  };

  const { x, y, width, height, type } = excalidrawElement;

  switch (type) {
    case 'rectangle':
    case 'ellipse':
    case 'diamond':
      baseElement.type = 'shape';
      baseElement.fillColor = excalidrawElement.backgroundColor || '#d4a574';
      baseElement.shapeType = type;
      
      if (type === 'rectangle') {
        baseElement.path = [
          { x, y },
          { x: x + width, y },
          { x: x + width, y: y + height },
          { x, y: y + height }
        ];
      } else if (type === 'ellipse') {
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const radiusX = width / 2;
        const radiusY = height / 2;
        baseElement.path = [];
        for (let i = 0; i <= 32; i++) {
          const angle = (i / 32) * 2 * Math.PI;
          baseElement.path.push({
            x: centerX + radiusX * Math.cos(angle),
            y: centerY + radiusY * Math.sin(angle)
          });
        }
      } else if (type === 'diamond') {
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        baseElement.path = [
          { x: centerX, y },
          { x: x + width, y: centerY },
          { x: centerX, y: y + height },
          { x, y: centerY }
        ];
      }
      break;

    case 'arrow':
    case 'line':
      baseElement.type = 'path';
      if (excalidrawElement.points && excalidrawElement.points.length > 0) {
        baseElement.path = excalidrawElement.points.map((p: number[]) => ({
          x: x + p[0],
          y: y + p[1],
          pressure: 0.5
        }));
      }
      break;

    case 'text':
      baseElement.type = 'text';
      baseElement.text = excalidrawElement.text || '';
      baseElement.fontSize = excalidrawElement.fontSize || 16;
      baseElement.position = { x, y };
      break;

    default:
      console.warn(`Unknown element type: ${type}`);
      return null;
  }

  return baseElement as DrawingElement;
};

// UPDATED addElementsViaAction function
const addElementsViaAction = useCallback((elements: any[]) => {
  console.log('🎨 addElementsViaAction called with', elements.length, 'elements');
  
  const convertedElements = elements
    .map(convertExcalidrawToDrawingElement)
    .filter((el): el is DrawingElement => el !== null);
  
  console.log('✅ Converted', convertedElements.length, 'elements successfully');
  console.log('Sample converted element:', convertedElements[0]);
  
  saveInitialState();
  setDrawingElements(prev => {
    const newElements = [...prev, ...convertedElements];
    console.log('📊 Total elements now:', newElements.length);
    return newElements;
  });
  
  // Force canvas redraw
  setTimeout(() => redrawCanvas(true), 100);
}, [saveInitialState]); // Add saveInitialState to dependencies

  // Assign methods to the forwarded ref
  useEffect(() => {
    if (forwardedRef) {
      forwardedRef.current = {
        undo,
        redo,
        handleImageUpload,
        placeEmoji,
        placeGraph,
        placeFlowchartShape: placeFlowCharthenartShape,
        activateSelectionTool,
        addElementsViaAction
      };
    }
  }, [forwardedRef, undo, redo, handleImageUpload, placeEmoji, placeGraph, placeFlowCharthenartShape, canvasSize, activateSelectionTool, addElementsViaAction]);

  // Dynamic cursor style based on selected tool
  const getCursorStyle = () => {
    let cursor = "default";

    switch (activeTool) {
      case "hand":
        cursor = isHandActive ? "grabbing" : "grab"; // Open hand when idle, clenched when dragging
        break;
      case "selection":
        // Check for transform handle hover when selection tool is active
        if (selectedElementIds.length > 0 || selectedImageId) {
          const hoveredHandle = getHoveredHandle(mousePosition.x, mousePosition.y);
          if (hoveredHandle && hoveredHandle.cursor) {
            cursor = hoveredHandle.cursor;
          } else {
            cursor = "default";
          }
        } else {
          cursor = "default";
        }
        break;
      case "pencil":
        // Use simple crosshair cursor that doesn't have zoom alignment issues
        cursor = "crosshair";
        console.log('Pencil Tool Active - Using crosshair cursor for consistent zoom behavior');
        break;
      case "eraser":
        // Hide default cursor and show custom eraser square
        cursor = "none";
        console.log('Eraser Tool Active - Using custom square cursor');
        break;
      case "text":
        // Use text cursor when hovering over text notes, or simple "text" for text tool
        cursor = getHoveredTextElementId(mousePosition.x, mousePosition.y) ? "text" : "text";
        console.log('Text Tool Active - Text editing cursor');
        break;
      case "sticky":
        cursor = "pointer"; // Upload media tool uses pointer
        break;
      case "emoji":
        cursor = "pointer"; // Emoji tool uses pointer
        break;
      case "shapes":
        cursor = "crosshair"; // Shapes tool uses crosshair
        break;
      case "graph":
        cursor = "pointer"; // Graph tool uses pointer
        break;
      default:
        cursor = "default";
        break;
    }

    console.log(`Final Cursor: ${cursor} for tool: ${activeTool}`);

    return cursor;
  };

  return (
    <div id="canvas-background" className="fixed inset-0" style={{
      background: 'transparent'
    }}>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="absolute inset-0"
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
          cursor: getCursorStyle()
        }}
        aria-label="Drawing canvas with freehand pencil tool"
        role="img"
        tabIndex={0}
      />

      {/* Autonomous Pen Tool - only show when pencil tool is active */}
      <AutonomousPenTool
        ref={penToolRef}
        penSettings={penSettings}
        onPenSettingsChange={(newSettings) => {
          setPenSettings(newSettings);
          onPenSettingsChange?.(newSettings);
        }}
        isVisible={activeTool === "pencil"}
        onClose={() => {
          // Optional: handle panel close if needed
        }}
      />

      {/* Atools Canvas Background Integration */}
      {activeTool === "background" && (
        <div className="absolute top-20 left-6 z-60">
          <style dangerouslySetInnerHTML={{
            __html: `
              .CanvasBackgroundContainer {
                background: white;
                border: 1px solid rgba(0,0,0,0.1);
                border-radius: 8px;
                padding: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                min-width: 120px;
              }

              .CanvasBackgroundOption {
                width: 32px;
                height: 32px;
                margin: 4px;
                border: 2px solid transparent;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.15s ease;
              }

              .CanvasBackgroundOption:hover {
                border-color: #4285f4;
                transform: scale(1.1);
              }
            `
          }} />

          <div className="CanvasBackgroundContainer">
            <div className="text-xs font-semibold text-gray-800 mb-2">Background</div>
            <div className="flex flex-wrap">
              {/* Atools Color Options */}
              <button
                className="CanvasBackgroundOption"
                style={{ backgroundColor: '#ffffff' }}
                title="White Background"
                onClick={() => {
                  // Change canvas background
                  document.querySelector('#canvas-background')?.setAttribute('style', 'background: #ffffff;');
                }}
              />

              <button
                className="CanvasBackgroundOption"
                style={{ backgroundColor: '#e3f2fd' }}
                title="Blue Background"
                onClick={() => {
                  document.querySelector('#canvas-background')?.setAttribute('style', 'background: #e3f2fd;');
                }}
              />
              <button
                className="CanvasBackgroundOption"
                style={{ backgroundColor: '#e8f5e8' }}
                title="Green Background"
                onClick={() => {
                  document.querySelector('#canvas-background')?.setAttribute('style', 'background: #e8f5e8;');
                }}
              />
              <button
                className="CanvasBackgroundOption"
                style={{ backgroundColor: '#fffde7' }}
                title="Yellow Background"
                onClick={() => {
                  document.querySelector('#canvas-background')?.setAttribute('style', 'background: #fffde7;');
                }}
              />
              <button
                className="CanvasBackgroundOption"
                style={{ backgroundColor: '#fce4ec' }}
                title="Pink Background"
                onClick={() => {
                  document.querySelector('#canvas-background')?.setAttribute('style', 'background: #fce4ec;');
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Autonomous Eraser Tool - only show when eraser tool is active */}
      <AutonomousEraserTool
        ref={eraserToolRef}
        eraserSettings={eraserSettings}
        onEraserSettingsChange={setEraserSettings}
        isVisible={activeTool === "eraser"}
        onClose={() => {
          // Optional: handle panel close if needed
        }}
      />

      {/* Autonomous Shape Tool - only show when shapes tool is active */}
      <AutonomousShapeTool
        ref={shapeToolRef}
        shapeSettings={shapeSettings}
        onShapeSettingsChange={(newSettings) => {
          setShapeSettings(prev => ({ ...prev, ...newSettings }));
        }}
        startPoint={isCreatingShape ? startPoint : undefined}
        mousePosition={isCreatingShape ? mousePosition : undefined}
        isVisible={activeTool === "shapes"}
        onClose={() => {
          // Optional: handle panel close if needed
        }}
      />

      {/* Autonomous Selection Tool - only show when selection tool is active */}
      <AutonomousSelectionTool
        ref={selectionToolRef}
        selectionSettings={selectionSettings}
        onSelectionSettingsChange={setSelectionSettings}
        selectedElementCount={selectedElementIds.length + (selectedImageId ? 1 : 0)}
        onSelectAll={selectAll}
        onDeleteSelected={() => {
          setDrawingElements(prev => prev.filter(el => !selectedElementIds.includes(el.id)));
          setImages(prev => prev.map(img => ({ ...img, selected: false })));
          setSelectedElementIds([]);
          setSelectedImageId(null);
          setTransformHandles([]);
        }}
        isVisible={activeTool === "selection"}
        onClose={() => {
          // Optional: handle panel close if needed
        }}
        isActive={activeTool === "selection"}
        canvasRef={canvasRef}
        isGridVisible={isGridVisible}
        onGridVisibilityChange={setIsGridVisible}
        onGroup={() => {
          if (selectedElementIds.length > 1) {
            const newGroup: DrawingElement = {
              id: `group-${generateId()}`,
              type: 'group',
              children: [...selectedElementIds],
            };
            setDrawingElements(prev => [...prev.filter(el => !selectedElementIds.includes(el.id)), newGroup]);
            setSelectedElementIds([newGroup.id]);
          }
        }}
        onUngroup={() => {
          const newElements: DrawingElement[] = [];
          const newSelectedIds: string[] = [];
          drawingElements.forEach(el => {
            if (selectedElementIds.includes(el.id) && el.type === 'group' && el.children) {
              el.children.forEach(childId => {
                const child = drawingElements.find(e => e.id === childId);
                if (child) {
                  newElements.push(child);
                  newSelectedIds.push(child.id);
                }
              });
            } else {
              newElements.push(el);
            }
          });
          setDrawingElements(newElements);
          setSelectedElementIds(newSelectedIds);
        }}
        isMovementXLocked={drawingElements.some(el => selectedElementIds.includes(el.id) && el.lockMovementX)}
        isMovementYLocked={drawingElements.some(el => selectedElementIds.includes(el.id) && el.lockMovementY)}
        onSetMovementLock={(axis, locked) => {
         setDrawingElements(prev => prev.map(el => {
           if (selectedElementIds.includes(el.id)) {
             return { ...el, [axis === 'x' ? 'lockMovementX' : 'lockMovementY']: locked };
           }
           return el;
         }));
       }}
      />

      {/* FlowchartPanel - show when flowchart tool is active */}
    

      <FlowchartPanel
  isVisible={activeTool === "graph"}
  onClose={() => {
    // Since activeTool is a prop from parent, we can't change it directly
    // The parent component needs to handle this
    console.log("FlowchartPanel close requested - parent should handle activeTool change");
  }}
  addElementsViaAction={addElementsViaAction}
/>





      {/* Shapes Size Readout */}
      {isCreatingShape && activeTool === "shapes" && (
        <div className="fixed top-32 left-6 bg-black/80 text-white px-3 py-1 rounded text-sm font-mono">
          {(() => {
            const width = Math.abs(mousePosition.x - startPoint.x);
            const height = Math.abs(mousePosition.y - startPoint.y);
            return Math.round(width) + " × " + Math.round(height);
          })()}
        </div>
      )}





      {activeTool === "eraser" && (
        <div className="fixed top-24 left-6 bg-white/10 backdrop-blur-md rounded-full p-2 border border-white/20 shadow-lg">
          <span className="text-2xl">🗞️</span>
        </div>
      )}

      {activeTool === "shapes" && (
        <div className="fixed top-24 left-6 bg-white/10 backdrop-blur-md rounded-full p-2 border border-white/20 shadow-lg">
          <span className="text-xl">⬜</span>
        </div>
      )}

     

      {activeTool === "selection" && (
        <div className="fixed top-24 left-6 bg-white/10 backdrop-blur-md rounded-full p-2 border border-white/20 shadow-lg">
          <span className="text-xl">↗</span>
        </div>
      )}

      {/* Bottom Left Zoom Controls */}
      <div className="fixed bottom-6 left-6 z-40 flex gap-2">
        {/* Zoom Controls */}
        <div className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-md shadow-md flex items-center px-1.5 py-1">
          <button
            className="h-6 w-6 p-0 rounded-sm hover:bg-gray-100/80 text-gray-600 flex items-center justify-center transition-colors"
            onClick={() => {
              // Fixed 10% decrement (convert to percentage, subtract 10%, convert back)
              const currentPercentage = zoomLevel * 100;
              const newPercentage = Math.max(currentPercentage - 10, 10);
              const newZoom = newPercentage / 100;
              onZoomChange?.(newZoom);
            }}
            title="Zoom out"
          >
            <Minus className="h-3 w-3" />
          </button>

          <span className="mx-2 text-xs font-medium text-gray-700 min-w-[2.5rem] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>

          <button
            className="h-6 w-6 p-0 rounded-sm hover:bg-gray-100/80 text-gray-600 flex items-center justify-center transition-colors"
            onClick={() => {
              // Fixed 10% increment (convert to percentage, add 10%, convert back)
              const currentPercentage = zoomLevel * 100;
              const newPercentage = Math.min(currentPercentage + 10, 500);
              const newZoom = newPercentage / 100;
              onZoomChange?.(newZoom);
            }}
            title="Zoom in"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        {/* Undo/Redo Controls */}
        <div className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-md shadow-md flex items-center px-1 py-1 gap-0.5">
          <button
            className={`h-6 w-6 p-0 rounded-sm flex items-center justify-center transition-colors ${
              undoHistory.length > 0
                ? "hover:bg-gray-100/80 text-gray-600"
                : "text-gray-300 cursor-not-allowed"
            }`}
            onClick={undo}
            disabled={undoHistory.length === 0}
            title="Undo"
          >
            <Undo2 className="h-3 w-3" />
          </button>

          <button
            className={`h-6 w-6 p-0 rounded-sm flex items-center justify-center transition-colors ${
              redoHistory.length > 0
                ? "hover:bg-gray-100/80 text-gray-600"
                : "text-gray-300 cursor-not-allowed"
            }`}
            onClick={redo}
            disabled={redoHistory.length === 0}
            title="Redo"
          >
            <Redo2 className="h-3 w-3" />
          </button>
        </div>
      </div>


    </div>
  );
};
