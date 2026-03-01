import { NextRequest } from "next/server";
import puppeteer from "puppeteer";

interface Contact {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

interface Experience {
  company: string;
  role: string;
  startDate?: string;
  endDate?: string;
  isCurrentRole?: boolean;
  location?: string;
  description?: string;
  achievements: string[];
  responsibilities: string[];
  keywords: string[];
}

interface Education {
  institution: string;
  degree: string;
  field?: string;
  year: string;
  gpa?: string;
  honors?: string;
}

interface ParsedResume {
  summary: string;
  skills: string[];
  jobTitle?: string;
  experience: Experience[];
  education: Education[];
  contact: Contact;
  ats_score?: string;
  ats_recommendations?: string[];
  jobDescription?: string;
}

// Helper function to format dates
const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return `${date.getMonth() + 1}/${date.getFullYear()}`;
};

// Helper function to get full name
const getFullName = (contact: Contact): string => {
  if (contact?.name) return contact.name;
  if (contact?.firstName || contact?.lastName) {
    return `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
  }
  return 'Your Name';
};

// Generate HTML for the resume
const generateResumeHTML = (resumeData: ParsedResume): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Resume</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 10px;
          line-height: 1.4;
          color: #333;
          background: white;
        }
        
        .page-break {
          page-break-before: always;
        }
        
        @page {
          size: A4;
          margin: 0.5in 0 0 0;
        }
        
        .page {
          width: 8.5in;
          height: 11in;
          padding: 0.5in 1in 1in 1in;
          display: flex;
          gap: 0.75in;
        }
        
        .left-column {
          flex: 9;
        }
        
        .right-column {
          flex: 1;
          background: #f8f9fa;
          padding: 0.25in;
          margin-top: 1.5in;
          margin-bottom: 1in;
          border-radius: 8px;
          height: fit-content;
        }
        
        .header {
          margin-bottom: 0.5in;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 0.1in;
        }
        
        .name {
          font-size: 32px;
          font-weight: bold;
          color: #1e293b;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .title {
          font-size: 16px;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .section {
          margin-bottom: 0.25in;
        }
        
        .section-title {
          font-size: 16px;
          font-weight: bold;
          color: #1e293b;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 6px;
        }
        
        .profile {
          font-size: 11px;
          line-height: 1.6;
          color: #374151;
          text-align: justify;
        }
        
        .experience-item {
          margin-bottom: 18px;
        }
        
        .job-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }
        
        .job-title {
          font-size: 14px;
          font-weight: bold;
          color: #1e293b;
          flex: 1;
        }
        
        .job-company {
          font-size: 12px;
          font-weight: 600;
          color: #2563eb;
          margin-bottom: 4px;
        }
        
        .job-duration {
          font-size: 10px;
          color: #64748b;
          font-style: italic;
          font-weight: 500;
        }
        
        .job-description {
          font-size: 10px;
          line-height: 1.5;
          color: #374151;
          margin-bottom: 8px;
        }
        
        .achievements-list {
          margin-left: 12px;
        }
        
        .achievement-item {
          font-size: 10px;
          line-height: 1.4;
          color: #374151;
          margin-bottom: 4px;
          display: flex;
        }
        
        .bullet {
          font-size: 8px;
          color: #2563eb;
          margin-right: 8px;
          margin-top: 2px;
          font-weight: bold;
        }
        
        .details-title {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #1e293b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .details-section {
          margin-bottom: 25px;
        }
        
        .detail-item {
          font-size: 10px;
          color: #374151;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
        }
        
        .detail-icon {
          font-size: 10px;
          color: #2563eb;
          margin-right: 8px;
          width: 12px;
        }
        
        .link-item {
          font-size: 10px;
          color: #2563eb;
          margin-bottom: 6px;
          text-decoration: underline;
        }
        
        .icon {
          width: 12px;
          height: 12px;
          display: inline-block;
          margin-right: 6px;
          vertical-align: middle;
        }
        
        .skills-section {
          background: #f8f9fa;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
        }
        
        .skill-item {
          font-size: 9px;
          color: #374151;
          margin-bottom: 2px;
        }
        
        .education-section {
          margin-bottom: 15px;
        }
        
        .education-item {
          margin-bottom: 12px;
        }
        
        .education-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 4px;
        }
        
        .education-degree {
          font-size: 11px;
          font-weight: bold;
          color: #1e293b;
        }
        
        .education-institution {
          font-size: 10px;
          color: #2563eb;
          font-weight: 600;
        }
        
        .education-year {
          font-size: 9px;
          color: #64748b;
          font-style: italic;
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="left-column">
          <div class="header">
            <div class="name">${getFullName(resumeData.contact)}</div>
            <div class="title">${resumeData.jobTitle || 'Fullstack Engineer | Voice AI'}</div>
          </div>

          ${resumeData.summary ? `
            <div class="section">
              <div class="section-title">Professional Summary</div>
              <div class="profile">${resumeData.summary}</div>
            </div>
          ` : ''}

          ${resumeData.experience && resumeData.experience.length > 0 ? `
            <div class="section">
              <div class="section-title">Professional Experience</div>
              ${resumeData.experience.map((exp, index) => `
                <div class="experience-item" ${exp.role === 'AI Associate' ? 'style="page-break-before: always;"' : ''}>
                  <div class="job-header">
                    <div class="job-title">${exp.role}</div>
                    <div class="job-duration">
                      ${formatDate(exp.startDate)} — ${exp.isCurrentRole ? 'Present' : formatDate(exp.endDate)}
                    </div>
                  </div>
                  <div class="job-company">${exp.company}</div>
                  ${exp.description ? `
                    <div class="achievements-list">
                      ${exp.description.split('\n').map((line, lineIndex) => {
                        const trimmedLine = line.trim();
                        if (trimmedLine.startsWith('- ')) {
                          return `
                            <div class="achievement-item">
                              <span class="bullet">•</span>
                              <span>${trimmedLine.substring(2)}</span>
                            </div>
                          `;
                        }
                        return trimmedLine ? `<div class="job-description">${trimmedLine}</div>` : '';
                      }).join('')}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${resumeData.education && resumeData.education.length > 0 ? `
            <div class="section">
              <div class="section-title">Education</div>
              ${resumeData.education.map((edu, index) => `
                <div class="education-item">
                  <div class="education-header">
                    <div class="education-degree">${edu.degree}${edu.field ? ` in ${edu.field}` : ''}</div>
                    <div class="education-year">${edu.year}</div>
                  </div>
                  <div class="education-institution">${edu.institution}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <div class="right-column">
          <div class="details-section">
            <div class="details-title">Contact</div>
            ${resumeData.contact?.location ? `<div class="detail-item">📍 ${resumeData.contact.location}</div>` : ''}
            ${resumeData.contact?.phone ? `<div class="detail-item">📞 ${resumeData.contact.phone}</div>` : ''}
            ${resumeData.contact?.email ? `<div class="detail-item">📧 <span class="link-item">${resumeData.contact.email}</span></div>` : ''}
          </div>

          <div class="details-section">
            <div class="details-title">Links</div>
            <div class="detail-item">
              <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <a href="https://github.com/jchaffin.com" class="link-item">jchaffin57</a>
            </div>
            <div class="detail-item">
              <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              <a href="https://linkedin.com/in/jacob-chaffin" class="link-item">jacob-chaffin</a>
            </div>
            <div class="detail-item">
              <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
              <a href="https://jacobchaffin.io" class="link-item">jacobchaffin.io</a>
            </div>
          </div>

          ${resumeData.skills && resumeData.skills.length > 0 ? `
            <div class="skills-section">
              <div class="details-title">Skills</div>
              ${resumeData.skills.map((skill, index) => `
                <div class="skill-item">• ${skill}</div>
              `).join('')}
            </div>
          ` : ''}


        </div>
      </div>


    </body>
    </html>
  `;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    if (!body) {
      return new Response(
        JSON.stringify({ error: "Empty request body" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { resumeData, jobDescription } = JSON.parse(body) as { 
      resumeData: ParsedResume | null; 
      jobDescription?: string;
    };
    
    if (!resumeData) {
      return new Response(
        JSON.stringify({ error: "No resume data provided" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Launch Puppeteer with timeout
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      timeout: 15000 // 15 second timeout for browser launch
    });
    
    const page = await browser.newPage();
    
    // Generate HTML
    const html = generateResumeHTML(resumeData);
    
    // Set content and wait for DOM to be ready
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    
    // Give it a moment for any styling to apply
    
    // Emulate print media type for proper page breaks
    await page.emulateMediaType('print');
    
    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0'
      },
      preferCSSPageSize: true
    });
    
    await browser.close();
    
    return new Response(pdf as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=resume.pdf",
      },
    });
  } catch (error: any) {
    console.error("PDF generation error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate PDF", details: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}