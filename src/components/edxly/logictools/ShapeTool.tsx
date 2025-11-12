// ShapeTool.tsx - Real-time Collaborative Shape Tool
import { Point, DrawingElement } from '../types/DrawingCanvas.types';

export interface ShapeSettings {
  selectedShape: 'rectangle' | 'rounded-rectangle' | 'ellipse' | 'circle' | 'diamond' | 'line' | 'polygon' | 'star' | 'arrow';
  strokeWidth: number;
  cornerRadius: number;
  sides: number;
  points: number;
}

/**
 * Create a shape path based on start and end points
 */
export const createShapePath = (
  start: Point,
  end: Point,
  settings: ShapeSettings,
  shiftKey: boolean = false
): Point[] => {
  const path: Point[] = [];
  let width = end.x - start.x;
  let height = end.y - start.y;

  // For circle and regular shapes, maintain aspect ratio when shift is held
  if (shiftKey && (settings.selectedShape === 'circle' || 
                   settings.selectedShape === 'ellipse' ||
                   settings.selectedShape === 'rectangle' ||
                   settings.selectedShape === 'rounded-rectangle')) {
    const size = Math.max(Math.abs(width), Math.abs(height));
    width = width < 0 ? -size : size;
    height = height < 0 ? -size : size;
  }

  const x = start.x;
  const y = start.y;
  const endX = x + width;
  const endY = y + height;

  switch (settings.selectedShape) {
    case 'rectangle':
      path.push({ x, y });
      path.push({ x: endX, y });
      path.push({ x: endX, y: endY });
      path.push({ x, y: endY });
      path.push({ x, y }); // Close path
      break;

    case 'rounded-rectangle':
      const radius = Math.min(settings.cornerRadius, Math.abs(width) / 2, Math.abs(height) / 2);
      // Top edge
      path.push({ x: x + radius, y });
      path.push({ x: endX - radius, y });
      // Top-right corner
      for (let i = 0; i <= 8; i++) {
        const angle = (Math.PI * 1.5) + (i / 8) * (Math.PI / 2);
        path.push({
          x: endX - radius + radius * Math.cos(angle),
          y: y + radius + radius * Math.sin(angle)
        });
      }
      // Right edge
      path.push({ x: endX, y: y + radius });
      path.push({ x: endX, y: endY - radius });
      // Bottom-right corner
      for (let i = 0; i <= 8; i++) {
        const angle = 0 + (i / 8) * (Math.PI / 2);
        path.push({
          x: endX - radius + radius * Math.cos(angle),
          y: endY - radius + radius * Math.sin(angle)
        });
      }
      // Bottom edge
      path.push({ x: endX - radius, y: endY });
      path.push({ x: x + radius, y: endY });
      // Bottom-left corner
      for (let i = 0; i <= 8; i++) {
        const angle = (Math.PI / 2) + (i / 8) * (Math.PI / 2);
        path.push({
          x: x + radius + radius * Math.cos(angle),
          y: endY - radius + radius * Math.sin(angle)
        });
      }
      // Left edge
      path.push({ x, y: endY - radius });
      path.push({ x, y: y + radius });
      // Top-left corner
      for (let i = 0; i <= 8; i++) {
        const angle = Math.PI + (i / 8) * (Math.PI / 2);
        path.push({
          x: x + radius + radius * Math.cos(angle),
          y: y + radius + radius * Math.sin(angle)
        });
      }
      break;

    case 'ellipse':
    case 'circle':
      const radiusX = Math.abs(width) / 2;
      const radiusY = Math.abs(height) / 2;
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      const numPoints = 64;
      
      for (let i = 0; i <= numPoints; i++) {
        const angle = (i / numPoints) * 2 * Math.PI;
        path.push({
          x: centerX + radiusX * Math.cos(angle),
          y: centerY + radiusY * Math.sin(angle)
        });
      }
      break;

    case 'diamond':
      const midX = (x + endX) / 2;
      const midY = (y + endY) / 2;
      path.push({ x: midX, y });
      path.push({ x: endX, y: midY });
      path.push({ x: midX, y: endY });
      path.push({ x, y: midY });
      path.push({ x: midX, y }); // Close path
      break;

    case 'line':
      path.push({ x, y });
      path.push({ x: endX, y: endY });
      break;

    case 'arrow':
      const arrowLength = Math.sqrt(width * width + height * height);
      const arrowAngle = Math.atan2(height, width);
      const headLength = Math.min(arrowLength * 0.2, 20);
      const headAngle = Math.PI / 6;

      // Main line
      path.push({ x, y });
      path.push({ x: endX, y: endY });
      
      // Arrowhead - left side
      path.push({ x: endX, y: endY });
      path.push({
        x: endX - headLength * Math.cos(arrowAngle - headAngle),
        y: endY - headLength * Math.sin(arrowAngle - headAngle)
      });
      
      // Back to tip
      path.push({ x: endX, y: endY });
      
      // Arrowhead - right side
      path.push({
        x: endX - headLength * Math.cos(arrowAngle + headAngle),
        y: endY - headLength * Math.sin(arrowAngle + headAngle)
      });
      break;

    case 'polygon':
      const polySides = settings.sides;
      const polyCenterX = x + width / 2;
      const polyCenterY = y + height / 2;
      const polyRadius = Math.min(Math.abs(width), Math.abs(height)) / 2;
      
      for (let i = 0; i <= polySides; i++) {
        const angle = (i / polySides) * 2 * Math.PI - Math.PI / 2;
        path.push({
          x: polyCenterX + polyRadius * Math.cos(angle),
          y: polyCenterY + polyRadius * Math.sin(angle)
        });
      }
      break;

    case 'star':
      const starPoints = settings.points;
      const starCenterX = x + width / 2;
      const starCenterY = y + height / 2;
      const outerRadius = Math.min(Math.abs(width), Math.abs(height)) / 2;
      const innerRadius = outerRadius * 0.4;
      
      for (let i = 0; i <= starPoints * 2; i++) {
        const angle = (i / (starPoints * 2)) * 2 * Math.PI - Math.PI / 2;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        path.push({
          x: starCenterX + radius * Math.cos(angle),
          y: starCenterY + radius * Math.sin(angle)
        });
      }
      break;
  }

  return path;
};

