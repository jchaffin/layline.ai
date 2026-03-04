"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/Input";
import {
  Search,
  MapPin,
  Clock,
  Plus,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  DollarSign,
  Globe,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  ArrowUpRight,
  X,
  SlidersHorizontal,
  Check,
  Upload,
  FileText,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { GooglePlacesAutocomplete } from "@/components/shared/AutoComplete";
import { CompanyLogo } from "@/components/jobs/CompanyLogo";
import { cn } from "@/lib/utils";
import { scoreColor } from "@/lib/resumeJobMatch";
import type { ParsedResume } from "@/lib/schema";
import type { Job } from "@/types/job";

interface JobBoardProps {
  onAddToTracker: (job: Job) => void | Promise<void>;
  resumeData?: ParsedResume | null;
}

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return "Recently";
  const posted = new Date(dateStr);
  if (isNaN(posted.getTime())) {
    if (typeof dateStr === "string" && dateStr.includes("ago")) return dateStr;
    return "Recently";
  }
  const diffMs = Date.now() - posted.getTime();
  const hours = Math.floor(diffMs / 3.6e6);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function sourceBadge(source?: string) {
  const s = (source || "").toLowerCase();
  if (s.includes("linkedin"))  return { label: "LinkedIn",     cls: "bg-[#0a66c2] text-white" };
  if (s.includes("indeed"))    return { label: "Indeed",        cls: "bg-[#2164f3] text-white" };
  if (s.includes("glassdoor")) return { label: "Glassdoor",     cls: "bg-[#0caa41] text-white" };
  if (s.includes("ziprecruiter")) return { label: "ZipRecruiter", cls: "bg-[#6fbe44] text-white" };
  if (s.includes("talent.com") || s === "talent.com") return { label: "Talent.com", cls: "bg-[#5b2d8e] text-white" };
  return { label: source || "Web", cls: "bg-gray-700 text-white" };
}

export default function JobBoard({ onAddToTracker, resumeData }: JobBoardProps) {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [searching, setSearching] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selected, setSelected] = useState<Job | null>(null);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [searched, setSearched] = useState(false);
  const [mobileDetail, setMobileDetail] = useState(false);


  const [fType, setFType] = useState("");
  const [fRemote, setFRemote] = useState(false);
  const [fDate, setFDate] = useState("");
  const [fSalary, setFSalary] = useState("");
  const [fSource, setFSource] = useState("");

  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [showTitleDropdown, setShowTitleDropdown] = useState(false);
  const [titleSelectedIdx, setTitleSelectedIdx] = useState(-1);
  const titleDebounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const titleInputRef = useRef<HTMLDivElement>(null);

  const [totalServerJobs, setTotalServerJobs] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchJobs = useCallback(async (q: string, loc: string, offset: number, append: boolean) => {
    const res = await fetch("/api/jobs/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: q || undefined, location: loc || undefined, resume: resumeData || undefined, offset, limit: 200 }),
    });
    const data = await res.json();
    const list: Job[] = Array.isArray(data.jobs) ? data.jobs : [];
    setTotalServerJobs(data.total || 0);
    if (append) {
      setJobs((prev) => [...prev, ...list]);
    } else {
      setJobs(list);
      if (list.length > 0) setSelected(list[0]);
    }
    return { list, hasMore: data.hasMore };
  }, [resumeData]);

  useEffect(() => {
    fetchJobs("", "", 0, false).then(() => setSearched(true)).catch(() => {});
  }, []);

  const fetchTitleSuggestions = useCallback((q: string) => {
    clearTimeout(titleDebounceRef.current);
    if (q.length < 1) {
      setTitleSuggestions([]);
      setShowTitleDropdown(false);
      return;
    }
    titleDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/jobs/titles?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        const titles: string[] = data.titles ?? [];
        setTitleSuggestions(titles);
        setShowTitleDropdown(titles.length > 0);
        setTitleSelectedIdx(-1);
      } catch {
        setTitleSuggestions([]);
        setShowTitleDropdown(false);
      }
    }, 200);
  }, []);

  useEffect(() => () => clearTimeout(titleDebounceRef.current), []);

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showTitleDropdown && titleSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setTitleSelectedIdx((p) => (p < titleSuggestions.length - 1 ? p + 1 : p));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setTitleSelectedIdx((p) => (p > 0 ? p - 1 : -1));
        return;
      }
      if (e.key === "Enter" && titleSelectedIdx >= 0) {
        e.preventDefault();
        setQuery(titleSuggestions[titleSelectedIdx]);
        setShowTitleDropdown(false);
        setTitleSelectedIdx(-1);
        return;
      }
      if (e.key === "Escape") {
        setShowTitleDropdown(false);
        setTitleSelectedIdx(-1);
        return;
      }
    }
    if (e.key === "Enter") search();
  };

  const KNOWN_SOURCES = new Set(["indeed", "linkedin", "ziprecruiter", "glassdoor", "talent.com"]);

  const normalizeSource = useCallback((s?: string) => {
    const low = (s || "").toLowerCase();
    if (KNOWN_SOURCES.has(low)) return s!;
    return "Other";
  }, []);

  const filtered = useMemo(() => {
    let r = jobs;
    if (fType) {
      r = r.filter((j) => {
        const t = (j.type || "").toLowerCase().replace(/[-\s]/g, "");
        return t.includes(fType);
      });
    }
    if (fRemote)
      r = r.filter(
        (j) => j.job_is_remote || (j.location || "").toLowerCase().includes("remote"),
      );
    if (fDate) {
      const now = Date.now();
      r = r.filter((j) => {
        if (!j.job_posted_at_datetime_utc) return true;
        const d = new Date(j.job_posted_at_datetime_utc).getTime();
        if (isNaN(d)) return true;
        const days = (now - d) / 864e5;
        return fDate === "24h" ? days <= 1 : fDate === "week" ? days <= 7 : days <= 30;
      });
    }
    if (fSalary) {
      const [lo, hi] = fSalary.split("-").map(Number);
      r = r.filter((j) => {
        const s = j.job_min_salary || 0;
        if (hi) return s >= lo * 1000 && s < hi * 1000;
        return s >= lo * 1000;
      });
    }
    if (fSource) {
      r = r.filter((j) => normalizeSource(j.source).toLowerCase() === fSource.toLowerCase());
    }
    return r;
  }, [jobs, fType, fRemote, fDate, fSalary, fSource, normalizeSource]);

  const sourceOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const j of jobs) {
      const s = normalizeSource(j.source);
      counts.set(s, (counts.get(s) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([s, n]) => ({ value: s.toLowerCase(), label: `${s} (${n})` }));
  }, [jobs, normalizeSource]);

  const activeFilters = [fType, fRemote, fDate, fSalary, fSource].filter(Boolean).length;

  const sentinelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const hasMore = jobs.length < totalServerJobs;

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      await fetchJobs(query, location, jobs.length, true);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, fetchJobs, query, location, jobs.length]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { root: listRef.current, threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  useEffect(() => {
    if (!selected) return;
    const isStub = selected.source === "LinkedIn" && selected.description?.startsWith("View full details");
    if (!isStub) return;
    fetch("/api/jobs/enrich", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: selected.url }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.description) return;
        setJobs((prev) =>
          prev.map((j) =>
            j.id === selected.id
              ? { ...j, description: data.description, salary: data.salary || j.salary, type: data.type || j.type }
              : j,
          ),
        );
        setSelected((prev) =>
          prev && prev.id === selected.id
            ? { ...prev, description: data.description, salary: data.salary || prev.salary, type: data.type || prev.type }
            : prev,
        );
      })
      .catch(() => {});
  }, [selected?.id]);

  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleJDUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (resumeData) formData.append("resume", JSON.stringify(resumeData));

      const res = await fetch("/api/jobs/analyze", { method: "POST", body: formData });
      const data = await res.json();

      if (data.job) {
        const job = { ...data.job, analysis: data.analysis || undefined };
        setJobs((prev) => [job, ...prev]);
        setSelected(job);
        setSearched(true);
        setShowUpload(false);
        onAddToTracker(job);
        toast({ title: "Added to tracker", description: `${job.title} at ${job.company}` });
      } else {
        toast({ title: data.error || "Analysis failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const search = async () => {
    if (!query.trim()) {
      toast({ title: "Enter a job title or keywords", variant: "destructive" });
      return;
    }
    setSearching(true);
    setSearched(true);
    setSelected(null);
    try {
      const { list } = await fetchJobs(query, location, 0, false);
      toast({ title: `${totalServerJobs || list.length} jobs found` });
    } catch {
      toast({ title: "Search failed", variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const toggle = (id: string) =>
    setSaved((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const pick = (j: Job) => {
    setSelected(j);
    setMobileDetail(true);
  };

  const chipCls =
    "inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-full border cursor-pointer select-none transition-all duration-150";
  const chipOn = "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200";
  const chipOff = "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50";
  return (
    <div className="flex flex-col gap-3">
      {/* ──── Search ──── */}
      <div className="rounded-2xl bg-gray-50/80 border border-gray-200/60 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div ref={titleInputRef} className="relative flex-[2] group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 group-focus-within:text-blue-600 transition-colors pointer-events-none z-10" />
            <input
              placeholder="Job title, company, or keywords"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                fetchTitleSuggestions(e.target.value);
              }}
              onKeyDown={handleTitleKeyDown}
              onFocus={() => {
                if (titleSuggestions.length > 0) setShowTitleDropdown(true);
              }}
              onBlur={() => setTimeout(() => setShowTitleDropdown(false), 150)}
              className="w-full h-11 pl-10 pr-3 text-sm rounded-xl border border-gray-200 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-gray-400 transition-all"
              autoComplete="off"
            />
            {showTitleDropdown && titleSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                {titleSuggestions.map((title, i) => (
                  <div
                    key={title + i}
                    className={cn(
                      "px-3.5 py-2.5 cursor-pointer text-sm transition-colors",
                      i === titleSelectedIdx
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50",
                    )}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setQuery(title);
                      setShowTitleDropdown(false);
                      setTitleSelectedIdx(-1);
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <Briefcase className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span>{title}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="location-input">
            <GooglePlacesAutocomplete
              value={location}
              onChange={setLocation}
              placeholder="City, state, or remote"
            />
          </div>

          <button
            onClick={search}
            disabled={searching}
            className="h-11 px-5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 flex-shrink-0 shadow-sm shadow-blue-200 hover:shadow-md hover:shadow-blue-200"
          >
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Search className="w-4 h-4" /> Search</>}
          </button>

          <button
            onClick={() => setShowUpload(true)}
            className="h-11 px-4 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 text-gray-600 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 flex-shrink-0"
          >
            <Upload className="w-4 h-4" /> Upload JD
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />

          <FilterDropdown
            label="Role Type"
            value={fType}
            onChange={setFType}
            options={[
              { value: "fulltime", label: "Full-time" },
              { value: "parttime", label: "Part-time" },
              { value: "contract", label: "Contract" },
              { value: "internship", label: "Internship" },
            ]}
          />

          <FilterDropdown
            label="Date Posted"
            value={fDate}
            onChange={setFDate}
            options={[
              { value: "24h", label: "Past 24 hours" },
              { value: "week", label: "Past week" },
              { value: "month", label: "Past month" },
            ]}
          />

          <FilterDropdown
            label="Salary"
            value={fSalary}
            onChange={setFSalary}
            options={[
              { value: "50-100", label: "$50k – $100k" },
              { value: "100-150", label: "$100k – $150k" },
              { value: "150-200", label: "$150k – $200k" },
              { value: "200", label: "$200k+" },
            ]}
          />

          {sourceOptions.length > 1 && (
            <FilterDropdown
              label="Source"
              value={fSource}
              onChange={setFSource}
              options={sourceOptions}
            />
          )}

          {activeFilters > 0 && (
            <button
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
              onClick={() => { setFType(""); setFRemote(false); setFDate(""); setFSalary(""); setFSource(""); }}
            >
              <X className="w-3 h-3" /> Clear all
            </button>
          )}

          {searched && (
            <span className="ml-auto text-xs text-gray-400 tabular-nums">
              {filtered.length} of {jobs.length} jobs
            </span>
          )}
        </div>
      </div>

      {/* ──── Body ──── */}
      {searching ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} />
            ))}
          </div>
          <div className="hidden lg:block lg:col-span-3">
            <DetailSkeleton />
          </div>
        </div>
      ) : !searched ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <Briefcase className="w-8 h-8 text-blue-400" />
          </div>
          <p className="text-lg font-semibold text-gray-800">Find your next role</p>
          <p className="text-sm text-gray-500 mt-1 max-w-xs">
            Search jobs from Indeed, LinkedIn, and more — all in one place
          </p>
          {!resumeData && (
            <p className="text-xs text-blue-500 mt-3">Upload your resume to see personalized match scores</p>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Search className="w-10 h-10 text-gray-300 mb-3" />
          <p className="font-medium text-gray-700">No jobs match your filters</p>
          <p className="text-sm text-gray-500 mt-1">Try broadening your search or removing filters</p>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden lg:grid lg:grid-cols-5 gap-3" style={{ height: "calc(100vh - 300px)", minHeight: 500 }}>
            <div className="lg:col-span-2 overflow-hidden">
              <div ref={listRef} className="h-full overflow-y-auto space-y-1.5 pr-1 styled-scrollbar">
                {filtered.map((j) => (
                  <JobCard
                    key={j.id}
                    job={j}
                    active={selected?.id === j.id}
                    bookmarked={saved.has(j.id)}
                    onSelect={() => setSelected(j)}
                    onBookmark={() => toggle(j.id)}
                  />
                ))}
                {hasMore && (
                  <div ref={sentinelRef} className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
            </div>
            <div className="lg:col-span-3 overflow-y-auto styled-scrollbar">
              {selected ? (
                <DetailPanel
                  job={selected}
                  bookmarked={saved.has(selected.id)}
                  onBookmark={() => toggle(selected.id)}
                  trackingId={trackingId}
                  onTrack={async () => {
                    setTrackingId(selected.id);
                    try {
                      await onAddToTracker(selected);
                      toast({ title: "Added to tracker", description: `${selected.title} at ${selected.company}` });
                    } catch {
                      toast({ title: "Could not add to tracker", variant: "destructive" });
                    } finally {
                      setTrackingId(null);
                    }
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  Select a job to view details
                </div>
              )}
            </div>
          </div>

          {/* Mobile */}
          <div className="lg:hidden">
            {mobileDetail && selected ? (
              <>
                <button
                  className="inline-flex items-center gap-0.5 text-sm text-blue-600 hover:text-blue-800 font-medium mb-3 -ml-1 transition-colors"
                  onClick={() => setMobileDetail(false)}
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="underline underline-offset-2 decoration-blue-300">Back to results</span>
                </button>
                <DetailPanel
                  job={selected}
                  bookmarked={saved.has(selected.id)}
                  onBookmark={() => toggle(selected.id)}
                  trackingId={trackingId}
                  onTrack={async () => {
                    setTrackingId(selected.id);
                    try {
                      await onAddToTracker(selected);
                      toast({ title: "Added to tracker", description: `${selected.title} at ${selected.company}` });
                    } catch {
                      toast({ title: "Could not add to tracker", variant: "destructive" });
                    } finally {
                      setTrackingId(null);
                    }
                  }}
                />
              </>
            ) : (
              <div className="space-y-1.5">
                {filtered.map((j) => (
                  <JobCard
                    key={j.id}
                    job={j}
                    active={false}
                    bookmarked={saved.has(j.id)}
                    onSelect={() => pick(j)}
                    onBookmark={() => toggle(j.id)}
                  />
                ))}
                {hasMore && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Upload JD Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => !uploading && setShowUpload(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Upload Job Description</h3>
              <button onClick={() => !uploading && setShowUpload(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-sm text-gray-500">Analyzing job description...</p>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer"
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-blue-400", "bg-blue-50/30"); }}
                onDragLeave={(e) => { e.currentTarget.classList.remove("border-blue-400", "bg-blue-50/30"); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove("border-blue-400", "bg-blue-50/30");
                  const file = e.dataTransfer.files[0];
                  if (file) handleJDUpload(file);
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleJDUpload(file);
                    e.target.value = "";
                  }}
                />
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700">Drop a PDF here or click to browse</p>
                <p className="text-xs text-gray-400 mt-1">PDF, TXT, DOC, DOCX</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════  Job Card  ═══════════════════ */

function JobCard({
  job,
  active,
  bookmarked,
  onSelect,
  onBookmark,
}: {
  job: Job;
  active: boolean;
  bookmarked: boolean;
  onSelect: () => void;
  onBookmark: () => void;
}) {
  const matchPct = job.matchScore ?? 0;
  return (
    <div
      onClick={onSelect}
      className={cn(
        "group relative rounded-xl border cursor-pointer transition-all overflow-hidden",
        active
          ? "border-blue-500 bg-blue-50/40 ring-1 ring-blue-200"
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm",
      )}
    >
      <div className="p-3.5">
        <div className="flex gap-3">
          <CompanyLogo src={job.employer_logo} url={job.url} size="md" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[13.5px] text-gray-900 leading-snug line-clamp-1">{job.title}</p>
            <p className="text-[13px] text-gray-600 leading-snug">{job.company}</p>
            <p className="text-[12px] text-gray-500 mt-0.5">
              {job.location || "—"}
              {(job.job_min_salary || job.salary) && (
                <span className="text-gray-400"> · {job.job_min_salary && job.job_max_salary
                  ? `$${Math.round(job.job_min_salary / 1000)}k–$${Math.round(job.job_max_salary / 1000)}k`
                  : job.salary}</span>
              )}
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onBookmark(); }}
            className={cn(
              "self-start w-7 h-7 flex items-center justify-center rounded-full transition-all",
              bookmarked
                ? "bg-blue-50 text-blue-600 opacity-100"
                : "text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-gray-100",
            )}
          >
            {bookmarked ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-400">
          <span>{timeAgo(job.job_posted_at_datetime_utc || job.posted)}</span>
          {job.job_is_remote && <span className="text-emerald-600 font-medium">Remote</span>}
          {matchPct > 0 && (
            <span className={cn(
              "font-semibold",
              matchPct >= 75 ? "text-green-600" : matchPct >= 50 ? "text-amber-600" : "text-orange-500",
            )}>
              {matchPct}% match
            </span>
          )}
          {job.matchedSkills && job.matchedSkills.length > 0 && (
            <span className="text-gray-500 truncate">{job.matchedSkills.slice(0, 3).join(", ")}</span>
          )}
        </div>
      </div>
      {matchPct > 0 && (
        <div className="h-1 bg-gray-100">
          <div
            className={cn(
              "h-full transition-all",
              matchPct >= 75 ? "bg-green-500" : matchPct >= 50 ? "bg-amber-400" : "bg-orange-300",
            )}
            style={{ width: `${matchPct}%` }}
          />
        </div>
      )}
    </div>
  );
}

/* ═══════════════════  Detail Panel  ═══════════════════ */

function DetailPanel({
  job,
  bookmarked,
  onBookmark,
  onTrack,
  trackingId,
}: {
  job: Job;
  bookmarked: boolean;
  onBookmark: () => void;
  onTrack: () => void | Promise<void>;
  trackingId?: string | null;
}) {
  const isTracking = trackingId === job.id;
  const src = sourceBadge(job.source);

  return (
    <div className="bg-white rounded-xl border shadow-sm">
      {/* Header */}
      <div className="p-5 border-b">
        <div className="flex gap-4">
          <CompanyLogo src={job.employer_logo} url={job.url} companyName={job.company} size="md" />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900 leading-snug">{job.title}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm text-gray-700 font-medium">{job.company}</span>
              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", src.cls)}>{src.label}</span>
            </div>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-gray-500">
          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{timeAgo(job.job_posted_at_datetime_utc || job.posted)}</span>
          <span className="flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5" />
            {(job.type || "Full-time").replace("FULLTIME", "Full-time").replace("PARTTIME", "Part-time").replace("CONTRACTOR", "Contract")}
          </span>
          {job.job_is_remote && (
            <span className="flex items-center gap-1 text-emerald-600 font-medium"><Globe className="w-3.5 h-3.5" />Remote</span>
          )}
        </div>

        {/* Salary & Match */}
        <div className="flex items-center gap-4 mt-2">
          {(job.job_min_salary || job.salary) && (
            <span className="text-sm text-gray-500">
              {job.job_min_salary && job.job_max_salary
                ? `$${Math.round(job.job_min_salary / 1000)}k – $${Math.round(job.job_max_salary / 1000)}k${job.job_salary_period ? ` / ${job.job_salary_period.toLowerCase()}` : ""}`
                : job.salary}
            </span>
          )}
          {(job.matchScore ?? 0) > 0 && (
            <span className={cn(
              "text-sm font-semibold",
              (job.matchScore ?? 0) >= 75 ? "text-green-600" : (job.matchScore ?? 0) >= 50 ? "text-amber-600" : "text-orange-500",
            )}>
              {job.matchScore}% match
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5 mt-4">
          <button
            className="inline-flex items-center gap-2 h-10 px-6 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-full font-semibold text-sm shadow-sm shadow-blue-200 hover:shadow-md hover:shadow-blue-200 transition-all"
            onClick={() => window.open(job.job_apply_link || job.url, "_blank")}
          >
            Apply now <ArrowUpRight className="w-4 h-4" />
          </button>
          <button
            className="inline-flex items-center gap-1.5 h-10 px-5 border border-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 text-gray-700 rounded-full font-semibold text-sm transition-all disabled:opacity-60 disabled:pointer-events-none"
            onClick={onTrack}
            disabled={isTracking}
          >
            {isTracking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {isTracking ? "Structuring…" : "Track"}
          </button>
          <button
            className={cn(
              "inline-flex items-center justify-center w-10 h-10 rounded-full transition-all",
              bookmarked
                ? "bg-blue-50 text-blue-600 border border-blue-200"
                : "text-gray-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200",
            )}
            onClick={onBookmark}
          >
            {bookmarked ? <BookmarkCheck className="w-[18px] h-[18px]" /> : <Bookmark className="w-[18px] h-[18px]" />}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-5">
        {/* Match */}
        {(job.matchedSkills?.length || job.missingSkills?.length) ? (
          <Section title="Fit analysis">
            {job.matchedSkills && job.matchedSkills.length > 0 && (
              <div className="mb-3">
                <p className="text-[11px] font-semibold text-green-700 uppercase tracking-wider mb-1.5">Your matching skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {job.matchedSkills.map((s, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {/* {job.missingSkills && job.missingSkills.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider mb-1.5">Skills to develop</p>
                <div className="flex flex-wrap gap-1.5">
                  {job.missingSkills.map((s, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )} */}
          </Section>
        ) : job.matchReasons && job.matchReasons.length > 0 ? (
          <Section title="Match">
            <div className="flex flex-wrap gap-1.5">
              {job.matchReasons.map((r, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">{r}</span>
              ))}
            </div>
          </Section>
        ) : null}

        {job.job_highlights?.Qualifications && job.job_highlights.Qualifications.length > 0 && (
          <Section title="Qualifications">
            <BulletList items={job.job_highlights.Qualifications} />
          </Section>
        )}

        {job.job_highlights?.Responsibilities && job.job_highlights.Responsibilities.length > 0 && (
          <Section title="Responsibilities">
            <BulletList items={job.job_highlights.Responsibilities} />
          </Section>
        )}

        {job.job_highlights?.Benefits && job.job_highlights.Benefits.length > 0 && (
          <Section title="Benefits">
            <BulletList items={job.job_highlights.Benefits} color="text-green-500" />
          </Section>
        )}

        {job.analysis ? (
          <>
            {job.analysis.companyInfo && (
              <Section title="About the company">
                <p className="text-sm text-gray-700 leading-relaxed">{job.analysis.companyInfo}</p>
              </Section>
            )}

            {job.analysis.experience && (
              <Section title="Experience">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gray-700">{job.analysis.experience}</span>
                  {job.analysis.experienceLevel && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">{job.analysis.experienceLevel}</span>
                  )}
                </div>
              </Section>
            )}

            {job.analysis.requiredSkills && job.analysis.requiredSkills.length > 0 && (
              <Section title="Required skills">
                <div className="flex flex-wrap gap-1.5">
                  {job.analysis.requiredSkills.map((s, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-gray-900 text-white font-medium">{s}</span>
                  ))}
                </div>
              </Section>
            )}

            {job.analysis.preferredSkills && job.analysis.preferredSkills.length > 0 && (
              <Section title="Preferred skills">
                <div className="flex flex-wrap gap-1.5">
                  {job.analysis.preferredSkills.map((s, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 font-medium">{s}</span>
                  ))}
                </div>
              </Section>
            )}

            <Section title="Full description">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{job.description}</p>
            </Section>
          </>
        ) : (
          <>
            <Section title="About this role">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{job.description}</p>
            </Section>

            {job.tags && job.tags.filter(t => t.length < 40).length > 0 && (
              <Section title="Skills">
                <div className="flex flex-wrap gap-1.5">
                  {job.tags.filter(t => t.length < 40).map((t, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 font-medium">{t}</span>
                  ))}
                </div>
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{title}</h4>
      {children}
    </div>
  );
}

function BulletList({ items, color = "text-gray-400" }: { items: string[]; color?: string }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
          <span className={cn("w-1.5 h-1.5 rounded-full mt-[7px] flex-shrink-0", color === "text-green-500" ? "bg-green-400" : "bg-gray-300")} />
          {item}
        </li>
      ))}
    </ul>
  );
}


/* ═══════════════════  Filter Dropdown  ═══════════════════ */

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = !!value;
  const display = options.find((o) => o.value === value)?.label || label;

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-full border cursor-pointer select-none transition-all duration-150",
          active
            ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200"
            : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50",
        )}
      >
        {display}
        <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-50 mt-1.5 min-w-[160px] bg-white border border-gray-200 rounded-xl shadow-lg py-1 animate-in fade-in slide-in-from-top-1 duration-100">
          {value && (
            <button
              className="w-full text-left px-3.5 py-2 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              onClick={() => { onChange(""); setOpen(false); }}
            >
              Clear
            </button>
          )}
          {options.map((o) => (
            <button
              key={o.value}
              className={cn(
                "w-full text-left px-3.5 py-2 text-xs transition-colors flex items-center justify-between gap-3",
                value === o.value
                  ? "text-blue-700 bg-blue-50 font-semibold"
                  : "text-gray-700 hover:bg-gray-50",
              )}
              onClick={() => { onChange(value === o.value ? "" : o.value); setOpen(false); }}
            >
              {o.label}
              {value === o.value && <Check className="w-3 h-3" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════  Skeletons  ═══════════════════ */

function Skeleton() {
  return (
    <div className="p-3.5 rounded-xl border border-gray-100 bg-white animate-pulse">
      <div className="flex gap-3">
        <div className="w-11 h-11 rounded-lg bg-gray-100" />
        <div className="flex-1 space-y-2 py-0.5">
          <div className="h-3.5 bg-gray-100 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
          <div className="h-2.5 bg-gray-100 rounded w-2/3" />
        </div>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="bg-white rounded-xl border shadow-sm animate-pulse">
      <div className="p-5 border-b space-y-3">
        <div className="flex gap-4">
          <div className="w-11 h-11 rounded-lg bg-gray-100" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-gray-100 rounded w-2/3" />
            <div className="h-3.5 bg-gray-100 rounded w-1/3" />
          </div>
        </div>
        <div className="flex gap-4">
          <div className="h-3 bg-gray-100 rounded w-28" />
          <div className="h-3 bg-gray-100 rounded w-20" />
          <div className="h-3 bg-gray-100 rounded w-24" />
        </div>
        <div className="flex gap-2 pt-1">
          <div className="h-9 bg-gray-100 rounded-lg w-24" />
          <div className="h-9 bg-gray-100 rounded-lg w-20" />
        </div>
      </div>
      <div className="p-5 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-3 bg-gray-100 rounded" style={{ width: `${60 + Math.random() * 40}%` }} />
        ))}
      </div>
    </div>
  );
}
