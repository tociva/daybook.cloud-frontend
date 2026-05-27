import { Injectable, inject } from '@angular/core';
import { getApiErrorMessage } from '../../../../../core/api/api-error.util';
import { DateManagementService } from '../../../../../core/date/date-management.service';
import { BranchSaleInvoiceTemplateService } from '../../../management/data/branch';
import type { SaleInvoiceTemplateType } from '../../../management/data/branch';
import { OrganizationService } from '../../../management/data/organization';
import { UserSessionStore } from '../../../management/data/user-session/user-session.store';
import type { SaleInvoice, SaleItem, SaleItemTax } from './sale-invoice.model';
import { SALE_INVOICE_DETAIL_INCLUDES } from './sale-invoice.model';
import { SaleInvoiceService } from './sale-invoice.service';

type TemplateAddress = Readonly<{
  line1?: string;
  line2?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  pincode?: string;
  country?: string;
  mobile?: string;
  email?: string;
  name?: string;
}>;

@Injectable({ providedIn: 'root' })
export class SaleInvoicePrintService {
  private static readonly itemsStartToken = '[[items_start]]';
  private static readonly itemsEndToken = '[[items_end]]';

  private readonly dateManagement = inject(DateManagementService);
  private readonly organizationService = inject(OrganizationService);
  private readonly saleInvoiceService = inject(SaleInvoiceService);
  private readonly templateService = inject(BranchSaleInvoiceTemplateService);
  private readonly userSessionStore = inject(UserSessionStore);

  async previewInvoicePdf(source: SaleInvoice | string): Promise<void> {
    const printWindow = this.openPreviewWindow();
    this.writeLoading(printWindow);

    try {
      const invoice = await this.resolveInvoice(source);
      const templateType = this.resolveTemplateType(invoice);
      const templateHtml = await this.templateService.getEffectiveTemplateHtml(templateType);
      const logoSources = await this.resolveLogoSources();
      const html = this.fillTemplate(templateHtml, invoice, logoSources);
      const fileName = `invoice-${this.safeFileName(invoice.number || invoice.id || 'download')}`;

      this.writePrintDocument(printWindow, html, fileName);
    } catch (error) {
      this.writeError(printWindow, getApiErrorMessage(error, 'Failed to prepare invoice PDF.'));
      throw error;
    }
  }

  private async resolveInvoice(source: SaleInvoice | string): Promise<SaleInvoice> {
    if (typeof source === 'string') {
      return this.saleInvoiceService.getById(source, { includes: SALE_INVOICE_DETAIL_INCLUDES });
    }

    if (source.id && (!source.items?.length || !source.customer)) {
      return this.saleInvoiceService.getById(source.id, { includes: SALE_INVOICE_DETAIL_INCLUDES });
    }

    return source;
  }

