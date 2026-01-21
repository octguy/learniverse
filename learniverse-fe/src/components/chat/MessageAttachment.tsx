"use client";

import React from "react";
import { FileText, Download } from "lucide-react";

interface MessageAttachmentProps {
  messageType: "TEXT" | "IMAGE" | "VIDEO" | "FILE";
  metadata: string | null;
  textContent: string;
}

/**
 * Downloads a file from Cloudinary with the correct filename.
 * For raw files (like PDFs), we use fetch + blob approach since fl_attachment
 * may not be supported for raw resource types.
 */
async function downloadFile(url: string, fileName: string) {
  try {
    // Fetch the file as a blob
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch file');
    }
    
    const blob = await response.blob();
    
    // Create a blob URL
    const blobUrl = window.URL.createObjectURL(blob);
    
    // Create a temporary link and trigger download
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName; // This will be the downloaded file's name
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the blob URL
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Download failed:', error);
    // Fallback: open in new tab
    window.open(url, '_blank');
  }
}

export default function MessageAttachment({
  messageType,
  metadata,
  textContent,
}: MessageAttachmentProps) {
  if (messageType === "TEXT" || !metadata) {
    return <p className="text-sm whitespace-pre-wrap break-words">{textContent}</p>;
  }


  if (messageType === "IMAGE") {
    return (
      <div>
        <a
          href={metadata}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <img
            src={metadata}
            alt="Image"
            className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            style={{ maxHeight: "400px" }}
          />
        </a>
        {textContent && (
          <p className="text-sm whitespace-pre-wrap break-words mt-2">{textContent}</p>
        )}
      </div>
    );
  }

  if (messageType === "VIDEO") {
    return (
      <div>
        <video
          src={metadata}
          controls
          className="max-w-full rounded-lg"
          style={{ maxHeight: "400px" }}
        />
        {textContent && (
          <p className="text-sm whitespace-pre-wrap break-words mt-2">{textContent}</p>
        )}
      </div>
    );
  }

  if (messageType === "FILE") {
    // Use textContent as filename if available (it contains the original filename)
    // Otherwise extract from URL as fallback
    const getFilenameFromUrl = (url: string): string => {
      try {
        const urlParts = url.split('/');
        const filename = urlParts[urlParts.length - 1];
        return decodeURIComponent(filename);
      } catch {
        return "Download File";
      }
    };

    const filename = textContent || (metadata ? getFilenameFromUrl(metadata) : "Download File");

    return (
      <div>
        <button
          type="button"
          onClick={() => downloadFile(metadata, filename)}
          className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer w-full text-left"
        >
          <FileText className="w-8 h-8 text-gray-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 break-words" title={filename}>
              {filename}
            </p>
          </div>
          <Download className="w-5 h-5 text-gray-600 flex-shrink-0" />
        </button>
      </div>
    );
  }

  return null;
}

