import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientService } from '../../core/api/api-client.service';
import { AppConfigStore } from '../../core/config/app-config.store';
import { CrudApiService } from '../crud';
import { StoredDocumentService } from '../../components/features/accounting/data/stored-document';
import { GstReconciliationService } from '../../components/features/gst/data/gst-reconciliation/gst-reconciliation.service';
import { BranchSaleInvoiceTemplateService } from '../../components/features/management/data/branch';
import { FiscalYearService } from '../../components/features/management/data/fiscal-year';
import { OrganizationService } from '../../components/features/management/data/organization';
import { InvoiceDocumentService } from '../../components/features/trading/data/invoice-document';
import { SignedUrlUploadService } from './signed-url-upload.service';
import {
  SignedUrlDownloadService,
  type SignedDownloadUrlResponse,
} from './signed-url-download.service';

const response: SignedDownloadUrlResponse = {
  getUrl: 'https://s3.example.test/download',
  expiresIn: 3600,
};

describe('document download endpoint contracts', () => {
  const get = vi.fn(async (_endpoint: string) => response);

  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        StoredDocumentService,
        FiscalYearService,
        InvoiceDocumentService,
        GstReconciliationService,
        BranchSaleInvoiceTemplateService,
        OrganizationService,
        { provide: SignedUrlDownloadService, useValue: { get } },
        { provide: SignedUrlUploadService, useValue: {} },
        { provide: ApiClientService, useValue: {} },
        { provide: AppConfigStore, useValue: {} },
        { provide: CrudApiService, useValue: {} },
        { provide: HttpClient, useValue: {} },
      ],
    });
  });

  it('uses the stored and fiscal-year document endpoints', async () => {
    await expect(
      TestBed.inject(StoredDocumentService).getDownloadUrl('stored/id'),
    ).resolves.toBe(response);
    expect(get).toHaveBeenLastCalledWith(
      '/storage/stored-document/stored%2Fid/download-url',
    );

    await expect(
      TestBed.inject(FiscalYearService).getDocumentDownloadUrl('fiscal id'),
    ).resolves.toBe(response);
    expect(get).toHaveBeenLastCalledWith(
      '/storage/fiscal-year-document/fiscal%20id/download-url',
    );
  });

  it('always generates stored-document download URLs from the document id', async () => {
    await expect(
      TestBed.inject(StoredDocumentService).getDownloadUrl('/gst-reconciliation/gstr1/4/download-url'),
    ).resolves.toBe(response);
    expect(get).toHaveBeenLastCalledWith(
      '/storage/stored-document/%2Fgst-reconciliation%2Fgstr1%2F4%2Fdownload-url/download-url',
    );
  });

  it.each([
    ['saleInvoice', '/inventory/sale-invoice'],
    ['purchaseInvoice', '/inventory/purchase-invoice'],
    ['purchaseReturn', '/inventory/purchase-return'],
    ['journal', '/accounting/journal'],
  ] as const)('uses the %s attachment endpoint', async (resourceType, endpoint) => {
    await expect(
      TestBed.inject(InvoiceDocumentService).getDownloadUrl(
        resourceType,
        'parent/id',
        'document id',
      ),
    ).resolves.toBe(response);
    expect(get).toHaveBeenLastCalledWith(
      `${endpoint}/parent%2Fid/documents/document%20id/download-url`,
    );
  });

  it('uses the GST reconciliation endpoint', async () => {
    await expect(
      TestBed.inject(GstReconciliationService).getDownloadUrl('gstr2b', 4),
    ).resolves.toBe(response);
    expect(get).toHaveBeenLastCalledWith('/gst-reconciliation/gstr2b/4/download-url');
  });

  it('uses the sale invoice template endpoint', async () => {
    await expect(
      TestBed.inject(BranchSaleInvoiceTemplateService).getDownloadUrl('two-tax'),
    ).resolves.toBe(response);
    expect(get).toHaveBeenLastCalledWith(
      '/inventory/sale-invoice/templates/two-tax/download-url',
    );
  });

  it.each(['small', 'normal'] as const)('uses the organization %s logo endpoint', async (variant) => {
    await expect(
      TestBed.inject(OrganizationService).getLogoReadUrl('organization/id', variant),
    ).resolves.toBe(response);
    expect(get).toHaveBeenLastCalledWith(
      `/organization/organization/organization%2Fid/logo/${variant}/url`,
    );
  });
});
