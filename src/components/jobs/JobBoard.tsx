"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SimpleLocationInput } from "@/components/shared/simple-location-input";
import {
  Search,
  MapPin,
  ExternalLink,
  Building,
  Clock,
  Briefcase,
  Star,
  Target,
  Zap,
  Heart,
  Share2,
  Globe,
  DollarSign,
  Users,
  CheckCircle,
  Award,
  Settings,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  fitScore?: number;
  fitReasons?: string[];
}

interface JobBoardProps {
  onJobSelect?: (job: Job) => void;
  resumeData?: any; // ParsedResume data for fit calculation
}

export default function JobBoard({ onJobSelect, resumeData }: JobBoardProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [experienceLevel, setExperienceLevel] = useState<string>("mid");
  const [preferredSalary, setPreferredSalary] = useState<number>(100000);
  const [showFitScores, setShowFitScores] = useState(true);
  
  // Additional missing state variables
  const [datePosted, setDatePosted] = useState<string>("anytime");
  const [radius, setRadius] = useState<string>("25");
  const [salaryRange, setSalaryRange] = useState<string>("anysalary");
  const [sortBy, setSortBy] = useState<string>("fit");
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [userSkills, setUserSkills] = useState<string[]>([]);

  // Auto-search on component mount with default values
  useEffect(() => {
    if (searchQuery && location) {
      handleSearch();
    }
  }, []); // Only run on mount

  const calculateJobFit = useCallback(
    (job: Job): { score: number; reasons: string[] } => {
      let score = 0;
      const reasons: string[] = [];
      const maxScore = 100;

      // If we have resume data, use it for calculations
      const resumeSkills = resumeData
        ? [
            ...(resumeData.technicalSkills || []),
            ...(resumeData.softSkills || []),
            ...(resumeData.skills || []),
          ].filter(Boolean)
        : userSkills;

      const resumeExperience = resumeData?.experience || [];
      const totalYearsExp = resumeExperience.reduce(
        (total: number, exp: any) => {
          if (exp.startDate && exp.endDate) {
            const start = new Date(exp.startDate);
            const end = exp.current ? new Date() : new Date(exp.endDate);
            return (
              total +
              (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365)
            );
          }
          return total;
        },
        0,
      );

      // Skills matching (40% of score) - enhanced matching algorithm
      const skillsWeight = 40;
      if (resumeSkills.length > 0) {
        const jobText = `${job.title} ${job.description} ${job.job_highlights?.Qualifications?.join(" ") || ""} ${job.job_highlights?.Responsibilities?.join(" ") || ""}`.toLowerCase();
        
        // Enhanced skill matching with fuzzy matching and synonyms
        const exactMatches = resumeSkills.filter((skill: string) =>
          jobText.includes(skill.toLowerCase())
        );
        
        // Check for skill variations and synonyms
        const skillSynonyms: { [key: string]: string[] } = {
          'javascript': ['js', 'node', 'react', 'vue', 'angular'],
          'python': ['django', 'flask', 'fastapi', 'pandas', 'numpy'],
          'aws': ['amazon web services', 'ec2', 's3', 'lambda', 'cloudformation'],
          'docker': ['containerization', 'kubernetes', 'k8s'],
          'sql': ['mysql', 'postgresql', 'oracle', 'database'],
          'react': ['reactjs', 'jsx', 'hooks'],
          'typescript': ['ts', 'javascript'],
          'machine learning': ['ml', 'ai', 'artificial intelligence', 'deep learning'],
          'agile': ['scrum', 'kanban', 'sprint'],
          'leadership': ['management', 'team lead', 'mentor', 'supervise']
        };
        
        let relatedMatches = 0;
        resumeSkills.forEach((skill: string) => {
          const skillLower = skill.toLowerCase();
          const synonyms = skillSynonyms[skillLower] || [];
          const hasRelatedMatch = synonyms.some(synonym => jobText.includes(synonym));
          if (hasRelatedMatch && !exactMatches.some(exact => exact.toLowerCase() === skillLower)) {
            relatedMatches++;
          }
        });
        
        // Calculate weighted skill score
        const exactMatchScore = (exactMatches.length / resumeSkills.length) * 0.8;
        const relatedMatchScore = (relatedMatches / resumeSkills.length) * 0.3;
        const totalSkillScore = Math.min(1, exactMatchScore + relatedMatchScore) * skillsWeight;
        
        score += totalSkillScore;

        if (exactMatches.length > 0 || relatedMatches > 0) {
          reasons.push(
            `${exactMatches.length} exact + ${relatedMatches} related skills match`
          );
        }
      } else {
        score += skillsWeight * 0.3; // Lower default score
      }

      // Experience level matching (30% of score) - enhanced experience analysis
      const experienceWeight = 30;
      const titleLower = job.title.toLowerCase();
      const descriptionLower = job.description.toLowerCase();
      let experienceMatch = 0;

      // Enhanced experience requirements detection
      let requiredYears = 2; // default
      
      // Parse experience requirements from job description
      const expMatches = descriptionLower.match(/(\d+)[\+\-\s]*years?\s+(?:of\s+)?experience/i);
      if (expMatches) {
        requiredYears = parseInt(expMatches[1]);
      } else {
        // Fallback to title-based detection with more nuance
        if (titleLower.includes("senior") || titleLower.includes("sr")) {
          requiredYears = 5;
        } else if (titleLower.includes("lead") || titleLower.includes("principal") || titleLower.includes("staff")) {
          requiredYears = 7;
        } else if (titleLower.includes("director") || titleLower.includes("vp")) {
          requiredYears = 10;
        } else if (titleLower.includes("junior") || titleLower.includes("entry") || titleLower.includes("associate")) {
          requiredYears = 0;
        } else if (titleLower.includes("mid") || titleLower.includes("ii") || titleLower.includes("2")) {
          requiredYears = 3;
        }
      }

      // Calculate experience match with more sophisticated scoring
      if (totalYearsExp >= requiredYears) {
        // Perfect match for meeting requirements, bonus for exceeding
        const baseScore = 0.8;
        const bonusScore = Math.min(0.2, (totalYearsExp - requiredYears) / 10 * 0.2);
        experienceMatch = (baseScore + bonusScore) * experienceWeight;
        
        if (totalYearsExp > requiredYears * 1.5) {
          reasons.push(`${totalYearsExp.toFixed(1)} years experience (exceeds ${requiredYears} required)`);
        } else {
          reasons.push(`${totalYearsExp.toFixed(1)} years experience (meets ${requiredYears} required)`);
        }
      } else if (totalYearsExp > 0) {
        // Partial credit for some experience
        experienceMatch = (totalYearsExp / Math.max(requiredYears, 1)) * 0.7 * experienceWeight;
        reasons.push(`${totalYearsExp.toFixed(1)} years experience (needs ${requiredYears})`);
      } else {
        // No experience detected
        experienceMatch = 0.1 * experienceWeight; // Small base score
        reasons.push("Experience level unclear from resume");
      }

      score += experienceMatch;

      // Job title/role similarity (15% of score) - new factor based on resume
      const roleWeight = 15;
      if (resumeData?.experience?.length > 0) {
        const recentRoles = resumeData.experience.slice(0, 3); // Last 3 jobs
        const hasRelevantRole = recentRoles.some((exp: any) => {
          const expTitle = exp.role?.toLowerCase() || "";
          const jobTitle = job.title.toLowerCase();
          return (
            jobTitle.includes(expTitle.split(" ")[0]) ||
            expTitle.includes(jobTitle.split(" ")[0]) ||
            (expTitle.includes("engineer") && jobTitle.includes("engineer")) ||
            (expTitle.includes("developer") &&
              jobTitle.includes("developer")) ||
            (expTitle.includes("manager") && jobTitle.includes("manager"))
          );
        });

        if (hasRelevantRole) {
          score += roleWeight;
          reasons.push("Similar role experience");
        } else {
          score += roleWeight * 0.3;
        }
      } else {
        score += roleWeight * 0.5;
      }

      // Salary matching (10% of score) - reduced weight
      const salaryWeight = 10;
      if (job.job_min_salary && job.job_max_salary) {
        const avgSalary = (job.job_min_salary + job.job_max_salary) / 2;
        // Estimate expected salary based on experience
        const expectedSalary = Math.max(60000, 60000 + totalYearsExp * 15000);
        const salaryDiff =
          Math.abs(avgSalary - expectedSalary) / expectedSalary;
        const salaryMatch = Math.max(0, 1 - salaryDiff) * salaryWeight;
        score += salaryMatch;

        if (avgSalary >= expectedSalary * 0.9) {
          reasons.push("Competitive salary");
        }
      } else {
        score += salaryWeight * 0.3;
      }

      // Company/industry match (5% of score)
      const companyWeight = 5;
      if (resumeData?.experience?.length > 0) {
        const hasRelevantIndustry = resumeData.experience.some(
                      (exp: any) => {
              const expCompany = exp.company?.toLowerCase() || "";
            const jobCompany = job.company.toLowerCase();
            return (
              expCompany.includes(jobCompany.split(" ")[0]) ||
              jobCompany.includes(expCompany.split(" ")[0])
            );
          },
        );

        if (hasRelevantIndustry) {
          score += companyWeight;
          reasons.push("Industry experience");
        }
      }

      // Well-known companies still get a small boost
      const wellKnownCompanies = [
        "google",
        "microsoft",
        "apple",
        "amazon",
        "meta",
        "netflix",
        "tesla",
        "uber",
        "airbnb",
        "stripe",
        "databricks",
      ];
      if (
        wellKnownCompanies.some((company) =>
          job.company.toLowerCase().includes(company),
        )
      ) {
        score += companyWeight * 0.5;
        if (!reasons.includes("Industry experience")) {
          reasons.push("Top-tier company");
        }
      }

      return {
        score: Math.round(Math.min(score, maxScore)),
        reasons: reasons.slice(0, 3), // Limit to top 3 reasons
      };
    },
    [resumeData, userSkills],
  );

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search query required",
        description: "Please enter a job title or keywords.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        location: location,
        jobtype: jobType || "",
        limit: "25",
      });

      if (datePosted && datePosted !== "anytime") {
        params.append("date_posted", datePosted);
      }

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
      console.log('Jobs data:', data.jobs, 'Jobs array:', jobsArray);

      // Calculate fit scores for each job
      const jobsWithFit = jobsArray.map((job: Job) => {
        const fit = calculateJobFit(job);
        return {
          ...job,
          fitScore: fit.score,
          fitReasons: fit.reasons,
        };
      });

      setJobs(jobsWithFit);
      setFilteredJobs(jobsWithFit);
      setSearchResults(data);

      toast({
        title: "Search completed",
        description: `Found ${jobsWithFit.length} job opportunities with fit scores.`,
      });
    } catch (error) {
      console.error("Job search error:", error);

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
      setFilteredJobs([]);
      setSearchResults(null);
    } finally {
      setIsSearching(false);
    }
  }, [
    searchQuery,
    location,
    jobType,
    radius,
    datePosted,
    toast,
    calculateJobFit,
  ]);

  const handleFilter = useCallback(() => {
    let filtered = [...jobs];

    // Filter by salary range
    if (salaryRange && salaryRange !== "anysalary") {
      filtered = filtered.filter((job) => {
        if (!job.job_min_salary) return true;
        const minSalary = job.job_min_salary;
        switch (salaryRange) {
          case "0-50k":
            return minSalary < 50000;
          case "50k-100k":
            return minSalary >= 50000 && minSalary < 100000;
          case "100k-150k":
            return minSalary >= 100000 && minSalary < 150000;
          case "150k+":
            return minSalary >= 150000;
          default:
            return true;
        }
      });
    }

    // Sort jobs
    switch (sortBy) {
      case "fit":
        filtered.sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0));
        break;
      case "date":
        filtered.sort((a, b) => {
          const dateA = new Date(
            a.job_posted_at_datetime_utc || a.posted,
          ).getTime();
          const dateB = new Date(
            b.job_posted_at_datetime_utc || b.posted,
          ).getTime();
          return dateB - dateA;
        });
        break;
      case "salary":
        filtered.sort((a, b) => {
          const salaryA = a.job_min_salary || 0;
          const salaryB = b.job_min_salary || 0;
          return salaryB - salaryA;
        });
        break;
      case "company":
        filtered.sort((a, b) => a.company.localeCompare(b.company));
        break;
      default: // relevance
        break;
    }

    setFilteredJobs(filtered);
  }, [jobs, salaryRange, sortBy]);

  useEffect(() => {
    handleFilter();
  }, [handleFilter]);

  const toggleSaveJob = (jobId: string) => {
    const newSavedJobs = new Set(savedJobs);
    if (newSavedJobs.has(jobId)) {
      newSavedJobs.delete(jobId);
      toast({ title: "Job removed from saved jobs" });
    } else {
      newSavedJobs.add(jobId);
      toast({ title: "Job saved successfully" });
    }
    setSavedJobs(newSavedJobs);
  };

  const handleJobClick = (job: Job) => {
    if (onJobSelect) {
      onJobSelect(job);
    } else {
      window.open(job.job_apply_link || job.url, "_blank");
    }
  };

  const getFitScoreColor = (score: number) => {
    if (score >= 85) return "bg-green-100 text-green-800 border-green-200";
    if (score >= 70) return "bg-blue-100 text-blue-800 border-blue-200";
    if (score >= 55) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getFitScoreLabel = (score: number) => {
    if (score >= 85) return "Excellent Fit";
    if (score >= 70) return "Good Fit";
    if (score >= 55) return "Fair Fit";
    return "Poor Fit";
  };

  const JobCard = ({ job, isGrid = false }: { job: Job; isGrid?: boolean }) => (
    <Card
      className={`cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 ${
        job.fitScore && job.fitScore >= 85
          ? "border-l-green-500"
          : job.fitScore && job.fitScore >= 70
            ? "border-l-blue-500"
            : job.fitScore && job.fitScore >= 55
              ? "border-l-yellow-500"
              : "border-l-gray-500"
      } ${isGrid ? "h-full" : ""}`}
      onClick={() => handleJobClick(job)}
    >
      <CardContent className="p-6">
        {/* Fit Score Banner */}
        {showFitScores && job.fitScore !== undefined && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <Badge
                variant="outline"
                className={`${getFitScoreColor(job.fitScore)} font-semibold`}
              >
                <Target className="w-3 h-3 mr-1" />
                {job.fitScore}% {getFitScoreLabel(job.fitScore)}
              </Badge>
              <div className="flex items-center text-xs text-gray-500">
                <Zap className="w-3 h-3 mr-1" />
                Match Score
              </div>
            </div>
            {job.fitReasons && job.fitReasons.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {job.fitReasons.map((reason, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-xs bg-blue-50 text-blue-700"
                  >
                    {reason}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="font-bold text-xl text-blue-700 hover:text-blue-800 mb-2">
              {job.title}
            </h3>
            <div className="flex items-center text-gray-700 mb-2">
              <Building className="w-5 h-5 mr-2" />
              <span className="font-semibold text-lg">{job.company}</span>
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
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                toggleSaveJob(job.id);
              }}
              className="p-2"
            >
              <Heart
                className={`w-4 h-4 ${
                  savedJobs.has(job.id)
                    ? "fill-red-500 text-red-500"
                    : "text-gray-400"
                }`}
              />
            </Button>
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
                ? new Date(job.job_posted_at_datetime_utc).toLocaleDateString()
                : job.posted}
            </span>
          </div>
          {job.job_min_salary && job.job_max_salary ? (
            <div className="flex items-center text-gray-600">
              <DollarSign className="w-4 h-4 mr-2 text-yellow-500" />
              <span className="font-semibold text-green-700">
                ${Math.round(job.job_min_salary / 1000)}k-$
                {Math.round(job.job_max_salary / 1000)}k
                {job.job_salary_period && ` ${job.job_salary_period}`}
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
          <span className="text-sm font-medium text-gray-700">Employment:</span>
          {job.job_employment_types?.map((type, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
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
                    {job.job_highlights.Qualifications.slice(0, 3).map(
                      (qual, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs bg-blue-50 border-blue-200 text-blue-800"
                        >
                          {qual.length > 50
                            ? `${qual.substring(0, 50)}...`
                            : qual}
                        </Badge>
                      ),
                    )}
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
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigator.share?.({
                  title: job.title,
                  text: `${job.title} at ${job.company}`,
                  url: job.job_apply_link || job.url,
                });
              }}
              className="p-2"
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <div className="flex items-center text-blue-600 font-medium text-sm">
              <span className="mr-2">Apply Now</span>
              <ExternalLink className="w-4 h-4" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Simple Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Briefcase className="w-5 h-5 mr-2" />
            Job Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="search" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="search">Search</TabsTrigger>
              <TabsTrigger value="filters">Filters</TabsTrigger>
            </TabsList>
            
            <TabsContent value="search" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Job Title, Skills, or Company
                  </label>
                  <Input
                    placeholder="e.g. Software Engineer, React, Google"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 focus:bg-white dark:focus:bg-blue-900/20 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-green-700 dark:text-green-300">
                    Location
                  </label>
                  <SimpleLocationInput
                    value={location}
                    onChange={setLocation}
                    placeholder="City, State, or Remote"
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 focus:bg-white dark:focus:bg-green-900/20 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    Job Type
                  </label>
                  <Select value={jobType} onValueChange={setJobType}>
                    <SelectTrigger className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors">
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
                <div className="space-y-2">
                  <label className="text-sm font-medium text-orange-700 dark:text-orange-300">
                    Date Posted
                  </label>
                  <Select value={datePosted} onValueChange={setDatePosted}>
                    <SelectTrigger className="bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors">
                      <SelectValue placeholder="Any time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anytime">Any time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="3days">Last 3 days</SelectItem>
                      <SelectItem value="week">Last week</SelectItem>
                      <SelectItem value="month">Last month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-teal-700 dark:text-teal-300">
                    Radius
                  </label>
                  <Select value={radius} onValueChange={setRadius}>
                    <SelectTrigger className="bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors">
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
            </TabsContent>

            <TabsContent value="filters" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    Salary Range
                  </label>
                  <Select value={salaryRange} onValueChange={setSalaryRange}>
                    <SelectTrigger className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors">
                      <SelectValue placeholder="Any salary" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anysalary">Any salary</SelectItem>
                      <SelectItem value="0-50k">$0 - $50k</SelectItem>
                      <SelectItem value="50k-100k">$50k - $100k</SelectItem>
                      <SelectItem value="100k-150k">$100k - $150k</SelectItem>
                      <SelectItem value="150k+">$150k+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                    Sort by
                  </label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fit">Best Fit</SelectItem>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="date">Date Posted</SelectItem>
                      <SelectItem value="salary">Salary</SelectItem>
                      <SelectItem value="company">Company</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Job Fit Preferences */}
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">
                    Job Fit Analysis
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFitScores(!showFitScores)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    {showFitScores ? "Hide" : "Show"} Fit Scores
                  </Button>
                </div>

                {resumeData ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      <h5 className="font-medium text-green-800">
                        Resume-Based Matching Active
                      </h5>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-green-700">
                          Skills:
                        </span>
                        <p className="text-green-600">
                          {[
                            ...(resumeData.technicalSkills || []),
                            ...(resumeData.softSkills || []),
                            ...(resumeData.skills || []),
                          ]
                            .slice(0, 4)
                            .join(", ")}
                          {[
                            ...(resumeData.technicalSkills || []),
                            ...(resumeData.softSkills || []),
                            ...(resumeData.skills || []),
                          ].length > 4 && "..."}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-green-700">
                          Experience:
                        </span>
                        <p className="text-green-600">
                          {resumeData.experience?.length || 0} positions
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-green-700">
                          Latest Role:
                        </span>
                        <p className="text-green-600">
                          {resumeData.experience?.[0]?.role ||
                            "Not specified"}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-green-600 mt-2">
                      Job fit scores are calculated based on your uploaded
                      resume data including skills, experience, and work
                      history.
                    </p>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <Target className="w-5 h-5 text-blue-600 mr-2" />
                      <h5 className="font-medium text-blue-800">
                        Manual Fit Preferences
                      </h5>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-violet-700 dark:text-violet-300">
                          Experience Level
                        </label>
                        <Select
                          value={experienceLevel}
                          onValueChange={setExperienceLevel}
                        >
                          <SelectTrigger className="bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="entry">
                              Entry Level (0-2 years)
                            </SelectItem>
                            <SelectItem value="mid">
                              Mid Level (3-5 years)
                            </SelectItem>
                            <SelectItem value="senior">
                              Senior Level (5+ years)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-rose-700 dark:text-rose-300">
                          Preferred Salary
                        </label>
                        <Select
                          value={preferredSalary.toString()}
                          onValueChange={(value) =>
                            setPreferredSalary(parseInt(value))
                          }
                        >
                          <SelectTrigger className="bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="60000">$60,000</SelectItem>
                            <SelectItem value="80000">$80,000</SelectItem>
                            <SelectItem value="100000">$100,000</SelectItem>
                            <SelectItem value="120000">$120,000</SelectItem>
                            <SelectItem value="150000">$150,000</SelectItem>
                            <SelectItem value="200000">$200,000</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mb-3 space-y-2">
                      <label className="text-sm font-medium text-cyan-700 dark:text-cyan-300">
                        Your Key Skills (comma-separated)
                      </label>
                      <Input
                        placeholder="e.g. React, TypeScript, Node.js, AWS"
                        value={userSkills.join(", ")}
                        onChange={(e) =>
                          setUserSkills(
                            e.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean),
                          )
                        }
                        className="bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800 focus:bg-white dark:focus:bg-cyan-900/20 transition-colors"
                      />
                    </div>
                    <p className="text-xs text-blue-600">
                      Upload your resume in the Documents section for more
                      accurate fit scoring based on your actual experience and
                      skills.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

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

      {/* Results Header & Controls */}
      {searchResults && (
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg">
                  {Array.isArray(filteredJobs) ? filteredJobs.length : 0} Jobs Found
                </h3>
                <p className="text-sm text-gray-600">
                  {searchResults.query && `"${searchResults.query}"`}
                  {searchResults.location && ` in ${searchResults.location}`}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setViewMode(viewMode === "list" ? "grid" : "list")
                  }
                >
                  {viewMode === "list" ? "Grid View" : "List View"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFitScores(!showFitScores)}
                >
                  <Target className="w-4 h-4 mr-1" />
                  {showFitScores ? "Hide" : "Show"} Fit Scores
                </Button>
                <Badge variant="secondary">{savedJobs.size} Saved</Badge>
                {showFitScores && filteredJobs.length > 0 && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    Avg Fit:{" "}
                    {Math.round(
                      filteredJobs.reduce(
                        (sum, job) => sum + (job.fitScore || 0),
                        0,
                      ) / filteredJobs.length,
                    )}
                    %
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Job Results */}
      {searchResults && (
        <Card>
          <CardContent className="p-6">
            <ScrollArea className="h-[800px]">
              {viewMode === "list" ? (
                <div className="space-y-6">
                  {Array.isArray(filteredJobs) && filteredJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Array.isArray(filteredJobs) && filteredJobs.map((job) => (
                    <JobCard key={job.id} job={job} isGrid={true} />
                  ))}
                </div>
              )}

              {(!Array.isArray(filteredJobs) || filteredJobs.length === 0) && !isSearching && (
                <div className="text-center py-12 text-gray-500">
                  {searchResults ? (
                    <>
                      <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="font-medium text-lg mb-2">No jobs found</h3>
                      <p className="mb-4">Try adjusting your search criteria or filters.</p>
                      <div className="space-y-2 text-sm text-gray-400">
                        <p>• Try broader search terms</p>
                        <p>• Expand location radius</p>
                        <p>• Remove filters</p>
                        <p>• Check for typos</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Search className="w-16 h-16 mx-auto mb-4 text-blue-300" />
                      <h3 className="font-medium text-lg mb-2">Ready to find your next opportunity?</h3>
                      <p className="mb-4">Enter a job title or keywords to start searching.</p>
                      <div className="space-y-2 text-sm text-gray-400">
                        <p>• Search across thousands of job postings</p>
                        <p>• AI-powered match scoring</p>
                        <p>• Real-time results from multiple sources</p>
                      </div>
                    </>
                  )}
                </div>
              )}
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
              <h4 className="font-medium text-green-800 flex items-center">
                <Globe className="w-4 h-4 mr-2" />
                Live Job Board Active
              </h4>
              <p className="text-sm text-green-700 mt-1">
                Connected to Indeed, LinkedIn, Glassdoor and other major job
                boards. Real-time job postings with advanced filtering, sorting,
                and save functionality.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
