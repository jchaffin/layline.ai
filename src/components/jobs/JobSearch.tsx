"use client";

import { useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { GooglePlacesAutocomplete } from "@/components/shared/AutoComplete";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ScrollArea } from "@/components/ui/ScrollArea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  Search,
  MapPin,
  Calendar,
  DollarSign,
  ExternalLink,
  Building,
  Clock,
  Users,
  Award,
  CheckCircle,
  Grid3X3,
  List,
  Filter,
  SortAsc,
  MoreVertical,
  Star,
  Download,
  Share,
  Archive,
  Folder,
  Settings,
  Plus,
  Menu,
  ChevronDown,
  ChevronUp,
  Target,
  Sliders,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  posted: string;
  salary?: string;
  type: string;
  source: string;
  tags?: string[];
  // Additional JSearch fields
  employer_logo?: string;
  job_employment_type?: string;
  job_employment_types?: string[];
  job_apply_link?: string;
  job_google_link?: string;
  job_posted_at_datetime_utc?: string;
  job_min_salary?: number;
  job_max_salary?: number;
  job_salary_period?: string;
  job_highlights?: {
    Qualifications?: string[];
    Responsibilities?: string[];
    Benefits?: string[];
  };
  job_is_remote?: boolean;
  job_city?: string;
  job_state?: string;
  job_country?: string;
}

interface JobSearchProps {
  onJobSelect?: (job: Job) => void;
}

