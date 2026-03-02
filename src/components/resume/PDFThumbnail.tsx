"use client";

import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';

interface PDFThumbnailProps {
  resumeData: any;
  className?: string;
  fallbackIcon?: React.ReactNode;
}

export default function PDFThumbnail({ resumeData, className = '', fallbackIcon }: PDFThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!resumeData) {
      setIsLoading(false);
      setError(true);
      return;
    }

    generateThumbnail();
  }, [resumeData]);

  const generateThumbnail = async () => {
    try {
      setIsLoading(true);
      setError(false);

      // Generate PDF data URL for thumbnail
      const response = await fetch('/api/resume/pdf-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resumeData }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        setThumbnailUrl(imageUrl);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Error generating PDF thumbnail:', err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-2"></div>
          <p className="text-xs text-gray-500">Generating preview...</p>
        </div>
      </div>
    );
  }

  if (error || !thumbnailUrl) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 ${className}`}>
        <div className="text-center">
          {fallbackIcon || <FileText className="w-8 h-8 text-gray-400" />}
          <div className="mt-2 text-xs text-gray-500 font-medium uppercase tracking-wide">
            Resume
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-white ${className}`}>
      <img 
        src={thumbnailUrl}
        alt="Document preview"
        className="w-full h-full object-cover object-top"
        onError={() => setError(true)}
      />
      {/* Subtle overlay to indicate it's a preview */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>
    </div>
  );
}
