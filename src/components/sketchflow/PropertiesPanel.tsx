import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Palette, 
  Move, 
  Type, 
  Eye, 
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Trash2
} from "lucide-react";

export const PropertiesPanel = () => {
  return (
    <div className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
        <span className="text-sm font-medium">Properties</span>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="p-1">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="p-1">
            <Lock className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="p-1">
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="p-1 text-red-500">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="design" className="w-full">
          <TabsList className="grid w-full grid-cols-3 m-2">
            <TabsTrigger value="design" className="text-xs">Design</TabsTrigger>
            <TabsTrigger value="layout" className="text-xs">Layout</TabsTrigger>
            <TabsTrigger value="effects" className="text-xs">Effects</TabsTrigger>
          </TabsList>

          <TabsContent value="design" className="p-4 space-y-6">
            {/* Element Info */}
            <div>
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Selected Element
              </Label>
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-sm font-medium">Header Component</span>
                </div>
                <div className="text-xs text-gray-500">Rectangle • 375×64px</div>
              </div>
            </div>

            {/* Fill */}
            <div>
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Fill
              </Label>
              <div className="mt-2 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500 rounded border border-gray-200 cursor-pointer"></div>
                  <Input value="#3B82F6" className="flex-1 h-8 text-xs" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Opacity</span>
                    <span>100%</span>
                  </div>
                  <Slider defaultValue={[100]} max={100} step={1} className="w-full" />
                </div>
              </div>
            </div>

            {/* Stroke */}
            <div>
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Stroke
              </Label>
              <div className="mt-2 space-y-3">
                <div className="flex items-center gap-2">
                  <Switch />
                  <span className="text-sm">Enable stroke</span>
                </div>
                <div className="flex items-center gap-2 opacity-50">
                  <div className="w-8 h-8 bg-gray-300 rounded border border-gray-200"></div>
                  <Input value="#000000" className="flex-1 h-8 text-xs" disabled />
                </div>
                <div className="space-y-2 opacity-50">
                  <div className="flex justify-between text-xs">
                    <span>Width</span>
                    <span>1px</span>
                  </div>
                  <Slider defaultValue={[1]} max={10} step={1} className="w-full" disabled />
                </div>
              </div>
            </div>

            {/* Typography */}
            <div>
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Typography
              </Label>
              <div className="mt-2 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Font</Label>
                    <Input value="Inter" className="h-8 text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs">Weight</Label>
                    <Input value="600" className="h-8 text-xs" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Size</Label>
                    <Input value="16" className="h-8 text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs">Line Height</Label>
                    <Input value="24" className="h-8 text-xs" />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="layout" className="p-4 space-y-6">
            {/* Position */}
            <div>
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Position
              </Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">X</Label>
                  <Input value="0" className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Y</Label>
                  <Input value="0" className="h-8 text-xs" />
                </div>
              </div>
            </div>

            {/* Size */}
            <div>
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Size
              </Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Width</Label>
                  <Input value="375" className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Height</Label>
                  <Input value="64" className="h-8 text-xs" />
                </div>
              </div>
            </div>

            {/* Rotation */}
            <div>
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Transform
              </Label>
              <div className="mt-2 space-y-3">
                <div>
                  <Label className="text-xs">Rotation</Label>
                  <div className="flex items-center gap-2">
                    <Input value="0" className="flex-1 h-8 text-xs" />
                    <span className="text-xs text-gray-500">°</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Constraints */}
            <div>
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Constraints
              </Label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs">Lock aspect ratio</span>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">Fix position</span>
                  <Switch />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="effects" className="p-4 space-y-6">
            {/* Shadow */}
            <div>
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Drop Shadow
              </Label>
              <div className="mt-2 space-y-3">
                <div className="flex items-center gap-2">
                  <Switch />
                  <span className="text-sm">Enable shadow</span>
                </div>
                <div className="grid grid-cols-2 gap-2 opacity-50">
                  <div>
                    <Label className="text-xs">X Offset</Label>
                    <Input value="0" className="h-8 text-xs" disabled />
                  </div>
                  <div>
                    <Label className="text-xs">Y Offset</Label>
                    <Input value="4" className="h-8 text-xs" disabled />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 opacity-50">
                  <div>
                    <Label className="text-xs">Blur</Label>
                    <Input value="8" className="h-8 text-xs" disabled />
                  </div>
                  <div>
                    <Label className="text-xs">Spread</Label>
                    <Input value="0" className="h-8 text-xs" disabled />
                  </div>
                </div>
              </div>
            </div>

            {/* Border Radius */}
            <div>
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Corner Radius
              </Label>
              <div className="mt-2 space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Radius</span>
                    <span>8px</span>
                  </div>
                  <Slider defaultValue={[8]} max={50} step={1} className="w-full" />
                </div>
              </div>
            </div>

            {/* Blur */}
            <div>
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Background Blur
              </Label>
              <div className="mt-2 space-y-3">
                <div className="flex items-center gap-2">
                  <Switch />
                  <span className="text-sm">Enable blur</span>
                </div>
                <div className="space-y-2 opacity-50">
                  <div className="flex justify-between text-xs">
                    <span>Blur Amount</span>
                    <span>0px</span>
                  </div>
                  <Slider defaultValue={[0]} max={20} step={1} className="w-full" disabled />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};