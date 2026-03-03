import { NextRequest } from "next/server";
import puppeteer from "puppeteer";
import { generateResumeHTMLString, type ResumeData } from "@/lib/resumeTemplate";
import { getTemplateCSS } from "@/lib/resumeTemplates";

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

    const { resumeData, templateId = "modern" } = JSON.parse(body) as {
      resumeData: ResumeData | null;
      templateId?: string;
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

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      timeout: 15000,
    });

    const page = await browser.newPage();

    const css = getTemplateCSS(templateId);
    const htmlBase = generateResumeHTMLString(resumeData);
    const html = htmlBase.replace(
      /<style>[\s\S]*?<\/style>/,
      `<style>${css} .resume-page { width: 8.5in; }</style>`
    );

    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.emulateMediaType('print');

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      preferCSSPageSize: true,
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
