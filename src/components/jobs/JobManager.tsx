"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import JobBoard from "./JobBoard";
import ApplicationTracker from "./ApplicationTracker";
import JDEditView from "./JDEditView";
import type { ParsedResume } from "@/lib/schema";
import type { Job, Application } from "@/types/job";

export default function JobManager({ resumeData }: { resumeData?: ParsedResume | null }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeTab, setActiveTab] = useState("search");
  const [editingApp, setEditingApp] = useState<Application | null>(null);

  const loadApplications = useCallback(async () => {
    try {
      const res = await fetch("/api/jobs/applications");
      const data = await res.json();
      const dbApps = Array.isArray(data.applications) ? data.applications : [];
      if (dbApps.length === 0) return;

      const mapped = dbApps.map((a: any) => ({
        id: a.id,
        jobTitle: a.jobTitle,
        company: a.company,
        location: a.location || "",
        status: a.status as Application["status"],
        appliedDate: new Date(a.appliedDate || a.createdAt),
        jobUrl: a.jobUrl,
        notes: a.notes,
        salary: a.salaryRange,
        description: a.description,
        analysis: a.analysis,
      }));

      setApplications((prev) => {
        const dbIds = new Set(mapped.map((a: Application) => a.id));
        const localOnly = prev.filter((a) => a.id.startsWith("temp-") && !dbIds.has(a.id));
        return [...localOnly, ...mapped];
      });
    } catch {}
  }, []);

  useEffect(() => { loadApplications(); }, [loadApplications]);

  const addJobToTracker = async (job: Job) => {
    const newApp: Application = {
      id: `temp-${Date.now()}`,
      jobTitle: job.title,
      company: job.company,
      location: job.location,
      status: "applied",
      appliedDate: new Date(),
      jobUrl: job.url,
      notes: job.matchScore ? `Match score: ${job.matchScore}%` : undefined,
      salary: job.salary ?? undefined,
    };

    setApplications((prev) => [newApp, ...prev]);
    setActiveTab("tracker");

    try {
      const res = await fetch("/api/jobs/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: job.title,
          company: job.company,
          jobUrl: job.url || "",
          status: "applied",
          notes: newApp.notes,
          location: job.location,
          salaryRange: job.salary,
        }),
      });
      const saved = await res.json();
      if (saved.id) {
        setApplications((prev) =>
          prev.map((a) => (a.id === newApp.id ? { ...a, id: saved.id } : a)),
        );
      }
    } catch {}
  };

  const handleApplicationUpdate = (updated: Application[]) => {
    setApplications(updated);
  };

  const handleJDSave = async (id: string, data: { jobTitle: string; company: string; location: string; description?: string; analysis: any }) => {
    setApplications((prev) =>
      prev.map((a) => a.id === id ? { ...a, jobTitle: data.jobTitle, company: data.company, location: data.location, description: data.description, analysis: data.analysis } : a),
    );
    if (editingApp) {
      setEditingApp((prev) => prev ? { ...prev, jobTitle: data.jobTitle, company: data.company, location: data.location, description: data.description, analysis: data.analysis } : prev);
    }
    fetch(`/api/jobs/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notes: undefined,
        description: data.description,
        analysis: data.analysis,
      }),
    }).catch(() => {});
  };

  const handlePracticeInterview = (context: { companyName: string; roleTitle: string; jobDescription: string }) => {
    const payload = {
      description: context.jobDescription,
      analysis: {
        company: context.companyName,
        role: context.roleTitle,
      },
    };
    localStorage.setItem("currentJobAnalysis", JSON.stringify(payload));
    localStorage.setItem("interviewContext", JSON.stringify(context));
    window.location.href = "/interview";
  };

  if (editingApp) {
    return (
      <div className="w-full max-w-7xl mx-auto">
        <JDEditView
          application={editingApp}
          onBack={() => setEditingApp(null)}
          onSave={handleJDSave}
          onPracticeInterview={handlePracticeInterview}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search" className="flex items-center gap-2">
            Job Search
          </TabsTrigger>
          <TabsTrigger value="tracker" className="flex items-center gap-2">
            Application Tracker
            {applications.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {applications.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="mt-6">
          <JobBoard onAddToTracker={addJobToTracker} resumeData={resumeData} />
        </TabsContent>

        <TabsContent value="tracker" className="mt-6">
          <ApplicationTracker
            applications={applications}
            onApplicationUpdate={handleApplicationUpdate}
            resumeData={resumeData}
            onOpenApplication={setEditingApp}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
