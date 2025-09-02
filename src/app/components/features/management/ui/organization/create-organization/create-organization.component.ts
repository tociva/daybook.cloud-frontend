import { Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Store } from '@ngrx/store';
import dayjs from 'dayjs';
import { toFlagEmoji } from '../../../../../../util/common.util';
import { DEFAULT_INVOICE_NUMBER_FORMAT, DEFAULT_JOURNAL_NUMBER_FORMAT, DEFAULT_NODE_DATE_FORMAT } from '../../../../../../util/constants';
import { FormValidator } from '../../../../../../util/form/form-validator';
import { FormUtil } from '../../../../../../util/form/form.util';
import { willPassEmailValidation, willPassRequiredStringValidation } from '../../../../../../util/form/validation.uti';
import { FormField } from '../../../../../../util/types/form-field.model';
import { TwoColumnFormComponent } from '../../../../../shared/forms/two-column-form/two-column-form.component';
import { countryActions } from '../../../../../shared/store/country/country.action';
import { Country } from '../../../../../shared/store/country/country.model';
import { CountryStore } from '../../../../../shared/store/country/country.store';
import { Currency } from '../../../../../shared/store/currency/currency.model';
import { CurrencyStore } from '../../../../../shared/store/currency/currency.store';
import { DateFormat } from '../../../../../shared/store/date-format/date-format.model';
import { DateFormatStore } from '../../../../../shared/store/date-format/date-format.store';
import { organizationActions } from '../../../store/organization/organization.actions';
import { OrganizationBootstrapFormData } from '../../../store/organization/organization.model';
import { currencyActions } from '../../../../../shared/store/currency/currency.action';
import { dateFormatActions } from '../../../../../shared/store/date-format/date-format.action';

@Component({
  selector: 'app-create-organization',
  standalone: true,
  imports: [TwoColumnFormComponent,],
  templateUrl: './create-organization.component.html',
  styleUrl: './create-organization.component.css',
})
export class CreateOrganizationComponent {
  private readonly fb = inject(FormBuilder);

  private readonly countryStore = inject(CountryStore);
  private readonly currencyStore = inject(CurrencyStore);
  private readonly dateFormatStore = inject(DateFormatStore);
  private readonly store = inject(Store);

  countries = signal<Country[]>([]);
  currencies = signal<Currency[]>([]);
  dateFormats = signal<DateFormat[]>([]);
  successAction = organizationActions.bootstrapOrganizationSuccess;

  allCurrencies = signal<Currency[]>([]);
  allDateFormats = signal<DateFormat[]>([]);

  
  private setByPath(path: string, value: any, opts = { emitEvent: true }) {
    const ctrl = this.form.get(path);
    if (!ctrl) {
      return;
    }
    ctrl.setValue(value, opts);
    // optionally:
    ctrl.markAsDirty();
    ctrl.updateValueAndValidity({ emitEvent: false });
  }

