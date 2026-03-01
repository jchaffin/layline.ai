import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { error: "Resume key is required" },
        { status: 400 },
      );
    }

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { error: "AWS S3 not configured" },
        { status: 503 },
      );
    }

    // Get object from S3
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET || "interview-assistant-resumes",
      Key: key,
    });

    const response = await s3Client.send(command);
    const body = await response.Body?.transformToString();

    if (!body) {
      return NextResponse.json(
        { error: "Resume content not found" },
        { status: 404 },
      );
    }

    // Try to parse as JSON
    try {
      const data = JSON.parse(body);

      // Try to parse the tailored resume as structured data
      let structuredData = null;
      const resumeContent =
        data.tailoredResume || data.originalResume || data.document;

      if (resumeContent) {
        try {
          // If the resume content is already parsed JSON, use it directly
          if (typeof resumeContent === "object") {
            structuredData = resumeContent;
          } else {
            // Try to parse if it's a JSON string
            structuredData = JSON.parse(resumeContent);
          }
        } catch (parseError) {
          // If not parseable, it's plain text - we'll handle this in the component
          structuredData = null;
        }
      }

      return NextResponse.json({
        success: true,
        data: data,
        structuredData: structuredData,
        preview: resumeContent || "No resume content available",
        metadata: {
          company: data.companyName,
          role: data.roleTitle,
          createdAt: data.createdAt,
          isStructured: !!structuredData,
        },
      });
    } catch (parseError) {
      // If not JSON, treat as plain text document
      return NextResponse.json({
        success: true,
        data: null,
        structuredData: null,
        preview: body,
        note: "This appears to be a legacy resume format",
      });
    }
  } catch (error) {
    console.error("Error fetching resume preview:", error);
    return NextResponse.json(
      { error: "Failed to load resume preview" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { resumeData } = await request.json();

    if (!resumeData) {
      return NextResponse.json(
        { error: "Resume data is required" },
        { status: 400 },
      );
    }

    // Generate PDF using jsPDF
    const pdf = generateResumePDFWithJSPDF(resumeData);

    return new NextResponse(pdf as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error generating PDF preview:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF preview" },
      { status: 500 },
    );
  }
}

function generateResumePDFWithJSPDF(resumeData: any): Buffer {
  const jsPDF = require("jspdf").jsPDF;
  const doc = new jsPDF("p", "mm", "a4");

  const {
    summary,
    skills,
    experience,
    education,
    personalInfo,
    contact,
    jobTitle,
  } = resumeData;
  const firstName = contact?.firstName || personalInfo?.firstName || "Jacob";
  const lastName = contact?.lastName || personalInfo?.lastName || "Chaffin";
  const name =
    contact?.name || personalInfo?.name || `${firstName} ${lastName}`;
  const title =
    jobTitle || personalInfo?.title || "Fullstack Engineer | Voice AI";
  const email = personalInfo?.email || contact?.email || "jchaffin57@gmail.com";
  const phone = personalInfo?.phone || contact?.phone || "(650) 380-3288";
  const location =
    personalInfo?.location || contact?.location || "SF Bay Area, United States";

  // Page dimensions and layout
  const pageWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  let yPos = margin;

  // Clean Header Section - No Background
  // Name
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(name, margin, yPos + 5);

  // Title
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(title, margin, yPos + 15);

  // Contact Information (right aligned)
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const contactInfo = [email, phone, location].filter(Boolean);
  let contactY = yPos + 5;
  contactInfo.forEach((info, index) => {
    const textWidth = doc.getTextWidth(info);
    doc.text(info, pageWidth - margin - textWidth, contactY + index * 4);
  });

  // Links (right aligned)
  const github = personalInfo?.github || contact?.github || "";
  const linkedin = personalInfo?.linkedin || contact?.linkedin || "";
  const website = personalInfo?.website || contact?.website || "";
  
  const links = [
    { label: "GitHub", url: github },
    { label: "LinkedIn", url: linkedin },
    { label: "Website", url: website },
  ].filter((link) => link.url);

  let linkY = contactY + contactInfo.length * 4 + 2;
  links.forEach((link, index) => {
    const textWidth = doc.getTextWidth(link.label);
    doc.setTextColor(0, 100, 200); // Blue links
    doc.text(link.label, pageWidth - margin - textWidth, linkY + index * 4);
  });

  // Add line separator
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos + 25, pageWidth - margin, yPos + 25);

  yPos = yPos + 35;

  // Professional Summary Section
  if (summary) {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("PROFESSIONAL SUMMARY", margin, yPos);

    // Add underline
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos + 2, margin + 60, yPos + 2);

    yPos += 8;

    doc.setTextColor(55, 65, 81);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const summaryLines = doc.splitTextToSize(summary, contentWidth);
    doc.text(summaryLines, margin, yPos);
    yPos += summaryLines.length * 5 + 12;
  }

  // Experience Section
  if (experience && experience.length > 0) {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("PROFESSIONAL EXPERIENCE", margin, yPos);

    // Add underline
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos + 2, margin + 75, yPos + 2);

    yPos += 10;

    experience.slice(0, 4).forEach((exp: any) => {
      // Check if we need a new page
      if (yPos > 240) {
        doc.addPage();
        yPos = margin;
      }

      // Job Title and Company
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(55, 65, 81);
      doc.text(`${exp.role || "Role"}`, margin, yPos);

      // Company name (right aligned on same line)
      if (exp.company) {
        const companyWidth = doc.getTextWidth(`${exp.company}`);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(`${exp.company}`, pageWidth - margin - companyWidth, yPos);
      }

      yPos += 6;

      // Date range and location
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(107, 114, 128);
      const startDate = exp.startDate
        ? new Date(exp.startDate).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          })
        : "";
      const endDate = exp.isCurrentRole
        ? "Present"
        : exp.endDate
          ? new Date(exp.endDate).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })
          : "";
      const dateRange = [startDate, endDate].filter(Boolean).join(" - ");
      doc.text(dateRange, margin, yPos);

      // Location (right aligned)
      if (exp.location) {
        const locationWidth = doc.getTextWidth(exp.location);
        doc.text(exp.location, pageWidth - margin - locationWidth, yPos);
      }

      yPos += 6;

      // Job description
      if (exp.description) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(55, 65, 81);
        const descLines = doc.splitTextToSize(exp.description, contentWidth);
        doc.text(descLines, margin, yPos);
        yPos += descLines.length * 4.5 + 8;
      } else {
        yPos += 8;
      }
    });
  }

  // Skills Section
  if (skills && skills.length > 0) {
    if (yPos > 220) {
      doc.addPage();
      yPos = margin;
    }

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("TECHNICAL SKILLS", margin, yPos);

    // Add underline
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos + 2, margin + 55, yPos + 2);

    yPos += 10;

    // Skills in columns
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const skillsPerColumn = 6;
    const columnWidth = contentWidth / 3;

    skills.slice(0, 18).forEach((skill: string, index: number) => {
      const columnIndex = Math.floor(index / skillsPerColumn);
      const rowIndex = index % skillsPerColumn;
      const xPos = margin + columnIndex * columnWidth;
      const skillYPos = yPos + rowIndex * 5;

      // Add bullet point
      doc.setFontSize(8);
      doc.text("•", xPos, skillYPos);
      doc.setFontSize(10);
      doc.text(skill, xPos + 5, skillYPos);
    });

    yPos += Math.ceil(Math.min(skills.length, 18) / 3) * 5 + 12;
  }

  // Education Section
  if (education && education.length > 0) {
    if (yPos > 220) {
      doc.addPage();
      yPos = margin;
    }

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("EDUCATION", margin, yPos);

    // Add underline
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos + 2, margin + 35, yPos + 2);

    yPos += 10;

    education.forEach((edu: any) => {
      // Degree
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(55, 65, 81);
      doc.text(edu.degree || "Degree", margin, yPos);

      // Graduation year (right aligned)
      if (edu.graduationDate) {
        const year = new Date(edu.graduationDate).getFullYear().toString();
        const yearWidth = doc.getTextWidth(year);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(107, 114, 128);
        doc.text(year, pageWidth - margin - yearWidth, yPos);
      }

      yPos += 6;

      // Institution
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(107, 114, 128);
      doc.text(edu.institution || "Institution", margin, yPos);
      yPos += 10;
    });
  }

  return Buffer.from(doc.output("arraybuffer"));
}

