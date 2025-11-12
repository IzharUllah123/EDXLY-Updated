import { Point, DrawingElement } from "../DrawingCanvas";

export interface SelectionHandle {
  id: string;
  type: 'corner' | 'edge' | 'rotation';
  position: Point;
  cursor: string;
}

export function handleSelectionD(point: PointerEvent): { isHandActive: boolean; lastPanPoint: Point } {
  return {
    isHandActive: true,
    lastPanPoint: { x: point.clientX, y: point.clientY }
  };
}

export function handleSelectionMove(
  isHandActive: boolean,
  ev: PointerEvent,
  lastPanPoint: Point,
  scrollX: number,
  scrollY: number,
  CANVAS_MAX_PAN: number
): { newScrollX: number; newScrollY: number; newLastPanPoint: Point } | null {
  if (!isHandActive) return null;

  const screenX = ev.clientX;
  const screenY = ev.clientY;
  const deltaX = screenX - lastPanPoint.x;
  const deltaY = screenY - lastPanPoint.y;
  const newScrollX = Math.max(-CANVAS_MAX_PAN, Math.min(CANVAS_MAX_PAN, scrollX + deltaX));
  const newScrollY = Math.max(-CANVAS_MAX_PAN, Math.min(CANVAS_MAX_PAN, scrollY + deltaY));

  return {
    newScrollX,
    newScrollY,
    newLastPanPoint: { x: screenX, y: screenY }
  };
}

interface HitTestResult {
  element: DrawingElement | null;
  offsets?: { x: number; y: number };
}

/**
 * Advanced hit test for text elements using accurate bounding box detection
 */
export function getHoveredTextElementId(
  elements: DrawingElement[],
  mouseX: number,
  mouseY: number
): string | null {
  for (let i = elements.length - 1; i >= 0; i--) {
    const element = elements[i];
    if (element.type !== 'text' || !element.position) continue;

    const temp = document.createElement("canvas");
    const ctx = temp.getContext("2d");
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
      if (metrics.width > maxWidth) maxWidth = metrics.width;
    });

    const textWidth = maxWidth;
    const textHeight = lines.length * lineHeight;

    const left = element.position.x;
    const top = element.position.y;
    const right = left + textWidth;
    const bottom = top + textHeight;

    if (mouseX >= left && mouseX <= right && mouseY >= top && mouseY <= bottom) {
      return element.id;
    }
  }
  return null;
}

/**
 * Hit test for image elements
 */
function hitTestImageElement(
  elements: DrawingElement[],
  mouseX: number,
  mouseY: number
): HitTestResult {
  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i];
    
    if (el.type === 'image' && el.position && el.width && el.height) {
      const { position, width, height } = el;
      
      if (
        mouseX >= position.x &&
        mouseX <= position.x + width &&
        mouseY >= position.y &&
        mouseY <= position.y + height
      ) {
        return {
          element: el,
          offsets: {
            x: position.x - mouseX,
            y: position.y - mouseY
          }
        };
      }
    }
  }
  
  return { element: null };
}

/**
 * Hit test for shape elements (rectangles, ellipses, diamonds with position + size)
 */
function hitTestShapeElement(
  elements: DrawingElement[],
  mouseX: number,
  mouseY: number
): HitTestResult {
  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i];
    
    if (el.type === 'shape' && el.position && el.size) {
      const { position, size } = el;
      
      // Add padding for easier selection
      const padding = 5;
      
      if (
        mouseX >= position.x - padding &&
        mouseX <= position.x + size.width + padding &&
        mouseY >= position.y - padding &&
        mouseY <= position.y + size.height + padding
      ) {
        return {
          element: el,
          offsets: {
            x: position.x - mouseX,
            y: position.y - mouseY
          }
        };
      }
    }
  }
  
  return { element: null };
}

/**
 * Comprehensive hit test that works with all element types including text, images, and shapes
 * Now includes bounding box detection for easier selection
 */
