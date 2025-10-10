import { Button } from "@/components/ui/button";
import { 
  MousePointer2, 
  Square, 
  Circle, 
  Type, 
  Image, 
  Layers, 
  Folder, 
  ChevronLeft,
  ChevronRight,
  Plus,
  Search
} from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const tools = [
    { icon: MousePointer2, label: "Select", active: true },
    { icon: Square, label: "Rectangle" },
    { icon: Circle, label: "Circle" },
    { icon: Type, label: "Text" },
    { icon: Image, label: "Image" },
  ];

  const layers = [
    { name: "Header Component", type: "Group", visible: true },
    { name: "Navigation Bar", type: "Rectangle", visible: true },
    { name: "Logo", type: "Image", visible: true },
    { name: "Menu Items", type: "Group", visible: false },
    { name: "Hero Section", type: "Group", visible: true },
    { name: "Background", type: "Rectangle", visible: true },
    { name: "Title Text", type: "Text", visible: true },
  ];

  return (
    <div className={`bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-200 ${isCollapsed ? 'w-12' : 'w-64'}`}>
      {/* Collapse Toggle */}
      <div className="h-12 flex items-center justify-between px-3 border-b border-gray-200 dark:border-gray-700">
        {!isCollapsed && <span className="text-sm font-medium">Tools & Layers</span>}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {!isCollapsed && (
        <>
          {/* Tools Section */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Tools
            </h3>
            <div className="grid grid-cols-2 gap-1">
              {tools.map((tool, index) => (
                <Button
                  key={index}
                  variant={tool.active ? "default" : "ghost"}
                  size="sm"
                  className="h-8 justify-start gap-2"
                >
                  <tool.icon className="h-4 w-4" />
                  <span className="text-xs">{tool.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Layers Section */}
          <div className="flex-1 p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Layers
              </h3>
              <Button variant="ghost" size="sm" className="p-1">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="relative mb-3">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              <Input 
                placeholder="Search layers..." 
                className="h-7 pl-7 text-xs"
              />
            </div>

            <div className="space-y-1">
              {layers.map((layer, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer group"
                >
                  <div className="w-3 h-3 flex items-center justify-center">
                    {layer.type === "Group" ? (
                      <Folder className="h-3 w-3 text-blue-500" />
                    ) : layer.type === "Rectangle" ? (
                      <Square className="h-3 w-3 text-gray-500" />
                    ) : layer.type === "Image" ? (
                      <Image className="h-3 w-3 text-green-500" />
                    ) : (
                      <Type className="h-3 w-3 text-purple-500" />
                    )}
                  </div>
                  <span className="text-xs flex-1 truncate">{layer.name}</span>
                  <div className={`w-2 h-2 rounded-full ${layer.visible ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};