import { Point, DrawingElement } from "../DrawingCanvas";
import { getStroke } from "perfect-freehand";

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

export function handlePenDown(scenePt: Point, ev: PointerEvent) {
  return {
    isDrawing: true,
    tempPath: [{ ...scenePt, pressure: ev.pressure }],
  };
}

export function handlePenMove(tempPath: Point[], scenePt: Point, ev: PointerEvent) {
  const updatedPath = [...tempPath, { ...scenePt, pressure: ev.pressure }];
  return updatedPath;
}

// export function handlePenUp(
//   tempPath: Point[],
//   userName: string,
//   strokeColor: string,
//   penSettings: { strokeWidth: number; smoothing: number; pressureEnabled: boolean; cap?: any; join?: any; dashPattern?: any },
//   isStraightLineMode: boolean,
//   addElement: (element: DrawingElement) => void
// ): { tempPath: Point[]; isDrawing: boolean; isStraightLineMode: boolean } {
//   if (tempPath.length >= 2) {
//     const finalPath = isStraightLineMode ? tempPath : smoothPath(tempPath, penSettings.smoothing || 0.5);
//     const newElement: DrawingElement = {
//       id: `path-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
//       type: "path",
//       path: finalPath,
//       strokeColor,
//       strokeWidth: penSettings.strokeWidth,
//       opacity: 1,
//       cap: penSettings.cap || 'round',
//       join: penSettings.join || 'round',
//       dashPattern: penSettings.dashPattern || [],
//       timestamp: Date.now(),
//       author: userName
//     };
//     addElement(newElement);
//   }
//   return { tempPath: [], isDrawing: false, isStraightLineMode: false };
// }
export function handlePenUp(
  tempPath: Point[],
  userName: string,
  strokeColor: string,
  penSettings: {
    strokeWidth: number;
    smoothing: number;
    pressureEnabled: boolean;
    cap?: any;
    join?: any;
    dashPattern?: any;
  },
  isStraightLineMode: boolean,
  addElement: (element: DrawingElement) => void
): { tempPath: Point[]; isDrawing: boolean; isStraightLineMode: boolean } {
  if (tempPath.length >= 2) {
    const finalPath = isStraightLineMode
      ? tempPath
      : smoothPath(tempPath, penSettings.smoothing || 0.5);

    const newElement: DrawingElement = {
      id: `path-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "path",
      path: finalPath,
      strokeColor,
      fillColor: strokeColor, // ✅ ensures no white center
      strokeWidth: penSettings.strokeWidth,
      opacity: 1,
      cap: penSettings.cap || "round",
      join: penSettings.join || "round",
      dashPattern: penSettings.dashPattern || [],
      timestamp: Date.now(),
      author: userName,
      selectable: true,
      evented: true,
    };

    addElement(newElement);
  }
  return { tempPath: [], isDrawing: false, isStraightLineMode: false };
}
