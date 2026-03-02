"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import SimpleJobBoard from "./SimpleJobBoard";
import ApplicationTracker from "./ApplicationTracker";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url?: string;
  posted: string;
  salary?: string;
  type: string;
  fitScore?: number;
  matchReasons?: string[];
}

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  status: "applied" | "interview" | "rejected" | "offer" | "accepted";
  appliedDate: Date;
  jobUrl?: string;
  notes?: string;
  salary?: string;
}

export default function JobManager() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeTab, setActiveTab] = useState("search");

  // Function to add job from job board to application tracker
  const addJobToTracker = (job: Job) => {
    const newApplication: Application = {
      id: `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      jobTitle: job.title,
      company: job.company,
      location: job.location,
      status: "applied",
      appliedDate: new Date(),
      jobUrl: job.url,
      notes: `Found via job search. Match score: ${job.fitScore || 'N/A'}%`,
      salary: job.salary,
    };

    setApplications(prev => [newApplication, ...prev]);
    
    // Switch to tracker tab to show the added application
    setActiveTab("tracker");
  };

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
          <SimpleJobBoard onAddToTracker={addJobToTracker} />
        </TabsContent>

        <TabsContent value="tracker" className="mt-6">
          <ApplicationTracker 
            applications={applications}
            onApplicationUpdate={setApplications}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}


