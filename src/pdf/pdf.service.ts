import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as PDFDocument from 'pdfkit';
import axios from 'axios';
import * as QRCode from 'qrcode';
import { PointOfSale } from '../point-of-sale/entities/point-of-sale.entity';
import { Setting } from '../settings/entities/setting.entity';
import { Sale } from '../sales/entities/sale.entity';

@Injectable()
export class PdfService {
    constructor(
        @InjectRepository(PointOfSale)
        private readonly posRepository: Repository<PointOfSale>,
        @InjectRepository(Setting)
        private readonly settingRepository: Repository<Setting>,
        @InjectRepository(Sale)
        private readonly saleRepository: Repository<Sale>,
    ) { }

    async generateReceiptPreview(template: string, posId: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            // Create a document with a typical receipt width
            // 80mm width is approximately 226 point
            const doc = new PDFDocument({
                margin: 10,
                size: [226, 800], // Long enough for dummy content
            });

            const buffers: Buffer[] = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            let businessLogo: string | Buffer | null = 'logo pa disponib';
            let businessName = 'Magazen Kolabo (Defo)';
            let businessSlogan = 'Pi bon pri nan tout katye a';
            let address = 'Adrès Entrepriz la';
            let phone = 'Nimewo Telefòn';
            let email = 'kolabopos@kolabo.com';
            let footerMessage = 'Mèsi pase vizite nou!';
            let taxRate = 10;
            let posName = 'Kès Preview';
            let cashier = 'Jean Pierre';
            let customer = 'Walk-in (Apesi)';

            // 1. Fetch Real Settings Data (Company Info, Tax, Footer)
            this.settingRepository.find().then(settings => {
                const settingsMap = settings.reduce((acc, current) => ({ ...acc, [current.key]: current.value }), {});
                if (settingsMap['BUSINESS_LOGO_URL']) businessLogo = settingsMap['BUSINESS_LOGO_URL'];
                if (settingsMap['BUSINESS_NAME']) businessName = settingsMap['BUSINESS_NAME'];
                if (settingsMap['BUSINESS_SLOGAN']) businessSlogan = settingsMap['BUSINESS_SLOGAN'];
                if (settingsMap['BUSINESS_EMAIL']) email = settingsMap['BUSINESS_EMAIL'];
                if (settingsMap['BUSINESS_ADDRESS']) address = settingsMap['BUSINESS_ADDRESS'];
                if (settingsMap['BUSINESS_PHONE']) phone = settingsMap['BUSINESS_PHONE'];
                if (settingsMap['RECEIPT_FOOTER_MESSAGE']) footerMessage = settingsMap['RECEIPT_FOOTER_MESSAGE'];
                if (settingsMap['TAX_PERCENTAGE']) taxRate = parseFloat(settingsMap['TAX_PERCENTAGE']);

                // 2. Fetch Point of Sale specific data
                let posPromise = Promise.resolve(null as PointOfSale | null);
                if (posId && posId !== 'none' && posId !== 'undefined') {
                    posPromise = this.posRepository.findOne({ where: { id: posId } });
                }

                return posPromise.then(async pos => {
                    if (pos) {
                        posName = pos.name;
                    }

                    if (typeof businessLogo === 'string' && businessLogo.startsWith('http')) {
                        console.log(`[PdfService] Attempting to fetch logo from: ${businessLogo}`);
                        // PDFKit only supports JPEG and PNG. WebP will crash it.
                        if (businessLogo.toLowerCase().endsWith('.webp')) {
                            console.log(`[PdfService] Skipping unsupported WebP format: ${businessLogo}`);
                            businessLogo = null;
                        } else {
                            try {
                                const res = await axios.get(businessLogo, { responseType: 'arraybuffer' });
                                businessLogo = Buffer.from(res.data) as any;
                                console.log(`[PdfService] Successfully fetched logo Buffer`);
                            } catch (e) {
                                console.error(`[PdfService] Failed to load logo from ${businessLogo}:`, e.message);
                                businessLogo = null;
                            }
                        }
                    } else {
                        businessLogo = null;
                    }

                    // Dummy Transaction Data for Preview
                    const receiptNo = `PREV-${Date.now().toString().slice(-6)}`;
                    const date = new Date().toLocaleString('fr-HT');

                    const items = [
                        { qty: 2, name: 'Boutèy Dlo', price: 50, total: 100 },
                        { qty: 1, name: 'Sik Granile 1kg', price: 150, total: 150 },
                        { qty: 3, name: 'Savon Lave', price: 25, total: 75 },
                    ];

                    const subtotal = 325;
                    const tax = subtotal * (taxRate / 100);
                    const total = subtotal + tax;

                    // Generate QR Code Buffer
                    let qrCodeBuffer: Buffer | null = null;
                    try {
                        const baseUrl = process.env.FRONTEND_URL;
                        const qrText = `${baseUrl}/receipt/${receiptNo}`;
                        qrCodeBuffer = await QRCode.toBuffer(qrText, { margin: 1, width: 80 });
                    } catch (e) {
                        console.error('Failed to generate QR Code', e);
                    }

                    if (template === 'minimal') {
                        this.renderMinimal(doc, { businessLogo: businessLogo as any, businessName, date, posName, cashier, customer, items, total, footer: footerMessage, qrCodeBuffer });
                    } else {
                        // Default is standard
                        this.renderStandard(doc, { businessLogo: businessLogo as any, businessName, address, phone, email, businessSlogan, posName, receiptNo, date, cashier, customer, items, subtotal, tax, total, footer: footerMessage, qrCodeBuffer });
                    }

                    doc.end();
                });
            }).catch(err => reject(err));
        });
    }

    async generateSaleReceipt(saleId: string, templateOverride?: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({
                margin: 10,
                size: [226, 800], // Will be dynamically adjusted by PDFKit, but acts as a max
            });

            const buffers: Buffer[] = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            let businessLogo: string | Buffer | null = 'logo pa disponib';
            let businessName = 'Magazen Kolabo (Defo)';
            let businessSlogan = 'Pi bon pri nan tout katye a';
            let address = 'Adrès Entrepriz la';
            let phone = 'Nimewo Telefòn';
            let email = 'kolabopos@kolabo.com';
            let footerMessage = 'Mèsi pase vizite nou!';

            // 1. Fetch Real Settings Data
            this.settingRepository.find().then(async settings => {
                const settingsMap = settings.reduce((acc, current) => ({ ...acc, [current.key]: current.value }), {});
                if (settingsMap['BUSINESS_LOGO_URL']) businessLogo = settingsMap['BUSINESS_LOGO_URL'];
                if (settingsMap['BUSINESS_NAME']) businessName = settingsMap['BUSINESS_NAME'];
                if (settingsMap['BUSINESS_SLOGAN']) businessSlogan = settingsMap['BUSINESS_SLOGAN'];
                if (settingsMap['BUSINESS_EMAIL']) email = settingsMap['BUSINESS_EMAIL'];
                if (settingsMap['BUSINESS_ADDRESS']) address = settingsMap['BUSINESS_ADDRESS'];
                if (settingsMap['BUSINESS_PHONE']) phone = settingsMap['BUSINESS_PHONE'];
                if (settingsMap['RECEIPT_FOOTER_MESSAGE']) footerMessage = settingsMap['RECEIPT_FOOTER_MESSAGE'];

                // 2. Fetch the Sale
                const sale = await this.saleRepository.findOne({
                    where: { id: saleId },
                    relations: ['pos', 'cashier', 'items', 'customer']
                });

                if (!sale) {
                    reject(new NotFoundException(`Sale with ID ${saleId} not found`));
                    return;
                }

                if (typeof businessLogo === 'string' && businessLogo.startsWith('http')) {
                    if (businessLogo.toLowerCase().endsWith('.webp')) {
                        businessLogo = null;
                    } else {
                        try {
                            const res = await axios.get(businessLogo, { responseType: 'arraybuffer' });
                            businessLogo = Buffer.from(res.data) as any;
                        } catch (e) {
                            businessLogo = null;
                        }
                    }
                } else {
                    businessLogo = null;
                }

                const receiptNo = sale.receiptNumber;
                const date = new Date(sale.createdAt).toLocaleString('fr-HT');
                const posName = sale.pos?.name || 'Kès';
                const cashier = sale.cashier ? `${sale.cashier.firstName} ${sale.cashier.lastName}` : 'N/A';
                const customer = sale.customer ? `${sale.customer.firstName} ${sale.customer.lastName}` : 'Walk-in';

                // Determine template priority: Override > POS setting > 'standard'
                const template = templateOverride || sale.pos?.receiptTemplate || 'standard';

                // Format items
                const formattedItems = sale.items.map(item => ({
                    qty: item.qty,
                    name: item.name,
                    price: Number(item.price),
                    total: Number(item.total)
                }));

                // Generate QR Code Buffer
                let qrCodeBuffer: Buffer | null = null;
                try {
                    const baseUrl = process.env.FRONTEND_URL;
                    const qrText = `${baseUrl}/receipt/${receiptNo}`;
                    qrCodeBuffer = await QRCode.toBuffer(qrText, { margin: 1, width: 80 });
                } catch (e) {
                    console.error('Failed to generate QR Code', e);
                }

                const data = {
                    businessLogo: businessLogo as any,
                    businessName,
                    address,
                    phone,
                    email,
                    businessSlogan,
                    posName,
                    receiptNo,
                    date,
                    cashier,
                    customer,
                    items: formattedItems,
                    subtotal: Number(sale.subtotal),
                    tax: Number(sale.tax),
                    total: Number(sale.total),
                    footer: footerMessage,
                    qrCodeBuffer
                };

                if (template === 'minimal') {
                    this.renderMinimal(doc, data);
                } else {
                    this.renderStandard(doc, data);
                }

                doc.end();

            }).catch(err => reject(err));
        });
    }

    private renderStandard(doc: PDFKit.PDFDocument, data: any) {
        if (data.businessLogo && Buffer.isBuffer(data.businessLogo)) {
            try {
                // Center a 50px wide logo
                doc.image(data.businessLogo, (doc.page.width - 50) / 2, doc.y, { width: 50 });
                doc.moveDown();
            } catch (e) {
                console.error('Error drawing standard logo', e);
            }
        }

        doc.moveDown(2.8);
        doc.font('Helvetica-Bold').fontSize(14).text(data.businessName, { align: 'center' });
        doc.font('Helvetica').fontSize(10).text(data.businessSlogan, { align: 'center' });
        doc.font('Helvetica').fontSize(10).text(data.address, { align: 'center' });
        doc.text(data.phone + " | " + data.email, { align: 'center' });
        doc.moveDown();

        doc.text("---------------------------------------------------", { align: 'center' });
        doc.text(`Magazen: ${data.posName}`);
        doc.text(`# Resi: ${data.receiptNo}`);
        doc.text(`Dat: ${data.date}`);
        doc.text(`Vandè: ${data.cashier}`);
        doc.text(`Kliyan: ${data.customer}`);
        doc.moveDown();

        // Line separator
        doc.moveTo(10, doc.y).lineTo(216, doc.y).stroke();
        doc.moveDown(0.5);

        // Table Header
        const currentY = doc.y;
        doc.font('Helvetica-Bold').fontSize(9);
        doc.text('Qte', 10, currentY, { width: 20 });
        doc.text('Atik', 30, currentY, { width: 85 });
        doc.text('Pri', 115, currentY, { width: 45, align: 'right' });
        doc.text('Total', 160, currentY, { width: 56, align: 'right' });
        doc.moveDown(0.5);

        // Items
        doc.font('Helvetica').fontSize(9);
        data.items.forEach(item => {
            const y = doc.y;
            doc.text(item.qty.toString(), 10, y, { width: 20 });
            doc.text(item.name, 30, y, { width: 85 });
            doc.text(item.price.toFixed(2), 115, y, { width: 45, align: 'right' });
            doc.text(item.total.toFixed(2), 160, y, { width: 56, align: 'right' });
        });
        doc.moveDown(0.5);

        // Line separator
        doc.moveTo(10, doc.y).lineTo(216, doc.y).stroke();
        doc.moveDown(0.5);

        // Totals
        let totalY = doc.y;
        doc.font('Helvetica').fontSize(9);
        doc.text('Sou-Total:', 84, totalY, { width: 70, align: 'right' });
        doc.text(data.subtotal.toFixed(2), 154, totalY, { width: 62, align: 'right' });
        doc.moveDown(0.5);

        totalY = doc.y;
        doc.text('Taks (10%):', 84, totalY, { width: 70, align: 'right' });
        doc.text(data.tax.toFixed(2), 154, totalY, { width: 62, align: 'right' });
        doc.moveDown(0.5);

        totalY = doc.y;
        doc.font('Helvetica-Bold').fontSize(12);
        doc.text('TOTAL:', 84, totalY, { width: 70, align: 'right' });
        doc.text(data.total.toFixed(2), 154, totalY, { width: 62, align: 'right' });
        doc.font('Helvetica').fontSize(9);
        doc.moveDown();

        // Footer
        if (data.qrCodeBuffer) {
            try {
                // Center a 60px wide QR code
                doc.image(data.qrCodeBuffer, (doc.page.width - 60) / 2, doc.y, { width: 60 });
                doc.y += 65; // adjust Y to move below the image manually
            } catch (e) {
                console.error('Error drawing standard QR', e);
            }
        }

        doc.text(data.footer, 10, doc.y, { align: 'center' });
    }

    private renderMinimal(doc: PDFKit.PDFDocument, data: any) {
        if (data.businessLogo && Buffer.isBuffer(data.businessLogo)) {
            try {
                doc.image(data.businessLogo, (doc.page.width - 40) / 2, doc.y, { width: 40 });
                doc.moveDown();
            } catch (e) {
                console.error('Error drawing minimal logo', e);
            }
        }

        doc.moveDown(2.5);
        doc.font('Helvetica-Bold').fontSize(12).text(data.businessName, { align: 'center' });
        doc.font('Helvetica').fontSize(9).text(data.date, { align: 'center' });
        doc.text(`Kliyan: ${data.customer}`, { align: 'center' });
        doc.moveDown();

        // Items - Simple format "Qty x Name ....... Total"
        doc.font('Helvetica').fontSize(9);
        data.items.forEach(item => {
            const y = doc.y;
            doc.text(`${item.qty} x ${item.name}`, 10, y, { width: 140 });
            doc.text(item.total.toFixed(2), 150, y, { width: 66, align: 'right' });
        });
        doc.moveDown(0.5);

        // Line separator
        doc.moveTo(10, doc.y).lineTo(216, doc.y).stroke();
        doc.moveDown(0.5);

        doc.font('Helvetica-Bold').fontSize(12);
        const totalY = doc.y;
        doc.text('TOTAL:', 10, totalY, { width: 140 });
        doc.text(data.total.toFixed(2), 150, totalY, { width: 66, align: 'right' });
        doc.font('Helvetica').fontSize(9);
        doc.moveDown();

        if (data.qrCodeBuffer) {
            try {
                // Center a 60px wide QR code
                doc.image(data.qrCodeBuffer, (doc.page.width - 60) / 2, doc.y, { width: 60 });
                doc.y += 65; // adjust Y to move below the image manually
            } catch (e) {
                console.error('Error drawing minimal QR', e);
            }
        }

        doc.text(data.footer, 10, doc.y, { align: 'center' });
    }
}
