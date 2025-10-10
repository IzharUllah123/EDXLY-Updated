import { Button } from "@/components/ui/button";
import { Share2, Network, Pipette } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { ShareModal } from "./ShareModal";
import { HandTool } from "./tools/HandTool";
import { PointerTool } from "./tools/PointerTool";
import { PencilTool } from "./tools/PencilTool";
import { EraserTool } from "./tools/EraserTool";
import { TextTool } from "./tools/TextTool";
import { UploadMediaTool } from "./tools/StickyNoteTool";
import { EmojiTool } from "./tools/EmojiTool";
import { ShapesTool } from "./tools/ShapesTool";
import FlowchartDropdown from "../../tool9/FlowchartDropdown";
import "../../tool9/FlowChart.css";



interface FloatingToolbarProps {
  activeTool?: string;
  onToolChange?: (tool: string) => void;
  selectedColor?: string;
  onColorChange?: (color: string) => void;
  textMode?: 'simple' | 'colorful' | null;
  onTextModeChange?: (mode: 'simple' | 'colorful' | null) => void;
  onImageUpload?: (file: File) => void;
  onEmojiPlace?: (emoji: string) => void;
  canvasRef?: any;
  selectedEmoji?: string | null;
  onEmojiPlaced?: () => void;
  onShapeSelect?: (shape: 'rectangle' | 'ellipse' | 'polygon' | 'line') => void;
  addElementsViaAction?: (elements: any[]) => void;
}

