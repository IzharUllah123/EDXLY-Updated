import React, { useState, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react';
import { EraserSettings } from '../../types/DrawingCanvas.types';

interface AutonomousEraserToolProps {
  eraserSettings?: EraserSettings;
  onEraserSettingsChange?: (settings: EraserSettings) => void;
  isVisible?: boolean;
  onClose?: () => void;
}

export interface AutonomousEraserToolRef {
  getSettings: () => EraserSettings;
  setSettings: (settings: EraserSettings) => void;
  resetToDefaults: () => void;
  show: () => void;
  hide: () => void;
  toggle: () => void;
}

export const AutonomousEraserTool = forwardRef<AutonomousEraserToolRef, AutonomousEraserToolProps>(({
  eraserSettings: externalSettings,
  onEraserSettingsChange,
  isVisible = true,
  onClose
}, ref) => {
  // Default eraser settings
  const defaultSettings: EraserSettings = {
    mode: 'stroke',
  
    size: 20,
    pressureEnabled: false,
    previewEnabled: true
  };

  // Internal state management
  const [internalSettings, setInternalSettings] = useState<EraserSettings>(defaultSettings);
  const [visible, setVisible] = useState(isVisible);

  // Current settings (priority: external > internal)
  const currentSettings = externalSettings || internalSettings;

  // Update visibility when prop changes
  useEffect(() => {
    setVisible(isVisible);
  }, [isVisible]);

  // Handlers
  const handleSettingsChange = useCallback((newSettings: EraserSettings) => {
    setInternalSettings(newSettings);
    onEraserSettingsChange?.(newSettings);
  }, [onEraserSettingsChange]);

  const updateSetting = useCallback((key: keyof EraserSettings, value: any) => {
    const newSettings = { ...currentSettings, [key]: value };
    handleSettingsChange(newSettings);
  }, [currentSettings, handleSettingsChange]);

  const resetToDefaults = useCallback(() => {
    handleSettingsChange(defaultSettings);
  }, [handleSettingsChange]);

  const show = useCallback(() => setVisible(true), []);
  const hide = useCallback(() => {
    setVisible(false);
    onClose?.();
  }, [onClose]);
  const toggle = useCallback(() => {
    if (visible) {
      hide();
    } else {
      show();
    }
  }, [visible, hide, show]);

  // Expose imperative methods
  useImperativeHandle(ref, () => ({
    getSettings: () => currentSettings,
    setSettings: handleSettingsChange,
    resetToDefaults,
    show,
    hide,
    toggle,
  }), [currentSettings, handleSettingsChange, resetToDefaults, show, hide, toggle]);

  if (!visible) return null;

  return (
    <div className="absolute top-20 left-6 z-50">
      <div className="bg-white/90 backdrop-blur-md rounded-lg shadow-lg p-4 max-w-xs">
        {/* Close button */}
        <div className="flex justify-end mb-2">
          <button
            onClick={hide}
            className="text-gray-400 hover:text-gray-600 text-sm"
            title="Close eraser settings"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          {/* Eraser Size */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Size: {currentSettings.size}px
            </label>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={currentSettings.size}
              onChange={(e) => updateSetting('size', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded appearance-none cursor-pointer"
              aria-label="Eraser size"
            />
          </div>

          {/* Pressure Sensitivity */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="eraser-pressure"
              checked={currentSettings.pressureEnabled}
              onChange={(e) => updateSetting('pressureEnabled', e.target.checked)}
              className="w-3 h-3"
            />
            <label htmlFor="eraser-pressure" className="text-sm">Pressure Sensitivity</label>
          </div>

          {/* Preview Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="eraser-preview"
              checked={currentSettings.previewEnabled}
              onChange={(e) => updateSetting('previewEnabled', e.target.checked)}
              className="w-3 h-3"
            />
            <label htmlFor="eraser-preview" className="text-sm">Show Preview</label>
          </div>

          {/* Eraser Mode */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">Mode</label>
            <select
              value={currentSettings.mode}
              onChange={(e) => updateSetting('mode', e.target.value as EraserSettings['mode'])}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              aria-label="Eraser mode"
            >
              <option value="stroke">Stroke Eraser</option>
              <option value="pixel">Pixel Eraser</option>
              <option value="object">Object Eraser</option>
            </select>
          </div>

          {/* Size Presets */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">Quick Sizes</label>
            <div className="grid grid-cols-4 gap-1">
              {[10, 20, 30, 50].map((size) => (
                <button
                  key={size}
                  onClick={() => updateSetting('size', size)}
                  className={`px-2 py-1 text-xs rounded border transition-all ${
                    currentSettings.size === size
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Reset button */}
          <div className="pt-2 border-t border-gray-200">
            <button
              onClick={resetToDefaults}
              className="w-full px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

AutonomousEraserTool.displayName = 'AutonomousEraserTool';

export default AutonomousEraserTool;
