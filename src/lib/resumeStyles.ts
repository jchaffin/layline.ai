import jsPDF from 'jspdf';

export interface ResumeStyle {
  id: string;
  name: string;
  description: string;
  preview: string;
}

export const RESUME_STYLES: ResumeStyle[] = [
  {
    id: 'modern',
    name: 'Modern Professional',
    description: 'Clean, minimalist design with subtle accent colors',
    preview: 'Clean lines, modern typography, blue accents'
  },
  {
    id: 'classic',
    name: 'Classic Traditional',
    description: 'Traditional format with serif fonts and formal layout',
    preview: 'Traditional serif fonts, formal structure'
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Bold design with visual elements and creative layout',
    preview: 'Creative layout, visual elements, standout design'
  },
  {
    id: 'ats-optimized',
    name: 'ATS Optimized',
    description: 'Simple, machine-readable format optimized for ATS systems',
    preview: 'Simple formatting, ATS-friendly structure'
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Premium layout for senior-level positions',
    preview: 'Premium design, executive-level formatting'
  },
  {
    id: 'match-original',
    name: 'Match Original Style',
    description: 'Attempts to match the formatting of your uploaded resume',
    preview: 'Mimics your original resume formatting'
  }
];

export class ResumeStyleGenerator {
  private pdf: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margins = { top: 20, right: 20, bottom: 20, left: 20 };

  constructor() {
    this.pdf = new jsPDF();
    this.pageWidth = this.pdf.internal.pageSize.width;
    this.pageHeight = this.pdf.internal.pageSize.height;
  }

  private addPage() {
    this.pdf.addPage();
  }

  private checkPageBreak(yPosition: number, requiredSpace: number = 15): number {
    if (yPosition + requiredSpace > this.pageHeight - this.margins.bottom) {
      this.addPage();
      return this.margins.top;
    }
    return yPosition;
  }

  private splitTextToLines(text: string, maxWidth: number, fontSize: number): string[] {
    this.pdf.setFontSize(fontSize);
    return this.pdf.splitTextToSize(text, maxWidth);
  }

  generateModernStyle(resumeData: any, content: string): Buffer {
    this.pdf = new jsPDF();
    let yPos = this.margins.top;

    // Header with name and contact
    this.pdf.setFillColor(52, 152, 219); // Blue accent
    this.pdf.rect(0, 0, this.pageWidth, 60, 'F');
    
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(24);
    this.pdf.setFont('helvetica', 'bold');
    
    const name = this.extractName(content) || 'Professional Resume';
    this.pdf.text(name, this.margins.left, 30);
    
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'normal');
    const contact = this.extractContact(content);
    this.pdf.text(contact, this.margins.left, 45);
    
    yPos = 80;
    this.pdf.setTextColor(0, 0, 0);

