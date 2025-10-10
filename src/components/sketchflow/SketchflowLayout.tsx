import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { Canvas } from "./Canvas";
import { PropertiesPanel } from "./PropertiesPanel";
import { BottomBar } from "./BottomBar";

export const SketchflowLayout = () => {
  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Canvas Area */}
        <Canvas />
        
        {/* Properties Panel */}
        <PropertiesPanel />
      </div>
      
      {/* Bottom Bar */}
      <BottomBar />
    </div>
  );
};