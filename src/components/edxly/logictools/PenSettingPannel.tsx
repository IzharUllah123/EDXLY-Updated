import React, { useState } from "react"; // 1. Import useState

interface PenSettingsPanelProps {
  penSettings: {
    strokeWidth: number;
    smoothing: number;
    pressureEnabled: boolean;
  };
  setPenSettings: React.Dispatch<React.SetStateAction<any>>;
}

const PenSettingsPanel: React.FC<PenSettingsPanelProps> = ({
  penSettings,
  setPenSettings,
}) => {
  // 2. Add state for collapse
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    /* --- MODIFIED: Updated positioning classes to match other panels --- */
    <div className="fixed top-16 right-4 bg-white shadow-lg rounded-2xl
     p-4 w-52 z-50 border border-gray-200 animate-slide-in lg:absolute lg:top-6 lg:left-6 lg:right-auto">
      {/* --- END MODIFICATION --- */}

      {/* 3. Make header a flex container */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
          🖊️ Pen Settings
        </h3>
        {/* --- NEW COLLAPSE BUTTON --- */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-md hover:bg-gray-100 text-gray-500"
          title={isCollapsed ? "Show" : "Hide"}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {isCollapsed ? '▼' : '▲'}
        </button>
        {/* --- END NEW BUTTON --- */}
      </div>

      {/* 4. Conditionally render the panel content */}
      {!isCollapsed && (
        <>
          {/* Stroke Width */}
          <div className="mb-3">
            <label className="text-xs text-gray-600">Stroke Width</label>
            <input
              type="range"
              min={1}
              max={20}
              value={penSettings.strokeWidth}
              onChange={(e) =>
                setPenSettings({ ...penSettings, strokeWidth: Number(e.target.value) })
              }
              className="w-full mt-1"
            />
            <p className="text-xs text-gray-500 text-center">{penSettings.strokeWidth}px</p>
          </div>

          {/* Smoothing */}
          <div className="mb-3">
            <label className="text-xs text-gray-600">Smoothing</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={penSettings.smoothing}
              onChange={(e) =>
                setPenSettings({ ...penSettings, smoothing: parseFloat(e.target.value) })
              }
              className="w-full mt-1"
            />
            <p className="text-xs text-gray-500 text-center">
              {penSettings.smoothing.toFixed(2)}
            </p>
          </div>

          {/* Pressure toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={penSettings.pressureEnabled}
              onChange={(e) =>
                setPenSettings({ ...penSettings, pressureEnabled: e.target.checked })
              }
            />
            <label className="text-xs text-gray-600">Pressure Enabled</label>
          </div>
        </>
      )}
      {/* --- End conditional render --- */}
    </div>
  );
};

export default PenSettingsPanel;