"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  FileText,
  Download,
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
  LayoutGrid,
  List,
  MoreVertical,
  Clock,
  Upload,
} from "lucide-react";

interface Version {
  key: string;
  label: string;
  company?: string;
  role?: string;
  createdAt: string;
  size: number;
  type: "original" | "tailored";
}

interface ResumeGroup {
  originalKey: string;
  originalName: string;
  uploadedAt: string;
  size: number;
  versions: Version[];
}

interface FlatFile {
  key: string;
  name: string;
  subtitle?: string;
  date: string;
  size: number;
  type: "original" | "tailored";
  groupName: string;
}

interface DocumentManagerProps {
  currentResume?: any;
  onDocumentSelect?: (document: any) => void;
  onNavigateToEdit?: (document: any) => void;
  onDocumentDeleted?: () => void;
  onFileUploaded?: (data: any) => void;
}

function flattenGroups(groups: ResumeGroup[]): FlatFile[] {
  const files: FlatFile[] = [];
  for (const group of groups) {
    for (const v of group.versions) {
      files.push({
        key: v.key,
        name:
          v.type === "original"
            ? group.originalName
            : v.label || "Tailored Resume",
        subtitle:
          v.type === "tailored" && v.company
            ? `${v.role || ""}${v.role && v.company ? " — " : ""}${v.company}`
            : undefined,
        date: v.createdAt,
        size: v.size,
        type: v.type,
        groupName: group.originalName,
      });
    }
  }
  return files.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export default function DocumentManager({
  currentResume,
  onNavigateToEdit,
  onDocumentDeleted,
  onFileUploaded,
}: DocumentManagerProps) {
  const [groups, setGroups] = useState<ResumeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadVersions();
  }, []);

  const triggerUpload = () => fileInputRef.current?.click();

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const result = await res.json();
      if (result.success && result.data) {
        onFileUploaded?.(result.data);
        onNavigateToEdit?.({
          id: result.s3Url || file.name,
          name: file.name,
          type: "original",
          uploadDate: new Date().toISOString(),
          size: file.size,
          data: result.data,
        });
      }
      loadVersions();
    } catch (err) {
      console.error("File upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const loadVersions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/resume/versions");
      const data = await res.json();
      setGroups(data.groups || []);
    } catch {
      setError("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = async (file: FlatFile) => {
    let data = currentResume || null;
    if (file.type === "tailored") {
      try {
        const res = await fetch(
          `/api/resume/parsed?action=get&key=${encodeURIComponent(file.key)}`,
        );
        if (res.ok) {
          const json = await res.json();
          data = json.tailoredResume || json;
        }
      } catch {}
    } else {
      const parsedKey = file.key
        .replace("original-resumes/", "parsed-resumes/")
        .replace(/\.[^.]+$/, "-parsed.json");
      try {
        const res = await fetch(
          `/api/resume/parsed?action=get&key=${encodeURIComponent(parsedKey)}`,
        );
        if (res.ok) data = await res.json();
      } catch {}
    }
    onNavigateToEdit?.({
      id: file.key,
      name: file.name,
      type: file.type,
      uploadDate: file.date,
      size: formatSize(file.size),
      data,
    });
  };

  const handleDelete = async (key: string) => {
    try {
      const res = await fetch(
        `/api/documents/delete?key=${encodeURIComponent(key)}`,
        { method: "DELETE" },
      );
      if (res.ok) onDocumentDeleted?.();
      loadVersions();
    } catch {}
  };

  const files = flattenGroups(groups);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
        <AlertCircle className="w-6 h-6" />
        <p className="text-sm">{error}</p>
        <Button variant="outline" size="sm" onClick={loadVersions}>
          Retry
        </Button>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <Card>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={handleFileSelected}
        />
        {uploading && (
          <div className="absolute inset-0 z-30 bg-background/80 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-sm font-medium">Uploading and parsing...</p>
          </div>
        )}
        <CardContent className="flex flex-col items-center justify-center py-16 gap-5">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <FileText className="w-7 h-7 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="font-medium">No documents yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Upload a resume to get started
            </p>
          </div>
          <Button onClick={triggerUpload}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Resume
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 relative">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={handleFileSelected}
      />

      {uploading && (
        <div className="absolute inset-0 z-30 bg-background/80 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm font-medium">Uploading and parsing...</p>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {files.length} {files.length === 1 ? "file" : "files"}
        </p>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={triggerUpload}>
            <Upload className="w-4 h-4 mr-1.5" />
            Upload
          </Button>
          <div className="flex items-center gap-1">
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setView("grid")}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setView("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Grid view */}
      {view === "grid" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {files.map((file) => (
            <FileCard
              key={file.key}
              file={file}
              onOpen={() => handleOpen(file)}
              onDelete={() => handleDelete(file.key)}
            />
          ))}
          <button
            onClick={triggerUpload}
            className="aspect-[4/5] rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 hover:bg-accent/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="w-6 h-6" />
            <span className="text-xs font-medium">New</span>
          </button>
        </div>
      )}

      {/* List view */}
      {view === "list" && (
        <div className="rounded-lg border divide-y">
          {files.map((file) => (
            <FileRow
              key={file.key}
              file={file}
              onOpen={() => handleOpen(file)}
              onDelete={() => handleDelete(file.key)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FileCard({
  file,
  onOpen,
  onDelete,
}: {
  file: FlatFile;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isOriginal = file.type === "original";

  return (
    <div
      className="group relative rounded-xl border bg-card hover:shadow-md hover:ring-1 hover:ring-primary/20 cursor-pointer transition-all overflow-hidden"
      onClick={onOpen}
    >
      {/* Thumbnail */}
      <div className="aspect-[4/3] bg-muted flex items-center justify-center relative">
        <div className="flex flex-col items-center gap-1.5">
          <FileText
            className={`w-10 h-10 ${isOriginal ? "text-blue-500" : "text-emerald-500"}`}
          />
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
              isOriginal
                ? "bg-blue-100 text-blue-700"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {isOriginal ? "Original" : "Tailored"}
          </span>
        </div>

        {/* Hover actions */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="relative">
            <Button
              variant="secondary"
              size="icon"
              className="h-7 w-7 rounded-full shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </Button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                  }}
                />
                <div className="absolute right-0 top-8 z-50 w-36 rounded-lg border bg-popover shadow-lg py-1">
                  <button
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(
                        `/api/documents/download?key=${encodeURIComponent(file.key)}&download=true`,
                        "_blank",
                      );
                      setMenuOpen(false);
                    }}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                  <button
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-accent transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                      setMenuOpen(false);
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="px-3 py-2.5">
        <p className="text-sm font-medium truncate" title={file.name}>
          {file.name}
        </p>
        {file.subtitle && (
          <p
            className="text-xs text-muted-foreground truncate mt-0.5"
            title={file.subtitle}
          >
            {file.subtitle}
          </p>
        )}
        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          {formatRelativeDate(file.date)}
        </div>
      </div>
    </div>
  );
}

function FileRow({
  file,
  onOpen,
  onDelete,
}: {
  file: FlatFile;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const isOriginal = file.type === "original";

  return (
    <div
      className="group flex items-center gap-3 px-4 py-3 hover:bg-accent/50 cursor-pointer transition-colors"
      onClick={onOpen}
    >
      <FileText
        className={`w-5 h-5 shrink-0 ${isOriginal ? "text-blue-500" : "text-emerald-500"}`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        {file.subtitle && (
          <p className="text-xs text-muted-foreground truncate">
            {file.subtitle}
          </p>
        )}
      </div>
      <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
        {formatRelativeDate(file.date)}
      </span>
      <span className="text-xs text-muted-foreground shrink-0 hidden md:block w-16 text-right">
        {formatSize(file.size)}
      </span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => {
            e.stopPropagation();
            window.open(
              `/api/documents/download?key=${encodeURIComponent(file.key)}&download=true`,
              "_blank",
            );
          }}
        >
          <Download className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}
