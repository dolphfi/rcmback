import { Module } from '@nestjs/common';
import { PdfService } from 'src/utility/pdf/pdf.service';

@Module({
  providers: [PdfService],
  exports: [PdfService],
})
export class PdfModule {}
