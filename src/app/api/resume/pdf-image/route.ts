import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

function generateResumeHTML(resumeData: any): string {
  const { contact, summary, experience, education, skills } = resumeData || {};
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { 
            font-family: 'Arial', sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: white;
            font-size: 12px;
            line-height: 1.4;
          }
          .header { 
            text-align: center; 
            margin-bottom: 20px; 
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
          }
          .name { 
            font-size: 24px; 
            font-weight: bold; 
            color: #333; 
            margin-bottom: 5px;
          }
          .contact-info { 
            color: #666; 
            font-size: 11px;
          }
          .section { 
            margin-bottom: 15px; 
          }
          .section-title { 
            font-size: 14px; 
            font-weight: bold; 
            color: #333; 
            border-bottom: 1px solid #ccc;
            margin-bottom: 8px;
            padding-bottom: 2px;
          }
          .experience-item, .education-item { 
            margin-bottom: 10px; 
          }
          .job-title { 
            font-weight: bold; 
            color: #333;
          }
          .company { 
            font-style: italic; 
            color: #666;
          }
          .date { 
            float: right; 
            color: #888;
            font-size: 10px;
          }
          .description { 
            margin-top: 3px;
            font-size: 11px;
            color: #555;
          }
          .skills-list {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
          }
          .skill-tag {
            background: #f0f0f0;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
            color: #333;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="name">${contact?.name || 'Resume'}</div>
          <div class="contact-info">
            ${contact?.email || ''} ${contact?.email && contact?.phone ? '•' : ''} ${contact?.phone || ''} ${(contact?.email || contact?.phone) && contact?.location ? '•' : ''} ${contact?.location || ''}
          </div>
        </div>
        
        ${summary ? `
          <div class="section">
            <div class="section-title">PROFESSIONAL SUMMARY</div>
            <div class="description">${summary}</div>
          </div>
        ` : ''}
        
        ${experience && experience.length > 0 ? `
          <div class="section">
            <div class="section-title">WORK EXPERIENCE</div>
            ${experience.map((exp: any) => `
              <div class="experience-item">
                <div class="job-title">${exp.role || ''}</div>
                <div class="company">${exp.company || ''} 
                  <span class="date">${exp.startDate ? new Date(exp.startDate).getFullYear() : ''} - ${exp.isCurrentRole ? 'Present' : (exp.endDate ? new Date(exp.endDate).getFullYear() : '')}</span>
                </div>
                ${exp.description ? `<div class="description">${exp.description.split('\n').slice(0, 3).join('<br>')}</div>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        ${education && education.length > 0 ? `
          <div class="section">
            <div class="section-title">EDUCATION</div>
            ${education.map((edu: any) => `
              <div class="education-item">
                <div class="job-title">${edu.degree || ''}</div>
                <div class="company">${edu.institution || ''} 
                  <span class="date">${edu.year || ''}</span>
                </div>
                ${edu.field ? `<div class="description">${edu.field}</div>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        ${skills && skills.length > 0 ? `
          <div class="section">
            <div class="section-title">SKILLS</div>
            <div class="skills-list">
              ${skills.slice(0, 12).map((skill: string) => `<span class="skill-tag">${skill}</span>`).join('')}
            </div>
          </div>
        ` : ''}
      </body>
    </html>
  `;
}

export async function POST(request: NextRequest) {
  try {
    const { pdfUrl, resumeData } = await request.json();

    if (!pdfUrl && !resumeData) {
      return NextResponse.json({ error: 'PDF URL or resume data is required' }, { status: 400 });
    }

    console.log('Converting to image for:', pdfUrl ? 'PDF URL' : 'resume data');

    // Launch puppeteer to convert PDF to image
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
      ],
    });

    const page = await browser.newPage();
    
    // Set viewport size
    await page.setViewport({ width: 595, height: 842 }); // A4 size
    
    let html;
    
    if (pdfUrl) {
      // Create a simple HTML page that displays the PDF URL as iframe
      html = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { margin: 0; padding: 0; }
              iframe { width: 100%; height: 100vh; border: none; }
            </style>
          </head>
          <body>
            <iframe src="${pdfUrl}#view=FitH" type="application/pdf"></iframe>
          </body>
        </html>
      `;
    } else {
      // Generate HTML from resume data
      html = generateResumeHTML(resumeData);
    }

    await page.setContent(html);
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Take screenshot
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: false,
    });

    await browser.close();

    console.log('PDF converted to image successfully');

    return new NextResponse(screenshot, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error('Error converting PDF to image:', error);
    
    // Return a fallback placeholder image
    const canvasLib = await import('canvas');
    const canvasInstance = canvasLib.createCanvas(595, 842);
    const ctx = canvasInstance.getContext('2d');
    
    // Draw white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 595, 842);
    
    // Draw placeholder text
    ctx.fillStyle = '#666';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PDF Preview', 297, 400);
    ctx.fillText('Image conversion failed', 297, 430);
    
    // Draw border
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, 595, 842);
    
    const buffer = canvasInstance.toBuffer('image/png');
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
      },
    });
  }
}