/**
 * Handle shape drawing start
 */
export const handleShapeDown = (
  scenePt: Point
): { startPoint: Point; isCreatingShape: boolean; tempPath: Point[] } => {
  return {
    startPoint: scenePt,
    isCreatingShape: true,
    tempPath: [scenePt]
  };
};

/**
 * Handle shape drawing movement
 */
export const handleShapeMove = (
  isCreatingShape: boolean,
  startPoint: Point,
  currentPoint: Point,
  shiftKey: boolean,
  settings: ShapeSettings
): { tempPath: Point[] } => {
  if (!isCreatingShape) return { tempPath: [] };
  
  const shapePath = createShapePath(startPoint, currentPoint, settings, shiftKey);
  return { tempPath: shapePath };
};

/**
 * Handle shape drawing completion (Real-time)
 */
export const handleShapeUp = (
  tempPath: Point[],
  settings: ShapeSettings,
  strokeColor: string,
  fillColor: string,
  userName: string,
  addElement: (element: DrawingElement) => void
): { isCreatingShape: boolean; tempPath: Point[] } => {
  if (tempPath.length < 2) {
    return { isCreatingShape: false, tempPath: [] };
  }

  // Calculate bounding box
  const xs = tempPath.map(p => p.x);
  const ys = tempPath.map(p => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  const newElement: DrawingElement = {
    id: `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: "path",
    path: tempPath,
    strokeColor: strokeColor,
    strokeWidth: settings.strokeWidth,
    fillColor: fillColor === 'transparent' ? undefined : fillColor,
    backgroundColor: fillColor === 'transparent' ? undefined : fillColor,
    timestamp: Date.now(),
    author: userName,
    selectable: true,
    evented: true,
    shapeType: settings.selectedShape as any,
    position: { x: minX, y: minY },
    size: { width: maxX - minX, height: maxY - minY }
  };

  // THIS IS THE REAL-TIME PART - addElement syncs to all users
  addElement(newElement);

  return { isCreatingShape: false, tempPath: [] };
};