export default function JobSearch({ onJobSelect }: JobSearchProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("Software Engineer");
  const [location, setLocation] = useState("New York, NY");
  const [jobType, setJobType] = useState("");
  const [radius, setRadius] = useState("25");
  const [isSearching, setIsSearching] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [isExtractingLinkedin, setIsExtractingLinkedin] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'company' | 'salary'>('relevance');
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [datePosted, setDatePosted] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");

  // Auto-search on component mount with default values
  useEffect(() => {
    if (searchQuery && location) {
      handleSearch();
    }
  }, []); // Only run on mount

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search query required",
        description: "Please enter a job title, skill, or company name.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        location: location,
        radius: radius,
        jobtype: jobType === "all" ? "" : jobType,
        limit: "20",
      });

      // Add advanced options if specified
      if (salaryMin) params.append("salary_min", salaryMin);
      if (salaryMax) params.append("salary_max", salaryMax);
      if (datePosted) params.append("date_posted", datePosted);
      if (experienceLevel) params.append("experience_level", experienceLevel);
      if (companySize) params.append("company_size", companySize);

      const response = await fetch(`/api/jobs/search?${params}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = (errorData && typeof errorData === 'object' && 'error' in errorData) 
          ? errorData.error 
          : `Search failed: ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Ensure jobs is an array
      const jobsArray = Array.isArray(data.jobs) ? data.jobs : [];
      
      setJobs(jobsArray);
      setSearchResults(data);

      toast({
        title: "Search completed",
        description: `Found ${data.jobs?.length || 0} job opportunities.`,
      });
    } catch (error) {
      // console.error("Job search error:", error);

      // More specific error handling
      let errorMessage =
        "There was an error searching for jobs. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes("fetch")) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        } else if (error.message.includes("timeout")) {
          errorMessage =
            "Search is taking longer than expected. Please try again.";
        }
      }

      toast({
        title: "Search failed",
        description: errorMessage,
        variant: "destructive",
      });

      // Set empty results on error
      setJobs([]);
      setSearchResults(null);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, location, jobType, radius, toast]);

  const handleJobClick = (job: Job) => {
    if (onJobSelect) {
      onJobSelect(job);
    } else {
      // Open job URL in new tab
      window.open(job.url, "_blank");
    }
  };

  const handleLinkedInExtraction = useCallback(async () => {
    if (!linkedinUrl.trim()) {
      toast({
        title: "LinkedIn URL required",
        description: "Please enter a valid LinkedIn job posting URL.",
        variant: "destructive",
      });
      return;
    }

    // Validate LinkedIn URL format
    if (!linkedinUrl.includes('linkedin.com/jobs')) {
      toast({
        title: "Invalid LinkedIn URL",
        description: "Please enter a valid LinkedIn job posting URL (should contain 'linkedin.com/jobs').",
        variant: "destructive",
      });
      return;
    }

    setIsExtractingLinkedin(true);

    try {
      const response = await fetch('/api/jobs/analyze/linkedin/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: linkedinUrl.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract LinkedIn job');
      }

      const data = await response.json();

      if (data.success && data.job) {
        // Add the extracted job to the search results
        const extractedJob: Job = {
          ...data.job,
          // Ensure the job has all required fields for the interface
          tags: data.job.tags || [],
          job_employment_types: data.job.job_employment_type ? [data.job.job_employment_type] : ['Full-time'],
          job_highlights: {
            Qualifications: data.job.tags?.slice(0, 5) || [],
            Benefits: ['Competitive salary', 'Health benefits'],
            Responsibilities: ['View LinkedIn posting for detailed responsibilities']
          }
        };

        // Add to beginning of jobs array
        setJobs(prevJobs => [extractedJob, ...prevJobs]);
        setSearchResults((prevResults: any) => ({
          ...prevResults,
          jobs: [extractedJob, ...(prevResults?.jobs || [])],
          linkedinExtracted: true
        }));

        toast({
          title: "LinkedIn job extracted successfully",
          description: `Added "${extractedJob.title}" at ${extractedJob.company} to your search results.`,
        });

        // Clear the LinkedIn URL input
        setLinkedinUrl("");
      } else {
        throw new Error('No job data returned from LinkedIn extraction');
      }
    } catch (error) {
      console.error("LinkedIn extraction error:", error);
      
      toast({
        title: "LinkedIn extraction failed",
        description: error instanceof Error ? error.message : "Could not extract job data from LinkedIn URL. Please try again or copy the job details manually.",
        variant: "destructive",
      });
    } finally {
      setIsExtractingLinkedin(false);
    }
  }, [linkedinUrl, toast]);

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="w-5 h-5 mr-2" />
            Job Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Job Title, Skills, or Company
              </label>
              <Input
                placeholder="e.g. Software Engineer, React, Google"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Location</label>
              <GooglePlacesAutocomplete
                value={location}
                onChange={setLocation}
                placeholder="City, State, or Remote"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Job Type</label>
              <Select value={jobType} onValueChange={setJobType}>
                <SelectTrigger>
                  <SelectValue placeholder="All job types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All job types</SelectItem>
                  <SelectItem value="fulltime">Full-time</SelectItem>
                  <SelectItem value="parttime">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="temporary">Temporary</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Radius</label>
              <Select value={radius} onValueChange={setRadius}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Exact location</SelectItem>
                  <SelectItem value="5">5 miles</SelectItem>
                  <SelectItem value="10">10 miles</SelectItem>
                  <SelectItem value="25">25 miles</SelectItem>
                  <SelectItem value="50">50 miles</SelectItem>
                  <SelectItem value="100">100 miles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <div className="border-t pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="w-full justify-between text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              <div className="flex items-center">
                <Sliders className="w-4 h-4 mr-2" />
                Advanced Options
              </div>
              {showAdvancedOptions ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Advanced Options Panel */}
          {showAdvancedOptions && (
            <div className="space-y-4 border-t pt-4 bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Salary Range</label>
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Min ($)"
                      value={salaryMin}
                      onChange={(e) => setSalaryMin(e.target.value)}
                      className="w-full"
                    />
                    <span className="text-gray-500">to</span>
                    <Input
                      placeholder="Max ($)"
                      value={salaryMax}
                      onChange={(e) => setSalaryMax(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Date Posted</label>
                  <Select value={datePosted} onValueChange={setDatePosted}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="3days">Last 3 days</SelectItem>
                      <SelectItem value="week">Last week</SelectItem>
                      <SelectItem value="month">Last month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Experience Level</label>
                  <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any level</SelectItem>
                      <SelectItem value="entry">Entry level</SelectItem>
                      <SelectItem value="mid">Mid level</SelectItem>
                      <SelectItem value="senior">Senior level</SelectItem>
                      <SelectItem value="lead">Lead/Principal</SelectItem>
                      <SelectItem value="executive">Executive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Company Size</label>
                  <Select value={companySize} onValueChange={setCompanySize}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any size</SelectItem>
                      <SelectItem value="startup">Startup (1-50)</SelectItem>
                      <SelectItem value="small">Small (51-200)</SelectItem>
                      <SelectItem value="medium">Medium (201-1000)</SelectItem>
                      <SelectItem value="large">Large (1000+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleSearch}
            disabled={isSearching}
            className="w-full"
          >
            {isSearching ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Searching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Search Jobs
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* LinkedIn Job Extraction */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-800">
            <ExternalLink className="w-5 h-5 mr-2" />
            Extract from LinkedIn
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block text-blue-700">
              LinkedIn Job URL
            </label>
            <Input
              placeholder="https://www.linkedin.com/jobs/view/..."
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLinkedInExtraction()}
              className="bg-white"
            />
            <p className="text-xs text-blue-600 mt-1">
              Paste a LinkedIn job posting URL to extract job details using our enhanced scraping
            </p>
          </div>
          <Button
            onClick={handleLinkedInExtraction}
            disabled={isExtractingLinkedin}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isExtractingLinkedin ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Extracting from LinkedIn...
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4 mr-2" />
                Extract Job from LinkedIn
              </>
            )}
          </Button>
          <div className="text-xs text-blue-600">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Enhanced fetch MCP server scraping active</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults && (
        <Card>
          <CardHeader>
                            <CardTitle>Search Results ({Array.isArray(jobs) ? jobs.length : 0} jobs found)</CardTitle>
            {searchResults.query && (
              <p className="text-sm text-gray-600">
                Showing results for "{searchResults.query}"
                {searchResults.location && ` in ${searchResults.location}`}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {Array.isArray(jobs) && jobs.map((job) => (
                  <Card
                    key={job.id}
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500"
                    onClick={() => handleJobClick(job)}
                  >
                    <CardContent className="p-6">
                      {/* Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-xl text-blue-700 hover:text-blue-800 mb-2">
                            {job.title}
                          </h3>
                          <div className="flex items-center text-gray-700 mb-2">
                            <Building className="w-5 h-5 mr-2" />
                            <span className="font-semibold text-lg">
                              {job.company}
                            </span>
                            {job.employer_logo && (
                              <img
                                src={job.employer_logo}
                                alt={`${job.company} logo`}
                                className="w-6 h-6 ml-3 rounded"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <Badge
                            variant="outline"
                            className="bg-green-50 border-green-200 text-green-800"
                          >
                            {job.source}
                          </Badge>
                          {job.job_is_remote && (
                            <Badge
                              variant="secondary"
                              className="bg-purple-100 text-purple-800"
                            >
                              Remote
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Job Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                        <div className="flex items-center text-gray-600">
                          <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                          <span>
                            {job.job_city && job.job_state
                              ? `${job.job_city}, ${job.job_state}`
                              : job.location}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Clock className="w-4 h-4 mr-2 text-green-500" />
                          <span>
                            {job.job_posted_at_datetime_utc
                              ? new Date(
                                  job.job_posted_at_datetime_utc,
                                ).toLocaleDateString()
                              : job.posted}
                          </span>
                        </div>
                        {job.job_min_salary && job.job_max_salary ? (
                          <div className="flex items-center text-gray-600">
                            <DollarSign className="w-4 h-4 mr-2 text-yellow-500" />
                            <span className="font-semibold text-green-700">
                              ${Math.round(job.job_min_salary / 1000)}k-$
                              {Math.round(job.job_max_salary / 1000)}k
                              {job.job_salary_period &&
                                ` ${job.job_salary_period}`}
                            </span>
                          </div>
                        ) : (
                          job.salary && (
                            <div className="flex items-center text-gray-600">
                              <DollarSign className="w-4 h-4 mr-2 text-yellow-500" />
                              <span className="font-semibold text-green-700">
                                {job.salary}
                              </span>
                            </div>
                          )
                        )}
                      </div>

                      {/* Employment Types */}
                      <div className="flex items-center space-x-2 mb-4">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-700">
                          Employment:
                        </span>
                        {job.job_employment_types?.map((type, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs"
                          >
                            {type
                              .replace("FULLTIME", "Full-time")
                              .replace("PARTTIME", "Part-time")
                              .replace("CONTRACTOR", "Contract")}
                          </Badge>
                        )) || (
                          <Badge variant="secondary" className="text-xs">
                            {job.type}
                          </Badge>
                        )}
                      </div>

                      {/* Description */}
                      <div className="mb-4">
                        <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                          {job.description?.length > 200
                            ? `${job.description.substring(0, 200)}...`
                            : job.description}
                        </p>
                      </div>

                      {/* Job Highlights */}
                      {job.job_highlights && (
                        <div className="mb-4 space-y-3">
                          {job.job_highlights.Qualifications &&
                            job.job_highlights.Qualifications.length > 0 && (
                              <div>
                                <div className="flex items-center mb-2">
                                  <CheckCircle className="w-4 h-4 mr-2 text-blue-500" />
                                  <span className="text-sm font-semibold text-gray-700">
                                    Key Qualifications:
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {job.job_highlights.Qualifications.slice(
                                    0,
                                    3,
                                  ).map((qual, index) => (
                                    <Badge
                                      key={index}
                                      variant="outline"
                                      className="text-xs bg-blue-50 border-blue-200 text-blue-800"
                                    >
                                      {qual.length > 50
                                        ? `${qual.substring(0, 50)}...`
                                        : qual}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                          {job.job_highlights.Benefits &&
                            job.job_highlights.Benefits.length > 0 && (
                              <div>
                                <div className="flex items-center mb-2">
                                  <Award className="w-4 h-4 mr-2 text-green-500" />
                                  <span className="text-sm font-semibold text-gray-700">
                                    Benefits:
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {job.job_highlights.Benefits.slice(0, 2).map(
                                    (benefit, index) => (
                                      <Badge
                                        key={index}
                                        variant="outline"
                                        className="text-xs bg-green-50 border-green-200 text-green-800"
                                      >
                                        {benefit.length > 40
                                          ? `${benefit.substring(0, 40)}...`
                                          : benefit}
                                      </Badge>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      )}

                      {/* Action Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center space-x-2">
                          {job.tags?.slice(0, 2).map((tag, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center text-blue-600 font-medium text-sm">
                          <span className="mr-2">View Details</span>
                          <ExternalLink className="w-4 h-4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {(!Array.isArray(jobs) || jobs.length === 0) && !isSearching && searchResults && (
                  <div className="text-center py-8 text-gray-500">
                    <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No jobs found for your search criteria.</p>
                    <p className="text-sm">
                      Try adjusting your search terms or location.
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Live Data Status */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <h4 className="font-medium text-green-800">
                Live Job Search Active
              </h4>
              <p className="text-sm text-green-700 mt-1">
                Connected to Indeed, LinkedIn, Glassdoor and other major job
                boards via RapidAPI JSearch. Enhanced with fetch MCP server for
                direct LinkedIn scraping. Showing real-time job postings with
                full details, salary ranges, and company information.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
