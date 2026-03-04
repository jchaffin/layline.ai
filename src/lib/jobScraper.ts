export interface SearchParams {
  query: string;
  location: string;
  radius?: number;
  jobType?: string;
  limit: number;
  page?: number;
}

export interface ScrapedJob {
  id: string;
  title: string;
  company: string;
  employer_logo?: string | null;
  location: string;
  description: string;
  url: string;
  job_apply_link?: string | null;
  posted: string;
  job_posted_at_datetime_utc?: string | null;
  salary?: string | null;
  job_min_salary?: number | null;
  job_max_salary?: number | null;
  job_salary_period?: string | null;
  type: string;
  job_is_remote?: boolean;
  job_highlights?: {
    Qualifications?: string[];
    Responsibilities?: string[];
    Benefits?: string[];
  } | null;
  source: string;
  tags: string[];
  matchScore?: number;
  matchReasons?: string[];
  matchedSkills?: string[];
  missingSkills?: string[];
}

// ─── Scrapeless helper ───

export async function fetchViaScrapeless(url: string): Promise<string | null> {
  const apiKey = process.env.SCRAPELESS_API_KEY;
  if (!apiKey) return null;

  const res = await fetch("https://api.scrapeless.com/api/v1/scraper/request", {
    method: "POST",
    headers: { "x-api-token": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ actor: "scraper.universal", input: { url, render: true } }),
  });

  if (res.status === 200) {
    const data = await res.json();
    return typeof data === "string" ? data : data?.html || data?.body || JSON.stringify(data);
  }

  if (res.status === 201) {
    const { taskId } = await res.json();
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const poll = await fetch(`https://api.scrapeless.com/api/v1/scraper/result/${taskId}`, {
        headers: { "x-api-token": apiKey, "Content-Type": "application/json" },
      });
      if (poll.status === 200) {
        const data = await poll.json();
        return typeof data === "string" ? data : data?.html || data?.body || JSON.stringify(data);
      }
    }
  }

  return null;
}

// ─── JSearch (RapidAPI) ───

export async function searchWithJSearchAPI(params: SearchParams): Promise<ScrapedJob[]> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) throw new Error("RAPIDAPI_KEY not configured");

  const queryWithLocation =
    params.location?.trim() ? `${params.query} in ${params.location}` : params.query;

  const sp = new URLSearchParams({
    query: queryWithLocation,
    page: String(params.page ?? 1),
    num_pages: "5",
    date_posted: "all",
    remote_jobs_only: "false",
    employment_types: (params.jobType || "FULLTIME").toUpperCase(),
    job_requirements: "under_3_years_experience,more_than_3_years_experience",
    country: "US",
  });

  if (params.location?.trim() && params.location.toLowerCase() !== "remote") {
    sp.append("location", params.location);
  }

  const res = await fetch(`https://jsearch.p.rapidapi.com/search?${sp}`, {
    headers: {
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
      Accept: "application/json",
    },
  });

  if (!res.ok) throw new Error(`JSearch ${res.status}`);
  const data = await res.json();
  if (!data.data || !Array.isArray(data.data)) return [];

  return data.data.slice(0, params.limit).map((job: any) => ({
    id: job.job_id || `jsearch-${Math.random().toString(36).slice(2, 11)}`,
    title: job.job_title || "No title",
    company: job.employer_name || "Company not specified",
    employer_logo: job.employer_logo || null,
    location:
      job.job_city && job.job_state
        ? `${job.job_city}, ${job.job_state}`
        : job.job_location || job.job_country || "",
    description: job.job_description || "",
    url:
      job.job_apply_link ||
      job.job_google_link ||
      `https://www.google.com/search?q=${encodeURIComponent((job.job_title || "") + " " + (job.employer_name || ""))}`,
    job_apply_link: job.job_apply_link || null,
    posted: job.job_posted_at_datetime_utc || "Recently posted",
    job_posted_at_datetime_utc: job.job_posted_at_datetime_utc || null,
    salary:
      job.job_min_salary && job.job_max_salary
        ? `$${Math.round(job.job_min_salary / 1000)}k-$${Math.round(job.job_max_salary / 1000)}k`
        : null,
    job_min_salary: job.job_min_salary || null,
    job_max_salary: job.job_max_salary || null,
    job_salary_period: job.job_salary_period || null,
    type: job.job_employment_type || "Full-time",
    job_is_remote: job.job_is_remote || false,
    job_highlights: job.job_highlights || null,
    source: job.job_publisher || "Indeed",
    tags: job.job_highlights?.Qualifications?.slice(0, 5) || [],
  }));
}

