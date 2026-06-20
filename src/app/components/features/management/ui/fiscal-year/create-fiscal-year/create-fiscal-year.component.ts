import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { ActivatedRoute } from '@angular/router';
import {
  TngAutocompleteComponent,
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
  TngHint,
  TngInputComponent,
  TngLabelComponent,
  TngStepperComponent,
  TngSwitchComponent,
  TngYearpickerComponent,
} from '@tailng-ui/components';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlCreateButtonComponent } from '../../../../../../shared/burl-create-button/burl-create-button.component';
import { DatepickerDateAdapterService } from '../../../../../../core/date/datepicker-date-adapter.service';
import { CurrencyStore } from '../../../data/currency/currency.store';
import type { Currency } from '../../../data/currency/currency.model';
import { UserSessionStore } from '../../../data/user-session/user-session.store';
import { FiscalYearFacade, FiscalYearStore } from '../../../data/fiscal-year';
import type { FiscalYearPayload } from '../../../data/fiscal-year';
import { AutoNumberingTemplateGeneratorComponent } from '../../../../../../shared/auto-numbering-template-generator/auto-numbering-template-generator.component';
import { toDateRangeEnd } from '../../../../../../core/date/dayjs-date.utils';
import { DEFAULT_NODE_DATE_FORMAT } from '../../../../../../util/constants';

dayjs.extend(customParseFormat);

