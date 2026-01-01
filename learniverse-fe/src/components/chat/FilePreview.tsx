"use client";

import React, { useState } from "react";
import { X, FileText, Image as ImageIcon, Video } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilePreviewProps {
  file: File;
  fileType: "IMAGE" | "VIDEO" | "FILE";
  onCancel: () => void;
  onSend: () => void;
  uploading: boolean;
  uploadProgress: number;
}

export default function FilePreview({
  file,
  fileType,
  onCancel,
  onSend,
  uploading,
  uploadProgress,
}: FilePreviewProps) {
  const [preview, setPreview] = useState<string>("");

  React.useEffect(() => {
    if (fileType === "IMAGE" || fileType === "VIDEO") {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [file, fileType]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">Send File</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            disabled={uploading}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Preview */}
        <div className="p-6">
          {fileType === "IMAGE" && preview && (
            <img
              src={preview}
              alt="Preview"
              className="max-w-full max-h-96 mx-auto rounded-lg"
            />
          )}

          {fileType === "VIDEO" && preview && (
            <video
              src={preview}
              controls
              className="max-w-full max-h-96 mx-auto rounded-lg"
            />
          )}

          {fileType === "FILE" && (
            <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-lg">
              <FileText className="w-12 h-12 text-gray-400" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t">
          <Button variant="outline" onClick={onCancel} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={onSend} disabled={uploading}>
            {uploading ? "Sending..." : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}