  readonly orgFields = signal<FormField[]>([
    // 🟦 Basic Details
    { key: 'name', label: 'Name', type: 'text', required: true, group: 'Basic Details', validators:(value: unknown) => {
      if(!willPassRequiredStringValidation(value as string)) {
        return ['Name is required'];
      }
      return [];
    }},
    { key: 'email', label: 'Email', type: 'email', required: true, group: 'Basic Details', validators:(value: unknown) => {
      if(!willPassRequiredStringValidation(value as string)) {
        return ['Email is required'];
      }
      if(!willPassEmailValidation(value as string)) {
        return ['Invalid email address'];
      }
      return [];
    }},
    { key: 'country', label: 'Country', type: 'auto-complete', required: true, group: 'Basic Details',
      placeholder: 'Search for a country',
      validators:(value: unknown) => {
        if(!willPassRequiredStringValidation((value as Country)?.name)) {
          return ['Country is required'];
        }
        return [];
      },
      autoComplete: {
        items: this.countries,
        optionDisplayValue: (item: Country) => `${toFlagEmoji(item.code)} ${item.name}`,
        inputDisplayValue: (item: Country) => `${toFlagEmoji(item.code)} ${item.name}`,
        trackBy: (item: Country) => item.name,
        onSearch: (value: string) => {
          this.countryStore.setSearch(value);
        },
        onOptionSelected: (item: Country) => {
          const currency = this.allCurrencies().find(currency => currency.code === item.currencycode);
          if(currency) {
            this.setByPath('currency', currency);
          } 
          const dateFormat = this.allDateFormats().find(dateFormat => dateFormat.name === item.dateformat);
          if(dateFormat) {
            this.setByPath('dateformatForm', dateFormat);
          }
          this.setByPath('mobile', `+${item.phone}-`);
          this.setByPath('fiscalstart', item.fiscalstart ?? 'January-01');
        }
      }
     },
    { key: 'mobile', label: 'Mobile', type: 'text', group: 'Basic Details' },
    { key: 'state', label: 'State', type: 'text', group: 'Basic Details' },
    { key: 'description', label: 'Description', type: 'textarea', group: 'Basic Details' },
  
    // 🟩 Address Info
    { key: 'address.line1', label: 'Line 1', type: 'text', group: 'Address Info', required: true, validators:(value: unknown) => {
      if(!willPassRequiredStringValidation(value as string)) {
        return ['Address Line 1 is required'];
      }
      return [];
    }},
    { key: 'address.line2', label: 'Line 2', type: 'text', group: 'Address Info' },
    { key: 'address.city', label: 'City', type: 'text', group: 'Address Info' },
    { key: 'address.pincode', label: 'Pincode', type: 'text', group: 'Address Info' },
    { key: 'gstin', label: 'GSTIN', type: 'text', group: 'Address Info' },
    
    // 🟨 Financial Info
    { key: 'fiscalstart', label: 'Fiscal Start', type: 'month-date', group: 'Financial Info', required: true, validators:(value: unknown) => {
      if(!willPassRequiredStringValidation(value as string)) {
        return ['Fiscal Start is required'];
      }
      return [];
    }, value: 'January-01' },
    { key: 'fiscalname', label: 'Fiscal Name', type: 'text', group: 'Financial Info', required: true, validators:(value: unknown) => {
      if(!willPassRequiredStringValidation(value as string)) {
        return ['Fiscal Name is required'];
      }
      return [];
    }},
    { key: 'fiscaldaterange', label: 'Date Range', type: 'fiscal-daterange', group: 'Financial Info', 
      required: true, validators:(value: unknown) => {
        const valueArray = value as string[];
      if(!willPassRequiredStringValidation(valueArray[0])) {
        return ['Start Date is required'];
      }
      if(!willPassRequiredStringValidation(valueArray[1])) {
        return ['End Date is required'];
      }
      return [];
    },value: [dayjs().startOf('year').format(DEFAULT_NODE_DATE_FORMAT), dayjs().endOf('year').format(DEFAULT_NODE_DATE_FORMAT)]},
    { key: 'invnumber', label: 'Invoice number format', type: 'text', group: 'Other Info', required: true, validators:(value: unknown) => {
      if(!willPassRequiredStringValidation(value as string)) {
        return ['Invoice No. is required'];
      }
      return [];
    }, value: DEFAULT_INVOICE_NUMBER_FORMAT },
    { key: 'jnumber', label: 'Journal number format', type: 'text', group: 'Other Info', required: true, validators:(value: unknown) => {
      if(!willPassRequiredStringValidation(value as string)) {
        return ['Journal No. is required'];
      }
      return [];
    }, value: DEFAULT_JOURNAL_NUMBER_FORMAT },
    {
      key: 'currency',
      label: 'Currency',
      type: 'auto-complete',
      group: 'Other Info',
      required: true,
      validators:(value: unknown) => {
        if(!willPassRequiredStringValidation((value as Currency)?.name)) {
          return ['Currency is required'];
        }
        return [];
      },
      autoComplete: {
        items: this.currencies,
        optionDisplayValue: (item: Currency) => `${item.name} (${item.symbol})`,
        inputDisplayValue: (item: Currency) => `${item.name} (${item.symbol})`,
        trackBy: (item: Currency) => item.name,
        onSearch: (value: string) => {
          this.currencyStore.setSearch(value);
        }
      }
    },
    { key: 'dateformatForm', label: 'Date Format', type: 'auto-complete', group: 'Other Info',
      required: true,
      validators:(value: unknown) => {
        if(!willPassRequiredStringValidation((value as DateFormat)?.name)) {
          return ['Date Format is required'];
        }
        return [];
      },
      autoComplete: {
        items: this.dateFormats,
        optionDisplayValue: (item: DateFormat) => `${item.name} (${item.example})`,
        inputDisplayValue: (item: DateFormat) => `${item.name} (${item.example})`,
        trackBy: (item: DateFormat) => item.name,
        onSearch: (value: string) => {
          this.dateFormatStore.setSearch(value);
        }
      }
    },
  ]);
  

