import { Point, DrawingElement } from "../DrawingCanvas";

export function handleTextDown(
  scenePt: Point,
  userName: string,
  textMode?: 'simple' | 'colorful' | null,
  gradientType?: 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'teal'
): DrawingElement {
  const gradientTypes: ('blue' | 'purple' | 'green' | 'orange' | 'pink' | 'teal')[] =
    ['blue', 'purple', 'green', 'orange', 'pink', 'teal'];
  const pickRandomGradient = () => gradientTypes[Math.floor(Math.random() * gradientTypes.length)];

  const newNote: DrawingElement = {
    id: `text-${Date.now()}`,
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
    gradientType: textMode === 'colorful' ? (gradientType || pickRandomGradient()) : undefined
  };

  return newNote;
}

export function handleTextEditStart(elementId: string): { editingElementId: string } {
  return { editingElementId: elementId };
}

export function handleTextKeyDown(
  key: string,
  existingText: string,
  updateElement: (id: string, element: Partial<DrawingElement>) => void,
  editingElementId: string
): boolean {
  if (key.length === 1 && key !== 'Enter') {
    const newText = existingText + key;
    updateElement(editingElementId, { text: newText });
  } else if (key === 'Backspace') {
    const newText = existingText.slice(0, -1);
    updateElement(editingElementId, { text: newText });
  } else if (key === 'Enter') {
    const newText = existingText + '\n';
    updateElement(editingElementId, { text: newText });
  } else if (key === 'Escape') {
    return true; // Stop editing
  }
  return false;
}

export function handleTextEditStop(): { editingElementId: string | null } {
  return { editingElementId: null };
}
