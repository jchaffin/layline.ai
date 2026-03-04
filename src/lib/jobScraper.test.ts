import test from "node:test";
import assert from "node:assert/strict";

import {
  cleanText,
  extractJobTags,
  fetchViaScrapeless,
  parseLinkedInSearchResults,
  rankJobsByMatch,
  removeDuplicateJobs,
  type ScrapedJob,
} from "./jobScraper";

function makeJob(overrides: Partial<ScrapedJob> = {}): ScrapedJob {
  return {
    id: overrides.id ?? "id-1",
    title: overrides.title ?? "Software Engineer",
    company: overrides.company ?? "Acme",
    location: overrides.location ?? "San Francisco, CA",
    description: overrides.description ?? "Build distributed systems with TypeScript and AWS.",
    url: overrides.url ?? "https://example.com/job",
    posted: overrides.posted ?? "1 day ago",
    type: overrides.type ?? "Full-time",
    source: overrides.source ?? "LinkedIn",
    tags: overrides.tags ?? ["TypeScript", "AWS"],
    employer_logo: overrides.employer_logo ?? null,
    job_apply_link: overrides.job_apply_link ?? null,
    job_posted_at_datetime_utc: overrides.job_posted_at_datetime_utc ?? null,
    salary: overrides.salary ?? null,
    job_min_salary: overrides.job_min_salary ?? null,
    job_max_salary: overrides.job_max_salary ?? null,
    job_salary_period: overrides.job_salary_period ?? null,
    job_is_remote: overrides.job_is_remote ?? false,
    job_highlights: overrides.job_highlights ?? null,
    matchScore: overrides.matchScore,
    matchReasons: overrides.matchReasons,
    matchedSkills: overrides.matchedSkills,
    missingSkills: overrides.missingSkills,
  };
}

test("cleanText decodes entities and strips HTML", () => {
  const input = `Senior &amp; Staff <b>Engineer</b> &quot;Platform&quot;`;
  const output = cleanText(input);
  assert.equal(output, `Senior & Staff Engineer "Platform"`);
});

test("extractJobTags derives tags from title", () => {
  const tags = extractJobTags("Senior React TypeScript Engineer");
  assert.deepEqual(tags, ["Senior", "React", "TypeScript", "Engineer"]);
});

test("removeDuplicateJobs deduplicates by title + company", () => {
  const jobs = [
    makeJob({ id: "1", title: "Software Engineer", company: "Acme" }),
    makeJob({ id: "2", title: " Software Engineer ", company: "acme " }),
    makeJob({ id: "3", title: "Backend Engineer", company: "Acme" }),
  ];
  const deduped = removeDuplicateJobs(jobs);
  assert.equal(deduped.length, 2);
  assert.equal(deduped[0].id, "1");
  assert.equal(deduped[1].id, "3");
});

test("rankJobsByMatch prefers stronger query and location matches", () => {
  const ranked = rankJobsByMatch(
    [
      makeJob({
        id: "best",
        title: "Senior TypeScript Engineer",
        location: "Austin, TX",
        description: "TypeScript Node.js AWS architecture and APIs.",
        posted: "1 day ago",
        salary: "$150k-$180k",
      }),
      makeJob({
        id: "weaker",
        title: "Generalist Developer",
        location: "Remote",
        description: "Broad software tasks.",
        posted: "14 days ago",
      }),
    ],
    { query: "typescript engineer", location: "Austin, TX", jobType: "full-time" },
  );

  assert.equal(ranked[0].id, "best");
  assert.ok((ranked[0].matchScore ?? 0) > (ranked[1].matchScore ?? 0));
  assert.ok((ranked[0].matchReasons ?? []).length > 0);
});

test("parseLinkedInSearchResults parses LinkedIn-like cards", () => {
  const html = `
    <li class="base-card">
      <div>
        <div>
          <h3 class="base-search-card__title">Senior Frontend Engineer</h3>
          <h4 class="base-search-card__subtitle"><a>Acme Corp</a></h4>
          <span class="job-search-card__location">New York, NY</span>
          <a href="https://www.linkedin.com/jobs/view/1234567890">Open</a>
        </div>
      </div>
    </li>
  `;

  
  fetchViaScrapeless("https://www.linkedin.com/jobs/view/4363037429").then(html => {
    console.log(`results: ${html}`);
  });
  const jobs = parseLinkedInSearchResults(html, 5);
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].id, "linkedin-1234567890");
  assert.equal(jobs[0].title, "Senior Frontend Engineer");
  assert.ok(jobs[0].company.length > 0);
  assert.ok(jobs[0].url.includes("linkedin.com/jobs/view/1234567890"));
  assert.equal(jobs[0].source, "LinkedIn");
});

test("fetchViaScrapeless returns null when key missing", async () => {
  const originalKey = process.env.SCRAPELESS_API_KEY;
  delete process.env.SCRAPELESS_API_KEY;
  try {
    const result = await fetchViaScrapeless("https://example.com");
    assert.equal(result, null);
  } finally {
    if (originalKey) process.env.SCRAPELESS_API_KEY = originalKey;
  }
});

