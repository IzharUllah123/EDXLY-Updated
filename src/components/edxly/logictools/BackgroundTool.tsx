
import React from "react";


export interface BackgroundSettings {
  color: string;
  pattern: 'solid' | 'grid' | 'dots' | 'lines';
  gridSize?: number;
  gridColor?: string;
  opacity?: number;
}

export const DEFAULT_BACKGROUND: BackgroundSettings = {
  color: '#ffffff',
  pattern: 'solid',
  gridSize: 20,
  gridColor: '#e0e0e0',
  opacity: 1
};

export const BACKGROUND_PRESETS = [
  { name: 'White', color: '#ffffff', pattern: 'solid' as const },
  { name: 'Light Blue', color: '#e3f2fd', pattern: 'solid' as const },
  { name: 'Light Green', color: '#e8f5e9', pattern: 'solid' as const },
  { name: 'Light Yellow', color: '#fffde7', pattern: 'solid' as const },
  { name: 'Light Pink', color: '#fce4ec', pattern: 'solid' as const },
  { name: 'Light Purple', color: '#f3e5f5', pattern: 'solid' as const },
  { name: 'Dark Gray', color: '#1a1a1a', pattern: 'solid' as const },
  { name: 'Dark Blue', color: '#0d1b2a', pattern: 'solid' as const },
];

export const PATTERN_OPTIONS = [
  { value: 'solid', label: 'Solid', icon: '⬜' },
  { value: 'grid', label: 'Grid', icon: '⊞' },
  { value: 'dots', label: 'Dots', icon: '⋮' },
  { value: 'lines', label: 'Lines', icon: '≡' },
];

interface BackgroundSettingsPanelProps {
  backgroundSettings: BackgroundSettings;
  setBackgroundSettings: (settings: BackgroundSettings) => void;
}

export const BackgroundSettingsPanel: React.FC<BackgroundSettingsPanelProps> = ({
  backgroundSettings,
  setBackgroundSettings,
}) => {
  return (
    <div className="flex flex-col gap-3">
      {/* Preset Colors */}
      <div>
        <label className="text-xs font-medium text-gray-700 mb-2 block">
          Background Color
        </label>
        <div className="grid grid-cols-4 gap-2">
          {BACKGROUND_PRESETS.map((preset) => (
            <button
              key={preset.name}
              className={`w-full h-8 rounded-md border-2 transition-all hover:scale-105 ${
                backgroundSettings.color === preset.color
                  ? 'border-blue-500 shadow-md'
                  : 'border-gray-300'
              }`}
              style={{ backgroundColor: preset.color }}
              onClick={() =>
                setBackgroundSettings({
                  ...backgroundSettings,
                  color: preset.color,
                  pattern: preset.pattern,
                })
              }
              title={preset.name}
            />
          ))}
        </div>
      </div>

      {/* Custom Color Picker */}
      <div>
        <label className="text-xs font-medium text-gray-700 mb-2 block">
          Custom Color
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={backgroundSettings.color}
            onChange={(e) =>
              setBackgroundSettings({
                ...backgroundSettings,
                color: e.target.value,
              })
            }
            className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
          />
          <input
            type="text"
            value={backgroundSettings.color}
            onChange={(e) =>
              setBackgroundSettings({
                ...backgroundSettings,
                color: e.target.value,
              })
            }
            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
            placeholder="#ffffff"
          />
        </div>
      </div>

      {/* Pattern Selection */}
      <div>
        <label className="text-xs font-medium text-gray-700 mb-2 block">
          Pattern
        </label>
        <div className="grid grid-cols-4 gap-2">
          {PATTERN_OPTIONS.map((pattern) => (
            <button
              key={pattern.value}
              className={`px-3 py-2 text-sm rounded-md border transition-all hover:bg-gray-50 ${
                backgroundSettings.pattern === pattern.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 text-gray-700'
              }`}
              onClick={() =>
                setBackgroundSettings({
                  ...backgroundSettings,
                  pattern: pattern.value as BackgroundSettings['pattern'],
                })
              }
              title={pattern.label}
            >
              <span className="text-lg">{pattern.icon}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid Settings (only show when grid/dots/lines pattern selected) */}
      {backgroundSettings.pattern !== 'solid' && (
        <>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-2 block">
              Grid Size: {backgroundSettings.gridSize}px
            </label>
            <input
              type="range"
              min="10"
              max="50"
              value={backgroundSettings.gridSize || 20}
              onChange={(e) =>
                setBackgroundSettings({
                  ...backgroundSettings,
                  gridSize: parseInt(e.target.value),
                })
              }
              className="w-full"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 mb-2 block">
              Grid Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={backgroundSettings.gridColor || '#e0e0e0'}
                onChange={(e) =>
                  setBackgroundSettings({
                    ...backgroundSettings,
                    gridColor: e.target.value,
                  })
                }
                className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={backgroundSettings.gridColor || '#e0e0e0'}
                onChange={(e) =>
                  setBackgroundSettings({
                    ...backgroundSettings,
                    gridColor: e.target.value,
                  })
                }
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                placeholder="#e0e0e0"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 mb-2 block">
              Opacity: {Math.round((backgroundSettings.opacity || 1) * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={(backgroundSettings.opacity || 1) * 100}
              onChange={(e) =>
                setBackgroundSettings({
                  ...backgroundSettings,
                  opacity: parseInt(e.target.value) / 100,
                })
              }
              className="w-full"
            />
          </div>
        </>
      )}

      {/* Reset Button */}
      <button
        className="w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
        onClick={() => setBackgroundSettings(DEFAULT_BACKGROUND)}
      >
        Reset to Default
      </button>
    </div>
  );
};

/**
 * Renders the background pattern on the canvas
 */
export const renderBackground = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  backgroundSettings: BackgroundSettings,
  scrollX: number,
  scrollY: number,
  zoomLevel: number
) => {
  // Save context state
  ctx.save();

  // Fill solid background color
  ctx.fillStyle = backgroundSettings.color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Render pattern if not solid
  if (backgroundSettings.pattern !== 'solid') {
    const gridSize = (backgroundSettings.gridSize || 20) * zoomLevel;
    const gridColor = backgroundSettings.gridColor || '#e0e0e0';
    const opacity = backgroundSettings.opacity || 1;

    ctx.strokeStyle = gridColor;
    ctx.globalAlpha = opacity;
    ctx.lineWidth = 1;

    const startX = (-scrollX * zoomLevel) % gridSize;
    const startY = (-scrollY * zoomLevel) % gridSize;

    switch (backgroundSettings.pattern) {
      case 'grid':
        // Vertical lines
        for (let x = startX; x < canvas.width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        // Horizontal lines
        for (let y = startY; y < canvas.height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
        break;

      case 'dots':
        ctx.fillStyle = gridColor;
        for (let x = startX; x < canvas.width; x += gridSize) {
          for (let y = startY; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;

      case 'lines':
        // Horizontal lines only
        for (let y = startY; y < canvas.height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
        break;
    }
  }

  // Restore context state
  ctx.restore();
};

/**
 * Handler for background tool - just activates the settings panel
 */
export const handleBackgroundDown = () => {
  // Background tool is passive - just shows settings panel
  return { handled: true };
};