  readonly form: FormGroup = FormUtil.buildForm(this.orgFields(), this.fb);

  readonly title = signal('Organization Setup');
  private readonly fiscalStartCtrl = this.form.get('fiscalstart') as FormControl<string>;
 // convert control value stream into a signal
  readonly fiscalStartSignal = toSignal(this.fiscalStartCtrl.valueChanges, {
    initialValue: this.fiscalStartCtrl.value,
  });

  private makeSafeDate(year: number, monthIndex: number, day: number): dayjs.Dayjs {
    let d = dayjs({ year, month: monthIndex, day });
    if (!d.isValid() || d.month() !== monthIndex) {
      d = dayjs({ year, month: monthIndex, day: 1 }).endOf('month');
    }
    return d;
  }

  constructor() {

    effect(() => {
      if (this.countryStore.countriesLoaded()) {
        this.countries.set(this.countryStore.filteredCountries());
      } 
      else {
        this.store.dispatch(countryActions.loadCountries({query: {}}));
      }
      if(this.currencyStore.currenciesLoaded()) {
        this.currencies.set(this.currencyStore.filteredCurrencies());
        this.allCurrencies.set(this.currencyStore.fetchAllCurrencies());
      }else{
        this.store.dispatch(currencyActions.loadCurrencies({query: {}}));
      }
      if(this.dateFormatStore.dateFormatsLoaded()) {
        this.dateFormats.set(this.dateFormatStore.filteredDateFormats());
        this.allDateFormats.set(this.dateFormatStore.fetchAllDateFormats());
      }else{
        this.store.dispatch(dateFormatActions.loadDateFormats({query: {}}));
      }
    });
    effect(() => {
      const fiscalStart = this.fiscalStartSignal(); // e.g. "April-01"
      if (!fiscalStart) return;
    
      // parse month/day strictly from "MMMM-DD"
      const md = dayjs(fiscalStart, 'MMMM-DD', true);
      if (!md.isValid()) return; // or throw if you prefer
    
      // read current range (tuple) from the form without subscriptions
      const ctrl = this.form.get('fiscaldaterange') as FormControl<string[]> | null;
      const currentRange = ctrl?.value ?? null;
      const currentStartStr = currentRange?.[0] ?? dayjs().startOf('year').format(DEFAULT_NODE_DATE_FORMAT);
    
      // determine base year from current start (or now)
      const currentStart = dayjs(currentStartStr, DEFAULT_NODE_DATE_FORMAT, true);
      const year = currentStart.isValid() ? currentStart.year() : dayjs().year();
    
      // build the new start using the same year + parsed month/day (clamped if needed)
      const newStartDay = this.makeSafeDate(year, md.month(), md.date());
      const newStart = newStartDay.format(DEFAULT_NODE_DATE_FORMAT);
    
      // force 1-year window (inclusive style): +1y - 1d
      const newEnd = newStartDay.add(1, 'year').subtract(1, 'day').format(DEFAULT_NODE_DATE_FORMAT);
    
      // avoid loops: only write if changed
      if (currentRange && currentRange[0] === newStart && currentRange[1] === newEnd) return;
    
      // update the form (your helper)
      this.setByPath('fiscaldaterange', [newStart, newEnd]);
    });
  }
  
  handleSubmit(data: OrganizationBootstrapFormData) {

    const validatedFields = FormValidator.validate(data as any, this.orgFields());
  
    const hasErrors = validatedFields.some(fld => fld.errors?.length);
    if (hasErrors) {
      this.orgFields.set(validatedFields);
      return;
    }
    const {dateformatForm, country, fiscaldaterange, ...restData} = data;
    const [startdate, enddate] = fiscaldaterange;
    this.store.dispatch(organizationActions.bootstrapOrganization({ organization: {...restData, startdate, enddate, dateformat: dateformatForm?.name ?? '', country: {...country, dateformat: dateformatForm?.name ?? ''}} }));
  }

  onSearch(value: string) {
    this.countryStore.setSearch(value);
  }

  findDisplayValue(item: Country): string {
    return item.name;
  }

  findTrackBy(item: Country): string {
    return item.name;
  }
}
