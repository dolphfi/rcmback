import { Controller, Get, Query, Param, Header, StreamableFile } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PdfService } from './pdf.service';

@ApiTags('PDF')
@Controller('pdf')
export class PdfController {
    constructor(private readonly pdfService: PdfService) { }

    @Get('preview-receipt')
    @ApiOperation({ summary: 'Aperçu du modèle de reçu' })
    @Header('Content-Type', 'application/pdf')
    @Header('Content-Disposition', 'inline; filename="preview.pdf"')
    async previewReceipt(
        @Query('template') template: string,
        @Query('posId') posId?: string,
    ): Promise<StreamableFile> {
        const buffer = await this.pdfService.generateReceiptPreview(template, posId || 'none');
        return new StreamableFile(Uint8Array.from(buffer));
    }

    @Get('receipt/:saleId')
    @ApiOperation({ summary: 'Générer le reçu PDF pour une vente spécifique' })
    @Header('Content-Type', 'application/pdf')
    async getSaleReceipt(
        @Param('saleId') saleId: string,
        @Query('template') template?: string,
    ): Promise<StreamableFile> {
        const buffer = await this.pdfService.generateSaleReceipt(saleId, template);
        return new StreamableFile(Uint8Array.from(buffer));
    }
}
