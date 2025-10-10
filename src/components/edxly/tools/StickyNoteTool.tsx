import { Button } from "@/components/ui/button";
import { CloudUpload } from "lucide-react";
import { useRef } from "react";

interface UploadMediaToolProps {
  isActive: boolean;
  onClick: () => void;
  onImageUpload?: (file: File) => void;
}

export const UploadMediaTool = ({ isActive, onClick, onImageUpload }: UploadMediaToolProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    onClick();
    // Trigger file selection
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (PNG, JPG, JPEG)
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a PNG, JPG, or JPEG image');
        return;
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      // Close any existing modal
      onImageUpload?.(file);
    }
  };

  return (
    <div className="flex flex-col items-center gap-0.5">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        variant="ghost"
        size="sm"
        className={`h-9 w-9 p-0 rounded-lg transition-all duration-200 ${
          isActive
            ? "bg-white/20 text-white shadow-md"
            : "text-black hover:bg-white"
        }`}
        onClick={handleClick}
        title="Upload Media (PNG, JPG, JPEG)"
      >
        <CloudUpload className={`h-4 w-4 ${isActive ? 'text-white' : 'text-black'}`} />
      </Button>
      <span className={`text-[8px] font-bold leading-none ${
        isActive ? 'text-white' : 'text-black'
      }`}>
        6
      </span>
    </div>
  );
};