export const FloatingToolbar = ({
  activeTool: propActiveTool = "hand",
  onToolChange,
  selectedColor: propSelectedColor = "#000000",
  onColorChange,
  textMode,
  onTextModeChange,
  onImageUpload,
  onEmojiPlace,
  canvasRef,
  selectedEmoji,
  onEmojiPlaced,
  onShapeSelect,
  addElementsViaAction,
}: FloatingToolbarProps) => {
  const [activeTool, setActiveTool] = useState(propActiveTool);
  const [selectedColor, setSelectedColor] = useState(propSelectedColor);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isTextToolActive, setIsTextToolActive] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isBackgroundPanelOpen, setIsBackgroundPanelOpen] = useState(false);
  const [colorMode, setColorMode] = useState<'stroke' | 'fill'>('stroke');
  const [hexValue, setHexValue] = useState('#000000');
  const [rgbaValue, setRgbaValue] = useState({ r: 0, g: 0, b: 0, a: 1 });
  const canvasRefForEyedropper = useRef<HTMLCanvasElement>(null);

  // Sync with props
  useEffect(() => {
    setActiveTool(propActiveTool);
  }, [propActiveTool]);

  useEffect(() => {
    setSelectedColor(propSelectedColor);
  }, [propSelectedColor]);



  const handleToolChange = (toolId: string) => {
    setActiveTool(toolId);
    onToolChange?.(toolId);
    setIsTextToolActive(toolId === "text");
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    onColorChange?.(color);
  };

  const colors = [
    // Basic Colors - Row 1
    "#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff",
    // Extended Colors - Row 2
    "#ffa500", "#800080", "#808080", "#c0c0c0", "#800000", "#808000", "#000080", "#008000",
    // Professional Colors - Row 3
    "#008080", "#8000ff", "#deb887", "#daa520", "#ffb6c1", "#ffe4b5", "#f0e68c", "#90ee90",
    // Additional Colors - Row 4
    "#20b2aa", "#87ceeb", "#483d8b", "#dc143c", "#32cd32", "#ff69b4", "#ba55d3", "#cd5c5c",
    // Warm Colors - Row 5
    "#ff6347", "#ffa07a", "#ffdab9", "#fff8dc", "#f0fff0", "#ffe4e1", "#fff0f5", "#e6e6fa"
  ];

  const [activeColorTab, setActiveColorTab] = useState<'swatches' | 'gradients'>('swatches');
  const [isFlowchartDropdownOpen, setIsFlowchartDropdownOpen] = useState(false);

  // Color picker functions
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
      a: 1
    } : null;
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  const updateColorFromHex = (hex: string) => {
    if (!/^#[0-9A-F]{6}$/i.test(hex)) return;

    const rgb = hexToRgb(hex);
    if (rgb) {
      setRgbaValue(rgb);
      setHexValue(hex);
      handleColorChange(hex);
    }
  };

  const updateColorFromRgba = (channel: string, value: number) => {
    const newRgba = { ...rgbaValue, [channel]: value };
    setRgbaValue(newRgba);

    if (channel !== 'a') {
      const hex = rgbToHex(newRgba.r, newRgba.g, newRgba.b);
      setHexValue(hex);
      handleColorChange(hex);
    }
  };

  // Eyedropper functionality
  const startEyedropper = () => {
    const canvas = canvasRef?.current;
    if (!canvas) return;

    setIsColorPickerOpen(false); // Close color picker to access canvas

    // Add eyedropper cursor to canvas
    const canvasElement = document.querySelector('canvas');
    if (canvasElement) {
      canvasElement.style.cursor = 'crosshair';

      const handleCanvasClick = (e: MouseEvent) => {
        const rect = canvasElement.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Get canvas context and pick color
        const ctx = canvasElement.getContext('2d');
        if (ctx) {
          const imageData = ctx.getImageData(x, y, 1, 1);
          const pixel = imageData.data;
          const color = rgbToHex(pixel[0], pixel[1], pixel[2]);

          handleColorChange(color);
          setHexValue(color);
        }

        // Reset cursor and remove listener
        canvasElement.style.cursor = 'default';
        canvasElement.removeEventListener('click', handleCanvasClick);
      };

      canvasElement.addEventListener('click', handleCanvasClick, { once: true });
    }
  };

  return (
    <>
      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="glass-toolbar rounded-xl shadow-xl px-3 py-1 flex items-center gap-1 border border-white/20">
          {/* Logo */}
          <div className="px-2 py-1">
            <span className="text-white font-bold text-base drop-shadow-sm">EDXLY</span>
          </div>

          {/* Separator */}
          <div className="w-px h-8 bg-white/20 mx-1"></div>

          {/* Tools */}
          <HandTool isActive={activeTool === "hand"} onClick={() => handleToolChange("hand")} />
          <PointerTool isActive={activeTool === "selection"} onClick={() => handleToolChange("selection")} />
          <PencilTool isActive={activeTool === "pencil"} onClick={() => handleToolChange("pencil")} />
          <EraserTool isActive={activeTool === "eraser"} onClick={() => handleToolChange("eraser")} />

          <TextTool
            isActive={activeTool === "text"}
            onClick={() => handleToolChange("text")}
            showDropdown={isTextToolActive}
            onSimpleClick={() => {
              onTextModeChange?.("simple");
              setIsTextToolActive(false);
            }}
            onColorfulClick={() => {
              onTextModeChange?.("colorful");
              setIsTextToolActive(false);
            }}
          />

          {/* Canvas Background Tool - With Panel */}
          <div className="relative">
            <div className="flex flex-col items-center gap-0.5">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 rounded-lg transition-all duration-200"
                onClick={() => setIsBackgroundPanelOpen(!isBackgroundPanelOpen)}
                title="Background Tool - Change canvas background"
              >
                <div className="h-4 w-4 text-black">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Clean background/canvas representation */}
                    <rect x="3" y="4" width="14" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" rx="1" />

                    {/* Simple background pattern */}
                    <path d="M6 6.5h1M6 8.5h1M8 6.5h1M8 8.5h1M10 6.5h1M10 8.5h1M12 6.5h1M12 8.5h1"
                          stroke="currentColor" strokeWidth="1" opacity="0.5" />

                    {/* Background icon accent */}
                    <path d="M14 14h-8V11a2 2 0 014-1.414 2 2 0 014 1.414z" fill="currentColor" fillOpacity="0.3" />
                  </svg>
                </div>
              </Button>

              <span className="text-[8px] font-bold leading-none text-black">
                BG
              </span>
            </div>

            {/* Canvas Background Color Panel */}
            {isBackgroundPanelOpen && (
              <div className="absolute top-12 left-0 z-60">
                <div className="bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-gray-200 p-3 min-w-[200px]">
                  <div className="space-y-3">
                    <div className="border-b border-gray-200 pb-2 mb-3">
                      <h3 className="text-sm font-semibold text-gray-800">Canvas Background</h3>
                      <p className="text-xs text-gray-600">Choose your background color</p>
                    </div>

                    {/* Enhanced Background Colors */}
                    <div className="grid grid-cols-3 gap-3">
                      {/* Your Preferred Colors: Blue, Orange, Green, White */}
                      <button
                        className="h-12 w-12 rounded-xl border-3 border-white shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-200 group"
                        style={{ backgroundColor: '#3b82f6' }}
                        onClick={() => {
                          const canvasElement = document.querySelector('#canvas-background') as HTMLElement;
                          if (canvasElement) {
                            canvasElement.style.background = '#3b82f6';
                          }
                          setIsBackgroundPanelOpen(false);
                        }}
                        title="Deep Blue"
                      />

                      <button
                        className="h-12 w-12 rounded-xl border-3 border-white shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-200 group"
                        style={{ backgroundColor: '#fde689' }}
                        onClick={() => {
                          const canvasElement = document.querySelector('#canvas-background') as HTMLElement;
                          if (canvasElement) {
                            canvasElement.style.background = '#fde689';
                          }
                          setIsBackgroundPanelOpen(false);
                        }}
                        title="Cream"
                      />

                      <button
                        className="h-12 w-12 rounded-xl border-3 border-white shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-200 group"
                        style={{ backgroundColor: '#10b981' }}
                        onClick={() => {
                          const canvasElement = document.querySelector('#canvas-background') as HTMLElement;
                          if (canvasElement) {
                            canvasElement.style.background = '#10b981';
                          }
                          setIsBackgroundPanelOpen(false);
                        }}
                        title="Emerald Green"
                      />

                      <button
                        className="h-12 w-12 rounded-xl border-3 border-white shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-200 group"
                        style={{ backgroundColor: '#ffffff' }}
                        onClick={() => {
                          const canvasElement = document.querySelector('#canvas-background') as HTMLElement;
                          if (canvasElement) {
                            canvasElement.style.background = '#ffffff';
                          }
                          setIsBackgroundPanelOpen(false);
                        }}
                        title="Pure White"
                      />

                      {/* Light Background Colors */}
                      <button
                        className="h-12 w-12 rounded-xl border-3 border-white shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-200 group"
                        style={{ backgroundColor: '#e0f2fe' }}
                        onClick={() => {
                          const canvasElement = document.querySelector('#canvas-background') as HTMLElement;
                          if (canvasElement) {
                            canvasElement.style.background = '#e0f2fe';
                          }
                          setIsBackgroundPanelOpen(false);
                        }}
                        title="Light Blue"
                      />

                      <button
                        className="h-12 w-12 rounded-xl border-3 border-white shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-200 group"
                        style={{ backgroundColor: '#f0fdf4' }}
                        onClick={() => {
                          const canvasElement = document.querySelector('#canvas-background') as HTMLElement;
                          if (canvasElement) {
                            canvasElement.style.background = '#f0fdf4';
                          }
                          setIsBackgroundPanelOpen(false);
                        }}
                        title="Light Green"
                      />


                    </div>
                    
                    {/* Custom Color Picker */}
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value="#ffffff"
                          onChange={(e) => {
                            const canvasElement = document.querySelector('#canvas-background') as HTMLElement;
                            if (canvasElement) {
                              canvasElement.style.background = e.target.value;
                            }
                            setIsColorPickerOpen(false);
                          }}
                          className="w-10 h-10 rounded-lg border-2 border-gray-300 cursor-pointer"
                          title="Custom Background Color"
                        />
                        <span className="text-xs font-medium text-gray-700">Custom Color</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <UploadMediaTool
            isActive={activeTool === "sticky"}
            onClick={() => handleToolChange("sticky")}
            onImageUpload={onImageUpload}
          />
          <EmojiTool
            isActive={activeTool === "emoji"}
            onClick={() => handleToolChange("emoji")}
            onEmojiPlace={onEmojiPlace}
          />
          <ShapesTool
            isActive={activeTool === "shapes"}
            onClick={() => handleToolChange("shapes")}
            onShapeSelect={onShapeSelect}
          />

          {/* Flowcharts & Graphs Tool - activates left panel */}
          <div className="relative">
            <div className="flex flex-col items-center gap-0.5">
              <Button
                variant="ghost"
                size="sm"
                className={`h-9 w-9 p-0 rounded-lg transition-all duration-200 ${
                  activeTool === "graph" ? "bg-white/20 ring-2 ring-white/40" : ""
                }`}
                onClick={() => handleToolChange("graph")}
                title="Flowcharts and Graphs - Add predefined flowcharts and graphs to canvas"
              >
                <div className="h-4 w-4 text-black">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 3h14v14H3z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                    <circle cx="6" cy="6" r="1.5" fill="currentColor"/>
                    <circle cx="6" cy="14" r="1.5" fill="currentColor"/>
                    <path d="M8 6h6M8 10h6M8 14h4" stroke="currentColor" strokeWidth="1"/>
                    <path d="M6 7.5V12.5" stroke="currentColor" strokeWidth="1"/>
                  </svg>
                </div>
              </Button>

              <span className="text-[8px] font-bold leading-none text-black">
                9
              </span>
            </div>
          </div>

          {/* Color Picker */}
          <div className="relative mx-1 flex items-center">
            {/* Fill/Stroke Toggle */}
            <div className="flex flex-col gap-0.5 mr-1">
              <button
                className={`w-3 h-3 rounded-full border border-white/40 text-[7px] font-bold ${
                  colorMode === 'fill' ? 'bg-blue-500 text-white' : 'text-black'
                }`}
                onClick={() => setColorMode('fill')}
                title="Fill Mode"
              >
                F
              </button>
              <button
                className={`w-3 h-3 rounded-full border border-white/40 text-[7px] font-bold ${
                  colorMode === 'stroke' ? 'bg-blue-500 text-white' : 'text-black'
                }`}
                onClick={() => setColorMode('stroke')}
                title="Stroke Mode"
              >
                S
              </button>
            </div>

            {/* Color Swatch */}
            <div
              className="rounded-lg border-2 border-white/30 cursor-pointer shadow-md transition-all hover:scale-105"
              style={{ width: '32px', height: '32px', backgroundColor: selectedColor }}
              onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
              title={`Color — Choose ${colorMode} color`}
            >
              {selectedColor === "#ffffff" && (
                <div className="w-full h-full rounded-lg border border-gray-300"></div>
              )}
            </div>

            {/* Comprehensive Color Picker Panel */}
            {isColorPickerOpen && (
              <div className="absolute top-12 left-0 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-200 w-80 max-h-96 overflow-auto z-50">
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {colorMode === 'fill' ? 'Fill' : 'Stroke'} Color Picker
                  </h3>
                  <button
                    onClick={() => setIsColorPickerOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                  <button
                    className={`px-4 py-2 text-sm font-medium ${
                      activeColorTab === 'swatches' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'
                    }`}
                    onClick={() => setActiveColorTab('swatches')}
                  >
                    Swatches
                  </button>
                  <button
                    className={`px-4 py-2 text-sm font-medium ${
                      activeColorTab === 'gradients' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'
                    }`}
                    onClick={() => setActiveColorTab('gradients')}
                  >
                    Gradients
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-3 space-y-3">
                  {/* Eyedropper Tool */}
                  <div className="border-b border-gray-200 pb-3">
                    <button
                      onClick={startEyedropper}
                      className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 px-3 rounded-lg transition-colors"
                      title="Eyedropper - Pick color from canvas"
                    >
                      <Pipette className="w-4 h-4" />
                      <span className="text-xs font-medium">Pick Color from Canvas</span>
                    </button>
                  </div>

                  {activeColorTab === 'swatches' && (
                    <div className="space-y-3">
                      {/* Color Categories */}
                      <div>
                        <h4 className="text-xs font-medium text-gray-700 mb-2">😊 Basic Colors</h4>
                        <div className="grid grid-cols-8 gap-1">
                          {colors.slice(0, 8).map((color) => (
                            <button
                              key={color}
                              className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform"
                              style={{ backgroundColor: color }}
                              onClick={() => handleColorChange(color)}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-medium text-gray-700 mb-2">🎨 Extended Colors</h4>
                        <div className="grid grid-cols-8 gap-1">
                          {colors.slice(8, 16).map((color) => (
                            <button
                              key={color}
                              className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform"
                              style={{ backgroundColor: color }}
                              onClick={() => handleColorChange(color)}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-medium text-gray-700 mb-2">🏢 Professional Colors</h4>
                        <div className="grid grid-cols-8 gap-1">
                          {colors.slice(16, 24).map((color) => (
                            <button
                              key={color}
                              className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform"
                              style={{ backgroundColor: color }}
                              onClick={() => handleColorChange(color)}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-medium text-gray-700 mb-2">🌈 Warm & Pastel Colors</h4>
                        <div className="grid grid-cols-8 gap-1">
                          {colors.slice(24, 32).map((color) => (
                            <button
                              key={color}
                              className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform"
                              style={{ backgroundColor: color }}
                              onClick={() => handleColorChange(color)}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-medium text-gray-700 mb-2">💙 Special Colors</h4>
                        <div className="grid grid-cols-8 gap-1">
                          {colors.slice(32).map((color) => (
                            <button
                              key={color}
                              className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform"
                              style={{ backgroundColor: color }}
                              onClick={() => handleColorChange(color)}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeColorTab === 'gradients' && (
                    <div className="space-y-3">
                      {/* Horizontal Gradients */}
                      <div>
                        <h4 className="text-xs font-medium text-gray-700 mb-2">➡️ Horizontal Gradients</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-md hover:opacity-80"
                            onClick={() => handleColorChange('linear-gradient(to right, #3B82F6, #8B5CF6)')}
                          >
                            <span className="text-white text-xs font-medium">Blue Purple</span>
                          </button>
                          <button
                            className="p-3 bg-gradient-to-r from-green-400 to-blue-500 rounded-md hover:opacity-80"
                            onClick={() => handleColorChange('linear-gradient(to right, #4ADE80, #3B82F6)')}
                          >
                            <span className="text-white text-xs font-medium">Green Blue</span>
                          </button>
                          <button
                            className="p-3 bg-gradient-to-r from-pink-500 to-orange-500 rounded-md hover:opacity-80"
                            onClick={() => handleColorChange('linear-gradient(to right, #EC4899, #F97316)')}
                          >
                            <span className="text-white text-xs font-medium">Pink Orange</span>
                          </button>
                          <button
                            className="p-3 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-md hover:opacity-80"
                            onClick={() => handleColorChange('linear-gradient(to right, #6366F1, #EC4899)')}
                          >
                            <span className="text-white text-xs font-medium">Indigo Pink</span>
                          </button>
                        </div>
                      </div>

                      {/* Vertical Gradients */}
                      <div>
                        <h4 className="text-xs font-medium text-gray-700 mb-2">⬇️ Vertical Gradients</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            className="p-3 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-md hover:opacity-80"
                            onClick={() => handleColorChange('linear-gradient(to bottom, #22D3EE, #2563EB)')}
                          >
                            <span className="text-white text-xs font-medium">Cyan Blue</span>
                          </button>
                          <button
                            className="p-3 bg-gradient-to-b from-yellow-400 via-orange-500 to-red-500 rounded-md hover:opacity-80"
                            onClick={() => handleColorChange('linear-gradient(to bottom, #FACC15, #F97316, #EF4444)')}
                          >
                            <span className="text-white text-xs font-medium">sunset</span>
                          </button>
                          <button
                            className="p-3 bg-gradient-to-b from-purple-500 to-pink-500 rounded-md hover:opacity-80"
                            onClick={() => handleColorChange('linear-gradient(to bottom, #A855F7, #EC4899)')}
                          >
                            <span className="text-white text-xs font-medium">Purple Pink</span>
                          </button>
                          <button
                            className="p-3 bg-gradient-to-b from-green-400 to-teal-500 rounded-md hover:opacity-80"
                            onClick={() => handleColorChange('linear-gradient(to bottom, #4ADE80, #14B8A6)')}
                          >
                            <span className="text-white text-xs font-medium">Green Teal</span>
                          </button>
                        </div>
                      </div>

                      {/* Diagonal Gradients */}
                      <div>
                        <h4 className="text-xs font-medium text-gray-700 mb-2">↘️ Diagonal Gradients</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            className="p-3 bg-gradient-to-br from-red-500 to-yellow-500 rounded-md hover:opacity-80"
                            onClick={() => handleColorChange('linear-gradient(to bottom right, #EF4444, #FACC15)')}
                          >
                            <span className="text-white text-xs font-medium">Red Yellow</span>
                          </button>
                          <button
                            className="p-3 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-md hover:opacity-80"
                            onClick={() => handleColorChange('linear-gradient(to bottom right, #60A5FA, #4F46E5)')}
                          >
                            <span className="text-white text-xs font-medium">Blue Indigo</span>
                          </button>
                          <button
                            className="p-3 bg-gradient-to-br from-emerald-400 to-cyan-600 rounded-md hover:opacity-80"
                            onClick={() => handleColorChange('linear-gradient(to bottom right, #34D399, #0891B2)')}
                          >
                            <span className="text-white text-xs font-medium">Emerald Cyan</span>
                          </button>
                          <button
                            className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-md hover:opacity-80"
                            onClick={() => handleColorChange('linear-gradient(to bottom right, #A78BFA, #9333EA)')}
                          >
                            <span className="text-white text-xs font-medium">Violet Purple</span>
                          </button>
                        </div>
                      </div>

                      {/* Radial Gradients */}
                      <div>
                        <h4 className="text-xs font-medium text-gray-700 mb-2">⭕ Radial Gradients</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            className="p-3 bg-gradient-radial from-red-400 to-pink-600 rounded-md hover:opacity-80"
                            onClick={() => handleColorChange('radial-gradient(circle, #FC8181, #DB2777)')}
                          >
                            <span className="text-white text-xs font-medium">Red Pink Radial</span>
                          </button>
                          <button
                            className="p-3 bg-gradient-to-br from-yellow-300 via-orange-300 to-red-400 rounded-md hover:opacity-80"
                            onClick={() => handleColorChange('linear-gradient(45deg, #FDE68A, #FB923C, #F87171)')}
                          >
                            <span className="text-white text-xs font-medium">Warm 45°</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-3 bg-gray-50 rounded-b-xl">
                  <button
                    onClick={() => setIsColorPickerOpen(false)}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-md"
                  >
                    Apply Color
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="w-px h-8 bg-white/20 mx-1"></div>

          {/* Monocolor Share Button */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="relative bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 hover:rotate-1 text-sm h-8 overflow-hidden group"
              onClick={() => setIsShareModalOpen(true)}
            >
              <div className="absolute inset-0 bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
              <div className="relative flex items-center justify-center gap-2">
                <Share2 className="h-4 w-4 transition-transform group-hover:rotate-12 group-hover:scale-110" />
                <span className="text-white drop-shadow-lg">Share</span>
              </div>
              <div className="absolute inset-0 rounded-lg bg-white/10 opacity-0 group-hover:opacity-100 group-hover:animate-pulse"></div>
            </Button>


          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </>
  );
};
