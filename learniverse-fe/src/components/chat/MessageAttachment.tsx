"use client";

import React from "react";
import { FileText, Download } from "lucide-react";

interface MessageAttachmentProps {
  messageType: "TEXT" | "IMAGE" | "VIDEO" | "FILE";
  metadata: string | null;
  textContent: string;
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
      <div className="space-y-2">
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
          />
        </a>
        {textContent && (
          <p className="text-sm whitespace-pre-wrap break-words">{textContent}</p>
        )}
      </div>
    );
  }

  if (messageType === "VIDEO") {
    return (
      <div className="space-y-2">
        <video
          src={metadata}
          controls
          className="max-w-full rounded-lg"
        />
        {textContent && (
          <p className="text-sm whitespace-pre-wrap break-words">{textContent}</p>
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
      <div className="space-y-2">
        <a
          href={metadata}
          download={filename}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors max-w-sm"
        >
          <FileText className="w-8 h-8 text-gray-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 break-words" title={filename}>
              {filename}
            </p>
          </div>
          <Download className="w-5 h-5 text-gray-600 flex-shrink-0" />
        </a>
      </div>
    );
  }

  return null;
}
