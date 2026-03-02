import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { ResumeStyleGenerator, RESUME_STYLES } from '@/lib/resumeStyles';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function POST(request: NextRequest) {
  try {
    const { resumeData } = await request.json();

    if (!resumeData) {
      return NextResponse.json(
        { error: 'Resume data is required' },
        { status: 400 }
      );
    }

    // Generate PDF from resume data for download using jsPDF
    const pdf = generateResumePDFWithJSPDF(resumeData);
    const fileName = `${resumeData.personalInfo?.name || resumeData.contact?.name || 'resume'}.pdf`;

    return new NextResponse(pdf as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF download:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF download' },
      { status: 500 }
    );
  }
}

function generateResumePDFWithJSPDF(resumeData: any): Buffer {
  const jsPDF = require('jspdf').jsPDF;
  const doc = new jsPDF();
  
  const { summary, skills, experience, education, personalInfo, contact } = resumeData;
  const name = personalInfo?.name || contact?.name || 'Your Name';
  const email = personalInfo?.email || contact?.email || '';
  const phone = personalInfo?.phone || contact?.phone || '';
  const location = personalInfo?.location || contact?.location || '';
  
  let yPos = 30;
  const margin = 20;
  const pageWidth = doc.internal.pageSize.width;
  
  // Header
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(name, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;
  
  // Contact info
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const contactInfo = `${email} | ${phone} | ${location}`;
  doc.text(contactInfo, pageWidth / 2, yPos, { align: 'center' });
  yPos += 20;
  
  // Professional Summary
  if (summary) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PROFESSIONAL SUMMARY', margin, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const summaryLines = doc.splitTextToSize(summary, pageWidth - 2 * margin);
    doc.text(summaryLines, margin, yPos);
    yPos += summaryLines.length * 5 + 10;
  }
  
  // Experience
  if (experience && experience.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('EXPERIENCE', margin, yPos);
    yPos += 8;
    
    experience.forEach((exp: any) => {
      // Job title and company
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(exp.role || exp.title || 'Position', margin, yPos);
      yPos += 6;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`${exp.company || 'Company'} | ${exp.duration || 'Duration'}`, margin, yPos);
      yPos += 8;
      
      // Description
      if (exp.description) {
        doc.setFontSize(10);
        const descLines = doc.splitTextToSize(exp.description, pageWidth - 2 * margin);
        doc.text(descLines, margin, yPos);
        yPos += descLines.length * 4 + 5;
      }
      
      // Responsibilities
      if (exp.responsibilities && exp.responsibilities.length > 0) {
        exp.responsibilities.slice(0, 3).forEach((resp: string) => {
          doc.setFontSize(10);
          const respLines = doc.splitTextToSize(`• ${resp}`, pageWidth - 2 * margin - 5);
          doc.text(respLines, margin + 5, yPos);
          yPos += respLines.length * 4 + 2;
        });
      }
      
      yPos += 8;
      
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 30;
      }
    });
  }
  
  // Skills
  if (skills && skills.length > 0) {
    if (yPos > 200) {
      doc.addPage();
      yPos = 30;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SKILLS', margin, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const skillsText = skills.join(' • ');
    const skillsLines = doc.splitTextToSize(skillsText, pageWidth - 2 * margin);
    doc.text(skillsLines, margin, yPos);
    yPos += skillsLines.length * 5 + 10;
  }
  
  // Education
  if (education && education.length > 0) {
    if (yPos > 230) {
      doc.addPage();
      yPos = 30;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('EDUCATION', margin, yPos);
    yPos += 8;
    
    education.forEach((edu: any) => {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(edu.degree || 'Degree', margin, yPos);
      yPos += 6;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const eduInfo = `${edu.institution || 'Institution'}${edu.graduationDate ? ' | ' + new Date(edu.graduationDate).getFullYear() : ''}`;
      doc.text(eduInfo, margin, yPos);
      yPos += 10;
    });
  }
  
  return Buffer.from(doc.output('arraybuffer'));
}

function generateResumeHTML(resumeData: any): string {
  const { summary, skills, experience, education, personalInfo, contact } = resumeData;
  const name = personalInfo?.name || contact?.name || 'Your Name';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${name} - Resume</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .name {
          font-size: 2.5em;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 10px;
        }
        .contact-info {
          font-size: 1.1em;
          color: #666;
        }
        .section {
          margin-bottom: 25px;
        }
        .section-title {
          font-size: 1.5em;
          font-weight: bold;
          color: #2563eb;
          border-bottom: 1px solid #e5e5e5;
          padding-bottom: 5px;
          margin-bottom: 15px;
        }
        .experience-item {
          margin-bottom: 20px;
        }
        .job-title {
          font-weight: bold;
          font-size: 1.2em;
          color: #333;
        }
        .company {
          font-style: italic;
          color: #666;
        }
        .duration {
          color: #888;
          font-size: 0.9em;
        }
        .skills {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .skill {
          background: #f3f4f6;
          padding: 5px 10px;
          border-radius: 5px;
          font-size: 0.9em;
        }
        ul {
          padding-left: 20px;
        }
        li {
          margin-bottom: 5px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="name">${name}</div>
        <div class="contact-info">
          ${personalInfo?.email || contact?.email || ''} | 
          ${personalInfo?.phone || contact?.phone || ''} | 
          ${personalInfo?.location || contact?.location || ''}
        </div>
      </div>

      ${summary ? `
      <div class="section">
        <div class="section-title">Professional Summary</div>
        <p>${summary}</p>
      </div>
      ` : ''}

      ${experience && experience.length > 0 ? `
      <div class="section">
        <div class="section-title">Experience</div>
        ${experience.map((exp: any) => `
          <div class="experience-item">
            <div class="job-title">${exp.role || exp.title}</div>
            <div class="company">${exp.company}</div>
            <div class="duration">${exp.duration || `${exp.startDate ? new Date(exp.startDate).getFullYear() : ''} - ${exp.endDate ? new Date(exp.endDate).getFullYear() : 'Present'}`}</div>
            ${exp.description ? `<p>${exp.description}</p>` : ''}
            ${exp.responsibilities && exp.responsibilities.length > 0 ? `
            <ul>
              ${exp.responsibilities.map((resp: string) => `<li>${resp}</li>`).join('')}
            </ul>
            ` : ''}
            ${exp.achievements && exp.achievements.length > 0 ? `
            <ul>
              ${exp.achievements.map((achievement: string) => `<li>${achievement}</li>`).join('')}
            </ul>
            ` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${skills && skills.length > 0 ? `
      <div class="section">
        <div class="section-title">Skills</div>
        <div class="skills">
          ${skills.map((skill: string) => `<span class="skill">${skill}</span>`).join('')}
        </div>
      </div>
      ` : ''}

      ${education && education.length > 0 ? `
      <div class="section">
        <div class="section-title">Education</div>
        ${education.map((edu: any) => `
          <div class="experience-item">
            <div class="job-title">${edu.degree}</div>
            <div class="company">${edu.institution}</div>
            <div class="duration">${edu.graduationDate ? new Date(edu.graduationDate).getFullYear() : ''}</div>
          </div>
        `).join('')}
      </div>
      ` : ''}
    </body>
    </html>
  `;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const style = searchParams.get('style') || 'modern';

    if (!key) {
      return NextResponse.json(
        { error: 'Resume key is required' },
        { status: 400 }
      );
    }

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { error: 'AWS S3 not configured' },
        { status: 503 }
      );
    }

    // Get object from S3
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET || 'interview-assistant-resumes',
      Key: key,
    });

    const response = await s3Client.send(command);
    const body = await response.Body?.transformToString();

    if (!body) {
      return NextResponse.json(
        { error: 'Resume content not found' },
        { status: 404 }
      );
    }

    // Parse the JSON data
    let resumeData: any = {};
    let resumeContent = '';
    let fileName = 'resume.pdf';
    
    try {
      resumeData = JSON.parse(body);
      resumeContent = resumeData.tailoredResume || resumeData.originalResume || resumeData.document || 'No resume content available';
      const styleName = RESUME_STYLES.find(s => s.id === style)?.name || 'Modern';
      fileName = `${resumeData.companyName}_${resumeData.roleTitle}_Resume_${styleName}.pdf`.replace(/[^a-zA-Z0-9_-]/g, '_');
    } catch (parseError) {
      // If not JSON, treat as plain text
      resumeContent = body;
      fileName = 'legacy_resume.pdf';
    }

    // Generate PDF with selected style
    const styleGenerator = new ResumeStyleGenerator();
    let pdfBuffer: Buffer;

    switch (style) {
      case 'classic':
        pdfBuffer = styleGenerator.generateClassicStyle(resumeData, resumeContent);
        break;
      case 'creative':
        pdfBuffer = styleGenerator.generateCreativeStyle(resumeData, resumeContent);
        break;
      case 'ats-optimized':
        pdfBuffer = styleGenerator.generateATSOptimizedStyle(resumeData, resumeContent);
        break;
      case 'executive':
        pdfBuffer = styleGenerator.generateExecutiveStyle(resumeData, resumeContent);
        break;
      case 'match-original':
        pdfBuffer = styleGenerator.generateMatchOriginalStyle(resumeData, resumeContent, resumeData.originalStyle);
        break;
      default: // modern
        pdfBuffer = styleGenerator.generateModernStyle(resumeData, resumeContent);
        break;
    }

    // Return PDF as download
    return new NextResponse(pdfBuffer as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF download' },
      { status: 500 }
    );
  }
}