// ─── LinkedIn (centralized extraction; DOM/class names change often — Scrapeless helps) ───

/** Try to get job detail from LinkedIn job page HTML. Prefers JSON-LD, then DOM regex fallback. */
export function extractLinkedInJobDetail(html: string): {
  description: string | null;
  salary?: string;
  type?: string;
  location?: string;
  employer_logo?: string | null;
} {
  const out: {
    description: string | null;
    salary?: string;
    type?: string;
    location?: string;
    employer_logo?: string | null;
  } = {
    description: null,
  };

  try {
    const ldBlocks = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || [];
    for (const block of ldBlocks) {
      const raw = block.replace(/<\/?script[^>]*>/gi, "").trim();
      const ld = JSON.parse(raw);
      const items = Array.isArray(ld) ? ld : ld["@graph"] ? (Array.isArray(ld["@graph"]) ? ld["@graph"] : [ld["@graph"]]) : [ld];
      for (const item of items) {
        if (item["@type"] === "JobPosting") {
          if (item.description) {
            const desc = typeof item.description === "string" ? item.description : "";
            out.description = htmlToStructuredText(desc).trim() || null;
          }
          if (item.jobLocation?.address?.addressLocality) out.location = cleanText(item.jobLocation.address.addressLocality);
          if (item.employmentType) out.type = Array.isArray(item.employmentType) ? item.employmentType[0] : item.employmentType;
          const org = item.hiringOrganization;
          if (org && typeof org === "object" && (org.logo || org.image)) {
            const logoUrl = typeof org.logo === "string" ? org.logo : typeof org.image === "string" ? org.image : org.logo?.url ?? org.image?.url;
            if (logoUrl && typeof logoUrl === "string") out.employer_logo = logoUrl;
          }
          if (out.description && out.employer_logo) return out;
          if (out.description) break;
        }
      }
    }
  } catch {}

  const descMatch = html.match(
    /class="show-more-less-html__markup[^"]*"[^>]*>([\s\S]*?)<\/div>/,
  );
  if (descMatch?.[1]) {
    out.description = htmlToStructuredText(descMatch[1]).trim() || null;
  }
  const salaryMatch = html.match(/class="salary[^"]*"[^>]*>([^<]+)/i);
  if (salaryMatch?.[1]) out.salary = cleanText(salaryMatch[1]);
  const typeMatch = html.match(
    /class="description__job-criteria-text[^"]*"[^>]*>\s*(Full-time|Part-time|Contract|Internship|Temporary)/i,
  );
  if (typeMatch?.[1]) out.type = typeMatch[1];

  // Company logo extraction chain — try multiple sources
  if (!out.employer_logo) {
    // 1. img src with "company-logo" in URL path
    const companyLogoMatch = html.match(/src=["'](https?:\/\/media\.licdn\.com\/dms\/image[^"']*company-logo[^"']+)["']/i);
    if (companyLogoMatch?.[1]) {
      out.employer_logo = companyLogoMatch[1].replace(/&amp;/g, "&");
    }
  }
  if (!out.employer_logo) {
    // 2. data-delayed-url with "company-logo" (LinkedIn lazy-loads some images)
    const delayedLogo = html.match(/data-delayed-url=["'](https?:\/\/media\.licdn\.com[^"']*company-logo[^"']+)["']/i);
    if (delayedLogo?.[1]) {
      out.employer_logo = delayedLogo[1].replace(/&amp;/g, "&");
    }
  }
  if (!out.employer_logo) {
    // 3. og:image meta tag — LinkedIn guest pages almost always include this
    const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["'](https?:\/\/[^"']+)["']/i)
      || html.match(/<meta[^>]*content=["'](https?:\/\/[^"']+)["'][^>]*property=["']og:image["']/i);
    if (ogImage?.[1]) {
      out.employer_logo = ogImage[1].replace(/&amp;/g, "&");
    }
  }
  if (!out.employer_logo) {
    // 4. Any media.licdn.com image
    const anyLinkedInImg = html.match(/src=["'](https?:\/\/(?:media\.licdn\.com|cdn\.licdn\.com)[^"']+)["']/i);
    if (anyLinkedInImg?.[1]) {
      out.employer_logo = anyLinkedInImg[1].replace(/&amp;/g, "&");
    }
  }

  console.log(`[extractLinkedInJobDetail] description: ${out.description ? out.description.length + ' chars' : 'null'}, logo: ${out.employer_logo || 'null'}`);

  return out;
}

export async function searchLinkedInJobs(params: SearchParams): Promise<ScrapedJob[]> {
  try {
    const allJobs: ScrapedJob[] = [];
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Cache-Control": "no-cache",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
    };

    const useScrapeless = !!process.env.SCRAPELESS_API_KEY;
    const pages = Math.ceil(Math.min(params.limit, 100) / 10);

    for (let page = 0; page < pages; page++) {
      const guestUrl = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(params.query)}&location=${encodeURIComponent(params.location || "")}&start=${page * 10}`;

      let html: string | null = null;

      if (useScrapeless) {
        html = await fetchViaScrapeless(guestUrl);
        if (html) {
          console.log(`LinkedIn via Scrapeless page ${page}: ${html.length} chars`);
        }
      }

      if (!html) {
        const res = await fetch(guestUrl, { headers });
        console.log(`LinkedIn direct page ${page}: status ${res.status}`);
        if (!res.ok) break;
        html = await res.text();
      }

      if (!html || html.length < 100) break;

      const parsed = parseLinkedInGuestResults(html);
      allJobs.push(...parsed);
      if (parsed.length < 10) break;
    }

    const capped = allJobs.slice(0, params.limit);

    let enriched = 0;
    const CONCURRENT = 5;
    for (let i = 0; i < capped.length; i += CONCURRENT) {
      const batch = capped.slice(i, i + CONCURRENT);
      const details = await Promise.allSettled(
        batch.map((j) => fetchLinkedInDescription(j.url, headers)),
      );
      for (let k = 0; k < details.length; k++) {
        const r = details[k];
        if (r.status === "fulfilled" && r.value) {
          capped[i + k].description = r.value.description;
          if (r.value.salary) capped[i + k].salary = r.value.salary;
          if (r.value.type) capped[i + k].type = r.value.type;
          if (r.value.employer_logo) capped[i + k].employer_logo = r.value.employer_logo;
          enriched++;
        }
      }
    }

    console.log(`LinkedIn total: ${capped.length} jobs, enriched: ${enriched}`);
    return capped;
  } catch (e) {
    console.error("LinkedIn search error:", e);
    return [];
  }
}

async function fetchLinkedInDescription(
  url: string,
  headers: Record<string, string>,
): Promise<{ description: string; salary?: string; type?: string; employer_logo?: string | null } | null> {
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    const html = await res.text();
    const detail = extractLinkedInJobDetail(html);
    if (!detail.description || detail.description.length < 20) return null;
    return {
      description: detail.description.slice(0, 5000),
      salary: detail.salary,
      type: detail.type,
      employer_logo: detail.employer_logo ?? null,
    };
  } catch {
    return null;
  }
}

function parseLinkedInGuestResults(html: string): ScrapedJob[] {
  const jobs: ScrapedJob[] = [];
  const cards = html.match(/class="[^"]*base-card[^"]*"[\s\S]*?<\/li>/gi) || [];

  for (const card of cards) {
    const urnMatch = card.match(/data-entity-urn="urn:li:jobPosting:(\d+)"/);
    const linkMatch = card.match(/href="https:\/\/www\.linkedin\.com\/jobs\/view\/[^"]*?(\d{8,})[^"]*"/);
    const jid = urnMatch?.[1] || linkMatch?.[1];
    if (!jid) continue;

    const title =
      card.match(/base-search-card__title[^>]*>([^<]+)/i)?.[1]?.trim() ||
      card.match(/<h3[^>]*>([^<]+)/i)?.[1]?.trim();
    if (!title) continue;

    const company =
      card.match(/base-search-card__subtitle[^>]*>[\s\S]*?<a[^>]*>([^<]+)/i)?.[1]?.trim() ||
      card.match(/<h4[^>]*>([^<]+)/i)?.[1]?.trim();

    const loc = card.match(/job-search-card__location[^>]*>([^<]+)/i)?.[1]?.trim();

    const timeMatch = card.match(/<time[^>]*datetime="([^"]+)"/i);
    const postedAt = timeMatch?.[1] || null;

    const urlMatch = card.match(/href="(https:\/\/www\.linkedin\.com\/jobs\/view\/[^"]+)"/i);
    const jobUrl = urlMatch?.[1]?.replace(/&amp;/g, "&") || `https://www.linkedin.com/jobs/view/${jid}`;

    let employer_logo: string | null = null;
    const logoImgMatch = card.match(/src="(https?:\/\/(?:media\.licdn\.com|cdn\.licdn\.com)[^"]+)"/i);
    if (logoImgMatch?.[1]) employer_logo = logoImgMatch[1];

    jobs.push({
      id: `linkedin-${jid}`,
      title: cleanText(title),
      company: company ? cleanText(company) : "Company on LinkedIn",
      location: loc ? cleanText(loc) : "",
      description: "View full details on LinkedIn.",
      url: jobUrl,
      posted: postedAt || "Recently posted",
      job_posted_at_datetime_utc: postedAt,
      salary: null,
      type: "Full-time",
      source: "LinkedIn",
      tags: extractJobTags(title),
      job_is_remote: loc ? loc.toLowerCase().includes("remote") : false,
      employer_logo: employer_logo ?? undefined,
    });
  }

  return jobs;
}