  private fillTemplate(
    html: string,
    invoice: SaleInvoice,
    logoSources: Record<'normal' | 'small', string>,
  ): string {
    const session = this.userSessionStore.session();
    const branch = session?.branch ?? null;
    const organization = branch?.organization ?? session?.organization ?? null;
    const customerAddress = (invoice.billingaddress ??
      invoice.customer?.address ??
      null) as TemplateAddress | null;
    const shippingAddress = (invoice.shippingaddress ?? null) as TemplateAddress | null;
    const currencyCode =
      invoice.currencycode ?? invoice.currency?.code ?? branch?.currencycode ?? 'INR';

    let filledHtml = this.fillRepeatingBlock(
      html,
      SaleInvoicePrintService.itemsStartToken,
      SaleInvoicePrintService.itemsEndToken,
      (invoice.items ?? []).map((item, index) =>
        this.itemTemplateValues(item, index, currencyCode),
      ),
    );

    filledHtml = this.replacePlaceholders(filledHtml, {
      invoice_id: invoice.id,
      invoice_number: invoice.number,
      invoice_date: this.formatDate(invoice.date),
      payment_due_date: this.formatDate(invoice.duedate),
      due_date: this.formatDate(invoice.duedate),

      customer_name: invoice.customer?.name ?? customerAddress?.name,
      customer_address: this.formatAddress(customerAddress),
      customer_address_line1: customerAddress?.line1,
      customer_address_line2: customerAddress?.line2,
      customer_city: customerAddress?.city,
      customer_state: customerAddress?.state ?? invoice.customer?.state,
      customer_zip: customerAddress?.zip,
      customer_country: customerAddress?.country,
      customer_phone: customerAddress?.mobile ?? invoice.customer?.mobile,
      customer_mobile: customerAddress?.mobile ?? invoice.customer?.mobile,
      customer_email: customerAddress?.email ?? invoice.customer?.email,
      customer_gstin: invoice.customer?.gstin,

      billing_name: customerAddress?.name,
      billing_address: this.formatAddress(customerAddress),
      shipping_name: shippingAddress?.name,
      shipping_address: this.formatAddress(shippingAddress),

      org_name: organization?.name ?? branch?.name,
      org_address: this.formatAddress(organization?.address ?? branch?.address ?? null),
      org_phone: organization?.mobile ?? branch?.mobile,
      org_mobile: organization?.mobile ?? branch?.mobile,
      org_email: organization?.email ?? branch?.email,

      branch_name: branch?.name,
      branch_address: this.formatAddress(branch?.address ?? null),
      branch_phone: branch?.mobile,
      branch_mobile: branch?.mobile,
      branch_email: branch?.email,
      branch_gstin: branch?.gstin,

      currency_code: currencyCode,
      itemtotal: this.formatAmount(invoice.itemtotal),
      item_total: this.formatAmount(invoice.itemtotal),
      discount: this.formatAmount(invoice.discount),
      subtotal: this.formatAmount(invoice.subtotal),
      tax_amount: this.formatAmount(invoice.tax),
      tax: this.formatAmount(invoice.tax),
      roundoff: this.formatAmount(invoice.roundoff),
      round_off: this.formatAmount(invoice.roundoff),
      grand_total: this.formatAmount(invoice.grandtotal),
      grandtotal: this.formatAmount(invoice.grandtotal),
      grand_total_inwords: this.convertAmountToWords(
        invoice.grandtotal ?? 0,
        currencyCode,
        branch?.countrycode,
      ),
      description: invoice.description,

      logo_small_src: logoSources.small,
      logo_large_src: logoSources.normal,
    });

    return filledHtml;
  }

  private itemTemplateValues(
    item: SaleItem,
    index: number,
    currencyCode: string,
  ): Record<string, string | number | null | undefined> {
    const taxes = [...(item.taxes ?? [])];
    const taxByName = (name: string): SaleItemTax | undefined =>
      taxes.find(
        (tax) => tax.shortname?.toLowerCase() === name || tax.name?.toLowerCase() === name,
      );
    const firstTax = taxes[0];
    const secondTax = taxes[1];
    const cgst = taxByName('cgst');
    const sgst = taxByName('sgst');
    const igst = taxByName('igst');

    return {
      item_index: index + 1,
      item_name: item.displayname || item.name,
      item_description: item.description,
      item_code: item.code,
      item_quantity: item.quantity,
      item_price: this.formatAmount(item.price),
      item_total: this.formatAmount(item.itemtotal),
      item_discount: this.formatAmount(item.discamount),
      item_discount_percent: this.formatAmount(item.discpercent),
      item_subtotal: this.formatAmount(item.subtotal),
      item_tax: this.formatAmount(item.taxamount),
      item_tax1_name: firstTax?.shortname || firstTax?.name,
      item_tax1_rate: this.formatAmount(firstTax?.rate),
      item_tax1_amount: this.formatAmount(firstTax?.amount),
      item_tax2_name: secondTax?.shortname || secondTax?.name,
      item_tax2_rate: this.formatAmount(secondTax?.rate),
      item_tax2_amount: this.formatAmount(secondTax?.amount),
      item_cgst: this.formatAmount(cgst?.amount ?? firstTax?.amount),
      item_cgst_rate: this.formatAmount(cgst?.rate ?? firstTax?.rate),
      item_sgst: this.formatAmount(sgst?.amount ?? secondTax?.amount),
      item_sgst_rate: this.formatAmount(sgst?.rate ?? secondTax?.rate),
      item_igst: this.formatAmount(igst?.amount),
      item_igst_rate: this.formatAmount(igst?.rate),
      item_amount: this.formatAmount(item.grandtotal),
      item_grandtotal: this.formatAmount(item.grandtotal),
      currency_code: currencyCode,
    };
  }

