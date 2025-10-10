import { Point, DrawingElement, ShapeSettings } from '../types/DrawingCanvas.types';
import { MIN_DISTANCE_BETWEEN_POINTS, MAX_DISTANCE_FOR_SMOOTHING } from '../constants/DrawingCanvas.constants';

/**
 * Converts screen coordinates to canvas coordinates considering zoom and pan
 */
export const getCanvasCoordinates = (
  e: PointerEvent | MouseEvent | Touch,
  canvas: HTMLCanvasElement | null,
  canvasSize: { width: number; height: number },
  zoomLevel: number,
  panOffset: Point
): Point => {
  if (!canvas) return { x: 0, y: 0 };

  const rect = canvas.getBoundingClientRect();
  const rawX = e.clientX - rect.left;
  const rawY = e.clientY - rect.top;

  // Convert screen coordinates to canvas coordinates considering zoom and pan
  const canvasX = (rawX - canvasSize.width / 2) / zoomLevel + canvasSize.width / 2 - panOffset.x;
  const canvasY = (rawY - canvasSize.height / 2) / zoomLevel + canvasSize.height / 2 - panOffset.y;

  return { x: canvasX, y: canvasY };
};

/**
 * Snap a point to the nearest grid position
 */
export const snapToGrid = (pos: Point, gridSize: number, snapEnabled: boolean): Point => {
  if (!snapEnabled) return pos;
  return {
    x: Math.round(pos.x / gridSize) * gridSize,
    y: Math.round(pos.y / gridSize) * gridSize
  };
};

/**
 * Calculate distance between two points
 */
export const getDistance = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

/**
 * Enhanced smooth path using Cubic Bezier curves for more natural strokes
 */
export const smoothPath = (points: Point[], smoothing: number): Point[] => {
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

/**
 * Advanced smoothing with velocity-based width calculation
 */
export const smoothPathAdvanced = (points: Point[], smoothing: number): Point[] => {
  if (points.length < 2) return points;

  const smoothed: Point[] = [points[0]];

  // Remove points that are too close (reduces noise)
  let filteredPoints = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const last = filteredPoints[filteredPoints.length - 1];
    const dist = getDistance(points[i], last);
    if (dist > MIN_DISTANCE_BETWEEN_POINTS) {
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
    const velocity = getDistance(current, prev);

    // Distance-based smoothing
    const distance = getDistance(next, prev);

    const alpha = smoothing * (1 + velocity / 50); // Velocity-based smoothing
    const smoothX = current.x * (1 - alpha) + prev.x * alpha * 0.3 + next.x * alpha * 0.3;
    const smoothY = current.y * (1 - alpha) + prev.y * alpha * 0.3 + next.y * alpha * 0.3;

    smoothed.push({
      x: smoothX,
      y: smoothY,
      pressure: current.pressure
    });
  }

  smoothed.push(points[points.length - 1]);
  return smoothed;
};

/**
 * Create shape path based on type and bounds
 */
export const createShapePath = (start: Point, end: Point, settings: ShapeSettings): Point[] => {
  const path: Point[] = [];
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);

  switch (settings.selectedShape) {
    case 'rectangle':
      path.push({ x, y });
      path.push({ x: x + width, y });
      path.push({ x: x + width, y: y + height });
      path.push({ x, y: y + height });
      break;

    case 'rounded-rectangle':
      const radius = settings.cornerRadius;
      // Top-left corner
      path.push({ x: x + radius, y });
      // Top-right corner
      path.push({ x: x + width - radius, y });
      path.push({ x: x + width, y: y + radius });
      // Bottom-right corner
      path.push({ x: x + width, y: y + height - radius });
      path.push({ x: x + width - radius, y: y + height });
      // Bottom-left corner
      path.push({ x: x + radius, y: y + height });
      path.push({ x, y: y + height - radius });
      break;

    case 'ellipse':
    case 'circle':
      // For circles, use the smaller dimension to ensure perfect circular shape
      const dimension = Math.min(width, height);
      const ellipseRx = settings.selectedShape === 'circle' ? dimension / 2 : width / 2;
      const ellipseRy = settings.selectedShape === 'circle' ? dimension / 2 : height / 2;
      // Center the ellipse/circle properly
      const ellipseCx = x + width / 2;
      const ellipseCy = y + height / 2;

      // Generate ellipse outline with more points for better accuracy
      const numPoints = 64; // More points for smoother curve
      for (let i = 0; i <= numPoints; i++) {
        const angle = (i / numPoints) * 2 * Math.PI;
        const px = ellipseCx + ellipseRx * Math.cos(angle);
        const py = ellipseCy + ellipseRy * Math.sin(angle);
        path.push({ x: px, y: py });
      }
      break;

    case 'line':
      path.push({ x: start.x, y: start.y });
      path.push({ x: end.x, y: end.y });
      break;

    case 'polygon':
      const polygonSides = settings.sides;
      const polygonCenterX = x + width / 2;
      const polygonCenterY = y + height / 2;
      const polygonRadius = Math.min(width, height) / 2;

      for (let i = 0; i < polygonSides; i++) {
        const angle = (i * 2 * Math.PI) / polygonSides - Math.PI / 2;
        path.push({
          x: polygonCenterX + polygonRadius * Math.cos(angle),
          y: polygonCenterY + polygonRadius * Math.sin(angle)
        });
      }
      break;

    case 'star':
      const starPoints = settings.points;
      const starInnerRadius = Math.min(width, height) / 4;
      const starOuterRadius = Math.min(width, height) / 2;
      const starCenterX = x + width / 2;
      const starCenterY = y + height / 2;

      for (let i = 0; i < starPoints * 2; i++) {
        const angle = (i * Math.PI) / starPoints - Math.PI / 2;
        const starRadius = i % 2 === 0 ? starOuterRadius : starInnerRadius;
        path.push({
          x: starCenterX + starRadius * Math.cos(angle),
          y: starCenterY + starRadius * Math.sin(angle)
        });
      }
      break;
  }

  return path;
};

