"use client";

import { useState, useEffect } from "react";
import { FileText, Loader2 } from "lucide-react";

interface PDFThumbnailProps {
  resumeData?: any;
  s3Key?: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
}

export default function PDFThumbnail({
  resumeData,
  s3Key,
  className = "",
  fallbackIcon,
}: PDFThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!resumeData && !s3Key) {
      setIsLoading(false);
      setError(true);
      return;
    }
    generateThumbnail();
  }, [resumeData, s3Key]);

  const generateThumbnail = async () => {
    try {
      setIsLoading(true);
      setError(false);

      let data = resumeData;

      if (!data && s3Key) {
        const res = await fetch(
          `/api/resume/parsed?action=get&key=${encodeURIComponent(s3Key)}`
        );
        if (res.ok) data = await res.json();
      }

      if (!data) {
        setError(true);
        return;
      }

      const response = await fetch("/api/resume/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData: data }),
      });

      if (response.ok) {
        const blob = await response.blob();
        setThumbnailUrl(URL.createObjectURL(blob));
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center bg-muted animate-pulse ${className}`}
      >
        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (error || !thumbnailUrl) {
    return (
      <div
        className={`flex items-center justify-center bg-muted ${className}`}
      >
        {fallbackIcon || (
          <FileText className="w-6 h-6 text-muted-foreground" />
        )}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-card ${className}`}>
      <img
        src={thumbnailUrl}
        alt="Document preview"
        className="w-full h-full object-cover object-top"
        onError={() => setError(true)}
      />
    </div>
  );
}
