import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  searchWithJSearchAPI,
  searchLinkedInJobs,
  removeDuplicateJobs,
  type ScrapedJob,
} from "@/lib/jobScraper";
import { JOB_QUERIES, TIER1_QUERIES, TOTAL_QUERIES } from "@/lib/jobQueries";

const BATCH_SIZE = 20;
const CONCURRENCY = 3;

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const started = Date.now();
  const deadline = started + 50_000; // stop 10s before Vercel's 60s timeout

  // Determine batch from time: every 20 minutes = a new batch index
  const minuteOfDay = new Date().getUTCHours() * 60 + new Date().getUTCMinutes();
  const invocationIndex = Math.floor(minuteOfDay / 20); // 0-71
  const totalBatches = Math.ceil(TOTAL_QUERIES / BATCH_SIZE);

  // Every 3rd invocation, run tier-1 priority queries instead of rotating
  const isTier1Run = invocationIndex % 3 === 0;

  let queries;
  if (isTier1Run) {
    const t1Batches = Math.ceil(TIER1_QUERIES.length / BATCH_SIZE);
    const t1Batch = invocationIndex % t1Batches;
    const start = t1Batch * BATCH_SIZE;
    queries = TIER1_QUERIES.slice(start, start + BATCH_SIZE);
  } else {
    const batchIndex = invocationIndex % totalBatches;
    const start = batchIndex * BATCH_SIZE;
    queries = JOB_QUERIES.slice(start, start + BATCH_SIZE);
  }

  if (queries.length === 0) {
    return NextResponse.json({ success: true, message: "No queries for this batch", jobs: 0 });
  }

  let totalUpserted = 0;
  let errors = 0;

  // Process in chunks of CONCURRENCY to avoid overwhelming APIs
  for (let i = 0; i < queries.length; i += CONCURRENCY) {
    if (Date.now() > deadline) break;

    const chunk = queries.slice(i, i + CONCURRENCY);

    const chunkResults = await Promise.allSettled(
      chunk.map(async ({ query, location }) => {
        const sources: Promise<ScrapedJob[]>[] = [];

        if (process.env.RAPIDAPI_KEY) {
          sources.push(searchWithJSearchAPI({ query, location, limit: 50 }).catch(() => []));
        }
        sources.push(searchLinkedInJobs({ query, location, limit: 50 }).catch(() => []));

        const results = await Promise.allSettled(sources);
        const all: ScrapedJob[] = [];
        for (const r of results) {
          if (r.status === "fulfilled") all.push(...r.value);
        }
        return { query, location, jobs: removeDuplicateJobs(all) };
      }),
    );

    for (const result of chunkResults) {
      if (result.status !== "fulfilled") {
        errors++;
        continue;
      }
      const { jobs } = result.value;

      for (const job of jobs) {
        if (Date.now() > deadline) break;
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
          totalUpserted++;
        } catch {
          errors++;
        }
      }
    }
  }

  // Prune listings older than 30 days (only on the first invocation of the day)
  let pruned = 0;
  if (invocationIndex === 0) {
    const result = await db.jobListing.deleteMany({
      where: { scrapedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    });
    pruned = result.count;
  }

  const elapsed = ((Date.now() - started) / 1000).toFixed(1);

  console.log(
    `[cron] batch=${invocationIndex} tier1=${isTier1Run} queries=${queries.length} upserted=${totalUpserted} errors=${errors} pruned=${pruned} elapsed=${elapsed}s`,
  );

  return NextResponse.json({
    success: true,
    batch: invocationIndex,
    tier1Run: isTier1Run,
    queriesProcessed: queries.length,
    totalQueries: TOTAL_QUERIES,
    upserted: totalUpserted,
    errors,
    pruned,
    elapsed: `${elapsed}s`,
  });
}
