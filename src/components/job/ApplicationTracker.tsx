"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Briefcase, 
  Building, 
  MapPin, 
  Calendar, 
  ExternalLink,
  Trash2,
  Edit,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface ApplicationTrackerProps {
  applications?: Application[];
  onApplicationUpdate?: (applications: Application[]) => void;
}

export default function ApplicationTracker({ 
  applications: externalApplications, 
  onApplicationUpdate 
}: ApplicationTrackerProps) {
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>(externalApplications || []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('jobApplications');
    if (saved && applications.length === 0) {
      setApplications(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    // Save to localStorage whenever applications change
    localStorage.setItem('jobApplications', JSON.stringify(applications));
    onApplicationUpdate?.(applications);
  }, [applications, onApplicationUpdate]);

  const updateApplicationStatus = (id: string, status: Application['status']) => {
    setApplications(apps => 
      apps.map(app => 
        app.id === id ? { ...app, status } : app
      )
    );
    toast({
      title: "Status updated",
      description: `Application status changed to ${status}`
    });
  };

  const deleteApplication = (id: string) => {
    setApplications(apps => apps.filter(app => app.id !== id));
    toast({
      title: "Application deleted",
      description: "Application removed from tracker"
    });
  };

  const updateNotes = (id: string, notes: string) => {
    setApplications(apps => 
      apps.map(app => 
        app.id === id ? { ...app, notes } : app
      )
    );
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Briefcase className="w-5 h-5 mr-2" />
              Application Tracker
            </div>
            <Badge variant="secondary">
              {applications.length} Applications
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No applications yet</p>
              <p>Start applying to jobs and they'll appear here!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <Card key={app.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{app.jobTitle}</h3>
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
