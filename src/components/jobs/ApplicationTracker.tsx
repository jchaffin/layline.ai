"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { GooglePlacesAutocomplete } from "@/components/shared/AutoComplete";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import {
  Briefcase,
  Building,
  MapPin,
  Calendar,
  ExternalLink,
  Trash2,
  Edit,
  CheckCircle,
  Upload,
  FileText,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
  Plus,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import type { ParsedResume } from "@/lib/schema";
import type { Application } from "@/types/job";
import { CompanyLogo } from "@/components/jobs/CompanyLogo";
import { normalizeJobAnalysis, cleanDescriptionText } from "@/lib/analysisUtils";

interface ApplicationTrackerProps {
  applications?: Application[];
  onApplicationUpdate?: (applications: Application[]) => void;
  resumeData?: ParsedResume | null;
  onOpenApplication?: (app: Application) => void;
}

export default function ApplicationTracker({
  applications: externalApplications,
  onApplicationUpdate,
  resumeData,
  onOpenApplication,
}: ApplicationTrackerProps) {
  const { toast } = useToast();
  const applications = externalApplications || [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newAnalysis, setNewAnalysis] = useState<Application["analysis"] | undefined>(undefined);
  const [scrapingUrl, setScrapingUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleManualAdd = async () => {
    if (!newTitle.trim() || !newCompany.trim()) {
      toast({ title: "Job title and company are required", variant: "destructive" });
      return;
    }
    const newApp: Application = {
      id: `temp-${Date.now()}`,
      jobTitle: newTitle.trim(),
      company: newCompany.trim(),
      location: newLocation.trim(),
      status: "applied",
      appliedDate: new Date(),
      jobUrl: newUrl.trim() || undefined,
      description: newDescription.trim() || undefined,
      analysis: newAnalysis,
    };
    onApplicationUpdate?.([newApp, ...applications]);
    setNewTitle(""); setNewCompany(""); setNewLocation(""); setNewUrl("");
    setNewDescription(""); setNewAnalysis(undefined);
    setShowAddForm(false);

    try {
      const res = await fetch("/api/jobs/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: newApp.jobTitle,
          company: newApp.company,
          jobUrl: newApp.jobUrl || "",
          status: "applied",
          location: newApp.location,
          description: newApp.description,
          analysis: newApp.analysis,
        }),
      });
      const saved = await res.json();
      if (saved.id) {
        onApplicationUpdate?.(
          [newApp, ...applications].map((a) => a.id === newApp.id ? { ...a, id: saved.id } : a),
        );
      }
    } catch {}
    toast({ title: "Application added", description: `${newApp.jobTitle} at ${newApp.company}` });
  };

  const handleScrapeUrl = async () => {
    const url = newUrl.trim();
    if (!url) {
      toast({ title: "Enter a job URL first", variant: "destructive" });
      return;
    }

    setScrapingUrl(true);
    try {
      const res = await fetch("/api/jobs/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok || !data?.job) {
        throw new Error(data?.error || "Could not scrape this job URL");
      }

      if (data.job.title) setNewTitle(data.job.title);
      if (data.job.company) setNewCompany(data.job.company);
      if (data.job.location) setNewLocation(data.job.location);
      if (data.job.url) setNewUrl(data.job.url);
      setNewDescription(cleanDescriptionText(data.job.description || ""));
      setNewAnalysis(data.analysis ? normalizeJobAnalysis(data.analysis) : undefined);

      toast({
        title: "Job URL scraped",
        description: "Filled title, company, location, and parsed JD.",
      });
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "Failed to scrape URL",
        variant: "destructive",
      });
    } finally {
      setScrapingUrl(false);
    }
  };

  const handleJDUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (resumeData) formData.append("resume", JSON.stringify(resumeData));

      const res = await fetch("/api/jobs/analyze", { method: "POST", body: formData });
      const data = await res.json();

      if (data.job && data.analysis) {
        const normalizedAnalysis = normalizeJobAnalysis(data.analysis);
        const newApp: Application = {
          id: `temp-${Date.now()}`,
          jobTitle: data.job.title,
          company: data.job.company,
          location: data.job.location || "",
          status: "applied",
          appliedDate: new Date(),
          jobUrl: data.job.url || "",
          description: cleanDescriptionText(data.job.description),
          analysis: normalizedAnalysis,
          salary: data.job.salary,
        };
        onApplicationUpdate?.([newApp, ...applications]);
        setExpandedId(newApp.id);

        const saveRes = await fetch("/api/jobs/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobTitle: newApp.jobTitle,
            company: newApp.company,
            jobUrl: newApp.jobUrl,
            status: "applied",
            location: newApp.location,
            salaryRange: newApp.salary,
            description: newApp.description,
            analysis: normalizedAnalysis,
          }),
        });
        const saved = await saveRes.json();
        if (saved.id) {
          onApplicationUpdate?.(
            [newApp, ...applications].map((a) => a.id === newApp.id ? { ...a, id: saved.id } : a),
          );
          setExpandedId(saved.id);
        }

        toast({ title: "JD analyzed & tracked", description: `${newApp.jobTitle} at ${newApp.company}` });
      } else {
        toast({ title: data.error || "Analysis failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const updateApplicationStatus = (id: string, status: Application['status']) => {
    onApplicationUpdate?.(
      applications.map(app => app.id === id ? { ...app, status } : app)
    );
    fetch(`/api/jobs/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => {});
    toast({
      title: "Status updated",
      description: `Application status changed to ${status}`
    });
  };

  const deleteApplication = (id: string) => {
    onApplicationUpdate?.(applications.filter(app => app.id !== id));
    fetch(`/api/jobs/applications/${id}`, { method: "DELETE" }).catch(() => {});
    toast({
      title: "Application deleted",
      description: "Application removed from tracker"
    });
  };

  const updateNotes = (id: string, notes: string) => {
    onApplicationUpdate?.(
      applications.map(app => app.id === id ? { ...app, notes } : app)
    );
    fetch(`/api/jobs/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    }).catch(() => {});
    setEditingId(null);
    setEditNotes("");
  };

  const getStatusColor = (status: Application['status']) => {
    switch (status) {
      case "applied": return "bg-blue-100 text-blue-800";
      case "interview": return "bg-yellow-100 text-yellow-800";
      case "offer": return "bg-green-100 text-green-800";
      case "accepted": return "bg-emerald-100 text-emerald-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: Application['status']) => {
    switch (status) {
      case "accepted": 
      case "offer": 
        return <CheckCircle className="w-4 h-4" />;
      default: 
        return <Briefcase className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Briefcase className="w-5 h-5 mr-2" />
              Application Tracker
              <Badge variant="secondary" className="ml-3">
                {applications.length}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Upload className="w-4 h-4 mr-1.5" />}
                {uploading ? "Analyzing..." : "Upload JD"}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showAddForm && (
            <div className="mb-4 p-4 border border-blue-200 bg-blue-50/30 rounded-xl space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Job title *" />
                <Input value={newCompany} onChange={(e) => setNewCompany(e.target.value)} placeholder="Company *" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <GooglePlacesAutocomplete value={newLocation} onChange={(value) => setNewLocation(value)} placeholder="Location" />
                <div className="flex gap-2">
                  <Input
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void handleScrapeUrl();
                      }
                    }}
                    placeholder="Job URL"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleScrapeUrl}
                    disabled={!newUrl.trim() || scrapingUrl}
                  >
                    {scrapingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : "Scrape URL"}
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleManualAdd} disabled={!newTitle.trim() || !newCompany.trim()}>Add Application</Button>
                <Button size="sm" variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {applications.length === 0 && !showAddForm ? (
            <div className="text-center py-12 space-y-3">
              <FileText className="w-10 h-10 mx-auto text-gray-300" />
              <p className="text-base font-medium text-gray-700">No applications yet</p>
              <div className="flex justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
                  <Plus className="w-4 h-4 mr-1.5" /> Add manually
                </Button>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-1.5" /> Upload JD
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <Card key={app.id} className="border border-gray-200 shadow-sm overflow-hidden">
                  <CardContent className="p-0">
                    {/* Top: logo + company + actions */}
                    <div className="flex items-center justify-between gap-4 p-4 pb-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <CompanyLogo
                          src={app.analysis?.companyLogoUrl}
                          url={app.jobUrl}
                          companyName={app.company}
                          size="sm"
                        />
                        <span className="text-sm font-medium text-gray-900 truncate">{app.company}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className={getStatusColor(app.status)}>
                          {getStatusIcon(app.status)}
                          <span className="ml-1 capitalize">{app.status}</span>
                        </Badge>
                        {app.jobUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => window.open(app.jobUrl, "_blank")}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Job title — clickable */}
                    <div className="px-4 pb-2">
                      <h3
                        className="font-semibold text-base text-gray-900 hover:text-blue-600 cursor-pointer transition-colors line-clamp-2"
                        onClick={() => onOpenApplication?.(app)}
                      >
                        {app.jobTitle}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {[app.location, app.salary, app.appliedDate.toLocaleDateString()].filter(Boolean).join(" · ")}
                      </p>
                    </div>

                    {/* Status pills */}
                    <div className="flex flex-wrap gap-1.5 px-4 pb-3">
                      {(["applied", "interview", "offer", "accepted", "rejected"] as const).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => updateApplicationStatus(app.id, status)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                            app.status === status
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {app.status === status && <CheckCircle className="w-3 h-3" />}
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>

                    {/* Notes + actions bar */}
                    <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-2.5">
                      {editingId === app.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Add notes..."
                            className="text-sm bg-white"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => updateNotes(app.id, editNotes)}>
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm text-gray-600 truncate flex-1 min-w-0">
                            {app.notes || "No notes"}
                          </p>
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            {app.analysis && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                                title={expandedId === app.id ? "Collapse JD" : "View JD"}
                              >
                                <FileText className="w-3.5 h-3.5" />
                                {expandedId === app.id ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
                              </Button>
                            )}
                            {!app.analysis && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => fileInputRef.current?.click()}
                                title="Upload JD"
                              >
                                <Upload className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => { setEditingId(app.id); setEditNotes(app.notes || ""); }}
                              title="Edit notes"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => deleteApplication(app.id)}
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Expanded Parsed JD — use normalized analysis for consistent arrays/strings */}
                    {expandedId === app.id && app.analysis && (() => {
                      const displayAnalysis = normalizeJobAnalysis(app.analysis);
                      const fullDescription = cleanDescriptionText(app.description);
                      return (
                      <div className="border-t border-gray-100 px-4 pt-4 pb-4 space-y-4 bg-white">
                        {displayAnalysis.companyInfo && (
                          <div>
                            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 inline-flex items-center gap-1.5">
                              <Building className="w-3.5 h-3.5" />
                              About the Company
                            </h5>
                            <p className="text-sm text-gray-700">{displayAnalysis.companyInfo}</p>
                          </div>
                        )}

                        {displayAnalysis.experience && (
                          <div>
                            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 inline-flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              Experience
                            </h5>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-700">{displayAnalysis.experience}</span>
                              {displayAnalysis.experienceLevel && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">{displayAnalysis.experienceLevel}</span>
                              )}
                            </div>
                          </div>
                        )}

                        {displayAnalysis.requiredSkills.length > 0 && (
                          <div>
                            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 inline-flex items-center gap-1.5">
                              <Briefcase className="w-3.5 h-3.5" />
                              Required Skills
                            </h5>
                            <div className="flex flex-wrap gap-1.5">
                              {displayAnalysis.requiredSkills.map((s, i) => (
                                <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-gray-900 text-white font-medium">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {displayAnalysis.preferredSkills.length > 0 && (
                          <div>
                            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 inline-flex items-center gap-1.5">
                              <Briefcase className="w-3.5 h-3.5" />
                              Preferred Skills
                            </h5>
                            <div className="flex flex-wrap gap-1.5">
                              {displayAnalysis.preferredSkills.map((s, i) => (
                                <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 font-medium">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {displayAnalysis.qualifications.length > 0 && (
                          <div>
                            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 inline-flex items-center gap-1.5">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Qualifications
                            </h5>
                            <ul className="space-y-1">
                              {displayAnalysis.qualifications.map((q, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-[7px] flex-shrink-0" />
                                  {q}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {displayAnalysis.responsibilities.length > 0 && (
                          <div>
                            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 inline-flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5" />
                              Responsibilities
                            </h5>
                            <ul className="space-y-1">
                              {displayAnalysis.responsibilities.map((r, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-[7px] flex-shrink-0" />
                                  {r}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {fullDescription && (
                          <div>
                            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 inline-flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5" />
                              Full Description
                            </h5>
                            <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 max-h-60 overflow-y-auto">
                              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{fullDescription}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ); })()}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
