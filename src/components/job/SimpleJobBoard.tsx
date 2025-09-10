"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  MapPin, 
  Building, 
  ExternalLink, 
  Clock,
  Star,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface SimpleJobBoardProps {
  onAddToTracker: (job: Job) => void;
}

export default function SimpleJobBoard({ onAddToTracker }: SimpleJobBoardProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);

  const fetchJobs = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search required",
        description: "Please enter a job title or keywords",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        location: location,
        limit: "25",
      });

      const response = await fetch(`/api/jobs/search?${params}`);
      const data = await response.json();

      if (data.jobs && Array.isArray(data.jobs)) {
        setJobs(data.jobs);
        toast({
          title: "Jobs found!",
          description: `Found ${data.jobs.length} job opportunities`,
        });
      } else {
        setJobs([]);
        toast({
          title: "No jobs found",
          description: "Try different keywords or location",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Job search error:", error);
      toast({
        title: "Search failed",
        description: "Unable to fetch jobs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const addJobToTracker = (job: Job) => {
    onAddToTracker(job);
    toast({
      title: "Added to tracker!",
      description: `${job.title} at ${job.company} added to your application tracker`,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      fetchJobs();
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="w-5 h-5 mr-2" />
            Job Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Enter job title, skills, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="text-lg"
              />
            </div>
            <div className="w-64">
              <Input
                placeholder="Location (optional)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
            <Button 
              onClick={fetchJobs} 
              disabled={isSearching}
              className="px-8"
            >
              {isSearching ? "Searching..." : "Search Jobs"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Job Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Job Results</span>
            {jobs.length > 0 && (
              <Badge variant="secondary">{jobs.length} jobs found</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {isSearching ? (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p>Searching for jobs...</p>
                </>
              ) : (
                <>
                  <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Ready to find your next opportunity?</p>
                  <p>Enter a job title or keywords to start searching.</p>
                </>
              )}
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {jobs.map((job) => (
                  <Card key={job.id} className="border hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-blue-700 hover:text-blue-900">
                            {job.title}
                          </h3>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1 mb-2">
                            <div className="flex items-center">
                              <Building className="w-4 h-4 mr-1" />
                              {job.company}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {job.location}
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {job.posted}
                            </div>
                          </div>

                          {job.fitScore && (
                            <div className="flex items-center mb-2">
                              <Star className="w-4 h-4 text-yellow-500 mr-1" />
                              <span className="text-sm font-medium text-green-600">
                                {job.fitScore}% Match
                              </span>
                              {job.matchReasons && job.matchReasons.length > 0 && (
                                <span className="text-xs text-gray-500 ml-2">
                                  ({job.matchReasons.slice(0, 2).join(", ")})
                                </span>
                              )}
                            </div>
                          )}

                          <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                            {job.description}
                          </p>

                          {job.salary && (
                            <Badge variant="outline" className="mr-2">
                              {job.salary}
                            </Badge>
                          )}
                          
                          <Badge variant="outline">
                            {job.type}
                          </Badge>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            onClick={() => addJobToTracker(job)}
                            className="flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Add to Tracker
                          </Button>
                          
                          {job.url && (
                            <Button
                              variant="outline"
                              onClick={() => window.open(job.url, '_blank')}
                              className="flex items-center gap-2"
                            >
                              <ExternalLink className="w-4 h-4" />
                              View Job
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


