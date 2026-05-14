import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import dayjs from 'dayjs';
import { ActivatedRoute } from '@angular/router';
import {
  TngCardActionsComponent,
  TngCardComponent,
  TngCardContentComponent,
  TngCardDescriptionComponent,
  TngCardFooterComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
  TngDatepickerComponent,
  TngError,
  TngFormFieldComponent,
  TngInputComponent,
  TngLabelComponent,
} from '@tailng-ui/components';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlCreateButtonComponent } from '../../../../../../shared/burl-create-button/burl-create-button.component';
import { DatepickerDateAdapterService } from '../../../../../../core/date/datepicker-date-adapter.service';
import { CurrencyStore } from '../../../data/currency/currency.store';
import type { Currency } from '../../../data/currency/currency.model';
import { BranchStore } from '../../../data/branch';
import type { Branch } from '../../../data/branch';
import { FiscalYearFacade, FiscalYearStore } from '../../../data/fiscal-year';
import type { FiscalYearPayload } from '../../../data/fiscal-year';

@Component({
  selector: 'app-create-fiscal-year',
  standalone: true,
  imports: [
    TngCardActionsComponent,
    TngCardComponent,
    TngCardContentComponent,
    TngCardDescriptionComponent,
    TngCardFooterComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    TngDatepickerComponent,
    TngError,
    TngFormFieldComponent,
    TngInputComponent,
    TngLabelComponent,
    BurlBackButtonComponent,
    BurlCreateButtonComponent,
  ],
  templateUrl: './create-fiscal-year.component.html',
  styleUrl: './create-fiscal-year.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateFiscalYearComponent implements AfterViewInit {
  @ViewChild('nameInputRef', { read: ElementRef }) private nameInputRef!: ElementRef;
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(FiscalYearFacade);
  protected readonly datepickerAdapter = inject(DatepickerDateAdapterService);
  protected readonly fiscalYearStore = inject(FiscalYearStore);
  protected readonly currencyStore = inject(CurrencyStore);
  protected readonly branchStore = inject(BranchStore);

  protected readonly id = signal<string | null>(null);
  protected readonly submitted = signal(false);
  protected readonly isSubmitting = signal(false);

  // ── Form fields ───────────────────────────────────────────────────────────
  protected readonly name = signal('');
  protected readonly startdate = signal('');
  protected readonly enddate = signal('');
  protected readonly jnumber = signal('<<YYYY>>/<<SERIAL5>>');
  protected readonly freezetill = signal('');

  // ── Currency autocomplete ─────────────────────────────────────────────────
  protected readonly selectedCurrency = signal<Currency | null>(null);
  protected readonly currencySearch = signal('');
  protected readonly showCurrencyDropdown = signal(false);

  protected readonly filteredCurrencies = computed(() => {
    const q = this.currencySearch().toLowerCase().trim();
    const all = this.currencyStore.currencies();
    if (!q) return all.slice(0, 20);
    return all
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.symbol.includes(q),
      )
      .slice(0, 20);
  });

  // ── Branch autocomplete ───────────────────────────────────────────────────
  protected readonly selectedBranch = signal<Branch | null>(null);
  protected readonly branchSearch = signal('');
  protected readonly showBranchDropdown = signal(false);

  protected readonly filteredBranches = computed(() => {
    const q = this.branchSearch().toLowerCase().trim();
    const all = this.branchStore.items();
    if (!q) return all.slice(0, 20);
    return all
      .filter(
        (b) =>
          (b.name ?? '').toLowerCase().includes(q) || (b.email ?? '').toLowerCase().includes(q),
      )
      .slice(0, 20);
  });

  // ── Derived ───────────────────────────────────────────────────────────────
  protected readonly mode = computed(() => (this.id() ? 'edit' : 'create'));
  protected readonly title = computed(() =>
    this.mode() === 'edit' ? 'Edit Fiscal Year' : 'New Fiscal Year',
  );
  protected readonly subtitle = computed(() =>
    this.mode() === 'edit'
      ? 'Update fiscal year details.'
      : 'Fill in the details to create a new fiscal year.',
  );

  // ── Validation ────────────────────────────────────────────────────────────
  protected readonly nameError = computed(() =>
    this.submitted() && this.name().trim() === '' ? 'Name is required.' : null,
  );
  protected readonly startdateError = computed(() =>
    this.submitted() && this.startdate().trim() === '' ? 'Start date is required.' : null,
  );
  protected readonly enddateError = computed((): string | null => {
    if (!this.submitted()) return null;
    if (this.enddate().trim() === '') return 'End date is required.';
    if (this.startdate().trim() && this.enddate() <= this.startdate()) {
      return 'End date must be after start date.';
    }
    return null;
  });
  protected readonly jnumberError = computed(() =>
    this.submitted() && this.jnumber().trim() === '' ? 'Journal number format is required.' : null,
  );
  protected readonly currencyError = computed(() =>
    this.submitted() && !this.selectedCurrency() ? 'Currency is required.' : null,
  );
  protected readonly branchError = computed(() =>
    this.submitted() && !this.selectedBranch() ? 'Branch is required.' : null,
  );
  protected readonly hasErrors = computed(
    () =>
      this.nameError() !== null ||
      this.startdateError() !== null ||
      this.enddateError() !== null ||
      this.jnumberError() !== null ||
      this.currencyError() !== null ||
      this.branchError() !== null,
  );

  constructor() {
    void this.currencyStore.load();
    void this.branchStore.loadBranches();
    void this.loadInitialState();
  }

  ngAfterViewInit(): void {
    this.nameInputRef?.nativeElement.querySelector('input')?.focus();
  }

  private async loadInitialState(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.id.set(id);
      const fy = await this.fiscalYearStore.loadFiscalYearById(id, {
        includes: ['branch', 'currency'],
      });
      if (fy) {
        this.name.set(fy.name ?? '');
        this.startdate.set(fy.startdate ?? '');
        this.enddate.set(fy.enddate ?? '');
        this.jnumber.set(fy.jnumber ?? '<<YYYY>>/<<SERIAL5>>');
        this.freezetill.set(fy.freezetill ?? '');

        const currency = this.currencyStore.currencies().find((c) => c.code === fy.currencycode);
        if (currency) {
          this.selectedCurrency.set(currency);
          this.currencySearch.set(`${currency.name} (${currency.symbol})`);
        }

        if (fy.branch) {
          this.selectedBranch.set(fy.branch);
          this.branchSearch.set(fy.branch.name ?? '');
        }
      }
    }
  }

  // ── Currency handlers ─────────────────────────────────────────────────────
  protected onCurrencyInput(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.currencySearch.set(v);
    this.showCurrencyDropdown.set(true);
    if (!v.trim()) this.selectedCurrency.set(null);
  }

  protected selectCurrency(currency: Currency): void {
    this.selectedCurrency.set(currency);
    this.currencySearch.set(`${currency.name} (${currency.symbol})`);
    this.showCurrencyDropdown.set(false);
  }

  protected onCurrencyBlur(): void {
    this.showCurrencyDropdown.set(false);
  }

  // ── Branch handlers ───────────────────────────────────────────────────────
  protected onBranchInput(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.branchSearch.set(v);
    this.showBranchDropdown.set(true);
    if (!v.trim()) this.selectedBranch.set(null);
  }

  protected selectBranch(branch: Branch): void {
    this.selectedBranch.set(branch);
    this.branchSearch.set(branch.name ?? '');
    this.showBranchDropdown.set(false);
    // Auto-fill currency from branch if not already selected
    if (!this.selectedCurrency() && branch.currencycode) {
      const currency = this.currencyStore.currencies().find((c) => c.code === branch.currencycode);
      if (currency) {
        this.selectedCurrency.set(currency);
        this.currencySearch.set(`${currency.name} (${currency.symbol})`);
      }
    }
  }

  protected onBranchBlur(): void {
    this.showBranchDropdown.set(false);
  }

  // ── Date handlers ─────────────────────────────────────────────────────────
  protected onStartdateChange(value: unknown): void {
    if (typeof value === 'string') this.startdate.set(value);
    else this.startdate.set(dayjs(value as Date).format('YYYY-MM-DD'));
  }

  protected onEnddateChange(value: unknown): void {
    if (typeof value === 'string') this.enddate.set(value);
    else this.enddate.set(dayjs(value as Date).format('YYYY-MM-DD'));
  }

  protected onFreezetillChange(value: unknown): void {
    if (!value) {
      this.freezetill.set('');
      return;
    }
    if (typeof value === 'string') this.freezetill.set(value);
    else this.freezetill.set(dayjs(value as Date).format('YYYY-MM-DD'));
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  protected async submitForm(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (this.isSubmitting()) return;

    this.submitted.set(true);
    if (this.hasErrors()) return;

    this.isSubmitting.set(true);
    const payload: FiscalYearPayload = {
      name: this.name().trim(),
      startdate: this.startdate().trim(),
      enddate: this.enddate().trim(),
      jnumber: this.jnumber().trim(),
      currencycode: this.selectedCurrency()!.code,
      branchid: this.selectedBranch()!.id!,
      ...(this.freezetill().trim() && { freezetill: this.freezetill().trim() }),
    };

    try {
      const fyId = this.id();
      if (fyId) {
        await this.facade.update(fyId, payload);
      } else {
        await this.facade.create(payload);
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
