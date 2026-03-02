import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  searchWithJSearchAPI,
  searchLinkedInJobs,
  removeDuplicateJobs,
  rankJobsByMatch,
  type ScrapedJob,
} from "@/lib/jobScraper";
import { computeMatchScore } from "@/lib/resumeJobMatch";
import type { ParsedResume } from "@/lib/schema";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const query = sp.get("q") || "";
    const location = sp.get("location") || "";
    const jobType = sp.get("jobtype") || "";
    const limit = parseInt(sp.get("limit") || "50");
    const dbOnly = sp.get("source") === "db";

    if (!query && !dbOnly) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 });
    }

    let jobs: ScrapedJob[];

    if (dbOnly) {
      const dbJobs = query
        ? await searchFromDB(query, location, jobType)
        : await recentFromDB(limit);
      jobs = query ? rankJobsByMatch(dbJobs, { query, location, jobType }) : dbJobs;
    } else {
      const [dbJobs, jsearchJobs, linkedInJobs] = await Promise.all([
        searchFromDB(query, location, jobType),
        process.env.RAPIDAPI_KEY
          ? searchWithJSearchAPI({ query, location, jobType, limit: 50 }).catch(() => [] as ScrapedJob[])
          : Promise.resolve([]),
        searchLinkedInJobs({ query, location, limit: 50 }).catch(() => [] as ScrapedJob[]),
      ]);

      console.log(`[Search] query="${query}" location="${location}" | DB: ${dbJobs.length}, JSearch: ${jsearchJobs.length}, LinkedIn: ${linkedInJobs.length}`);

      const liveJobs = [...jsearchJobs, ...linkedInJobs];
      const merged = removeDuplicateJobs([...liveJobs, ...dbJobs]);
      jobs = rankJobsByMatch(merged, { query, location, jobType });

      if (liveJobs.length > 0) {
        upsertJobsToDB(liveJobs).catch((e) => console.error("DB upsert:", e));
      }
    }

    return NextResponse.json({
      jobs: jobs.slice(0, limit),
      total: jobs.length,
      query,
      location,
    });
  } catch (error) {
    console.error("Job search error:", error);
    return NextResponse.json({ error: "Failed to search jobs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { q = "", location = "", resume, offset = 0, limit = 200 } = body as {
      q?: string;
      location?: string;
      resume?: ParsedResume;
      offset?: number;
      limit?: number;
    };

    const ALLOWED_SOURCES = ["Indeed", "LinkedIn", "ZipRecruiter"];

    let allJobs: ScrapedJob[];

    if (q) {
      const [dbJobs, jsearchJobs, linkedInJobs] = await Promise.all([
        searchFromDB(q, location, ""),
        process.env.RAPIDAPI_KEY
          ? searchWithJSearchAPI({ query: q, location, limit: 50 }).catch(() => [] as ScrapedJob[])
          : Promise.resolve([]),
        searchLinkedInJobs({ query: q, location, limit: 50 }).catch(() => [] as ScrapedJob[]),
      ]);
      const liveJobs = [...jsearchJobs, ...linkedInJobs];
      allJobs = removeDuplicateJobs([...liveJobs, ...dbJobs]);
      if (liveJobs.length > 0) {
        upsertJobsToDB(liveJobs).catch(() => {});
      }
    } else {
      allJobs = await allFromDB(ALLOWED_SOURCES);
    }

    if (resume) {
      allJobs = allJobs.map((j) => {
        const { score, reasons, matchedSkills, missingSkills } = computeMatchScore(resume, j);
        return { ...j, matchScore: score, matchReasons: reasons, matchedSkills, missingSkills };
      });
      allJobs.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    } else {
      allJobs = rankJobsByMatch(allJobs, { query: q, location });
    }

    const page = allJobs.slice(offset, offset + limit);

    return NextResponse.json({
      jobs: page,
      total: allJobs.length,
      offset,
      hasMore: offset + limit < allJobs.length,
    });
  } catch (error) {
    console.error("Job search POST error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}

async function allFromDB(sources: string[]): Promise<ScrapedJob[]> {
  try {
    const rows = await db.jobListing.findMany({
      where: { source: { in: sources } },
      orderBy: { scrapedAt: "desc" },
    });
    return rows.map(rowToJob);
  } catch {
    return [];
  }
}

function rowToJob(r: any): ScrapedJob {
  return {
    id: r.externalId,
    title: r.title,
    company: r.company,
    employer_logo: r.employerLogo,
    location: r.location || "",
    description: r.description,
    url: r.url,
    job_apply_link: r.applyLink,
    posted: r.postedAt?.toISOString() || "Recently posted",
    job_posted_at_datetime_utc: r.postedAt?.toISOString() || null,
    salary: r.salary,
    job_min_salary: r.minSalary,
    job_max_salary: r.maxSalary,
    job_salary_period: r.salaryPeriod,
    type: r.employmentType || "Full-time",
    job_is_remote: r.isRemote,
    job_highlights: r.highlights as ScrapedJob["job_highlights"],
    source: r.source,
    tags: r.tags,
  };
}

async function recentFromDB(limit: number): Promise<ScrapedJob[]> {
  try {
    const rows = await db.jobListing.findMany({
      where: {
        source: { in: ["Indeed", "LinkedIn", "ZipRecruiter"] },
      },
      orderBy: { scrapedAt: "desc" },
      take: limit,
    });
    return rows.map((r) => ({
      id: r.externalId,
      title: r.title,
      company: r.company,
      employer_logo: r.employerLogo,
      location: r.location || "",
      description: r.description,
      url: r.url,
      job_apply_link: r.applyLink,
      posted: r.postedAt?.toISOString() || "Recently posted",
      job_posted_at_datetime_utc: r.postedAt?.toISOString() || null,
      salary: r.salary,
      job_min_salary: r.minSalary,
      job_max_salary: r.maxSalary,
      job_salary_period: r.salaryPeriod,
      type: r.employmentType || "Full-time",
      job_is_remote: r.isRemote,
      job_highlights: r.highlights as ScrapedJob["job_highlights"],
      source: r.source,
      tags: r.tags,
    }));
  } catch {
    return [];
  }
}

async function searchFromDB(
  query: string,
  location: string,
  jobType: string,
): Promise<ScrapedJob[]> {
  try {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

    // Any term matching title OR company OR description (OR across terms for broader results)
    const where: any = {
      OR: terms.flatMap((t) => [
        { title: { contains: t, mode: "insensitive" } },
        { company: { contains: t, mode: "insensitive" } },
      ]),
    };

    if (location && location.toLowerCase() !== "remote") {
      where.AND = [
        {
          OR: [
            { location: { contains: location, mode: "insensitive" } },
            { isRemote: true },
          ],
        },
      ];
    }

    if (jobType && jobType !== "all") {
      const andClause = where.AND || [];
      andClause.push({ employmentType: { contains: jobType, mode: "insensitive" } });
      where.AND = andClause;
    }

    const rows = await db.jobListing.findMany({
      where,
      orderBy: { scrapedAt: "desc" },
    });

    return rows.map((r) => ({
      id: r.externalId,
      title: r.title,
      company: r.company,
      employer_logo: r.employerLogo,
      location: r.location || "",
      description: r.description,
      url: r.url,
      job_apply_link: r.applyLink,
      posted: r.postedAt?.toISOString() || "Recently posted",
      job_posted_at_datetime_utc: r.postedAt?.toISOString() || null,
      salary: r.salary,
      job_min_salary: r.minSalary,
      job_max_salary: r.maxSalary,
      job_salary_period: r.salaryPeriod,
      type: r.employmentType || "Full-time",
      job_is_remote: r.isRemote,
      job_highlights: r.highlights as ScrapedJob["job_highlights"],
      source: r.source,
      tags: r.tags,
    }));
  } catch (e) {
    console.error("DB search failed, falling back to live:", e);
    return [];
  }
}

async function upsertJobsToDB(jobs: ScrapedJob[]) {
  for (const job of jobs) {
    try {
      await db.jobListing.upsert({
        where: { externalId: job.id },
        update: {
          title: job.title,
          company: job.company,
          employerLogo: job.employer_logo,
          location: job.location,
          description: job.description?.slice(0, 10000) || "",
          url: job.url,
          applyLink: job.job_apply_link,
          postedAt: job.job_posted_at_datetime_utc ? new Date(job.job_posted_at_datetime_utc) : null,
          salary: job.salary,
          minSalary: job.job_min_salary,
          maxSalary: job.job_max_salary,
          salaryPeriod: job.job_salary_period,
          employmentType: job.type,
          isRemote: job.job_is_remote || false,
          source: job.source,
          highlights: job.job_highlights as any,
          tags: job.tags || [],
          scrapedAt: new Date(),
        },
        create: {
          externalId: job.id,
          title: job.title,
          company: job.company,
          employerLogo: job.employer_logo,
          location: job.location,
          description: job.description?.slice(0, 10000) || "",
          url: job.url,
          applyLink: job.job_apply_link,
          postedAt: job.job_posted_at_datetime_utc ? new Date(job.job_posted_at_datetime_utc) : null,
          salary: job.salary,
          minSalary: job.job_min_salary,
          maxSalary: job.job_max_salary,
          salaryPeriod: job.job_salary_period,
          employmentType: job.type,
          isRemote: job.job_is_remote || false,
          source: job.source,
          highlights: job.job_highlights as any,
          tags: job.tags || [],
        },
      });
    } catch (e) {
      console.error(`Upsert failed for ${job.id}:`, e);
    }
  }
}

export { upsertJobsToDB };
