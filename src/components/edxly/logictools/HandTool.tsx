import { Point } from "../DrawingCanvas";

export function handleHandDown(ev: PointerEvent): { isHandActive: boolean; lastPanPoint: Point } {
  return {
    isHandActive: true,
    lastPanPoint: { x: ev.clientX, y: ev.clientY }
  };
}

export function handleHandMove(
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

export function handleHandUp(): { isHandActive: boolean } {
  return { isHandActive: false };
}
