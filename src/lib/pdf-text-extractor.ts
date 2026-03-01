import pdfParse from '@jchaffin/pdf-parse';

// Professional PDF text extractor using pdf-parse library
export async function extractPDFText(file: File): Promise<string> {
  try {
    console.log(
      "Starting PDF text extraction for:",
      file.name,
      "Size:",
      file.size,
    );

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log("Using pdf-parse library for text extraction");

    // Custom render function for better text extraction
    function renderPage(pageData: any) {
      const renderOptions = {
        normalizeWhitespace: true,
        disableCombineTextItems: false,
      };

      return pageData.getTextContent(renderOptions).then(function (
        textContent: any,
      ) {
        let lastY: number | null = null;
        let text = "";

        for (let item of textContent.items) {
          if (lastY === item.transform[5] || !lastY) {
            text += item.str;
          } else {
            text += "\n" + item.str;
          }
          lastY = item.transform[5];
        }
        return text;
      });
    }

    // Use pdf-parse library with custom options
    const data = await pdfParse(buffer, {
      pagerender: renderPage,
      max: 0, // process all pages
      version: "v1.10.100",
    });

    let extractedText = data.text;

    console.log("PDF-parse extracted text length:", extractedText.length);
    console.log("Number of pages:", data.numpages);
    console.log("PDF info:", JSON.stringify(data.info, null, 2));

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error(
        "No text content found in PDF. This may be an image-based PDF that requires OCR.",
      );
    }

    // Clean up the extracted text
    extractedText = extractedText
      .replace(/\r\n/g, "\n") // Normalize line endings
      .replace(/\r/g, "\n") // Handle old Mac line endings
      .replace(/\n{3,}/g, "\n\n") // Limit consecutive newlines
      .replace(/\t/g, " ") // Replace tabs with spaces
      .replace(/[^\x20-\x7E\n]/g, " ") // Replace non-printable chars except newlines
      .replace(/\s+/g, " ") // Normalize multiple spaces
      .replace(/\n\s+/g, "\n") // Remove spaces at start of lines
      .replace(/\s+\n/g, "\n") // Remove spaces at end of lines
      .trim();

    console.log("Final cleaned text length:", extractedText.length);
    console.log(
      "Text preview (first 200 chars):",
      extractedText.substring(0, 200),
    );

    if (extractedText.length < 50) {
      throw new Error(
        "Insufficient text extracted from PDF. Please ensure the PDF contains selectable text, not images.",
      );
    }

    return extractedText;
  } catch (error) {
    console.error("PDF text extraction error:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
    throw new Error(
      "Failed to extract text from PDF. Please try copying and pasting your resume text instead.",
    );
  }
}