  private resolveTemplateType(invoice: SaleInvoice): SaleInvoiceTemplateType {
    const maxTaxColumns = Math.max(
      0,
      ...(invoice.items ?? []).map(
        (item) => item.taxes?.filter((tax) => (tax.amount ?? 0) !== 0).length ?? 0,
      ),
    );

    if (maxTaxColumns >= 2) return 'two-tax';
    if (maxTaxColumns === 1 || (invoice.tax ?? 0) > 0) return 'one-tax';
    return 'no-tax';
  }

  private fillRepeatingBlock(
    html: string,
    startToken: string,
    endToken: string,
    rows: Array<Record<string, string | number | null | undefined>>,
  ): string {
    const regex = new RegExp(
      `${this.escapeRegex(startToken)}([\\s\\S]*?)${this.escapeRegex(endToken)}`,
    );
    const match = html.match(regex);

    if (!match) return html;

    const rowTemplate = match[1];
    const renderedRows = rows.map((row) => this.replacePlaceholders(rowTemplate, row)).join('');

    return html.replace(regex, renderedRows);
  }

  private replacePlaceholders(
    html: string,
    values: Record<string, string | number | null | undefined>,
  ): string {
    return Object.entries(values).reduce((result, [key, value]) => {
      return result.split(`[[${key}]]`).join(this.escapeHtml(value));
    }, html);
  }

  private openPreviewWindow(): Window {
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      throw new Error('Unable to open print preview. Popup may be blocked.');
    }

    try {
      printWindow.opener = null;
    } catch {
      // Some browsers disallow mutating opener; the preview still works.
    }