export function parseLinkedInSearchResults(html: string, limit: number): ScrapedJob[] {
  const jobs: ScrapedJob[] = [];
  const seenIds = new Set<string>();

  try {
    // Strategy 1: JSON-LD
    const ldBlocks = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || [];
    for (const block of ldBlocks) {
      try {
        const ld = JSON.parse(block.replace(/<\/?script[^>]*>/gi, ""));
        const items = Array.isArray(ld) ? ld : ld["@graph"] || [ld];
        for (const item of items) {
          if (item["@type"] === "JobPosting" && item.title) {
            const idMatch = (item.url || "").match(/\/jobs\/view\/(\d+)/);
            const jid = idMatch ? idMatch[1] : String(Date.now());
            if (seenIds.has(jid)) continue;
            seenIds.add(jid);
            jobs.push({
              id: `linkedin-${jid}`,
              title: cleanText(item.title),
              company: cleanText(typeof item.hiringOrganization === "object" ? item.hiringOrganization.name : item.hiringOrganization || ""),
              location: cleanText(typeof item.jobLocation === "object" ? item.jobLocation.address?.addressLocality || "" : ""),
              description: cleanText((item.description || "").slice(0, 500)),
              url: item.url || `https://www.linkedin.com/jobs/view/${jid}`,
              posted: item.datePosted || "Recently posted",
              salary: null,
              type: item.employmentType || "Full-time",
              source: "LinkedIn",
              tags: extractJobTags(item.title),
              job_is_remote: (item.jobLocationType || "").toLowerCase().includes("remote"),
            });
          }
        }
      } catch {}
    }

    // Strategy 2: Card-level CSS selectors
    if (jobs.length < 5) {
      const patterns = [
        /class="[^"]*base-card[^"]*"[\s\S]*?<\/div>\s*<\/div>\s*<\/li>/gi,
        /class="[^"]*job-search-card[^"]*"[\s\S]*?<\/div>\s*<\/li>/gi,
      ];
      for (const pat of patterns) {
        for (const card of html.match(pat) || []) {
          const idMatch = card.match(/\/jobs\/view\/(\d+)/);
          if (!idMatch) continue;
          const jid = idMatch[1];
          if (seenIds.has(jid)) continue;
          seenIds.add(jid);

          const title =
            card.match(/class="[^"]*base-search-card__title[^"]*"[^>]*>([^<]+)/i)?.[1] ||
            card.match(/<h3[^>]*>([^<]+)/i)?.[1] ||
            card.match(/aria-label="([^"]+)"/i)?.[1];
          if (!title) continue;

          const company =
            card.match(/class="[^"]*base-search-card__subtitle[^"]*"[^>]*>[\s\S]*?<a[^>]*>([^<]+)/i)?.[1] ||
            card.match(/<h4[^>]*>([^<]+)/i)?.[1];

          const loc =
            card.match(/class="[^"]*job-search-card__location[^"]*"[^>]*>([^<]+)/i)?.[1] ||
            card.match(/class="[^"]*base-search-card__metadata[^"]*"[^>]*>([^<]+)/i)?.[1];

          jobs.push({
            id: `linkedin-${jid}`,
            title: cleanText(title),
            company: company ? cleanText(company) : "Company on LinkedIn",
            location: loc ? cleanText(loc) : "",
            description: "View full details on LinkedIn.",
            url: `https://www.linkedin.com/jobs/view/${jid}`,
            posted: "Recently posted",
            salary: null,
            type: "Full-time",
            source: "LinkedIn",
            tags: extractJobTags(title),
            job_is_remote: loc ? loc.toLowerCase().includes("remote") : false,
          });
        }
        if (jobs.length >= 5) break;
      }
    }

    // Strategy 3: Link scraping fallback
    if (jobs.length < 3) {
      const ids = [...new Set(Array.from(html.matchAll(/\/jobs\/view\/(\d+)/g)).map((m) => m[1]))];
      for (const jid of ids) {
        if (seenIds.has(jid) || jobs.length >= limit) continue;
        seenIds.add(jid);
        const idx = html.indexOf(`/jobs/view/${jid}`);
        const chunk = html.slice(Math.max(0, idx - 1000), idx + 1000);
        const t = chunk.match(/class="[^"]*title[^"]*"[^>]*>([^<]{3,80})/i)?.[1] || chunk.match(/<h3[^>]*>([^<]{3,80})/i)?.[1];
        const c = chunk.match(/class="[^"]*subtitle[^"]*"[^>]*>([^<]{2,60})/i)?.[1];
        jobs.push({
          id: `linkedin-${jid}`,
          title: t ? cleanText(t) : `LinkedIn Job #${jid}`,
          company: c ? cleanText(c) : "Company on LinkedIn",
          location: "",
          description: "View full details on LinkedIn.",
          url: `https://www.linkedin.com/jobs/view/${jid}`,
          posted: "Recently posted",
          salary: null,
          type: "Full-time",
          source: "LinkedIn",
          tags: [],
          job_is_remote: false,
        });
      }
    }
  } catch (e) {
    console.error("LinkedIn parse error:", e);
  }

  return jobs.slice(0, limit);
}