/**
 * Get pressure-adjusted width for strokes
 */
export const getPressureAdjustedWidth = (baseWidth: number, pressure?: number): number => {
  if (pressure === undefined) return baseWidth;
  return Math.max(0.5, baseWidth * pressure);
};

/**
 * Check if a point is on a stroke path (for eraser functionality)
 */
export const isPointOnPath = (point: Point, path: Point[], strokeWidth: number, eraserRadius: number): boolean => {
  const tolerance = strokeWidth + eraserRadius;

  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i];
    const p2 = path[i + 1];

    // Calculate distance from point to line segment
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) {
      const dist = getDistance(point, p1);
      if (dist <= tolerance) return true;
    } else {
      const t = ((point.x - p1.x) * dx + (point.y - p1.y) * dy) / (length ** 2);
      const clampedT = Math.max(0, Math.min(1, t));
      const closestX = p1.x + clampedT * dx;
      const closestY = p1.y + clampedT * dy;
      const dist = getDistance(point, { x: closestX, y: closestY });
      if (dist <= tolerance) return true;
    }
  }
  return false;
};

/**
 * Get element at a specific point on the canvas
 */
export const getElementAtPoint = (
  x: number,
  y: number,
  drawingElements: DrawingElement[],
  images: any[],
  textNotes: any[]
): string | null => {
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
  for (const note of textNotes) {
    // Simple text bounds check - could be made more sophisticated
    const textWidth = note.text.length * 7; // approximate character width
    const textHeight = note.type === 'simple' ? 16 : 18;

    const left = note.position.x;
    const right = note.position.x + textWidth;
    const top = note.position.y - textHeight;
    const bottom = note.position.y;

    if (x >= left && x <= right && y >= top && y <= bottom) {
      return note.id;
    }
  }

  // Check drawing elements (bottom to top)
  for (let i = drawingElements.length - 1; i >= 0; i--) {
    const element = drawingElements[i];
    if (element.type === 'path' || element.type === 'shape') {
      if (element.path && element.path.length > 0) {
        // Simple point-in-path check (for exact implementation, would need proper geometry)
        for (const point of element.path) {
          const distance = getDistance({ x, y }, point);
          if (distance <= (element.strokeWidth || 2) / 2 + 5) {
            return element.id;
          }
        }
      }
    }
  }

  return null;
};

/**
 * Calculate bounds of selected elements
 */
export const calculateBounds = (elements: DrawingElement[], selectedIds: string[]) => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  selectedIds.forEach(id => {
    const element = elements.find(el => el.id === id);
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

    if (element.position) {
      minX = Math.min(minX, element.position.x);
      minY = Math.min(minY, element.position.y);
      maxX = Math.max(maxX, element.position.x);
      maxY = Math.max(maxY, element.position.y);
    }

    // Add size if present
    if (element.size) {
      minX = Math.min(minX, element.position!.x - element.size.width / 2);
      minY = Math.min(minY, element.position!.y - element.size.height / 2);
      maxX = Math.max(maxX, element.position!.x + element.size.width / 2);
      maxY = Math.max(maxY, element.position!.y + element.size.height / 2);
    }
  });

  return {
    minX: minX === Infinity ? 0 : minX,
    minY: minY === Infinity ? 0 : minY,
    maxX: maxX === -Infinity ? 0 : maxX,
    maxY: maxY === -Infinity ? 0 : maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2
  };
};

/**
 * Generate a unique ID for canvas elements
 */
export const generateId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};