function generateResumeHTML(resumeData: any): string {
  const { summary, skills, experience, education, contact } = resumeData;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Resume Preview</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #0066cc;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .name {
          font-size: 28px;
          font-weight: bold;
          color: #0066cc;
          margin-bottom: 10px;
        }
        .contact-info {
          font-size: 14px;
          color: #666;
        }
        .section {
          margin-bottom: 25px;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #0066cc;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
          margin-bottom: 15px;
        }
        .experience-item, .education-item {
          margin-bottom: 20px;
        }
        .job-title {
          font-weight: bold;
          font-size: 16px;
        }
        .company {
          font-style: italic;
          color: #666;
        }
        .duration {
          float: right;
          color: #666;
          font-size: 14px;
        }
        .description {
          margin-top: 8px;
          line-height: 1.5;
        }
        .skills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .skill-tag {
          background-color: #f0f0f0;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="name">Resume Preview</div>
        <div class="contact-info">
          ${contact?.email || ""} ${contact?.phone ? "• " + contact.phone : ""} ${contact?.location ? "• " + contact.location : ""}
        </div>
      </div>

      ${
        summary
          ? `
        <div class="section">
          <div class="section-title">Professional Summary</div>
          <div>${summary}</div>
        </div>
      `
          : ""
      }

      ${
        skills && skills.length > 0
          ? `
        <div class="section">
          <div class="section-title">Skills</div>
          <div class="skills">
            ${skills.map((skill: string) => `<span class="skill-tag">${skill}</span>`).join("")}
          </div>
        </div>
      `
          : ""
      }

      ${
        experience && experience.length > 0
          ? `
        <div class="section">
          <div class="section-title">Experience</div>
          ${experience
            .map(
              (exp: any) => `
            <div class="experience-item">
              <div class="job-title">${exp.role || ""}</div>
              <div class="company">${exp.company || ""} <span class="duration">${exp.duration || ""}</span></div>
              ${exp.description ? `<div class="description">${exp.description}</div>` : ""}
            </div>
          `,
            )
            .join("")}
        </div>
      `
          : ""
      }

      ${
        education && education.length > 0
          ? `
        <div class="section">
          <div class="section-title">Education</div>
          ${education
            .map(
              (edu: any) => `
            <div class="education-item">
              <div class="job-title">${edu.degree || ""} ${edu.field ? "in " + edu.field : ""}</div>
              <div class="company">${edu.institution || ""}</div>
            </div>
          `,
            )
            .join("")}
        </div>
      `
          : ""
      }
    </body>
    </html>
  `;
}