@Component({
  selector: 'app-create-fiscal-year',
  standalone: true,
  imports: [
    TngAutocompleteComponent,
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
    TngHint,
    TngInputComponent,
    TngLabelComponent,
    TngStepperComponent,
    TngSwitchComponent,
    TngYearpickerComponent,
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
  private readonly userSessionStore = inject(UserSessionStore);

  /** The branch the user is currently working in (set via the session selector). */
  private readonly sessionBranch = computed(() => this.userSessionStore.session()?.branch ?? null);

  protected readonly id = signal<string | null>(null);
  protected readonly submitted = signal(false);
  protected readonly isSubmitting = signal(false);

  // ── Form fields ───────────────────────────────────────────────────────────
  protected readonly name = signal('');
  protected readonly startYear = signal(dayjs().year());
  protected readonly jnumber = signal('<<YYYY>>/<<SERIAL5>>');
  protected readonly freezetill = signal('');
  protected readonly transferData = signal(false);

  // ── Currency (tng-autocomplete) ───────────────────────────────────────────
  protected readonly selectedCurrencyCode = signal<string | null>(null);
  protected readonly currencyQuery = signal('');

  protected readonly currencyOptionValue = (currency: Currency): string => currency.code;
  protected readonly currencyOptionLabel = (currency: Currency): string =>
    `${currency.name} (${currency.symbol})`;
  protected readonly currencyTrackBy = (_index: number, currency: Currency): string =>
    currency.code;

  protected readonly filteredCurrencies = computed(() => {
    const q = this.currencyQuery().toLowerCase().trim();
    const selectedCode = this.selectedCurrencyCode();
    const all = this.currencyStore.currencies();

    const matches = q
      ? all.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.code.toLowerCase().includes(q) ||
            c.symbol.includes(q),
        )
      : all;

    const page = matches.slice(0, 20);

    // Always keep the selected currency in the list so the autocomplete can
    // resolve its label (name + symbol) for the trigger display.
    if (selectedCode && !page.some((c) => c.code === selectedCode)) {
      const selected = all.find((c) => c.code === selectedCode);
      if (selected) return [selected, ...page];
    }

    return page;
  });

  // ── Year picker bounds ────────────────────────────────────────────────────
  protected readonly minYear = computed(() => dayjs().year() - 5);
  protected readonly maxYear = computed(() => dayjs().year() + 10);

  // ── Fiscal start month/day from session branch ────────────────────────────
  /** 1-indexed month parsed from branch.fiscalstart (e.g. "April-01" → 4) */
  protected readonly fiscalStartMonth = computed(() => {
    const fiscalStart = this.sessionBranch()?.fiscalstart ?? 'January-01';
    const parsed = dayjs(fiscalStart, ['MMMM-D', 'MMMM-DD'], true);
    return parsed.isValid() ? parsed.month() + 1 : 1;
  });

  /** Day parsed from branch.fiscalstart (e.g. "April-01" → 1) */
  protected readonly fiscalStartDay = computed(() => {
    const fiscalStart = this.sessionBranch()?.fiscalstart ?? 'January-01';
    const parsed = dayjs(fiscalStart, ['MMMM-D', 'MMMM-DD'], true);
    return parsed.isValid() ? parsed.date() : 1;
  });

  // ── Derived dates ─────────────────────────────────────────────────────────
  protected readonly startdate = computed(() => {
    const year = this.startYear();
    const month = this.fiscalStartMonth(); // 1-indexed
    const day = this.fiscalStartDay();
    return dayjs().year(year).month(month - 1).date(day).format(DEFAULT_NODE_DATE_FORMAT);
  });

  protected readonly enddate = computed(() =>
    toDateRangeEnd(this.startdate(), `${this.startYear()}-12-31`),
  );

  protected readonly formattedDateRange = computed(() => {
    const start = this.startdate();
    const end = this.enddate();
    if (!start || !end) return '—';
    return `${dayjs(start).format('D MMM YYYY')} – ${dayjs(end).format('D MMM YYYY')}`;
  });

  // ── Journal number sequences ───────────────────────────────────────────────
  protected readonly journalNextSequences = computed(() => {
    const template = this.jnumber();
    const range = { startdate: this.startdate(), enddate: this.enddate() };
    const resolvedTemplate = AutoNumberingTemplateGeneratorComponent.fillAutoNumberingTemplate(
      template,
      new Date(),
      range,
    );
    return Array.from({ length: 5 }, (_, i) =>
      AutoNumberingTemplateGeneratorComponent.updateSerialWithNumber(resolvedTemplate, i + 1),
    );
  });

  // ── Stepper ───────────────────────────────────────────────────────────────
  protected readonly setupSteps = computed(() => {
    const detailsCompleted = this.name().trim().length > 0 && !!this.selectedCurrencyCode();
    const numberingCompleted = this.jnumber().trim().length > 0;

    return [
      {
        value: 'details',
        label: 'Details',
        description: 'Name, period & currency',
        completed: detailsCompleted,
      },
      {
        value: 'numbering',
        label: 'Numbering',
        description: 'Journal number format',
        completed: numberingCompleted,
      },
    ] as const;
  });

  protected readonly activeSetupStep = computed(() => {
    const firstPending = this.setupSteps().find((step) => !step.completed);
    return firstPending?.value ?? 'numbering';
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
  protected readonly jnumberError = computed(() =>
    this.submitted() && this.jnumber().trim() === '' ? 'Journal number format is required.' : null,
  );
  protected readonly currencyError = computed(() =>
    this.submitted() && !this.selectedCurrencyCode() ? 'Currency is required.' : null,
  );
  protected readonly hasErrors = computed(
    () =>
      this.nameError() !== null ||
      this.jnumberError() !== null ||
      this.currencyError() !== null,
  );

  constructor() {
    void this.currencyStore.load();
    void this.loadInitialState();

    // Auto-fill currency from the session branch when available
    effect(() => {
      const branch = this.sessionBranch();
      if (branch?.currencycode && !this.selectedCurrencyCode()) {
        this.selectedCurrencyCode.set(branch.currencycode);
      }
    });
  }

  ngAfterViewInit(): void {
    this.nameInputRef?.nativeElement.querySelector('input')?.focus();
  }

  private async loadInitialState(): Promise<void> {
    this.fiscalYearStore.clearError();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.id.set(id);
      const fy = await this.fiscalYearStore.loadFiscalYearById(id, {
        includes: ['branch', 'currency'],
      });
      if (fy) {
        this.name.set(fy.name ?? '');
        // Extract year from startdate for the year picker
        if (fy.startdate) {
          const yr = dayjs(fy.startdate, DEFAULT_NODE_DATE_FORMAT).year();
          if (yr > 0) this.startYear.set(yr);
        }
        this.jnumber.set(fy.jnumber ?? '<<YYYY>>/<<SERIAL5>>');
        this.freezetill.set(fy.freezetill ?? '');
        if (fy.currencycode) {
          this.selectedCurrencyCode.set(fy.currencycode);
        }
      }
    }
  }

  // ── Currency handlers ─────────────────────────────────────────────────────
  protected onStartYearChange(value: string | number | undefined): void {
    const year = typeof value === 'number' ? value : Number(value ?? 0);
    if (Number.isFinite(year) && year > 0) {
      this.startYear.set(year);
    }
  }

  protected onCurrencyChange(value: unknown): void {
    this.selectedCurrencyCode.set(value as string | null);
  }

  protected onCurrencyQueryChange(q: string): void {
    this.currencyQuery.set(q);
  }

  // ── Freeze handler ────────────────────────────────────────────────────────
  protected onFreezetillChange(value: unknown): void {
    if (!value) {
      this.freezetill.set('');
      return;
    }
    if (typeof value === 'string') this.freezetill.set(value);
    else this.freezetill.set(dayjs(value as Date).format(DEFAULT_NODE_DATE_FORMAT));
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  protected async submitForm(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (this.isSubmitting()) return;

    this.submitted.set(true);
    if (this.hasErrors()) return;

    const branchId = this.sessionBranch()?.id;
    if (!branchId) return;

    this.isSubmitting.set(true);
    const payload: FiscalYearPayload = {
      name: this.name().trim(),
      startdate: this.startdate(),
      enddate: this.enddate(),
      jnumber: this.jnumber().trim(),
      currencycode: this.selectedCurrencyCode()!,
      branchid: branchId,
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
