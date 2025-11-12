import React from 'react';

export interface Point { 
  x: number; 
  y: number; 
  pressure?: number; 
}

// Eraser settings interface
export interface EraserSettings {
  mode: 'stroke' | 'object';
  size: number;
  pressureEnabled: boolean;
  previewEnabled: boolean;
}

// Eraser Settings Panel Component
export const EraserSettingsPanel: React.FC<{
  eraserSettings: EraserSettings;
  setEraserSettings: (settings: EraserSettings) => void;
}> = ({ eraserSettings, setEraserSettings }) => {
  return (
    <div className="flex flex-col gap-3">
      {/* Eraser Mode */}
      <div>
        {/* <label className="text-xs font-medium text-gray-700 block mb-2">Mode</label> */}
        <div className="flex gap-2">
          <button
            onClick={() => setEraserSettings({ ...eraserSettings, mode: 'stroke' })}
            className={`flex-1 px-3 py-2 text-xs rounded-lg transition-all ${
              eraserSettings.mode === 'stroke'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Stroke
          </button>
          {/* <button
            onClick={() => setEraserSettings({ ...eraserSettings, mode: 'object' })}
            className={`flex-1 px-3 py-2 text-xs rounded-lg transition-all ${
              eraserSettings.mode === 'object'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Object
          </button> */}
        </div>
        <p className="text-[10px] text-gray-500 mt-1">
          {eraserSettings.mode === 'stroke' ? 'Erase strokes by dragging' : 'Delete entire objects'}
        </p>
      </div>

      {/* Eraser Size */}
      <div>
        <label className="text-xs font-medium text-gray-700 flex justify-between mb-2">
          <span>Size</span>
          <span className="text-blue-600 font-semibold">{eraserSettings.size}px</span>
        </label>
        <input
          type="range"
          min="5"
          max="100"
          value={eraserSettings.size}
          onChange={(e) => setEraserSettings({ ...eraserSettings, size: Number(e.target.value) })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
          <span>5px</span>
          <span>100px</span>
        </div>
      </div>

      {/* Pressure Sensitivity */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-700">Pressure</label>
        <button
          onClick={() => setEraserSettings({ ...eraserSettings, pressureEnabled: !eraserSettings.pressureEnabled })}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            eraserSettings.pressureEnabled ? 'bg-blue-500' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              eraserSettings.pressureEnabled ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Preview Enable */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-700">Preview</label>
        <button
          onClick={() => setEraserSettings({ ...eraserSettings, previewEnabled: !eraserSettings.previewEnabled })}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            eraserSettings.previewEnabled ? 'bg-blue-500' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              eraserSettings.previewEnabled ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="pt-2 border-t border-gray-200">
        <p className="text-[10px] text-gray-500 mb-1 font-medium">Keyboard Shortcuts:</p>
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-gray-600">
            <span className="font-mono bg-gray-100 px-1 rounded">[</span>
            <span>Decrease size</span>
          </div>
          <div className="flex justify-between text-[10px] text-gray-600">
            <span className="font-mono bg-gray-100 px-1 rounded">]</span>
            <span>Increase size</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export function handleEraserDown(): { isDrawing: boolean } {
  return { isDrawing: true };
}

export function handleEraserMove(
  isDrawing: boolean,
  elements: any[],
  scenePt: Point,
  deleteElement: (id: string) => void,
  eraserSize?: number
): void {
  if (!isDrawing) return;

  const effectiveEraserSize = eraserSize || 20;

  for (const el of elements) {
    // Check for path-based elements (strokes, shapes)
    if (el.path && el.path.length > 0) {
      for (let k = 0; k < el.path.length - 1; k++) {
        const a = el.path[k];
        const b = el.path[k + 1];
        const dx = b.x - a.x, dy = b.y - a.y;
        const length = Math.hypot(dx, dy);
        if (length === 0) {
          if (Math.hypot(scenePt.x - a.x, scenePt.y - a.y) < effectiveEraserSize) {
            deleteElement(el.id);
            return;
          }
          continue;
        }
        const t = Math.max(0, Math.min(1, ((scenePt.x - a.x) * dx + (scenePt.y - a.y) * dy) / (length * length)));
        const projX = a.x + t * dx;
        const projY = a.y + t * dy;
        const dist = Math.hypot(scenePt.x - projX, scenePt.y - projY);
        if (dist < effectiveEraserSize) {
          deleteElement(el.id);
          return;
        }
      }
    }
    
    // Check for text elements (including emojis)
    if (el.type === 'text' && el.position) {
      // Estimate text bounds
      const fontSize = el.fontSize || 15;
      const textLength = (el.text || '').length;
      const estimatedWidth = textLength * fontSize * 0.6; // Rough estimate
      const estimatedHeight = fontSize * 1.5;
      
      // Check if eraser point is within text bounds
      if (scenePt.x >= el.position.x && 
          scenePt.x <= el.position.x + estimatedWidth &&
          scenePt.y >= el.position.y && 
          scenePt.y <= el.position.y + estimatedHeight) {
        deleteElement(el.id);
        return;
      }
    }
    
    // Check for positioned elements (sticky notes, graphs, etc.)
    if (el.position && el.size) {
      const halfWidth = el.size.width / 2;
      const halfHeight = el.size.height / 2;
      
      if (scenePt.x >= el.position.x - halfWidth && 
          scenePt.x <= el.position.x + halfWidth &&
          scenePt.y >= el.position.y - halfHeight && 
          scenePt.y <= el.position.y + halfHeight) {
        deleteElement(el.id);
        return;
      }
    }
  }
}

export function handleEraserUp(): { isDrawing: boolean } {
  return { isDrawing: false };
}