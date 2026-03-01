import { NextRequest, NextResponse } from 'next/server';

// Enhanced LinkedIn job scraper using fetch MCP server approach
export async function POST(request: NextRequest) {
  try {
    const { url, jobTitle } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    console.log('Extracting LinkedIn job from URL:', url);
    console.log('Looking for job title:', jobTitle);

    // Extract job ID from LinkedIn URL patterns
    const jobIdMatch = url.match(/jobs\/view\/(\d+)/) || 
                      url.match(/currentJobId=(\d+)/) ||
                      url.match(/job\/(\d+)/);
    
    if (!jobIdMatch) {
      return NextResponse.json(
        { error: 'Could not extract job ID from LinkedIn URL. Please ensure the URL is a valid LinkedIn job posting.' },
        { status: 400 }
      );
    }

    const jobId = jobIdMatch[1];
    console.log('Extracted job ID:', jobId);

    // Implement fetch MCP server approach for LinkedIn scraping
    const scrapedData = await scrapeLinkedInJob(url, jobId);

    if (!scrapedData.success) {
      return NextResponse.json(
        { error: scrapedData.error || 'Failed to scrape LinkedIn job data' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      job: scrapedData.job,
      metadata: {
        extractedAt: new Date().toISOString(),
        extractionMethod: 'fetch-mcp-server',
        jobId: jobId
      }
    });

  } catch (error) {
    console.error('LinkedIn job extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract job from LinkedIn' },
      { status: 500 }
    );
  }
}

