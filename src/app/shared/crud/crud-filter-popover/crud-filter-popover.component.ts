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
  TngButtonComponent,
  TngFormFieldComponent,
  TngInputComponent,
  TngLabelComponent,
  TngSelectComponent,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { TngPopover, TngPopoverPanel, TngPopoverTrigger } from '@tailng-ui/primitives';
import type { Lb4ListQuery, Lb4TextFilterOperator, Lb4Where } from '../lb4-query';
import {
  DEFAULT_LB4_PAGE_SIZE,
  buildLb4TextFilterValue,
  readLb4TextFilterOperator,
  readLb4TextFilterValue,
} from '../lb4-query';
import { CrudUrlService } from '../crud-url.service';

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

export type CrudFilterField = CrudEnumFilterField | CrudTextFilterField;

type DraftFilterValue = {
  operator: Lb4TextFilterOperator;
  value: unknown;
};

type OperatorOption<T extends string = string> = Readonly<{
  label: string;
  value: T;
}>;

const DEFAULT_TEXT_OPERATORS: readonly Lb4TextFilterOperator[] = ['like', '=', '!='];

const OPERATOR_LABELS: Record<Lb4TextFilterOperator, string> = {
  '!=': 'Not equal to',
  '=': 'Equal to',
  like: 'Contains',
};

@Component({
  selector: 'app-crud-filter-popover',
  imports: [
    TngButtonComponent,
    TngFormFieldComponent,
    TngIcon,
    TngInputComponent,
    TngLabelComponent,
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
    if (field.type !== 'text') {
      return [];
    }

    const cachedOptions = this.operatorOptionsCache.get(field);
    if (cachedOptions) {
      return cachedOptions;
    }

    const operators = field.operators ?? DEFAULT_TEXT_OPERATORS;

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

  protected getEnumOptions(field: CrudFilterField): readonly CrudFilterOption[] {
    return field.type === 'enum' ? field.options : [];
  }

  protected setTextValue(field: CrudTextFilterField, value: string): void {
    this.patchDraft(field.id, {
      operator: this.getOperatorValueForField(field) as Lb4TextFilterOperator,
      value,
    });
  }

  protected setSelectValue(field: CrudEnumFilterField, value: unknown): void {
    this.patchDraft(field.id, {
      operator: '=',
      value,
    });
  }

  protected setOperator(field: CrudFilterField, operator: string | null): void {
    const nextOperator = this.isAllowedOperator(field, operator)
      ? operator
      : this.getDefaultOperator(field);

    this.patchDraft(field.id, {
      operator: nextOperator,
      value: this.draft()[field.id]?.value ?? null,
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
    const filter = {
      ...this.currentFilter(),
      offset: 0,
      where: undefined,
    };

    this.clearFilters.emit();
    void this.emitFilterChange(filter);
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
          value: field.type === 'text' ? '' : null,
        },
      ]),
    );
  }

  private getDefaultOperator(field: CrudFilterField): Lb4TextFilterOperator {
    return field.type === 'text' ? (field.defaultOperator ?? 'like') : '=';
  }

  private isAllowedOperator(
    field: CrudFilterField,
    operator: string | null,
  ): operator is Lb4TextFilterOperator {
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
}
