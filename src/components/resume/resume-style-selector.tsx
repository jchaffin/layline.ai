'use client'

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Palette, Check } from "lucide-react";
import { RESUME_STYLES, type ResumeStyle } from "@/lib/resume-styles";
import { useToast } from "@/hooks/use-toast";

interface ResumeStyleSelectorProps {
  resumeKey: string;
  companyName: string;
  roleTitle: string;
}

export function ResumeStyleSelector({ resumeKey, companyName, roleTitle }: ResumeStyleSelectorProps) {
  const [selectedStyle, setSelectedStyle] = useState<string>('modern');
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  const handleDownload = async (styleId: string) => {
    setIsDownloading(true);
    try {
      const downloadUrl = `/api/resume/download?key=${encodeURIComponent(resumeKey)}&style=${styleId}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      const styleName = RESUME_STYLES.find(s => s.id === styleId)?.name || 'Modern';
      link.download = `${companyName}_${roleTitle}_Resume_${styleName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download started",
        description: `Your ${styleName.toLowerCase()} style resume is being downloaded.`,
      });
      
      setShowDialog(false);
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const StylePreview = ({ style }: { style: ResumeStyle }) => (
    <Card 
      className={`cursor-pointer border-2 transition-all hover:shadow-md ${
        selectedStyle === style.id 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => setSelectedStyle(style.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{style.name}</CardTitle>
          {selectedStyle === style.id && (
            <Check className="w-5 h-5 text-blue-600" />
          )}
        </div>
        <CardDescription className="text-sm">
          {style.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-100 rounded p-3 min-h-[80px]">
          <div className="text-xs text-gray-600 font-mono">
            {style.preview}
          </div>
        </div>
        
        {/* Style-specific preview elements */}
        {style.id === 'modern' && (
          <div className="mt-2 space-y-1">
            <div className="h-2 bg-blue-200 rounded w-3/4"></div>
            <div className="h-1 bg-gray-200 rounded w-1/2"></div>
            <div className="h-1 bg-gray-200 rounded w-2/3"></div>
          </div>
        )}
        
        {style.id === 'classic' && (
          <div className="mt-2 space-y-1">
            <div className="h-2 bg-gray-700 rounded w-3/4 text-center"></div>
            <div className="h-px bg-gray-400 w-full"></div>
            <div className="h-1 bg-gray-200 rounded w-1/2"></div>
          </div>
        )}
        
        {style.id === 'creative' && (
          <div className="mt-2 flex space-x-2">
            <div className="w-6 bg-orange-200 rounded"></div>
            <div className="flex-1 space-y-1">
              <div className="h-2 bg-gray-700 rounded w-3/4"></div>
              <div className="h-1 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        )}
        
        {style.id === 'ats-optimized' && (
          <div className="mt-2 space-y-1">
            <div className="h-2 bg-gray-600 rounded w-3/4"></div>
            <div className="h-1 bg-gray-300 rounded w-1/2"></div>
            <div className="h-1 bg-gray-300 rounded w-2/3"></div>
            <Badge variant="secondary" className="text-xs mt-1">ATS-Friendly</Badge>
          </div>
        )}
        
        {style.id === 'executive' && (
          <div className="mt-2 space-y-1">
            <div className="h-3 bg-gray-800 rounded w-full"></div>
            <div className="h-2 bg-gray-600 rounded w-3/4"></div>
            <div className="h-1 bg-gray-300 rounded w-1/2"></div>
          </div>
        )}
        
        {style.id === 'match-original' && (
          <div className="mt-2 space-y-1">
            <div className="h-2 bg-blue-300 rounded w-3/4"></div>
            <div className="h-1 bg-gray-300 rounded w-1/2"></div>
            <Badge variant="outline" className="text-xs mt-1">Auto-Matched</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="flex items-center space-x-2"
        >
          <Palette className="w-4 h-4" />
          <span>Styled Download</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Choose Resume Style</DialogTitle>
          <DialogDescription>
            Select a professional style for your {companyName} {roleTitle} resume
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
            {RESUME_STYLES.map((style) => (
              <StylePreview key={style.id} style={style} />
            ))}
          </div>
        </ScrollArea>
        
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-600">
            Selected: <span className="font-medium">
              {RESUME_STYLES.find(s => s.id === selectedStyle)?.name}
            </span>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleDownload(selectedStyle)}
              disabled={isDownloading}
              className="flex items-center space-x-2"
            >
              {isDownloading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isDownloading ? 'Generating...' : 'Download PDF'}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}