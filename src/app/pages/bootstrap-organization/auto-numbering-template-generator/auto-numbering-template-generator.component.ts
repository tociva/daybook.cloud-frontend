import { Component, EventEmitter, Input, Output, computed, signal, OnChanges, SimpleChanges } from '@angular/core';
import { TngButtonComponent, TngLabelComponent } from '@tailng-ui/components';
import { TngInput } from '@tailng-ui/primitives';
import dayjs from 'dayjs';

type FiscalYearRange = Readonly<{
  enddate: string;
  startdate: string;
}>;

const dateAndFiscalPlaceholders = [
  '<<YY>>',
  '<<YYYY>>',
  '<<M>>',
  '<<MM>>',
  '<<MMM>>',
  '<<MMMM>>',
  '<<D>>',
  '<<DD>>',
  '<<FISCAL_START_YY>>',
  '<<FISCAL_END_YY>>',
  '<<FISCAL_START_YYYY>>',
  '<<FISCAL_END_YYYY>>',
] as const;

const placeholderGroups = [
  {
    label: 'Date placeholders',
    values: ['<<YY>>', '<<YYYY>>', '<<M>>', '<<MM>>', '<<MMM>>', '<<MMMM>>', '<<D>>', '<<DD>>'],
  },
  {
    label: 'Fiscal year placeholders',
    values: [
      '<<FISCAL_START_YY>>',
      '<<FISCAL_END_YY>>',
      '<<FISCAL_START_YYYY>>',
      '<<FISCAL_END_YYYY>>',
    ],
  },
  {
    label: 'Serial placeholders',
    values: ['<<SERIAL1>>', '<<SERIAL2>>', '<<SERIAL3>>', '<<SERIAL4>>', '<<SERIAL5>>', '...'],
  },
] as const;

@Component({
  selector: 'app-auto-numbering-template-generator',
  imports: [TngButtonComponent, TngLabelComponent, TngInput],
  templateUrl: './auto-numbering-template-generator.component.html',
  styleUrl: './auto-numbering-template-generator.component.css',
})
export class AutoNumberingTemplateGeneratorComponent implements OnChanges {
  @Input({ required: true }) initialTemplate!: string;
  @Input({ required: true }) fiscalStartDate!: string;
  @Input({ required: true }) fiscalEndDate!: string;
  @Output() readonly applyTemplate = new EventEmitter<string>();

  protected readonly template = signal('');
  protected readonly placeholderGroups = placeholderGroups;
  protected readonly fiscalYearRange = computed<FiscalYearRange>(() => ({
    startdate: this.fiscalStartDate,
    enddate: this.fiscalEndDate,
  }));

  protected readonly resolvedTemplatePreview = computed(() =>
    AutoNumberingTemplateGeneratorComponent.fillAutoNumberingTemplate(
      this.template(),
      new Date(),
      this.fiscalYearRange(),
    ),
  );

  protected readonly nextSequences = computed(() => {
    const resolvedTemplate = this.resolvedTemplatePreview();
    return Array.from({ length: 5 }, (_unused, index) =>
      AutoNumberingTemplateGeneratorComponent.updateSerialWithNumber(resolvedTemplate, index + 1),
    );
  });

  ngOnChanges(_changes: SimpleChanges): void {
    this.template.set(this.initialTemplate ?? '');
  }

  protected onTemplateInput(event: Event): void {
    this.template.set((event.target as HTMLInputElement | null)?.value ?? '');
  }

  protected apply(): void {
    this.applyTemplate.emit(this.template());
  }

  static fillAutoNumberingTemplate(
    jnumber: string,
    date: Date,
    fiscalYearRange: FiscalYearRange,
  ): string {
    const dDate = dayjs(date);
    const replacements: Record<string, string> = {};

    for (const rep of ['YY', 'YYYY', 'M', 'MM', 'MMM', 'MMMM', 'D', 'DD']) {
      replacements[`<<${rep}>>`] = dDate.format(rep);
    }

    const finStart = dayjs(fiscalYearRange.startdate);
    const finEnd = dayjs(fiscalYearRange.enddate);
    replacements['<<FISCAL_START_YY>>'] = finStart.format('YY');
    replacements['<<FISCAL_END_YY>>'] = finEnd.format('YY');
    replacements['<<FISCAL_START_YYYY>>'] = finStart.format('YYYY');
    replacements['<<FISCAL_END_YYYY>>'] = finEnd.format('YYYY');

    const regex = new RegExp(dateAndFiscalPlaceholders.join('|'), 'gu');
    return jnumber.replace(regex, (match) => replacements[match] ?? match);
  }

  static updateSerialWithNumber(template: string, number: number): string {
    return template.replace(/<<SERIAL(\d+)>>/gu, (_match, widthRaw: string) => {
      const width = Number(widthRaw);
      if (!Number.isFinite(width) || width <= 0) {
        return '';
      }

      return String(number).padStart(width, '0');
    });
  }
}