export function hitTestElement(
  elements: DrawingElement[],
  point: Point,
  strokeWidth?: number
): HitTestResult {
  // First check for text elements using accurate method
  const textId = getHoveredTextElementId(elements, point.x, point.y);
  if (textId) {
    const textElement = elements.find(el => el.id === textId);
    if (textElement) {
      return {
        element: textElement,
        offsets: {
          x: textElement.position?.x ? textElement.position.x - point.x : 0,
          y: textElement.position?.y ? textElement.position.y - point.y : 0
        }
      };
    }
  }

  // Check for image elements
  const imageHit = hitTestImageElement(elements, point.x, point.y);
  if (imageHit.element) {
    return imageHit;
  }

  // Check for shape elements (position + size)
  const shapeHit = hitTestShapeElement(elements, point.x, point.y);
  if (shapeHit.element) {
    return shapeHit;
  }

  // Check path-based elements with both stroke and bounding box detection
  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i];
    if (!el) continue;

    if (el.path && el.path.length > 0) {
      // Calculate bounding box for the element
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      el.path.forEach(p => {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      });

      // Check if point is within expanded bounding box
      const padding = 15; // Generous padding for easier selection
      const inBoundingBox = point.x >= minX - padding && point.x <= maxX + padding &&
                           point.y >= minY - padding && point.y <= maxY + padding;
      
      if (!inBoundingBox) continue; // Skip if not even close
      
      // For path-based shapes (lines, arrows, drawn shapes from tool 8)
      // Check if this is a shape type element
      if (el.shapeType && (
        el.shapeType === 'line' || 
        el.shapeType === 'arrow' ||
        el.shapeType === 'rectangle' ||
        el.shapeType === 'rounded-rectangle' ||
        el.shapeType === 'circle' ||
        el.shapeType === 'ellipse' ||
        el.shapeType === 'diamond' ||
        el.shapeType === 'polygon' ||
        el.shapeType === 'star'
      )) {
        // For shapes, accept clicks within the bounding box
        return { 
          element: el, 
          offsets: { 
            x: el.path[0].x - point.x, 
            y: el.path[0].y - point.y
          } 
        };
      }
      
      // For filled shapes, accept any click within the bounding box
      if (el.fillColor && el.type === 'shape') {
        return { 
          element: el, 
          offsets: { 
            x: el.position?.x ? el.position.x - point.x : (el.path[0].x - point.x), 
            y: el.position?.y ? el.position.y - point.y : (el.path[0].y - point.y)
          } 
        };
      }

      // For drawings/strokes, check if within bounding box with smaller padding
      const tightPadding = 20; // More generous for freehand drawings
      if (point.x >= minX - tightPadding && point.x <= maxX + tightPadding &&
          point.y >= minY - tightPadding && point.y <= maxY + tightPadding) {
        
        // Accept the element if within the tight bounding box
        // This allows clicking anywhere near the drawing to select it
        return { 
          element: el, 
          offsets: { 
            x: el.position?.x ? el.position.x - point.x : (el.path[0].x - point.x), 
            y: el.position?.y ? el.position.y - point.y : (el.path[0].y - point.y)
          } 
        };
      }

      // Fallback: check exact stroke proximity (legacy behavior)
      for (let k = 0; k < el.path.length - 1; k++) {
        const a = el.path[k];
        const b = el.path[k + 1];
        const dx = b.x - a.x, dy = b.y - a.y;
        const length = Math.hypot(dx, dy);
        if (length === 0) {
          if (Math.hypot(point.x - a.x, point.y - a.y) < ((strokeWidth || 2) + 15)) {
            return { 
              element: el, 
              offsets: { 
                x: el.position?.x ? el.position.x - point.x : (a.x - point.x), 
                y: el.position?.y ? el.position.y - point.y : (a.y - point.y)
              } 
            };
          }
          continue;
        }
        const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (length * length)));
        const projX = a.x + t * dx;
        const projY = a.y + t * dy;
        const dist = Math.hypot(point.x - projX, point.y - projY);
        if (dist < ((strokeWidth || 2) + 15)) {
          return { 
            element: el, 
            offsets: { 
              x: el.position?.x ? el.position.x - point.x : (a.x - point.x), 
              y: el.position?.y ? el.position.y - point.y : (a.y - point.y)
            } 
          };
        }
      }
    }
  }
  return { element: null };
}

/**
 * Calculate bounding box for selected elements
 */