// Fetch MCP server implementation for LinkedIn job scraping
async function scrapeLinkedInJob(url: string, jobId: string) {
  try {
    console.log('Starting fetch MCP server scraping for:', url);

    // Configure headers to mimic a real browser request
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0'
    };

    // Fetch the LinkedIn job page using fetch MCP server approach
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
      redirect: 'follow'
    });

    if (!response.ok) {
      console.error('Failed to fetch LinkedIn page:', response.status, response.statusText);
      return {
        success: false,
        error: `Failed to fetch LinkedIn page: ${response.status} ${response.statusText}`
      };
    }

    const htmlContent = await response.text();
    console.log('Successfully fetched LinkedIn page, content length:', htmlContent.length);

    // Parse the HTML content to extract job data
    const extractedData = parseLinkedInJobHTML(htmlContent, jobId, url);

    if (!extractedData.title || extractedData.title === 'Job Title Not Found') {
      return {
        success: false,
        error: 'Could not extract job data from LinkedIn page. The page may require authentication or the job may no longer be available.'
      };
    }

    return {
      success: true,
      job: extractedData
    };

  } catch (error) {
    console.error('Error in scrapeLinkedInJob:', error);
    return {
      success: false,
      error: `Scraping failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

// Enhanced HTML parser for LinkedIn job pages
function parseLinkedInJobHTML(html: string, jobId: string, originalUrl: string) {
  console.log('Parsing LinkedIn HTML content...');

  // Enhanced selectors for LinkedIn job pages
  const selectors = {
    title: [
      /"jobTitle":"([^"]+)"/,
      /<h1[^>]*class="[^"]*job-title[^"]*"[^>]*>([^<]+)</i,
      /<title[^>]*>([^|]+) \|/i,
      /"jobTitle":\s*"([^"]+)"/,
      /class="job-details-jobs-unified-top-card__job-title"[^>]*>\s*<[^>]*>\s*([^<]+)/i
    ],
    company: [
      /"companyName":"([^"]+)"/,
      /<a[^>]*class="[^"]*company-name[^"]*"[^>]*>([^<]+)</i,
      /"companyName":\s*"([^"]+)"/,
      /class="job-details-jobs-unified-top-card__company-name"[^>]*>\s*<[^>]*>\s*([^<]+)/i,
      /<span[^>]*class="[^"]*company[^"]*"[^>]*>([^<]+)</i
    ],
    location: [
      /"jobLocation":"([^"]+)"/,
      /<span[^>]*class="[^"]*job-location[^"]*"[^>]*>([^<]+)</i,
      /"jobLocation":\s*"([^"]+)"/,
      /class="job-details-jobs-unified-top-card__bullet"[^>]*>([^<]+)</i
    ],
    description: [
      /"description":"([^"]+)"/,
      /<div[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<section[^>]*class="[^"]*job-description[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
      /class="job-details-jobs-unified-top-card__job-description"[^>]*>([\s\S]*?)<\/div>/i
    ],
    employmentType: [
      /"employmentType":"([^"]+)"/,
      /<span[^>]*class="[^"]*employment-type[^"]*"[^>]*>([^<]+)</i
    ],
    seniority: [
      /"seniorityLevel":"([^"]+)"/,
      /<span[^>]*class="[^"]*seniority[^"]*"[^>]*>([^<]+)</i
    ]
  };

  // Extract data using multiple selector strategies
  const extractWithSelectors = (selectorArray: RegExp[], defaultValue: string = 'Not Found') => {
    for (const selector of selectorArray) {
      const match = html.match(selector);
      if (match && match[1]) {
        let result = match[1].trim();
        // Decode HTML entities and clean up
        result = result
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#x27;/g, "'")
          .replace(/&#x2F;/g, '/')
          .replace(/\\u[\dA-F]{4}/gi, (match) => {
            return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
          })
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (result && result !== '' && result.length > 0) {
          return result;
        }
      }
    }
    return defaultValue;
  };

  const title = extractWithSelectors(selectors.title, 'Job Title Not Found');
  const company = extractWithSelectors(selectors.company, 'Company Not Found');
  const location = extractWithSelectors(selectors.location, 'Location Not Found');
  const employmentType = extractWithSelectors(selectors.employmentType, 'Full-time');
  const seniority = extractWithSelectors(selectors.seniority, '');

  // Extract and clean description
  let description = extractWithSelectors(selectors.description, '');
  if (!description || description === 'Not Found') {
    // Fallback: extract text content from likely description areas
    const descriptionFallback = html.match(/<div[^>]*class="[^"]*show-more-less-html__markup[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (descriptionFallback) {
      description = descriptionFallback[1]
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    } else {
      description = 'Job description not available. Please visit the LinkedIn posting for complete details.';
    }
  }

  // Limit description length for practical use
  if (description.length > 2000) {
    description = description.substring(0, 2000) + '... [View full description on LinkedIn]';
  }

  console.log('Extracted job data:', { title, company, location, employmentType, seniority });

  return {
    id: jobId,
    title,
    company,
    location,
    description,
    url: originalUrl,
    source: 'LinkedIn',
    type: employmentType,
    seniority: seniority || undefined,
    posted: 'Recently posted',
    extractedAt: new Date().toISOString(),
    job_employment_type: employmentType,
    job_is_remote: location.toLowerCase().includes('remote'),
    tags: extractSkillsFromDescription(description)
  };
}

// Extract relevant skills and keywords from job description
function extractSkillsFromDescription(description: string): string[] {
  if (!description) return [];

  const commonSkills = [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'AWS', 'Docker',
    'Kubernetes', 'SQL', 'MongoDB', 'GraphQL', 'REST', 'API', 'Microservices',
    'Machine Learning', 'AI', 'Data Science', 'Analytics', 'Leadership', 'Agile',
    'Scrum', 'Git', 'CI/CD', 'DevOps', 'Cloud', 'Azure', 'GCP', 'HTML', 'CSS'
  ];

  const foundSkills = commonSkills.filter(skill => 
    description.toLowerCase().includes(skill.toLowerCase())
  );

  return foundSkills.slice(0, 10); // Limit to top 10 skills
}

function extractJobData(html: string, jobId: string) {
  // Extract job title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i) || 
                    html.match(/<h1[^>]*>([^<]+)<\/h1>/i) ||
                    html.match(/job-title[^>]*>([^<]+)</i);
  
  // Extract company name
  const companyMatch = html.match(/company-name[^>]*>([^<]+)</i) ||
                      html.match(/employer-name[^>]*>([^<]+)</i) ||
                      html.match(/<h2[^>]*>([^<]+)<\/h2>/i);
  
  // Extract location
  const locationMatch = html.match(/job-location[^>]*>([^<]+)</i) ||
                       html.match(/location[^>]*>([^<]+)</i);
  
  // Extract job description
  const descriptionMatch = html.match(/job-description[^>]*>([\s\S]*?)<\/div>/i) ||
                          html.match(/description[^>]*>([\s\S]*?)<\/div>/i) ||
                          html.match(/<div[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

  const title = titleMatch ? titleMatch[1].trim() : 'Job Title Not Found';
  const company = companyMatch ? companyMatch[1].trim() : 'Company Not Found';
  const location = locationMatch ? locationMatch[1].trim() : 'Location Not Found';
  const description = descriptionMatch ? 
    descriptionMatch[1]
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() : 
    'Job description not available. Please visit the LinkedIn posting for full details.';

  return {
    id: jobId,
    title,
    company,
    location,
    description,
    url: `https://www.linkedin.com/jobs/view/${jobId}`,
    source: 'LinkedIn',
    extractedAt: new Date().toISOString()
  };
}

function extractFromSearchPage(html: string, jobId: string) {
  // Extract job information from search page
  const titleMatch = html.match(/<h3[^>]*>([^<]+)<\/h3>/i);
  const companyMatch = html.match(/<h4[^>]*>([^<]+)<\/h4>/i);
  const locationMatch = html.match(/([A-Za-z\s,]+),\s*[A-Z]{2}\s*\d+\s*hours?\s*ago/i);

  const title = titleMatch ? titleMatch[1].trim() : 'Job Title Not Found';
  const company = companyMatch ? companyMatch[1].trim() : 'Company Not Found';
  const location = locationMatch ? locationMatch[1].trim() : 'Location Not Found';

  return {
    id: jobId,
    title,
    company,
    location,
    description: `This job was extracted from LinkedIn search results. For complete details, please visit: https://www.linkedin.com/jobs/view/${jobId}`,
    url: `https://www.linkedin.com/jobs/view/${jobId}`,
    source: 'LinkedIn Search',
    extractedAt: new Date().toISOString(),
    note: 'Limited information available from search page'
  };
}
