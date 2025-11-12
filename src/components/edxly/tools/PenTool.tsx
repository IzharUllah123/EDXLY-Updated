import React, { useState, forwardRef, useImperativeHandle } from 'react';

// --- Pen Tool Settings Panel Component ---

// Define the types for the component's props
export interface PenSettings {
  strokeWidth: number;
  smoothing: number;
  pressureEnabled: boolean;
  mode: 'raster' | 'vector';
  cap: 'round' | 'butt' | 'square';
  join: 'round' | 'miter' | 'bevel';
  dashPattern: number[];
  stabilizerLevel: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  roughness: number;
}

interface AutonomousPenToolProps {
  penSettings: PenSettings;
  onPenSettingsChange: (newSettings: PenSettings) => void;
  isVisible: boolean;
  onClose: () => void;
}

export interface AutonomousPenToolRef {
  // You can add methods here to control the panel from the parent if needed
}

// Using forwardRef to allow parent components to get a ref to this component
export const AutonomousPenTool = forwardRef<AutonomousPenToolRef, AutonomousPenToolProps>(
  ({ penSettings, onPenSettingsChange, isVisible, onClose }, ref) => {

    // This makes sure the component is not rendered if it's not visible
    if (!isVisible) {
      return null;
    }

    // A helper function to handle changes to any setting
    const handleSettingChange = (setting: keyof PenSettings, value: any) => {
      onPenSettingsChange({ ...penSettings, [setting]: value });
    };

    // Expose any methods to the parent via the ref
    useImperativeHandle(ref, () => ({}));

    return (
      <div className="fixed top-20 left-4 z-50 bg-white w-64 rounded-lg shadow-xl border border-gray-200 p-4 font-sans">
        {/* Panel Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-gray-800">Pen Settings</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors"
            title="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Stroke Width Slider */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">Stroke Width</label>
          <div className="flex items-center">
            <input
              type="range"
              min="1"
              max="50"
              value={penSettings.strokeWidth}
              onChange={(e) => handleSettingChange('strokeWidth', parseInt(e.target.value, 10))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs text-gray-700 w-10 text-center ml-2">{penSettings.strokeWidth}px</span>
          </div>
        </div>

        {/* Smoothing Slider */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">Smoothing</label>
          <div className="flex items-center">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={penSettings.smoothing}
              onChange={(e) => handleSettingChange('smoothing', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
             <span className="text-xs text-gray-700 w-10 text-center ml-2">{penSettings.smoothing.toFixed(1)}</span>
          </div>
        </div>

        {/* Pressure Sensitivity Toggle */}
        <div className="flex items-center justify-between mb-4">
            <label className="text-xs font-medium text-gray-600">Pressure Sensitivity</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={penSettings.pressureEnabled}
                onChange={(e) => handleSettingChange('pressureEnabled', e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
        </div>

         {/* Stroke Style Buttons */}
        <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-2">Stroke Style</label>
            <div className="grid grid-cols-3 gap-2">
                 <button onClick={() => handleSettingChange('strokeStyle', 'solid')} className={`text-xs py-1 rounded border ${penSettings.strokeStyle === 'solid' ? 'bg-blue-500 text-white border-blue-500' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Solid</button>
                 <button onClick={() => handleSettingChange('strokeStyle', 'dashed')} className={`text-xs py-1 rounded border ${penSettings.strokeStyle === 'dashed' ? 'bg-blue-500 text-white border-blue-500' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Dashed</button>
                 <button onClick={() => handleSettingChange('strokeStyle', 'dotted')} className={`text-xs py-1 rounded border ${penSettings.strokeStyle === 'dotted' ? 'bg-blue-500 text-white border-blue-500' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Dotted</button>
            </div>
        </div>
      </div>
    );
  }
);


// --- Example of how to use the AutonomousPenTool ---

export const PenToolExample = () => {
  // State to manage which tool is currently active
  const [activeTool, setActiveTool] = useState<'pencil' | 'eraser' | 'hand'>('pencil');
  
  // State to hold the current pen settings
  const [penSettings, setPenSettings] = useState<PenSettings>({
    strokeWidth: 5,
    smoothing: 0.5,
    pressureEnabled: true,
    mode: 'raster',
    cap: 'round',
    join: 'round',
    dashPattern: [],
    stabilizerLevel: 0.5,
    strokeStyle: 'solid',
    roughness: 1,
  });
  
  // This function would be passed to your toolbar to change the active tool
  const handleToolChange = (tool: 'pencil' | 'eraser' | 'hand') => {
    setActiveTool(tool);
  };
  
  return (
    <div className="w-full h-screen bg-gray-100 relative">
      {/* This is a mock toolbar to control the active tool */}
      <div className="absolute top-4 left-4 bg-white p-2 rounded-lg shadow-md flex gap-2">
        <button 
          onClick={() => handleToolChange('pencil')} 
          className={`px-3 py-1 text-sm rounded ${activeTool === 'pencil' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Pen
        </button>
        <button 
          onClick={() => handleToolChange('hand')} 
          className={`px-3 py-1 text-sm rounded ${activeTool === 'hand' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Hand
        </button>
      </div>

      {/* The Pen Tool Settings Panel */}
      <AutonomousPenTool
        // The panel is only visible when the active tool is 'pencil'
        isVisible={activeTool === 'pencil'}
        penSettings={penSettings}
        onPenSettingsChange={setPenSettings}
        // When the panel is closed, we switch back to the 'hand' tool
        onClose={() => setActiveTool('hand')}
        ref={null} // We don't need a ref in this example
      />
      
      {/* A simple display to show the current settings */}
      <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-md text-xs">
          <h4 className="font-bold mb-2">Current Settings:</h4>
          <pre>{JSON.stringify(penSettings, null, 2)}</pre>
      </div>
    </div>
  );
};

export default PenToolExample;