    return printWindow;
  }

  private writeLoading(printWindow: Window): void {
    printWindow.document.open();
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Preparing invoice PDF</title>
          <style>
            body {
              align-items: center;
              color: #111827;
              display: flex;
              font-family: Arial, sans-serif;
              height: 100vh;
              justify-content: center;
              margin: 0;
            }
          </style>
        </head>
        <body>Preparing invoice PDF...</body>
      </html>
    `);
    printWindow.document.close();
  }

  private writeError(printWindow: Window, message: string): void {
    printWindow.document.open();
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Invoice PDF unavailable</title>
          <style>
            body {
              color: #991b1b;
              font-family: Arial, sans-serif;
              margin: 2rem;
            }
          </style>
        </head>
        <body>${this.escapeHtml(message)}</body>
      </html>
    `);
    printWindow.document.close();
  }

  private writePrintDocument(printWindow: Window, html: string, title: string): void {
    const documentTitle = this.escapeHtml(title || 'Invoice');

    printWindow.document.open();
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${documentTitle}</title>

          <style>
            @page {
              size: A4;
              margin: 12mm;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
            }

            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            table {
              border-collapse: collapse;
            }

            thead {
              display: table-header-group;
            }

            tfoot {
              display: table-footer-group;
            }

            tr,
            td,
            th,
            .avoid-page-break,
            .invoice-summary,
            .invoice-footer,
            .signature-section {
              break-inside: avoid;
              page-break-inside: avoid;
            }

            img {
              max-width: 100%;
            }

            @media print {
              html,
              body {
                background: #ffffff;
              }

              .no-print {
                display: none !important;
              }
            }
          </style>
        </head>

        <body>
          ${html}

          <script>
            window.addEventListener('load', function () {
              window.focus();
              window.print();
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  private formatAddress(address: TemplateAddress | null | undefined): string {
    if (!address) return '';

    return [
      address.line1,
      address.line2,
      address.street,
      address.city,
      address.state,
      address.zip ?? address.pincode,
      address.country,
    ]
      .filter((part): part is string => !!part?.trim())
      .join(', ');
  }

  private formatAmount(value: number | null | undefined): string {
    return Number(value ?? 0).toFixed(2);
  }

  private formatDate(value: string | null | undefined): string {
    return this.dateManagement.formatDisplayDate(value, '');
  }

  private async resolveLogoSources(): Promise<Record<'normal' | 'small', string>> {
    const session = this.userSessionStore.session();
    const organization = session?.branch?.organization ?? session?.organization ?? null;

    const [small, normal] = await Promise.all([
      this.logoSource(organization?.smalllogodocumentid),
      this.logoSource(organization?.normallogodocumentid),
    ]);

    return { small, normal };
  }

  private async logoSource(documentId: string | null | undefined): Promise<string> {
    if (!documentId) return '';

    try {
      const document = await this.organizationService.getLogoDocument(documentId);
      return document.path ?? '';
    } catch {
      return '';
    }
  }

  private escapeHtml(value: unknown): string {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private safeFileName(value: string): string {
    const fileName = value
      .trim()
      .replace(/[\\/:*?"<>|]/g, '-')
      .replace(/\s+/g, ' ')
      .slice(0, 120);

    return fileName || 'download';
  }

  private convertAmountToWords(amount: number, currencyCode: string, countryCode = 'IN'): string {
    const ones = [
      '',
      'One',
      'Two',
      'Three',
      'Four',
      'Five',
      'Six',
      'Seven',
      'Eight',
      'Nine',
      'Ten',
      'Eleven',
      'Twelve',
      'Thirteen',
      'Fourteen',
      'Fifteen',
      'Sixteen',
      'Seventeen',
      'Eighteen',
      'Nineteen',
    ];
    const tens = [
      '',
      '',
      'Twenty',
      'Thirty',
      'Forty',
      'Fifty',
      'Sixty',
      'Seventy',
      'Eighty',
      'Ninety',
    ];
    const numToWords = (value: number): string => {
      if (value === 0) return '';
      if (value < 20) return `${ones[value]} `;
      if (value < 100) {
        return `${tens[Math.floor(value / 10)]}${value % 10 ? ` ${ones[value % 10]}` : ''} `;
      }

      return `${ones[Math.floor(value / 100)]} Hundred ${numToWords(value % 100)}`;
    };
    const { major, minor } = this.currencyNames(currencyCode);
    const wholeAmount = Math.floor(amount);
    const subunit = Math.round((amount - wholeAmount) * 100);
    let result = '';

    if (wholeAmount === 0) {
      result = 'Zero';
    } else if (countryCode === 'IN') {
      const crore = Math.floor(wholeAmount / 10_000_000);
      const lakh = Math.floor((wholeAmount % 10_000_000) / 100_000);
      const thousand = Math.floor((wholeAmount % 100_000) / 1_000);
      const remainder = wholeAmount % 1_000;

      if (crore) result += `${numToWords(crore)}Crore `;
      if (lakh) result += `${numToWords(lakh)}Lakh `;
      if (thousand) result += `${numToWords(thousand)}Thousand `;
      if (remainder) result += numToWords(remainder);
    } else {
      const billion = Math.floor(wholeAmount / 1_000_000_000);
      const million = Math.floor((wholeAmount % 1_000_000_000) / 1_000_000);
      const thousand = Math.floor((wholeAmount % 1_000_000) / 1_000);
      const remainder = wholeAmount % 1_000;

      if (billion) result += `${numToWords(billion)}Billion `;
      if (million) result += `${numToWords(million)}Million `;
      if (thousand) result += `${numToWords(thousand)}Thousand `;
      if (remainder) result += numToWords(remainder);
    }

    result = `${result.trim()} ${major}`;
    if (subunit > 0) result += ` and ${numToWords(subunit).trim()} ${minor}`;

    return `${result} Only`;
  }

  private currencyNames(code: string): { major: string; minor: string } {
    const map: Record<string, { major: string; minor: string }> = {
      AED: { major: 'Dirhams', minor: 'Fils' },
      AUD: { major: 'Dollars', minor: 'Cents' },
      BDT: { major: 'Taka', minor: 'Paisa' },
      CAD: { major: 'Dollars', minor: 'Cents' },
      CHF: { major: 'Francs', minor: 'Centimes' },
      CNY: { major: 'Yuan', minor: 'Jiao' },
      EUR: { major: 'Euros', minor: 'Cents' },
      GBP: { major: 'Pounds', minor: 'Pence' },
      INR: { major: 'Rupees', minor: 'Paise' },
      JPY: { major: 'Yen', minor: 'Sen' },
      LKR: { major: 'Rupees', minor: 'Cents' },
      MYR: { major: 'Ringgit', minor: 'Sen' },
      NPR: { major: 'Rupees', minor: 'Paisa' },
      NZD: { major: 'Dollars', minor: 'Cents' },
      OMR: { major: 'Riyals', minor: 'Baisa' },
      PKR: { major: 'Rupees', minor: 'Paisa' },
      QAR: { major: 'Riyals', minor: 'Dirhams' },
      SAR: { major: 'Riyals', minor: 'Halalah' },
      SGD: { major: 'Dollars', minor: 'Cents' },
      USD: { major: 'Dollars', minor: 'Cents' },
    };

    return map[code] ?? { major: code, minor: 'Cents' };
  }
}
