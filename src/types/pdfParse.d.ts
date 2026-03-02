declare module '@jchaffin/pdf-parse' {
  interface PDFData {
    text: string;
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    version: string;
  }

  interface PDFOptions {
    pagerender?: (pageData: any) => Promise<string>;
    max?: number;
    version?: string;
  }

  function pdfParse(buffer: Buffer, options?: PDFOptions): Promise<PDFData>;
  export = pdfParse;
}