export function calculateBounds(
  elementIds: string[],
  elements: DrawingElement[]
): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  elementIds.forEach(id => {
    const element = elements.find(el => el.id === id);
    if (!element) return;

    if (element.path && element.path.length > 0) {
      element.path.forEach(point => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });
    } else if (element.position) {
      // For text elements, consider the text width/height
      if (element.type === 'text') {
        const textWidth = (element.text || '').length * 12;
        const textHeight = element.fontSize || 16;
        minX = Math.min(minX, element.position.x);
        minY = Math.min(minY, element.position.y);
        maxX = Math.max(maxX, element.position.x + textWidth);
        maxY = Math.max(maxY, element.position.y + textHeight);
      }
      // For image elements
      else if (element.type === 'image' && element.width && element.height) {
        minX = Math.min(minX, element.position.x);
        minY = Math.min(minY, element.position.y);
        maxX = Math.max(maxX, element.position.x + element.width);
        maxY = Math.max(maxY, element.position.y + element.height);
      }
      // For shape elements with size
      else if (element.type === 'shape' && element.size) {
        minX = Math.min(minX, element.position.x);
        minY = Math.min(minY, element.position.y);
        maxX = Math.max(maxX, element.position.x + element.size.width);
        maxY = Math.max(maxY, element.position.y + element.size.height);
      }
      else {
        minX = Math.min(minX, element.position.x);
        minY = Math.min(minY, element.position.y);
        maxX = Math.max(maxX, element.position.x);
        maxY = Math.max(maxY, element.position.y);
      }
    }
  });

  return {
    minX: minX === Infinity ? 0 : minX,
    minY: minY === Infinity ? 0 : minY,
    maxX: maxX === -Infinity ? 0 : maxX,
    maxY: maxY === -Infinity ? 0 : maxY
  };
}

/**
 * Calculate transform handles for selected elements
 */
export function calculateTransformHandles(
  elementIds: string[],
  elements: DrawingElement[]
): SelectionHandle[] {
  const handles: SelectionHandle[] = [];
  if (elementIds.length === 0) return handles;

  const bounds = calculateBounds(elementIds, elements);
  if (bounds.minX === Infinity) return handles;

  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  const centerX = bounds.minX + width / 2;
  const centerY = bounds.minY + height / 2;

  // Create 8 corner/edge handles + 1 rotation handle
  handles.push(
    { id: 'nw', type: 'corner', position: { x: bounds.minX, y: bounds.minY }, cursor: 'nw-resize' },
    { id: 'ne', type: 'corner', position: { x: bounds.maxX, y: bounds.minY }, cursor: 'ne-resize' },
    { id: 'sw', type: 'corner', position: { x: bounds.minX, y: bounds.maxY }, cursor: 'sw-resize' },
    { id: 'se', type: 'corner', position: { x: bounds.maxX, y: bounds.maxY }, cursor: 'se-resize' },
    { id: 'n', type: 'edge', position: { x: centerX, y: bounds.minY }, cursor: 'n-resize' },
    { id: 'e', type: 'edge', position: { x: bounds.maxX, y: centerY }, cursor: 'e-resize' },
    { id: 's', type: 'edge', position: { x: centerX, y: bounds.maxY }, cursor: 's-resize' },
    { id: 'w', type: 'edge', position: { x: bounds.minX, y: centerY }, cursor: 'w-resize' },
    { id: 'rotation', type: 'rotation', position: { x: centerX, y: bounds.minY - 20 }, cursor: 'crosshair' }
  );

  return handles;
}

/**
 * Check if mouse is hovering over a transform handle
 */