// ─── Helpers ───

export function cleanText(text: string): string {
  return text
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#x2F;/g, "/")
    .replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Converts HTML to plain text while preserving paragraph/list structure.
 * Block elements (p, div, li, br, headings, etc.) become newlines so scraped
 * job descriptions stay readable instead of one run-on line.
 */
export function htmlToStructuredText(html: string): string {
  let out = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  out = out
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/td>/gi, " ")
    .replace(/<\/th>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n");
  out = out
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/<[^>]*>/g, " ");
  out = out
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
  return out;
}

/** Derive tags from job title: meaningful words (2+ chars), deduped, limited. */
export function extractJobTags(title: string): string[] {
  const tokens = title
    .replace(/[^\w\s.-]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
  return [...new Set(tokens)].slice(0, 8);
}

export function removeDuplicateJobs(jobs: ScrapedJob[]): ScrapedJob[] {
  const seen = new Set<string>();
  return jobs.filter((j) => {
    const key = `${(j.title || "").toLowerCase().trim()}|${(j.company || "").toLowerCase().trim()}`;
    if (seen.has(key) || !j.title || !j.company) return false;
    seen.add(key);
    return true;
  });
}

export function rankJobsByMatch(
  jobs: ScrapedJob[],
  params: { query: string; location: string; jobType?: string },
): ScrapedJob[] {
  const { query, location, jobType } = params;
  const qTerms = query.toLowerCase().split(" ");

  return jobs
    .map((job) => {
      let score = 0;
      const reasons: string[] = [];
      const text = `${job.title} ${job.description} ${job.company}`.toLowerCase();

      let qHits = 0;
      for (const t of qTerms) if (text.includes(t)) qHits++;
      score += (qHits / qTerms.length) * 40;
      if (qHits > 0) reasons.push(`${qHits}/${qTerms.length} search terms match`);

      if (!location || location.toLowerCase() === "remote") {
        score += 25;
      } else {
        const jl = (job.location || "").toLowerCase();
        const sl = location.toLowerCase();
        if (jl.includes(sl) || sl.includes(jl)) { score += 25; reasons.push("Location matches"); }
        else if (jl.includes("remote") || job.job_is_remote) { score += 22; reasons.push("Remote available"); }
        else score += 8;
      }

      if (!jobType || jobType === "all") score += 15;
      else {
        const jt = (job.type || "").toLowerCase();
        if (jt.includes(jobType.toLowerCase())) { score += 15; reasons.push("Job type matches"); }
        else score += 7;
      }

      if (job.description && job.description.length > 500) { score += 1; }
      if (job.salary) { score += 2; reasons.push("Salary listed"); }

      const posted = (job.posted || "").toLowerCase();
      if (posted.includes("today") || posted.includes("1 day")) score += 10;
      else if (posted.includes("2 day") || posted.includes("3 day")) score += 8;
      else score += 4;

      return { ...job, matchScore: Math.min(Math.round(score), 100), matchReasons: reasons.slice(0, 4) };
    })
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
}
