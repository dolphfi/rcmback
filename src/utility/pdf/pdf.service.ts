import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { PDFDocument } from 'pdf-lib';

@Injectable()
export class PdfService implements OnModuleInit {
  private readonly logger = new Logger(PdfService.name);

  async generatePdfFromHtml(html: string): Promise<Buffer> {
    let browser;
    try {
      browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // Take a screenshot of the rendered page
      const screenshotBuffer = await page.screenshot({ fullPage: true });

      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      const pageImage = await pdfDoc.embedPng(screenshotBuffer);

      // Get image dimensions and calculate aspect ratio
      const { width, height } = pageImage.scale(1);
      const a4Page = pdfDoc.addPage(); // A4 by default
      const { width: a4Width, height: a4Height } = a4Page.getSize();

      // Scale image to fit A4 page width
      const scale = a4Width / width;
      const scaledWidth = width * scale;
      const scaledHeight = height * scale;

      // Draw the image on the PDF page
      a4Page.drawImage(pageImage, {
        x: 0,
        y: a4Height - scaledHeight,
        width: scaledWidth,
        height: scaledHeight,
      });

      // Save the PDF to a buffer
      const pdfBytes = await pdfDoc.save();

      return Buffer.from(pdfBytes);
    } catch (error) {
      this.logger.error('Failed to generate PDF from screenshot', error.stack);
      throw new Error('Could not generate PDF from screenshot.');
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async onModuleInit() {
    this.logger.log('Validating Puppeteer browser executable...');
    let browser: puppeteer.Browser | null = null;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      this.logger.log('Puppeteer browser validation successful.');
    } catch (error) {
      this.logger.error(
        'Puppeteer browser validation failed. The application cannot generate PDFs.',
        error.stack,
      );
      // This will prevent the application from starting if Puppeteer is not configured correctly.
      throw new Error(
        'Puppeteer validation failed. Check system dependencies (e.g., Chromium) and configuration.',
      );
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