export function getHoveredHandle(
  mouseX: number,
  mouseY: number,
  handles: SelectionHandle[]
): SelectionHandle | null {
  if (handles.length === 0) return handles;

  const handleSize = 8;
  for (const handle of handles) {
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
}

/**
 * Handles initiating a new selection (single element drag or marquee).
 * Group dragging is handled in DrawingCanvas.tsx.
 */
export function handleSelectionDown(
  hitTestResult: HitTestResult,
  scenePt: Point
) {
  if (hitTestResult.element) {
    // Clicked on an element, prepare for single-element drag
    const el = hitTestResult.element;
    const offsets: { [elementId: string]: { x: number; y: number } } = {};
    
    if (el.position) {
      offsets[el.id] = { x: el.position.x - scenePt.x, y: el.position.y - scenePt.y };
    } else if (el.path && el.path.length > 0) {
      offsets[el.id] = { x: el.path[0].x - scenePt.x, y: el.path[0].y - scenePt.y };
    }

    return {
      selectedElementIds: [el.id],
      isDraggingSelection: true,
      dragOffsets: offsets,
      selectionMode: null,
      selectionStart: scenePt,
    };
  } else {
    // Clicked on empty space, prepare for marquee selection
    return {
      selectedElementIds: [],
      isDraggingSelection: false,
      dragOffsets: {},
      selectionMode: 'marquee' as const,
      selectionStart: scenePt,
    };
  }
}

/**
 * **REFACTORED**
 * Moves all selected elements based on the current mouse position and their initial offsets.
 * This works for single elements and groups, including images and shapes.
 */
export function handleSelectionDragMove(
  isDraggingSelection: boolean,
  selectedElementIds: string[],
  scenePt: Point,
  dragOffsets: { [elementId: string]: { x: number; y: number } },
  elements: DrawingElement[],
  updateElement: (id: string, element: DrawingElement) => void
): void {
  if (!isDraggingSelection || selectedElementIds.length === 0) return;

  selectedElementIds.forEach(id => {
    const element = elements.find(e => e.id === id);
    const offset = dragOffsets[id];
    if (!element || !offset) return;

    const updatedElement = { ...element };
    
    const canMoveX = !updatedElement.lockMovementX;
    const canMoveY = !updatedElement.lockMovementY;

    // Handle position-based elements (text, emojis, stickies, images, shapes with size)
    if (updatedElement.position) {
      const newX = canMoveX ? scenePt.x + offset.x : updatedElement.position.x;
      const newY = canMoveY ? scenePt.y + offset.y : updatedElement.position.y;

      // Calculate the change (delta) from the *original* element's position
      const dx = newX - element.position!.x;
      const dy = newY - element.position!.y;
      
      // Update the position
      updatedElement.position = { x: newX, y: newY };

      // --- START FIX ---
      // If the element ALSO has a path (like a flowchart line or a 'tool 8' shape),
      // we must update all points in its path by the same delta.
      // This is because these elements are *rendered* using their path, not their position.
      if (updatedElement.path && updatedElement.path.length > 0) {
        updatedElement.path = element.path!.map(p => ({
          ...p,
          x: canMoveX ? p.x + dx : p.x,
          y: canMoveY ? p.y + dy : p.y,
        }));
      }
      // --- END FIX ---
    } 
    // Handle path-based elements (strokes, shapes with path)
    else if (updatedElement.path && updatedElement.path.length > 0) {
      // Calculate the displacement (delta) based on the first point's original and new position
      const newFirstPointX = scenePt.x + offset.x;
      const newFirstPointY = scenePt.y + offset.y;
      
      // Use element.path![0] to get the original, non-updated position
      const dx = newFirstPointX - element.path![0].x;
      const dy = newFirstPointY - element.path![0].y;

      // Apply the same delta to all points in the path
      updatedElement.path = element.path!.map(p => ({
        ...p,
        x: canMoveX ? p.x + dx : p.x,
        y: canMoveY ? p.y + dy : p.y,
      }));
    }
    
    updateElement(id, updatedElement);
  });
}

/**
 * Handle element resize/transform
 */
// --- START FIX: Update function signature and logic ---
export function handleSelectionResize(
  handle: SelectionHandle,
  mousePos: Point,
  originalBounds: { minX: number; minY: number; maxX: number; maxY: number },
  originalElements: DrawingElement[], // <-- Use originalElements
  updateElement: (id: string, element: DrawingElement) => void
): void {
  const { minX: origMinX, minY: origMinY, maxX: origMaxX, maxY: origMaxY } = originalBounds;
  const origWidth = origMaxX - origMinX;
  const origHeight = origMaxY - origMinY;
  const centerX = origMinX + origWidth / 2;
  const centerY = origMinY + origHeight / 2;

  let scaleX = 1, scaleY = 1;

  // Calculate scale based on handle, preventing division by zero
  switch (handle.id) {
    case 'nw':
      if (origWidth !== 0) scaleX = Math.max(0.1, (origMaxX - mousePos.x) / origWidth);
      if (origHeight !== 0) scaleY = Math.max(0.1, (origMaxY - mousePos.y) / origHeight);
      break;
    case 'ne':
      if (origWidth !== 0) scaleX = Math.max(0.1, (mousePos.x - origMinX) / origWidth);
      if (origHeight !== 0) scaleY = Math.max(0.1, (origMaxY - mousePos.y) / origHeight);
      break;
    case 'sw':
      if (origWidth !== 0) scaleX = Math.max(0.1, (origMaxX - mousePos.x) / origWidth);
      if (origHeight !== 0) scaleY = Math.max(0.1, (mousePos.y - origMinY) / origHeight);
      break;
    case 'se':
      if (origWidth !== 0) scaleX = Math.max(0.1, (mousePos.x - origMinX) / origWidth);
      if (origHeight !== 0) scaleY = Math.max(0.1, (mousePos.y - origMinY) / origHeight);
      break;
    case 'n':
      if (origHeight !== 0) scaleY = Math.max(0.1, (origMaxY - mousePos.y) / origHeight);
      break;
    case 'e':
      if (origWidth !== 0) scaleX = Math.max(0.1, (mousePos.x - origMinX) / origWidth);
      break;
    case 's':
      if (origHeight !== 0) scaleY = Math.max(0.1, (mousePos.y - origMinY) / origHeight);
      break;
    case 'w':
      if (origWidth !== 0) scaleX = Math.max(0.1, (origMaxX - mousePos.x) / origWidth);
      break;
  }

  // Clamp scales
  scaleX = Math.min(20, scaleX);
  scaleY = Math.min(20, scaleY);

  // Apply scaling to selected elements
  // Iterate over the originalElements, not the main elements array
  originalElements.forEach(originalElement => {
    // Create a new updatedElement based on the original
    const updatedElement = { ...originalElement };

    if (updatedElement.path && updatedElement.path.length > 0) {
      // Apply scaling based on the originalElement's path
      updatedElement.path = originalElement.path!.map(point => ({
        ...point,
        x: centerX + (point.x - centerX) * scaleX,
        y: centerY + (point.y - centerY) * scaleY
      }));
    }

    if (updatedElement.position) {
      // Apply scaling based on the originalElement's position
      updatedElement.position = {
        x: centerX + (originalElement.position!.x - centerX) * scaleX,
        y: centerY + (originalElement.position!.y - centerY) * scaleY
      };
      
      // Scale image/shape dimensions based on the originalElement's dimensions
      if (updatedElement.width && updatedElement.height) {
        updatedElement.width = originalElement.width! * scaleX;
        updatedElement.height = originalElement.height! * scaleY;
      }
      
      if (updatedElement.size) {
        updatedElement.size = {
          width: originalElement.size!.width * scaleX,
          height: originalElement.size!.height * scaleY
        };
      }
    }

    updateElement(originalElement.id, updatedElement);
  });
}
// --- END FIX ---

export function handleSelectionMarqueeMove(
  selectionMode: string,
  scenePt: Point,
  selectionStart: Point
): { marqueeRect: { x: number; y: number; width: number; height: number } } | null {
  if (selectionMode !== 'marquee' || !selectionStart) return null;

  const width = scenePt.x - selectionStart.x;
  const height = scenePt.y - selectionStart.y;
  const marqueeRect = {
    x: Math.min(selectionStart.x, selectionStart.x + width),
    y: Math.min(selectionStart.y, selectionStart.y + height),
    width: Math.abs(width),
    height: Math.abs(height)
  };

  return { marqueeRect };
}

/**
 * Check if point is inside rectangle
 */
function isPointInRect(point: Point, rect: { x: number; y: number; width: number; height: number }): boolean {
  const minX = Math.min(rect.x, rect.x + rect.width);
  const maxX = Math.max(rect.x, rect.x + rect.width);
  const minY = Math.min(rect.y, rect.y + rect.height);
  const maxY = Math.max(rect.y, rect.y + rect.height);

  return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
}

/**
 * Check if element is inside marquee rectangle
 */
function isElementInMarquee(
  element: DrawingElement,
  marqueeRect: { x: number; y: number; width: number; height: number }
): boolean {
  if (!marqueeRect) return false;

  if (element.path && element.path.length > 0) {
    // For paths, check if any point is inside
    return element.path.some(point => isPointInRect(point, marqueeRect));
  } else if (element.type === 'text' && element.position) {
    // For text, check bounding box
    const textWidth = (element.text || '').length * 12;
    const textHeight = element.fontSize || 16;
    const left = element.position.x;
    const top = element.position.y;
    const right = left + textWidth;
    const bottom = top + textHeight;

    return isPointInRect({ x: left, y: top }, marqueeRect) ||
           isPointInRect({ x: right, y: top }, marqueeRect) ||
           isPointInRect({ x: left, y: bottom }, marqueeRect) ||
           isPointInRect({ x: right, y: bottom }, marqueeRect);
  } else if (element.type === 'image' && element.position && element.width && element.height) {
    // For images, check all corners
    const left = element.position.x;
    const top = element.position.y;
    const right = left + element.width;
    const bottom = top + element.height;

    return isPointInRect({ x: left, y: top }, marqueeRect) ||
           isPointInRect({ x: right, y: top }, marqueeRect) ||
           isPointInRect({ x: left, y: bottom }, marqueeRect) ||
           isPointInRect({ x: right, y: bottom }, marqueeRect);
  } else if (element.type === 'shape' && element.position && element.size) {
    // For shapes with size, check all corners
    const left = element.position.x;
    const top = element.position.y;
    const right = left + element.size.width;
    const bottom = top + element.size.height;

    return isPointInRect({ x: left, y: top }, marqueeRect) ||
           isPointInRect({ x: right, y: top }, marqueeRect) ||
           isPointInRect({ x: left, y: bottom }, marqueeRect) ||
           isPointInRect({ x: right, y: bottom }, marqueeRect);
  } else if (element.position) {
    return isPointInRect(element.position, marqueeRect);
  }

  return false;
}

interface MarqueeSelectionResult {
  selectedElementIds: string[];
  selectionMode: null;
  marqueeRect: null;
}

export function handleSelectionUp(
  selectionMode: string,
  marqueeRect: { x: number; y: number; width: number; height: number } | null,
  elements: DrawingElement[]
): MarqueeSelectionResult | { isDraggingSelection: boolean } {
  if (selectionMode === 'marquee' && marqueeRect) {
    const normalizedRect = {
      x: Math.min(marqueeRect.x, marqueeRect.x + marqueeRect.width),
      y: Math.min(marqueeRect.y, marqueeRect.y + marqueeRect.height),
      width: Math.abs(marqueeRect.width),
      height: Math.abs(marqueeRect.height)
    };

    const elementsInMarquee = elements
      .filter(el => isElementInMarquee(el, normalizedRect))
      .map(el => el.id);

    return {
      selectedElementIds: elementsInMarquee,
      selectionMode: null,
      marqueeRect: null
    };
  }

  return {
    isDraggingSelection: false
  };
}

/**
 * Flip selected elements horizontally or vertically
 */
export function flipSelectedElements(
  direction: 'horizontal' | 'vertical',
  selectedElementIds: string[],
  elements: DrawingElement[],
  updateElement: (id: string, element: DrawingElement) => void
): void {
  if (selectedElementIds.length === 0) return;

  const bounds = calculateBounds(selectedElementIds, elements);
  const centerX = bounds.minX + (bounds.maxX - bounds.minX) / 2;
  const centerY = bounds.minY + (bounds.maxY - bounds.minY) / 2;

  selectedElementIds.forEach(id => {
    const element = elements.find(e => e.id === id);
    if (!element) return;

    const updatedElement = { ...element };

    if (updatedElement.path && updatedElement.path.length > 0) {
      updatedElement.path = element.path!.map(point => ({
        ...point,
        x: direction === 'horizontal' ? centerX + (centerX - point.x) : point.x,
        y: direction === 'vertical' ? centerY + (centerY - point.y) : point.y
      }));
    }

    if (updatedElement.position) {
      updatedElement.position = {
        x: direction === 'horizontal' ? centerX + (centerX - element.position!.x) : element.position!.x,
        y: direction === 'vertical' ? centerY + (centerY - element.position!.y) : element.position!.y
      };
    }

    updateElement(id, updatedElement);
  });
}

/**
 * Nudge selected elements by arrow keys
 */
export function nudgeSelectedElements(
  direction: 'up' | 'down' | 'left' | 'right',
  distance: number,
  selectedElementIds: string[],
  elements: DrawingElement[],
  updateElement: (id: string, element: DrawingElement) => void
): void {
  let dx = 0, dy = 0;

  switch (direction) {
    case 'up': dy = -distance; break;
    case 'down': dy = distance; break;
    case 'left': dx = -distance; break;
    case 'right': dx = distance; break;
  }

  selectedElementIds.forEach(id => {
    const element = elements.find(e => e.id === id);
    if (!element) return;

    const updatedElement = { ...element };

    if (updatedElement.path) {
      updatedElement.path = updatedElement.path.map(p => ({
        ...p,
        x: updatedElement.lockMovementX ? p.x : p.x + dx,
        y: updatedElement.lockMovementY ? p.y : p.y + dy
      }));
    }

    if (updatedElement.position) {
      updatedElement.position = {
        x: updatedElement.lockMovementX ? updatedElement.position.x : updatedElement.position.x + dx,
        y: updatedElement.lockMovementY ? updatedElement.position.y : updatedElement.position.y + dy
      };
    }

    updateElement(id, updatedElement);
  });
}