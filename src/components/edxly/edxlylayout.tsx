import { DrawingCanvas } from "./DrawingCanvas";

export const EdxlyLayout = () => {
  return (
    <div className="h-screen w-screen overflow-hidden relative">
      {/* Drawing Canvas (Background) */}
      <DrawingCanvas />
    </div>
  );
};
