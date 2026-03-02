"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  ExternalLink,
  Building,
  MapPin,
  DollarSign,
  Calendar,
  Edit,
  Trash2,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SimpleLocationInput } from "@/components/ui/simple-location-input";
import type { JobApplication } from "@/lib/schema";

interface JobTrackerProps {
  hasResume?: boolean;
  userId?: string;
}

export default function JobTracker({
  hasResume = false,
  userId = "demo-user",
}: JobTrackerProps) {
  const [showUrlPopup, setShowUrlPopup] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [jobUrl, setJobUrl] = useState("");
  const [isFetchingJob, setIsFetchingJob] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useDetailedLocation, setUseDetailedLocation] = useState(false);
  const [locationData, setLocationData] = useState<{
    city?: string;
    state?: string;
    zipCode?: string;
  }>({});

  const { toast } = useToast();

  const [formData, setFormData] = useState({
    jobTitle: "",
    company: "",
    jobUrl: "",
    status: "applied" as JobApplication["status"],
    salaryRange: "",
    notes: "",
    location: "",
  });

  const resetForm = () => {
    setFormData({
      jobTitle: "",
      company: "",
      jobUrl: "",
      status: "applied",
      salaryRange: "",
      notes: "",
      location: "",
    });
    setLocationData({});
    setJobUrl("");
  };

  const fetchJobFromUrl = async () => {
    if (!jobUrl.trim()) return;

    setIsFetchingJob(true);
    try {
      const response = await fetch("/api/jobs/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: jobUrl }),
      });

      if (response.ok) {
        const jobData = await response.json();
        setFormData({
          jobTitle: jobData.title || "",
          company: jobData.company || "",
          jobUrl: jobUrl,
          status: "applied",
          salaryRange: jobData.salary || "",
          notes: jobData.description
            ? jobData.description.substring(0, 500) +
              (jobData.description.length > 500 ? "..." : "")
            : "",
          location: jobData.location || "",
        });
        setShowUrlPopup(false);
        setShowAddForm(true);

        toast({
          title: "Job details fetched",
          description:
            "Job information has been extracted and populated in the form.",
        });
      } else {
        toast({
          title: "Could not fetch job details",
          description: "Please enter the job information manually.",
          variant: "destructive",
        });
        // Still allow manual entry
        setFormData((prev) => ({ ...prev, jobUrl: jobUrl }));
        setShowUrlPopup(false);
        setShowAddForm(true);
      }
    } catch (error) {
      toast({
        title: "Error fetching job",
        description: "Please enter the job information manually.",
        variant: "destructive",
      });
      // Still allow manual entry
      setFormData((prev) => ({ ...prev, jobUrl: jobUrl }));
      setShowUrlPopup(false);
      setShowAddForm(true);
    } finally {
      setIsFetchingJob(false);
    }
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (
        !formData.jobTitle.trim() ||
        !formData.company.trim() ||
        !formData.jobUrl.trim()
      ) {
        toast({
          title: "Missing required fields",
          description: "Please fill in all required fields (marked with *).",
          variant: "destructive",
        });
        return;
      }

      setIsSubmitting(true);

      try {
        // Build the final location string
        let finalLocation = formData.location;
        if (useDetailedLocation && (locationData.city || locationData.state)) {
          const parts = [];
          if (locationData.city) parts.push(locationData.city);
          if (locationData.state) parts.push(locationData.state);
          if (locationData.zipCode) parts.push(locationData.zipCode);
          finalLocation = parts.join(", ");
        }

        const applicationData = {
          ...formData,
          location: finalLocation,
          userId,
          appliedDate: new Date().toISOString(),
        };

        const response = await fetch("/api/jobs/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(applicationData),
        });

        if (!response.ok) {
          throw new Error("Failed to save application");
        }

        const newApp = await response.json();
        setApplications((prev) => [newApp, ...prev]);

        toast({
          title: "Application added",
          description: "Job application has been saved successfully.",
        });

        setShowAddForm(false);
        resetForm();
      } catch (error) {
        toast({
          title: "Failed to save application",
          description: "Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, locationData, useDetailedLocation, userId, toast],
  );

  const updateStatus = useCallback(
    async (id: string, newStatus: JobApplication["status"]) => {
      try {
        const response = await fetch(`/api/jobs/applications/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
          throw new Error("Failed to update status");
        }

        setApplications((prev) =>
          prev.map((app) =>
            app.id === id
              ? { ...app, status: newStatus, lastUpdated: new Date() }
              : app,
          ),
        );

        toast({
          title: "Status updated",
          description: `Application status changed to ${newStatus}`,
        });
      } catch (error) {
        toast({
          title: "Update failed",
          description: "Could not update application status.",
          variant: "destructive",
        });
      }
    },
    [toast],
  );

  const getStatusBadge = (status: JobApplication["status"]) => {
    const statusConfig = {
      applied: { variant: "secondary" as const, label: "Applied" },
      "in-progress": { variant: "default" as const, label: "In Progress" },
      rejected: { variant: "destructive" as const, label: "Rejected" },
      offered: { variant: "default" as const, label: "Offered" },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge
        variant={config.variant}
        className={
          status === "offered"
            ? "bg-green-100 text-green-800 hover:bg-green-200"
            : ""
        }
      >
        {config.label}
      </Badge>
    );
  };

  const getStatusColor = (status: JobApplication["status"]) => {
    switch (status) {
      case "applied":
        return "border-l-blue-500";
      case "in-progress":
        return "border-l-yellow-500";
      case "rejected":
        return "border-l-red-500";
      case "offered":
        return "border-l-green-500";
      default:
        return "border-l-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Job Applications</h2>
          <p className="text-gray-600">
            Track your job applications and their status
          </p>
        </div>
        <Button
          onClick={() => setShowUrlPopup(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Job Application
        </Button>
      </div>

      {/* Manual Job Entry Popup */}
      {showUrlPopup && (
        <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
          <div className="w-full max-w-4xl max-h-[90vh] mx-4 bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold">Add Job Application</h2>
                <p className="text-sm text-gray-600">
                  Enter job details manually or paste a job URL
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowUrlPopup(false);
                  setJobUrl("");
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
              <Card>
                <CardHeader>
                  <CardTitle>Enter Job Details</CardTitle>
                  <CardDescription>
                    Paste the job posting URL to automatically extract job
                    details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="jobUrl">Job Posting URL</Label>
                      <Input
                        id="jobUrl"
                        type="url"
                        value={jobUrl}
                        onChange={(e) => setJobUrl(e.target.value)}
                        placeholder="https://company.com/jobs/position"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            fetchJobFromUrl();
                          }
                        }}
                      />
                    </div>
                    <div className="flex space-x-3">
                      <Button
                        onClick={fetchJobFromUrl}
                        disabled={isFetchingJob || !jobUrl.trim()}
                        className="flex-1"
                      >
                        {isFetchingJob ? "Fetching..." : "Fetch Job Details"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          // Allow manual entry
                          setFormData((prev) => ({ ...prev, jobUrl: jobUrl }));
                          setShowUrlPopup(false);
                          setShowAddForm(true);
                        }}
                        disabled={!jobUrl.trim()}
                      >
                        Manual Entry
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Add Job Application Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Job Application</CardTitle>
            <CardDescription>
              Enter the details of the job you've applied for
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="jobTitle">Job Title *</Label>
                  <Input
                    id="jobTitle"
                    value={formData.jobTitle}
                    onChange={(e) =>
                      setFormData({ ...formData, jobTitle: e.target.value })
                    }
                    placeholder="Software Engineer"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company *</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                    placeholder="Company Name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="jobUrl">Job URL *</Label>
                  <Input
                    id="jobUrl"
                    type="url"
                    value={formData.jobUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, jobUrl: e.target.value })
                    }
                    placeholder="https://..."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="applied">Applied</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="offered">Offered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Location
                    </Label>
                    <button
                      type="button"
                      onClick={() =>
                        setUseDetailedLocation(!useDetailedLocation)
                      }
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      {useDetailedLocation
                        ? "Use simple format"
                        : "Use detailed format"}
                    </button>
                  </div>

                  <SimpleLocationInput
                    id="location"
                    value={formData.location}
                    onChange={(value) =>
                      setFormData({ ...formData, location: value })
                    }
                    placeholder="Remote / City, State"
                    showDetailedFields={useDetailedLocation}
                    locationData={locationData}
                    onLocationDataChange={setLocationData}
                  />
                </div>
                <div>
                  <Label htmlFor="salaryRange">Salary Range</Label>
                  <Input
                    id="salaryRange"
                    value={formData.salaryRange}
                    onChange={(e) =>
                      setFormData({ ...formData, salaryRange: e.target.value })
                    }
                    placeholder="$80k - $120k"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Application notes, referrals, interview details..."
                  rows={3}
                />
              </div>
              <div className="flex space-x-3">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Application"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Applications List */}
      <div className="space-y-4">
        {applications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No applications yet
              </h3>
              <p className="text-gray-600 mb-4">
                Start tracking your job applications to stay organized during
                your job search.
              </p>
              <Button onClick={() => setShowUrlPopup(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Application
              </Button>
            </CardContent>
          </Card>
        ) : (
          applications.map((app) => (
            <Card
              key={app.id}
              className={`border-l-4 ${getStatusColor(app.status)}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{app.jobTitle}</CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Building className="w-4 h-4" />
                        <span>{app.company}</span>
                      </div>
                      {app.location && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{app.location}</span>
                        </div>
                      )}
                      {app.salaryRange && (
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-4 h-4" />
                          <span>{app.salaryRange}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(app.status)}
                    <Button variant="ghost" size="sm" asChild>
                      <a
                        href={app.jobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Select
                      value={app.status}
                      onValueChange={(value: any) =>
                        updateStatus(app.id, value)
                      }
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="applied">Applied</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="offered">Offered</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {app.notes && (
                    <div>
                      <Label className="text-sm font-medium">Notes</Label>
                      <p className="text-sm text-gray-700 mt-1">{app.notes}</p>
                    </div>
                  )}

                  {/* Resume Tailoring - Only available if resume uploaded */}
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">
                        Resume Tailoring
                      </Label>
                      {hasResume ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Resume tailoring",
                              description:
                                "This feature would tailor your resume for this specific job application.",
                            });
                          }}
                        >
                          Tailor Resume
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          onClick={() => {
                            toast({
                              title: "Resume required",
                              description:
                                "Please upload your resume first to enable resume tailoring.",
                              variant: "destructive",
                            });
                          }}
                        >
                          Tailor Resume
                        </Button>
                      )}
                    </div>
                    {!hasResume && (
                      <p className="text-xs text-gray-500 mt-1">
                        Upload your resume to enable personalized resume
                        tailoring for each job application.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Applied:{" "}
                      {new Date(
                        app.appliedDate || Date.now(),
                      ).toLocaleDateString()}
                    </span>
                    {app.lastUpdated && (
                      <span>
                        Updated:{" "}
                        {new Date(app.lastUpdated).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
