"use client";

import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Type, 
  Sparkles,
  Trash2 
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showWordCount?: boolean;
  showAIButton?: boolean;
  onAIClick?: () => void;
  onRemove?: () => void;
  className?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter text...",
  showWordCount = true,
  showAIButton = false,
  onAIClick,
  onRemove,
  className = "",
  minHeight = "120px"
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newText);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const formatBold = () => insertText("**", "**");
  const formatItalic = () => insertText("*", "*");
  const formatUnderline = () => insertText("_", "_");
  const formatBulletList = () => {
    const lines = value.split('\n');
    const start = textareaRef.current?.selectionStart || 0;
    const lineIndex = value.substring(0, start).split('\n').length - 1;
    
    if (lines[lineIndex] && !lines[lineIndex].startsWith('• ')) {
      lines[lineIndex] = '• ' + lines[lineIndex];
      onChange(lines.join('\n'));
    }
  };

  const wordCount = value.trim().split(/\s+/).filter(word => word.length > 0).length;
  const charCount = value.length;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center space-x-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={formatBold}
            className="h-8 w-8 p-0"
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={formatItalic}
            className="h-8 w-8 p-0"
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={formatUnderline}
            className="h-8 w-8 p-0"
            title="Underline"
          >
            <Underline className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-gray-300 mx-2" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={formatBulletList}
            className="h-8 w-8 p-0"
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          {showAIButton && onAIClick && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onAIClick}
              className="text-blue-600 text-xs px-2 h-6"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Get help with writing
            </Button>
          )}
          {onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="text-red-600 text-xs px-2 h-6"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Remove
            </Button>
          )}
        </div>
      </div>

      {/* Text Area */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="resize-none border-0 focus:ring-0 p-3 bg-gray-50"
        style={{ minHeight }}
      />

      {/* Word Count */}
      {showWordCount && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Recruiter tip: write 400-600 characters to increase interview chances</span>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-xs">
              {charCount} / 600
            </Badge>
            <span>{wordCount} words</span>
          </div>
        </div>
      )}
    </div>
  );
}