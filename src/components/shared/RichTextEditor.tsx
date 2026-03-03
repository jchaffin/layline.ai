"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
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
  minHeight = "180px",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [spellCheck, setSpellCheck] = useState(true);
  const lastHtml = useRef(value);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const emitChange = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    let html = el.innerHTML;
    html = html
      .replace(/<li><br><\/li>/gi, "")
      .replace(/<ul>\s*<\/ul>/gi, "")
      .replace(/<ol>\s*<\/ol>/gi, "");
    if (html === lastHtml.current) return;
    lastHtml.current = html;
    onChange(html);
    if (onAutoSave) {
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => onAutoSave(html), 1000);
    }
  }, [onChange, onAutoSave]);

  useEffect(() => () => clearTimeout(autoSaveTimer.current), []);

  const didMount = useRef(false);
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (!didMount.current || value !== lastHtml.current) {
      didMount.current = true;
      lastHtml.current = value;
      const raw = value || "";
      if (raw) {
        const isHtml = /<[a-z][\s\S]*>/i.test(raw);
        el.innerHTML = isHtml ? raw : raw.replace(/\n/g, "<br>");
      }
    }
  }, [value]);

  const exec = useCallback((cmd: string) => {
    document.execCommand(cmd, false);
    emitChange();
  }, [emitChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === "b") { e.preventDefault(); exec("bold"); }
        if (e.key === "i") { e.preventDefault(); exec("italic"); }
        if (e.key === "u") { e.preventDefault(); exec("underline"); }
      }
    },
    [exec],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text/plain");
      document.execCommand("insertText", false, text);
      emitChange();
    },
    [emitChange],
  );

  const plainText = (editorRef.current?.textContent || value.replace(/<[^>]*>/g, "") || "").trim();
  const wordCount = plainText.split(/\s+/).filter((w) => w.length > 0).length;
  const charCount = plainText.length;

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
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`h-7 w-7 p-0 ${active ? "bg-accent text-foreground" : ""}`}
      title={title}
    >
      {children}
    </Button>
  );

  return (
    <>
      <div className={`rounded-lg bg-[hsl(var(--muted))] ${className}`}>
        <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5">
          <div className="flex items-center gap-0.5">
            <ToolBtn onClick={() => exec("bold")} title="Bold (⌘B)">
              <Bold className="h-3.5 w-3.5" />
            </ToolBtn>
            <ToolBtn onClick={() => exec("italic")} title="Italic (⌘I)">
              <Italic className="h-3.5 w-3.5" />
            </ToolBtn>
            <ToolBtn onClick={() => exec("underline")} title="Underline (⌘U)">
              <Underline className="h-3.5 w-3.5" />
            </ToolBtn>
            <ToolBtn onClick={() => exec("strikeThrough")} title="Strikethrough">
              <Strikethrough className="h-3.5 w-3.5" />
            </ToolBtn>

            <div className="w-px h-4 bg-border mx-1" />

            <ToolBtn onClick={() => { exec("insertUnorderedList"); }} title="Bullet List">
              <List className="h-3.5 w-3.5" />
            </ToolBtn>
            <ToolBtn onClick={() => { exec("insertOrderedList"); }} title="Numbered List">
              <ListOrdered className="h-3.5 w-3.5" />
            </ToolBtn>

            <div className="w-px h-4 bg-border mx-1" />

            <ToolBtn onClick={() => setSpellCheck(!spellCheck)} title="Spell Check" active={spellCheck}>
              <SpellCheck className="h-3.5 w-3.5" />
            </ToolBtn>
          </div>

          <div className="flex items-center gap-2">
            {showAIButton && onAIClick && (
              <Button type="button" variant="outline" size="sm" onClick={onAIClick} className="text-xs h-7 px-3 rounded-full">
                <Sparkles className="w-3 h-3 mr-1.5" />
                Write with AI
              </Button>
            )}
            {onRemove && (
              <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="text-destructive text-xs px-2 h-6">
                <Trash2 className="w-3 h-3 mr-1" />
                Remove
              </Button>
            )}
          </div>
        </div>

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          spellCheck={spellCheck}
          onInput={emitChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          data-placeholder={placeholder}
          className="p-3 text-sm leading-relaxed outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_u]:underline [&_s]:line-through [&_strike]:line-through [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
          style={{ minHeight }}
        />
      </div>

      {showWordCount && (
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">
            Recruiter tip: write 400-600 characters to increase interview chances
          </span>
          <span className={`text-xs font-medium ${
            charCount > 600 ? "text-red-500" :
            charCount >= 400 ? "text-green-600" :
            "text-muted-foreground"
          }`}>
            {charCount} / 600 &middot; {wordCount} words
          </span>
        </div>
      )}
    </>
  );
}
