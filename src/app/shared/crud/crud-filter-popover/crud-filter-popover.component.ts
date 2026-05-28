import {
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  TngAutocompleteComponent,
  TngBadge,
  TngButtonComponent,
  TngDateRangePickerComponent,
  TngDatepickerComponent,
  TngFormFieldComponent,
  TngInputComponent,
  TngLabelComponent,
  TngNumberRangeComponent,
  TngSelectComponent,
} from '@tailng-ui/components';
import type {
  TngDateRangePickerValue,
  TngNumberRangeValue,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { TngPopover, TngPopoverPanel, TngPopoverTrigger } from '@tailng-ui/primitives';
import type {
  Lb4ComparisonFilterOperator,
  Lb4ListQuery,
  Lb4TextFilterOperator,
  Lb4Where,
} from '../lb4-query';
import {
  DEFAULT_LB4_PAGE_SIZE,
  buildLb4ComparisonFilterValue,
  buildLb4TextFilterValue,
  readLb4TextFilterOperator,
  readLb4TextFilterValue,
} from '../lb4-query';
import { CrudUrlService } from '../crud-url.service';
import { DatepickerDateAdapterService } from '../../../core/date/datepicker-date-adapter.service';
import { FiscalYearDatepickerComponent } from '../../fiscal-year-datepicker';
import { FiscalYearDateRangePickerComponent } from '../../fiscal-year-date-range-picker';

export type CrudFilterOption<T = unknown> = Readonly<{
  label: string;
  value: T;
}>;

type CrudFilterFieldBase = Readonly<{
  id: string;
  label: string;
}>;

export type CrudTextFilterField = CrudFilterFieldBase &
  Readonly<{
    defaultOperator?: Lb4TextFilterOperator;
    operators?: readonly Lb4TextFilterOperator[];
    placeholder?: string;
    type: 'text';
  }>;

export type CrudEnumFilterField = CrudFilterFieldBase &
  Readonly<{
    options: readonly CrudFilterOption[];
    placeholder?: string;
    type: 'enum';
  }>;

export type CrudAutocompleteFilterField<T = unknown, V = unknown> = CrudFilterFieldBase &
  Readonly<{
    getOptionLabel: (option: T) => string;
    getOptionValue: (option: T) => V;
    options: () => readonly T[];
    placeholder?: string;
    queryChange?: (query: string) => void;
    trackBy?: (index: number, option: T) => unknown;
    type: 'autocomplete';
  }>;

export type CrudComparisonFilterField = CrudFilterFieldBase &
  Readonly<{
    defaultOperator?: Lb4ComparisonFilterOperator;
    fiscalYear?: boolean;
    operators?: readonly Lb4ComparisonFilterOperator[];
    placeholder?: string;
    step?: string | number;
    type: 'date' | 'number';
  }>;

export type CrudFilterField =
  | CrudAutocompleteFilterField
  | CrudComparisonFilterField
  | CrudEnumFilterField
  | CrudTextFilterField;

type CrudFilterOperator = Lb4ComparisonFilterOperator | Lb4TextFilterOperator;

type DraftFilterValue = {
  operator: CrudFilterOperator;
  value: unknown;
};

type DraftRangeValue = Readonly<{
  from: unknown;
  to: unknown;
}>;

type OperatorOption<T extends string = string> = Readonly<{
  label: string;
  value: T;
}>;

const DEFAULT_TEXT_OPERATORS: readonly Lb4TextFilterOperator[] = ['like', '=', '!='];
const DEFAULT_COMPARISON_OPERATORS: readonly Lb4ComparisonFilterOperator[] = [
  '=',
  '>=',
  '<=',
  'between',
];

const OPERATOR_LABELS: Record<CrudFilterOperator, string> = {
  '!=': 'Not equal to',
  '<': 'Less than',
  '<=': 'Less or equal',
  '=': 'Equal to',
  '>': 'Greater than',
  '>=': 'Greater or equal',
  between: 'Between',
  like: 'Contains',
};

@Component({
  selector: 'app-crud-filter-popover',
  imports: [
    FiscalYearDateRangePickerComponent,
    FiscalYearDatepickerComponent,
    TngAutocompleteComponent,
    TngBadge,
    TngButtonComponent,
    TngDateRangePickerComponent,
    TngDatepickerComponent,
    TngFormFieldComponent,
    TngIcon,
    TngInputComponent,
    TngLabelComponent,
    TngNumberRangeComponent,
    TngPopover,
    TngPopoverPanel,
    TngPopoverTrigger,
    TngSelectComponent,
  ],
  templateUrl: './crud-filter-popover.component.html',
  styleUrl: './crud-filter-popover.component.css',
})
export class CrudFilterPopoverComponent {
  private readonly elementRef = inject(ElementRef);
  protected readonly datepickerAdapter = inject(DatepickerDateAdapterService);
  private readonly route = inject(ActivatedRoute);
  private readonly crudUrl = inject(CrudUrlService);

  readonly ariaLabel = input('Filters');
  readonly defaultPageSize = input(DEFAULT_LB4_PAGE_SIZE);
  readonly fields = input<readonly CrudFilterField[]>([]);
  readonly title = input('Filter');
  readonly replaceUrl = input(false, { transform: booleanAttribute });
  readonly syncUrl = input(false, { transform: booleanAttribute });
  readonly filter = input<Lb4ListQuery | undefined>();
  readonly where = input<Lb4Where | undefined>();

  readonly clearFilters = output<void>();
  readonly filterChange = output<Lb4ListQuery>();
  readonly filterApply = output<Lb4Where | undefined>();

  protected readonly open = signal(false);
  protected readonly draft = signal<Record<string, DraftFilterValue>>({});
  protected readonly getOptionLabel = (option: CrudFilterOption): string => option.label;
  protected readonly getOptionValue = (option: CrudFilterOption): unknown => option.value;
  protected readonly getOperatorLabel = (option: OperatorOption): string => option.label;
  protected readonly getOperatorValue = (option: OperatorOption): string => option.value;
  protected readonly trackByOptionValue = (_: number, option: CrudFilterOption): unknown =>
    option.value;
  protected readonly trackByOperatorValue = (_: number, option: OperatorOption): string =>
    option.value;

  private readonly currentFilter = computed(() => this.filter() ?? {});
  private readonly currentWhere = computed(() => this.where() ?? this.currentFilter().where);

  protected readonly activeFilterCount = computed(() => {
    const where = this.currentWhere();
    if (!where) return null;
    const count = Object.keys(where).length;
    return count > 0 ? count : null;
  });
  private readonly operatorOptionsCache = new Map<CrudFilterField, readonly OperatorOption[]>();
  private readonly syncDraftEffect = effect(() => {
    this.fields();
    this.currentWhere();
    this.operatorOptionsCache.clear();
    this.syncDraftFromWhere();
  });

  protected onInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.open.set(false);
    }
  }

  protected onOpenChange(open: boolean): void {
    this.open.set(open);

    if (open) {
      this.syncDraftFromWhere();
      setTimeout(() => {
        const panel = this.elementRef.nativeElement.querySelector('.filter-panel');
        const firstInput = panel?.querySelector('input, select') as HTMLElement | null;
        firstInput?.focus();
      }, 50);
    }
  }

  protected getFieldId(field: CrudFilterField): string {
    return `crud-filter-${field.id}`;
  }

  protected getOperatorOptions(field: CrudFilterField): readonly OperatorOption[] {
    if (field.type !== 'text' && !this.isComparisonField(field)) {
      return [];
    }

    const cachedOptions = this.operatorOptionsCache.get(field);
    if (cachedOptions) {
      return cachedOptions;
    }

    const operators =
      field.type === 'text'
        ? (field.operators ?? DEFAULT_TEXT_OPERATORS)
        : (field.operators ?? DEFAULT_COMPARISON_OPERATORS);

    const options = operators.map((operator) => ({
      label: OPERATOR_LABELS[operator],
      value: operator,
    }));

    this.operatorOptionsCache.set(field, options);

    return options;
  }

  protected getTextValue(fieldId: string): string {
    const value = this.draft()[fieldId]?.value;

    return typeof value === 'string' ? value : '';
  }

  protected getSelectValue(fieldId: string): unknown {
    return this.draft()[fieldId]?.value ?? null;
  }

  protected getOperatorValueForField(field: CrudFilterField): string {
    return this.draft()[field.id]?.operator ?? this.getDefaultOperator(field);
  }

  protected getComparisonValue(fieldId: string, side: 'from' | 'single' | 'to'): string {
    const value = this.draft()[fieldId]?.value;

    if (side === 'single') {
      return this.isRangeValue(value)
        ? this.stringifyValue(value.from)
        : this.stringifyValue(value);
    }

    if (!this.isRangeValue(value)) {
      return side === 'from' ? this.stringifyValue(value) : '';
    }

    return this.stringifyValue(value[side]);
  }

  protected getInputMode(field: CrudFilterField): string | null {
    return field.type === 'number' ? 'decimal' : null;
  }

  protected getAutocompleteOptions(field: CrudFilterField): readonly unknown[] {
    if (field.type !== 'autocomplete') return [];

    return field.options();
  }

  protected getAutocompleteOptionLabel(field: CrudFilterField): (option: unknown) => string {
    return (option) => (field.type === 'autocomplete' ? field.getOptionLabel(option) : '');
  }

  protected getAutocompleteOptionValue(field: CrudFilterField): (option: unknown) => unknown {
    return (option) => (field.type === 'autocomplete' ? field.getOptionValue(option) : null);
  }

  protected getAutocompleteTrackBy(
    field: CrudFilterField,
  ): (index: number, option: unknown) => unknown {
    return (index, option) => {
      if (field.type !== 'autocomplete') return option;

      return field.trackBy?.(index, option) ?? field.getOptionValue(option) ?? option;
    };
  }

  protected getAutocompleteValue(fieldId: string): unknown {
    return this.draft()[fieldId]?.value ?? null;
  }

  protected isBetweenOperator(field: CrudFilterField): boolean {
    return this.getOperatorValueForField(field) === 'between';
  }

  protected isFiscalDateField(field: CrudFilterField): boolean {
    return this.isComparisonField(field) && field.type === 'date' && (field.fiscalYear ?? false);
  }

  protected getDateRangeValue(
    fieldId: string,
  ): Readonly<{ start: string | null; end: string | null }> | null {
    const value = this.draft()[fieldId]?.value;

    if (!this.isRangeValue(value)) return null;

    return {
      start: this.stringifyValue(value.from) || null,
      end: this.stringifyValue(value.to) || null,
    };
  }

  protected setDatepickerValue(field: CrudFilterField, value: Date | null | unknown): void {
    if (!this.isComparisonField(field)) return;

    const date = value instanceof Date ? value : null;

    this.setComparisonValue(field, 'single', date ? this.dateToIsoString(date) : '');
  }

  protected setDateRangeValue(
    field: CrudFilterField,
    value: TngDateRangePickerValue<Date>,
  ): void {
    if (!this.isComparisonField(field)) return;

    this.patchDraft(field.id, {
      operator: 'between',
      value: {
        from: value?.start ? this.dateToIsoString(value.start) : '',
        to: value?.end ? this.dateToIsoString(value.end) : '',
      },
    });
  }

  protected getNumberRangeValue(fieldId: string): TngNumberRangeValue | null {
    const value = this.draft()[fieldId]?.value;

    if (!this.isRangeValue(value)) return null;

    const fromText = this.stringifyValue(value.from).trim();
    const toText = this.stringifyValue(value.to).trim();
    const min = fromText !== '' ? Number(fromText) : null;
    const max = toText !== '' ? Number(toText) : null;

    return {
      min: min !== null && Number.isFinite(min) ? min : null,
      max: max !== null && Number.isFinite(max) ? max : null,
    };
  }

  protected setNumberRangeValue(field: CrudFilterField, value: TngNumberRangeValue): void {
    if (!this.isComparisonField(field)) return;

    this.patchDraft(field.id, {
      operator: 'between',
      value: {
        from: value.min !== null ? String(value.min) : '',
        to: value.max !== null ? String(value.max) : '',
      },
    });
  }

  protected getFieldStep(field: CrudFilterField): string | number | null {
    return this.isComparisonField(field) ? (field.step ?? null) : null;
  }

  protected getEnumOptions(field: CrudFilterField): readonly CrudFilterOption[] {
    if (field.type !== 'enum') return [];

    const emptyOption: CrudFilterOption = {
      label: field.placeholder ?? `Any ${field.label.toLowerCase()}`,
      value: null,
    };

    return [emptyOption, ...field.options];
  }

  protected setTextValue(field: CrudTextFilterField, value: string): void {
    this.patchDraft(field.id, {
      operator: this.getOperatorValueForField(field) as Lb4TextFilterOperator,
      value,
    });
  }

  protected setSelectValue(field: CrudFilterField, value: unknown): void {
    if (field.type !== 'enum') return;

    this.patchDraft(field.id, {
      operator: '=',
      value,
    });
  }

  protected setAutocompleteValue(field: CrudFilterField, value: unknown): void {
    if (field.type !== 'autocomplete') return;

    this.patchDraft(field.id, {
      operator: '=',
      value,
    });
  }

  protected setAutocompleteQuery(field: CrudFilterField, query: string | null): void {
    if (field.type !== 'autocomplete') return;

    field.queryChange?.(query ?? '');
  }

  protected setComparisonValue(
    field: CrudFilterField,
    side: 'from' | 'single' | 'to',
    value: string,
  ): void {
    if (!this.isComparisonField(field)) return;

    const currentValue = this.draft()[field.id]?.value;
    const nextValue =
      side === 'single'
        ? value
        : {
            ...this.normalizeRangeValue(currentValue),
            [side]: value,
          };

    this.patchDraft(field.id, {
      operator: this.getOperatorValueForField(field) as Lb4ComparisonFilterOperator,
      value: nextValue,
    });
  }

  protected setOperator(field: CrudFilterField, operator: string | null): void {
    const nextOperator = this.isAllowedOperator(field, operator)
      ? operator
      : this.getDefaultOperator(field);
    const currentValue = this.draft()[field.id]?.value ?? null;

    this.patchDraft(field.id, {
      operator: nextOperator,
      value:
        nextOperator === 'between'
          ? this.normalizeRangeValue(currentValue)
          : this.normalizeSingleValue(currentValue),
    });
  }

  protected submitFilter(event: SubmitEvent): void {
    event.preventDefault();
    const where = this.buildWhere();
    const filter = {
      ...this.currentFilter(),
      offset: 0,
      where,
    };

    this.filterApply.emit(where);
    void this.emitFilterChange(filter);
    this.open.set(false);
  }

  protected clearFilter(): void {
    this.draft.set(this.createEmptyDraft());
  }

  protected closePopover(): void {
    this.open.set(false);
  }

  private async emitFilterChange(filter: Lb4ListQuery): Promise<void> {
    this.filterChange.emit(filter);

    if (!this.syncUrl()) {
      return;
    }

    await this.crudUrl.updateFilterInUrl(filter, {
      defaultPageSize: this.defaultPageSize(),
      replaceUrl: this.replaceUrl(),
      route: this.route,
    });
  }

  private syncDraftFromWhere(): void {
    const nextDraft: Record<string, DraftFilterValue> = {};

    for (const field of this.fields()) {
      if (field.type === 'text') {
        nextDraft[field.id] = {
          operator: readLb4TextFilterOperator(this.currentWhere(), field.id),
          value: readLb4TextFilterValue(this.currentWhere(), field.id),
        };
        continue;
      }

      if (this.isComparisonField(field)) {
        nextDraft[field.id] = {
          operator: this.readComparisonOperator(field.id),
          value: this.readComparisonDraftValue(field.id),
        };
        continue;
      }

      nextDraft[field.id] = {
        operator: '=',
        value: this.readComparisonValue(field.id),
      };
    }

    this.draft.set(nextDraft);
  }

  private buildWhere(): Lb4Where | undefined {
    const where: Lb4Where = {};
    const draft = this.draft();

    for (const field of this.fields()) {
      const draftValue = draft[field.id];
      if (!draftValue) {
        continue;
      }

      if (field.type === 'text') {
        const value = typeof draftValue.value === 'string' ? draftValue.value.trim() : '';

        if (value) {
          where[field.id] = buildLb4TextFilterValue(
            value,
            draftValue.operator as Lb4TextFilterOperator,
          );
        }
        continue;
      }

      if (this.isComparisonField(field)) {
        const value = this.buildComparisonFilterValue(field, draftValue);

        if (value !== undefined) {
          where[field.id] = value;
        }
        continue;
      }

      if (draftValue.value !== null && draftValue.value !== undefined && draftValue.value !== '') {
        where[field.id] = draftValue.value;
      }
    }

    return Object.keys(where).length ? where : undefined;
  }

  private createEmptyDraft(): Record<string, DraftFilterValue> {
    return Object.fromEntries(
      this.fields().map((field) => [
        field.id,
        {
          operator: this.getDefaultOperator(field),
          value: this.getEmptyValue(field),
        },
      ]),
    );
  }

  private getEmptyValue(field: CrudFilterField): DraftRangeValue | null | string {
    if (field.type === 'text') {
      return '';
    }

    return this.isComparisonField(field) && field.defaultOperator === 'between'
      ? this.emptyRange()
      : null;
  }

  private getDefaultOperator(field: CrudFilterField): CrudFilterOperator {
    if (field.type === 'text') {
      return field.defaultOperator ?? 'like';
    }

    if (this.isComparisonField(field)) {
      return field.defaultOperator ?? '=';
    }

    return '=';
  }

  private isAllowedOperator(
    field: CrudFilterField,
    operator: string | null,
  ): operator is CrudFilterOperator {
    if (!operator) {
      return false;
    }

    return this.getOperatorOptions(field).some((option) => option.value === operator);
  }

  private patchDraft(fieldId: string, value: DraftFilterValue): void {
    this.draft.update((draft) => ({
      ...draft,
      [fieldId]: value,
    }));
  }

  private readComparisonValue(fieldId: string): unknown {
    const fieldFilter = this.currentWhere()?.[fieldId];

    if (fieldFilter === null || fieldFilter === undefined) {
      return null;
    }

    if (typeof fieldFilter !== 'object') {
      return fieldFilter;
    }

    for (const operator of ['neq', 'lt', 'lte', 'gt', 'gte'] as const) {
      if (operator in fieldFilter) {
        return (fieldFilter as Record<string, unknown>)[operator];
      }
    }

    return null;
  }

  private buildComparisonFilterValue(
    field: CrudComparisonFilterField,
    draftValue: DraftFilterValue,
  ): unknown {
    const operator = draftValue.operator as Lb4ComparisonFilterOperator;

    if (operator === 'between') {
      const rangeValue = this.normalizeRangeValue(draftValue.value);
      const from = this.coerceComparisonValue(field, rangeValue.from);
      const to = this.coerceComparisonValue(field, rangeValue.to);

      if (from === null || to === null) {
        return undefined;
      }

      return buildLb4ComparisonFilterValue([from, to], operator);
    }

    const value = this.coerceComparisonValue(field, draftValue.value);

    return value === null ? undefined : buildLb4ComparisonFilterValue(value, operator);
  }

  private coerceComparisonValue(
    field: CrudComparisonFilterField,
    value: unknown,
  ): number | string | null {
    const text = this.stringifyValue(value).trim();

    if (!text) {
      return null;
    }

    if (field.type !== 'number') {
      return text;
    }

    const numberValue = Number(text);

    return Number.isFinite(numberValue) ? numberValue : null;
  }

  private emptyRange(): DraftRangeValue {
    return { from: '', to: '' };
  }

  private isComparisonField(field: CrudFilterField): field is CrudComparisonFilterField {
    return field.type === 'date' || field.type === 'number';
  }

  private isRangeValue(value: unknown): value is DraftRangeValue {
    return typeof value === 'object' && value !== null && 'from' in value && 'to' in value;
  }

  private normalizeRangeValue(value: unknown): DraftRangeValue {
    if (this.isRangeValue(value)) {
      return value;
    }

    return {
      from: value ?? '',
      to: '',
    };
  }

  private normalizeSingleValue(value: unknown): unknown {
    return this.isRangeValue(value) ? value.from : value;
  }

  private readComparisonDraftValue(fieldId: string): unknown {
    const fieldFilter = this.currentWhere()?.[fieldId];

    if (
      typeof fieldFilter === 'object' &&
      fieldFilter !== null &&
      'between' in fieldFilter &&
      Array.isArray((fieldFilter as Record<string, unknown>)['between'])
    ) {
      const [from = '', to = ''] = (fieldFilter as { between: readonly unknown[] }).between;

      return { from, to };
    }

    return this.readComparisonValue(fieldId);
  }

  private readComparisonOperator(fieldId: string): Lb4ComparisonFilterOperator {
    const fieldFilter = this.currentWhere()?.[fieldId];

    if (fieldFilter === null || fieldFilter === undefined || typeof fieldFilter !== 'object') {
      return '=';
    }

    if ('between' in fieldFilter) return 'between';
    if ('neq' in fieldFilter) return '!=';
    if ('lt' in fieldFilter) return '<';
    if ('lte' in fieldFilter) return '<=';
    if ('gt' in fieldFilter) return '>';
    if ('gte' in fieldFilter) return '>=';

    return '=';
  }

  private stringifyValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    return String(value);
  }

  private dateToIsoString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');

    return `${y}-${m}-${d}`;
  }
}
