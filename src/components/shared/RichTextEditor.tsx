"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Link,
  Highlighter,
  Palette,
  SpellCheck,
  Sparkles,
  Trash2,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showWordCount?: boolean;
  showAIButton?: boolean;
  onAIClick?: () => void;
  onRemove?: () => void;
  onAutoSave?: (value: string) => void;
  className?: string;
  minHeight?: string;
  maxChars?: number;
}

const HIGHLIGHT_COLORS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fecaca", "#e9d5ff"];
const TEXT_COLORS = ["#000000", "#dc2626", "#2563eb", "#16a34a", "#9333ea", "#ea580c"];

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter text...",
  showWordCount = true,
  showAIButton = false,
  onAIClick,
  onRemove,
  onAutoSave,
  className = "",
  maxChars = 600,
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [spellCheck, setSpellCheck] = useState(true);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>();

  const handleChange = useCallback(
    (newValue: string) => {
      onChange(newValue);
      if (onAutoSave) {
        clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = setTimeout(() => onAutoSave(newValue), 1000);
      }
    },
    [onChange, onAutoSave],
  );

  useEffect(() => {
    return () => clearTimeout(autoSaveTimer.current);
  }, []);

  const insertText = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);
    const newText =
      value.substring(0, start) + before + selected + after + value.substring(end);
    handleChange(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const formatBulletList = () => {
    const lines = value.split("\n");
    const start = textareaRef.current?.selectionStart || 0;
    const lineIndex = value.substring(0, start).split("\n").length - 1;
    if (lines[lineIndex] && !lines[lineIndex].startsWith("• ")) {
      lines[lineIndex] = "• " + lines[lineIndex];
      handleChange(lines.join("\n"));
    }
  };

  const formatOrderedList = () => {
    const lines = value.split("\n");
    const start = textareaRef.current?.selectionStart || 0;
    const lineIndex = value.substring(0, start).split("\n").length - 1;
    if (lines[lineIndex] && !/^\d+\.\s/.test(lines[lineIndex])) {
      lines[lineIndex] = "1. " + lines[lineIndex];
      handleChange(lines.join("\n"));
    }
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) insertText("[", `](${url})`);
  };

  const insertHighlight = (color: string) => {
    insertText(`<mark style="background:${color}">`, "</mark>");
    setShowHighlightPicker(false);
  };

  const insertTextColor = (color: string) => {
    insertText(`<span style="color:${color}">`, "</span>");
    setShowColorPicker(false);
  };

  const wordCount = value
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  const charCount = value.length;

  const ToolBtn = ({
    onClick,
    title,
    active,
    children,
  }: {
    onClick: () => void;
    title: string;
    active?: boolean;
    children: React.ReactNode;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={`h-7 w-7 p-0 ${active ? "bg-accent text-foreground" : ""}`}
      title={title}
    >
      {children}
    </Button>
  );

  return (
    <>
      <div className={`rounded-lg bg-[hsl(var(--muted))] overflow-hidden ${className}`}>
        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5">
          <div className="flex items-center gap-0.5">
            <ToolBtn onClick={() => insertText("**", "**")} title="Bold">
              <Bold className="h-3.5 w-3.5" />
            </ToolBtn>
            <ToolBtn onClick={() => insertText("*", "*")} title="Italic">
              <Italic className="h-3.5 w-3.5" />
            </ToolBtn>
            <ToolBtn onClick={() => insertText("_", "_")} title="Underline">
              <Underline className="h-3.5 w-3.5" />
            </ToolBtn>
            <ToolBtn onClick={() => insertText("~~", "~~")} title="Strikethrough">
              <Strikethrough className="h-3.5 w-3.5" />
            </ToolBtn>

            <div className="w-px h-4 bg-border mx-1" />

            <ToolBtn onClick={formatBulletList} title="Bullet List">
              <List className="h-3.5 w-3.5" />
            </ToolBtn>
            <ToolBtn onClick={formatOrderedList} title="Numbered List">
              <ListOrdered className="h-3.5 w-3.5" />
            </ToolBtn>

            <div className="w-px h-4 bg-border mx-1" />

            <ToolBtn onClick={insertLink} title="Insert Link">
              <Link className="h-3.5 w-3.5" />
            </ToolBtn>

            {/* Highlight */}
            <div className="relative">
              <ToolBtn
                onClick={() => {
                  setShowHighlightPicker(!showHighlightPicker);
                  setShowColorPicker(false);
                }}
                title="Highlight"
              >
                <Highlighter className="h-3.5 w-3.5" />
              </ToolBtn>
              {showHighlightPicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowHighlightPicker(false)} />
                  <div className="absolute top-8 left-0 z-50 flex gap-1 p-2 rounded-lg border bg-popover shadow-lg">
                    {HIGHLIGHT_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => insertHighlight(c)}
                        className="w-5 h-5 rounded-full border border-border hover:scale-110 transition-transform"
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Text color */}
            <div className="relative">
              <ToolBtn
                onClick={() => {
                  setShowColorPicker(!showColorPicker);
                  setShowHighlightPicker(false);
                }}
                title="Text Color"
              >
                <Palette className="h-3.5 w-3.5" />
              </ToolBtn>
              {showColorPicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowColorPicker(false)} />
                  <div className="absolute top-8 left-0 z-50 flex gap-1 p-2 rounded-lg border bg-popover shadow-lg">
                    {TEXT_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => insertTextColor(c)}
                        className="w-5 h-5 rounded-full border border-border hover:scale-110 transition-transform"
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="w-px h-4 bg-border mx-1" />

            <ToolBtn
              onClick={() => setSpellCheck(!spellCheck)}
              title="Spell Check"
              active={spellCheck}
            >
              <SpellCheck className="h-3.5 w-3.5" />
            </ToolBtn>
          </div>

          <div className="flex items-center gap-2">
            {showAIButton && onAIClick && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAIClick}
                className="text-xs h-7 px-3 rounded-full"
              >
                <Sparkles className="w-3 h-3 mr-1.5" />
                Write with AI
              </Button>
            )}
            {onRemove && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="text-destructive text-xs px-2 h-6"
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
          maxLength={maxChars}
          spellCheck={spellCheck}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className="resize-none border-0 focus:ring-0 p-3 bg-muted h-[280px]"
        />
      </div>

      {/* Below the gray container */}
      {showWordCount && (
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">
            Recruiter tip: write 400-600 characters to increase interview chances
          </span>
          <span className="text-xs text-muted-foreground">
            {charCount} / {maxChars} &middot; {wordCount} words
          </span>
        </div>
      )}
    </>
  );
}
