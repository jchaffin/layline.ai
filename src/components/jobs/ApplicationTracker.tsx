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
      setNewDescription(data.job.description || "");
      setNewAnalysis(data.analysis || undefined);

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
        const newApp: Application = {
          id: `temp-${Date.now()}`,
          jobTitle: data.job.title,
          company: data.job.company,
          location: data.job.location || "",
          status: "applied",
          appliedDate: new Date(),
          jobUrl: data.job.url || "",
          description: data.job.description,
          analysis: data.analysis,
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
            analysis: data.analysis,
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
                <Card key={app.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3">
                          <CompanyLogo url={app.jobUrl} size="sm" />
                          <div className="min-w-0 flex-1">
                        <h3
                          className="font-semibold text-lg hover:text-blue-600 cursor-pointer transition-colors"
                          onClick={() => onOpenApplication?.(app)}
                        >
                          {app.jobTitle}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <div className="flex items-center">
                            <Building className="w-4 h-4 mr-1" />
                            {app.company}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {app.location}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {app.appliedDate.toLocaleDateString()}
                          </div>
                        </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(app.status)}>
                          {getStatusIcon(app.status)}
                          <span className="ml-1 capitalize">{app.status}</span>
                        </Badge>
                        
                        {app.jobUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(app.jobUrl, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Status Update Buttons */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(["applied", "interview", "offer", "accepted", "rejected"] as const).map((status) => (
                        <Button
                          key={status}
                          variant={app.status === status ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateApplicationStatus(app.id, status)}
                          className="text-xs"
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Button>
                      ))}
                    </div>

                    {/* Notes Section */}
                    <div className="border-t pt-3">
                      {editingId === app.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Add notes about this application..."
                            className="text-sm"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => updateNotes(app.id, editNotes)}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-gray-600">
                            {app.notes || "No notes added"}
                          </p>
                          <div className="flex gap-1">
                            {app.analysis && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                              >
                                <FileText className="w-4 h-4 mr-1" />
                                {expandedId === app.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </Button>
                            )}
                            {!app.analysis && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                title="Upload JD for this application"
                              >
                                <Upload className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingId(app.id);
                                setEditNotes(app.notes || "");
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteApplication(app.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Expanded Parsed JD */}
                    {expandedId === app.id && app.analysis && (
                      <div className="border-t pt-4 mt-3 space-y-4">
                        {app.analysis.companyInfo && (
                          <div>
                            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 inline-flex items-center gap-1.5">
                              <Building className="w-3.5 h-3.5" />
                              About the Company
                            </h5>
                            <p className="text-sm text-gray-700">{app.analysis.companyInfo}</p>
                          </div>
                        )}

                        {app.analysis.experience && (
                          <div>
                            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 inline-flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              Experience
                            </h5>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-700">{app.analysis.experience}</span>
                              {app.analysis.experienceLevel && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">{app.analysis.experienceLevel}</span>
                              )}
                            </div>
                          </div>
                        )}

                        {app.analysis.requiredSkills && app.analysis.requiredSkills.length > 0 && (
                          <div>
                            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 inline-flex items-center gap-1.5">
                              <Briefcase className="w-3.5 h-3.5" />
                              Required Skills
                            </h5>
                            <div className="flex flex-wrap gap-1.5">
                              {app.analysis.requiredSkills.map((s: string, i: number) => (
                                <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-gray-900 text-white font-medium">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {app.analysis.preferredSkills && app.analysis.preferredSkills.length > 0 && (
                          <div>
                            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 inline-flex items-center gap-1.5">
                              <Briefcase className="w-3.5 h-3.5" />
                              Preferred Skills
                            </h5>
                            <div className="flex flex-wrap gap-1.5">
                              {app.analysis.preferredSkills.map((s: string, i: number) => (
                                <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 font-medium">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {app.analysis.qualifications && app.analysis.qualifications.length > 0 && (
                          <div>
                            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 inline-flex items-center gap-1.5">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Qualifications
                            </h5>
                            <ul className="space-y-1">
                              {app.analysis.qualifications.map((q: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-[7px] flex-shrink-0" />
                                  {q}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {app.analysis.responsibilities && app.analysis.responsibilities.length > 0 && (
                          <div>
                            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 inline-flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5" />
                              Responsibilities
                            </h5>
                            <ul className="space-y-1">
                              {app.analysis.responsibilities.map((r: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-[7px] flex-shrink-0" />
                                  {r}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {app.description && (
                          <div>
                            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 inline-flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5" />
                              Full Description
                            </h5>
                            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto">{app.description}</p>
                          </div>
                        )}
                      </div>
                    )}
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
