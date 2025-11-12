import { Point, DrawingElement } from "../DrawingCanvas";

export function handleGraphDown(scenePt: Point, userName: string): DrawingElement {
  const newEl: DrawingElement = {
    id: `graph-${Date.now()}`,
    type: "shape",
    path: [
      { x: scenePt.x - 80, y: scenePt.y - 50 },
      { x: scenePt.x + 80, y: scenePt.y - 50 },
      { x: scenePt.x + 80, y: scenePt.y + 50 },
      { x: scenePt.x - 80, y: scenePt.y + 50 },
      { x: scenePt.x - 80, y: scenePt.y - 50 }
    ],
    strokeWidth: 2,
    strokeColor: "#333",
    fillColor: "#fff",
    position: scenePt,
    size: { width: 160, height: 100 },
    timestamp: Date.now(),
    author: userName,
    selectable: true,
    evented: true
  };
  return newEl;
}