    // Content sections
    return this.addContentSections(content, yPos, 'modern');
  }

  generateClassicStyle(resumeData: any, content: string): Buffer {
    this.pdf = new jsPDF();
    let yPos = this.margins.top;

    // Classic header
    this.pdf.setFontSize(20);
    this.pdf.setFont('times', 'bold');
    const name = this.extractName(content) || 'Professional Resume';
    this.pdf.text(name, this.pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 10;
    this.pdf.setFontSize(11);
    this.pdf.setFont('times', 'normal');
    const contact = this.extractContact(content);
    this.pdf.text(contact, this.pageWidth / 2, yPos, { align: 'center' });
    
    // Horizontal line
    yPos += 15;
    this.pdf.setLineWidth(0.5);
    this.pdf.line(this.margins.left, yPos, this.pageWidth - this.margins.right, yPos);
    
    yPos += 15;
    return this.addContentSections(content, yPos, 'classic');
  }

  generateCreativeStyle(resumeData: any, content: string): Buffer {
    this.pdf = new jsPDF();
    let yPos = this.margins.top;

    // Creative header with color blocks
    this.pdf.setFillColor(230, 126, 34); // Orange accent
    this.pdf.rect(0, 0, 80, this.pageHeight, 'F');
    
    this.pdf.setFillColor(52, 73, 94); // Dark sidebar
    this.pdf.rect(0, 0, 80, 100, 'F');
    
    // Name in sidebar
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(18);
    this.pdf.setFont('helvetica', 'bold');
    const name = this.extractName(content) || 'Professional Resume';
    const nameLines = this.splitTextToLines(name, 60, 18);
    nameLines.forEach((line, index) => {
      this.pdf.text(line, 10, 30 + (index * 8));
    });
    
    // Contact in sidebar
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    const contact = this.extractContact(content);
    const contactLines = this.splitTextToLines(contact, 60, 10);
    contactLines.forEach((line, index) => {
      this.pdf.text(line, 10, 60 + (index * 6));
    });
    
    // Main content area
    this.pdf.setTextColor(0, 0, 0);
    return this.addContentSections(content, this.margins.top, 'creative', 90);
  }

  generateATSOptimizedStyle(resumeData: any, content: string): Buffer {
    this.pdf = new jsPDF();
    let yPos = this.margins.top;

    // Simple ATS-friendly header
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    const name = this.extractName(content) || 'Professional Resume';
    this.pdf.text(name, this.margins.left, yPos);
    
    yPos += 15;
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'normal');
    const contact = this.extractContact(content);
    this.pdf.text(contact, this.margins.left, yPos);
    
    yPos += 20;
    return this.addContentSections(content, yPos, 'ats');
  }

  generateExecutiveStyle(resumeData: any, content: string): Buffer {
    this.pdf = new jsPDF();
    let yPos = this.margins.top;

    // Premium executive header
    this.pdf.setFillColor(44, 62, 80); // Dark professional
    this.pdf.rect(0, 0, this.pageWidth, 70, 'F');
    
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(22);
    this.pdf.setFont('helvetica', 'bold');
    const name = this.extractName(content) || 'Professional Resume';
    this.pdf.text(name, this.margins.left, 35);
    
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'normal');
    const contact = this.extractContact(content);
    this.pdf.text(contact, this.margins.left, 55);
    
    yPos = 90;
    this.pdf.setTextColor(0, 0, 0);
    return this.addContentSections(content, yPos, 'executive');
  }

  generateMatchOriginalStyle(resumeData: any, content: string, originalStyle?: any): Buffer {
    // Analyze original resume style if available
    const detectedStyle = this.analyzeOriginalStyle(content, originalStyle);
    
    // Fall back to modern style with detected characteristics
    this.pdf = new jsPDF();
    let yPos = this.margins.top;

    // Use detected formatting preferences
    const fontFamily = detectedStyle.fontFamily || 'helvetica';
    const accentColor = detectedStyle.accentColor || [52, 152, 219];
    
    this.pdf.setFontSize(detectedStyle.nameSize || 20);
    this.pdf.setFont(fontFamily, 'bold');
    const name = this.extractName(content) || 'Professional Resume';
    this.pdf.text(name, this.margins.left, yPos);
    
    yPos += 15;
    this.pdf.setFontSize(detectedStyle.contactSize || 11);
    this.pdf.setFont(fontFamily, 'normal');
    const contact = this.extractContact(content);
    this.pdf.text(contact, this.margins.left, yPos);
    
    yPos += 20;
    return this.addContentSections(content, yPos, 'matched', undefined, detectedStyle);
  }

  private analyzeOriginalStyle(content: string | any, originalData?: any): any {
    let textContent = '';
    
    // Handle different content types
    if (typeof content === 'string') {
      textContent = content;
    } else if (typeof content === 'object' && content !== null) {
      textContent = JSON.stringify(content);
    } else {
      textContent = '';
    }
    
    // Basic style detection based on content patterns
    const hasEmail = textContent.includes('@');
    const hasPhone = /\d{3}[-.]?\d{3}[-.]?\d{4}/.test(textContent);
    const hasLinkedIn = textContent.toLowerCase().includes('linkedin');
    
    return {
      fontFamily: 'helvetica', // Default to safe font
      nameSize: 20,
      contactSize: 11,
      accentColor: [52, 152, 219],
      hasStructuredContact: hasEmail && hasPhone,
      hasLinkedIn: hasLinkedIn
    };
  }

  private extractName(content: string | any): string {
    let textContent = '';
    
    // Handle different content types
    if (typeof content === 'string') {
      textContent = content;
    } else if (typeof content === 'object' && content !== null) {
      // If it's a structured object, try to extract name from contact info
      if (content.contact && content.contact.name) {
        return content.contact.name;
      }
      // Convert object to string representation
      textContent = JSON.stringify(content);
    } else {
      return 'Professional Resume';
    }
    
    // Try to extract name from first line or common patterns
    const lines = textContent.split('\n').filter(line => line.trim());
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      // Basic name detection - if it's short and doesn't contain common resume keywords
      if (firstLine.length < 50 && !firstLine.toLowerCase().includes('resume') && 
          !firstLine.includes('@') && !firstLine.includes('phone')) {
        return firstLine;
      }
    }
    return 'Professional Resume';
  }

  private extractContact(content: string | any): string {
    let textContent = '';
    
    // Handle different content types
    if (typeof content === 'string') {
      textContent = content;
    } else if (typeof content === 'object' && content !== null) {
      // If it's a structured object, extract from contact info
      if (content.contact) {
        const contactParts = [];
        if (content.contact.email) contactParts.push(content.contact.email);
        if (content.contact.phone) contactParts.push(content.contact.phone);
        if (content.contact.location) contactParts.push(content.contact.location);
        if (contactParts.length > 0) {
          return contactParts.join(' | ');
        }
      }
      // Convert object to string representation
      textContent = JSON.stringify(content);
    } else {
      return 'Contact Information';
    }
    
    const lines = textContent.split('\n');
    const contactInfo = [];
    
    // Look for email, phone, location
    const emailMatch = textContent.match(/[\w.-]+@[\w.-]+\.\w+/);
    const phoneMatch = textContent.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    
    if (emailMatch) contactInfo.push(emailMatch[0]);
    if (phoneMatch) contactInfo.push(phoneMatch[0]);
    
    return contactInfo.join(' | ') || 'Contact Information';
  }

  private addContentSections(content: string | any, startY: number, style: string, leftMargin?: number, styleOptions?: any): Buffer {
    let yPos = startY;
    const leftStart = leftMargin || this.margins.left;
    const contentWidth = this.pageWidth - leftStart - this.margins.right;
    
    // Convert content to string if it's an object
    let textContent = '';
    if (typeof content === 'string') {
      textContent = content;
    } else if (typeof content === 'object' && content !== null) {
      // Convert structured data to readable text
      textContent = this.convertStructuredToText(content);
    } else {
      textContent = 'No content available';
    }
    
    // Split content into sections
    const sections = this.parseContentSections(textContent);
    
    sections.forEach(section => {
      yPos = this.checkPageBreak(yPos, 25);
      
      // Section header
      this.pdf.setFontSize(14);
      this.pdf.setFont('helvetica', 'bold');
      if (style === 'creative') {
        this.pdf.setTextColor(230, 126, 34);
      } else if (style === 'executive') {
        this.pdf.setTextColor(44, 62, 80);
      } else {
        this.pdf.setTextColor(0, 0, 0);
      }
      
      this.pdf.text(section.title, leftStart, yPos);
      yPos += 15;
      
      // Section content
      this.pdf.setFontSize(11);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setTextColor(0, 0, 0);
      
      const contentLines = this.splitTextToLines(section.content, contentWidth, 11);
      contentLines.forEach(line => {
        yPos = this.checkPageBreak(yPos, 6);
        this.pdf.text(line, leftStart, yPos);
        yPos += 6;
      });
      
      yPos += 10; // Space between sections
    });
    
    return Buffer.from(this.pdf.output('arraybuffer'));
  }

  private parseContentSections(content: string): Array<{title: string, content: string}> {
    const sections = [];
    const lines = content.split('\n');
    let currentSection = { title: 'Summary', content: '' };
    
    // Basic section detection
    const sectionKeywords = ['experience', 'education', 'skills', 'summary', 'objective', 'projects', 'certifications'];
    
    lines.forEach(line => {
      const lowercaseLine = line.toLowerCase().trim();
      const isSection = sectionKeywords.some(keyword => 
        lowercaseLine === keyword || lowercaseLine.includes(keyword) && line.length < 50
      );
      
      if (isSection && line.trim().length > 0) {
        if (currentSection.content.trim()) {
          sections.push({ ...currentSection });
        }
        currentSection = { title: line.trim(), content: '' };
      } else if (line.trim()) {
        currentSection.content += line + '\n';
      }
    });
    
    if (currentSection.content.trim()) {
      sections.push(currentSection);
    }
    
    return sections.length > 0 ? sections : [{ title: 'Resume Content', content: content }];
  }

  private convertStructuredToText(data: any): string {
    let text = '';
    
    if (data.summary) {
      text += `PROFESSIONAL SUMMARY\n${data.summary}\n\n`;
    }
    
    if (data.experience && Array.isArray(data.experience)) {
      text += 'PROFESSIONAL EXPERIENCE\n';
      data.experience.forEach((exp: any) => {
        text += `${exp.role} at ${exp.company}\n`;
        if (exp.duration) text += `${exp.duration}\n`;
        if (exp.description) text += `${exp.description}\n`;
        if (exp.responsibilities) {
          exp.responsibilities.forEach((resp: string) => {
            text += `• ${resp}\n`;
          });
        }
        if (exp.achievements) {
          exp.achievements.forEach((ach: string) => {
            text += `• ${ach}\n`;
          });
        }
        text += '\n';
      });
    }
    
    if (data.education && Array.isArray(data.education)) {
      text += 'EDUCATION\n';
      data.education.forEach((edu: any) => {
        text += `${edu.degree}`;
        if (edu.field) text += ` in ${edu.field}`;
        text += `\n${edu.institution}, ${edu.year}\n`;
        if (edu.gpa) text += `GPA: ${edu.gpa}\n`;
        if (edu.honors) text += `${edu.honors}\n`;
        text += '\n';
      });
    }
    
    if (data.skills && Array.isArray(data.skills)) {
      text += 'SKILLS\n';
      text += data.skills.join(', ') + '\n\n';
    }
    
    return text || JSON.stringify(data, null, 2);
  }
}