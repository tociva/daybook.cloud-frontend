import { Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Store } from '@ngrx/store';
import { toFlagEmoji } from '../../../../../../util/common.util';
import { DEFAULT_INVOICE_NUMBER_FORMAT, DEFAULT_JOURNAL_NUMBER_FORMAT } from '../../../../../../util/constants';
import { FormValidator } from '../../../../../../util/form/form-validator';
import { FormUtil } from '../../../../../../util/form/form.util';
import { willPassEmailValidation, willPassRequiredValidation } from '../../../../../../util/form/validation.uti';
import { FormField } from '../../../../../../util/types/form-field.model';
import { TwoColumnFormComponent } from '../../../../../shared/forms/two-column-form/two-column-form.component';
import { loadCountries } from '../../../../../shared/store/country/country.action';
import { Country } from '../../../../../shared/store/country/country.model';
import { CountryStore } from '../../../../../shared/store/country/country.store';
import { Currency } from '../../../../../shared/store/currency/currency.model';
import { CurrencyStore } from '../../../../../shared/store/currency/currency.store';
import { DateFormat } from '../../../../../shared/store/date-format/date-format.model';
import { DateFormatStore } from '../../../../../shared/store/date-format/date-format.store';
import { organizationActions } from '../../../store/organization/organization.actions';
import { OrganizationBootstrap } from '../../../store/organization/organization.model';

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
  
  readonly orgFields = signal<FormField[]>([
    // 🟦 Basic Details
    { key: 'name', label: 'Name', type: 'text', required: true, group: 'Basic Details', validators:(value: unknown) => {
      if(!willPassRequiredValidation(value as string)) {
        return ['Name is required'];
      }
      return [];
    }, value: 'Test Organization' },
    { key: 'email', label: 'Email', type: 'email', required: true, group: 'Basic Details', validators:(value: unknown) => {
      if(!willPassRequiredValidation(value as string)) {
        return ['Email is required'];
      }
      if(!willPassEmailValidation(value as string)) {
        return ['Invalid email address'];
      }
      return [];
    }, value: 'test@test.com' },
    { key: 'country', label: 'Country', type: 'auto-complete', required: true, group: 'Basic Details',
      validators:(value: unknown) => {
        if(!willPassRequiredValidation((value as Country)?.name)) {
          return ['Country is required'];
        }
        return [];
      },
      autoComplete: {
        items: this.countries,
        displayValue: (item: Country) => `${toFlagEmoji(item.iso)} ${item.name}`,
        trackBy: (item: Country) => item.name,
        onSearch: (value: string) => {
          this.countryStore.setSearch(value);
        },
        onSelect: (item: Country) => {
          
            const fields = this.orgFields();
            const currencyF = fields.find(fld => fld.key === 'currency');
            if(currencyF) {
              currencyF.value = item.currency;
            }
            const dateFormatF = fields.find(fld => fld.key === 'dateformat');
            if(dateFormatF) {
              dateFormatF.value = item.dateFormat;
            }
            const mobileF = fields.find(fld => fld.key === 'mobile');
            if(mobileF){
              mobileF.value = `+${item.code}-`;
            }
        }
      }
     },
    { key: 'mobile', label: 'Mobile', type: 'text', group: 'Basic Details', value: '9876543210' },
    { key: 'state', label: 'State', type: 'text', group: 'Basic Details', value: 'Test State' },
    { key: 'description', label: 'Description', type: 'textarea', group: 'Basic Details', value: 'Test Description' },
  
    // 🟩 Address Info
    { key: 'address.line1', label: 'Line 1', type: 'text', group: 'Address Info', required: true, validators:(value: unknown) => {
      if(!willPassRequiredValidation(value as string)) {
        return ['Address Line 1 is required'];
      }
      return [];
    }, value: 'Test Line 1' },
    { key: 'address.line2', label: 'Line 2', type: 'text', group: 'Address Info', value: 'Test Line 2' },
    { key: 'address.city', label: 'City', type: 'text', group: 'Address Info', value: 'Test City' },
    { key: 'address.pincode', label: 'Pincode', type: 'text', group: 'Address Info', value: '123456' },
    { key: 'gstin', label: 'GSTIN', type: 'text', group: 'Address Info', value: '1234567890' },
    
    // 🟨 Financial Info
    { key: 'fiscalstart', label: 'Fiscal Start', type: 'date', group: 'Financial Info', required: true, validators:(value: unknown) => {
      if(!willPassRequiredValidation(value as string)) {
        return ['Fiscal Start is required'];
      }
      return [];
    }, value: '2025-04-01' },
    { key: 'fiscalname', label: 'Fiscal Name', type: 'text', group: 'Financial Info', required: true, validators:(value: unknown) => {
      if(!willPassRequiredValidation(value as string)) {
        return ['Fiscal Name is required'];
      }
      return [];
    }, value: '2025-2026' },
    { key: 'startdate', label: 'Start Date', type: 'date', group: 'Financial Info', required: true, validators:(value: unknown) => {
      if(!willPassRequiredValidation(value as string)) {
        return ['Start Date is required'];
      }
      return [];
    }, value: '2025-04-01' },
    { key: 'enddate', label: 'End Date', type: 'date', group: 'Financial Info', required: true, validators:(value: unknown) => {
      if(!willPassRequiredValidation(value as string)) {
        return ['End Date is required'];
      }
      return [];
    }, value: '2026-03-31' },
  
    // 🔢 Numbering Formats
    { key: 'invnumber', label: 'Invoice number format', type: 'text', group: 'Other Info', required: true, validators:(value: unknown) => {
      if(!willPassRequiredValidation(value as string)) {
        return ['Invoice No. is required'];
      }
      return [];
    }, value: DEFAULT_INVOICE_NUMBER_FORMAT },
    { key: 'jnumber', label: 'Journal number format', type: 'text', group: 'Other Info', required: true, validators:(value: unknown) => {
      if(!willPassRequiredValidation(value as string)) {
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
        if(!willPassRequiredValidation((value as Currency)?.name)) {
          return ['Currency is required'];
        }
        return [];
      },
      autoComplete: {
        items: this.currencies,
        displayValue: (item: Currency) => `${item.name} (${String.fromCharCode(parseInt(item.unicode, 16))})`,
        trackBy: (item: Currency) => item.name,
        onSearch: (value: string) => {
          this.currencyStore.setSearch(value);
        }
      }
    },
    { key: 'dateformat', label: 'Date Format', type: 'auto-complete', group: 'Other Info',
      required: true,
      validators:(value: unknown) => {
        console.log('value', value);
        if(!willPassRequiredValidation((value as DateFormat)?.name)) {
          return ['Date Format is required'];
        }
        return [];
      },
      autoComplete: {
        items: this.dateFormats,
        displayValue: (item: DateFormat) => `${item.name} (${item.value})`,
        trackBy: (item: DateFormat) => item.name,
        onSearch: (value: string) => {
          this.dateFormatStore.setSearch(value);
        }
      }
    },
  ]);
  

  readonly form: FormGroup = FormUtil.buildForm(this.orgFields(), this.fb);

  readonly title = signal('Organization Setup');


  constructor() {

    effect(() => {
      if (this.countryStore.countriesLoaded()) {
        this.countries.set(this.countryStore.filteredCountries());
        
      } 
      else {
        this.store.dispatch(loadCountries());
      }
      if(this.currencyStore.currenciesLoaded()) {
        this.currencies.set(this.currencyStore.filteredCurrencies());
      }
      if(this.dateFormatStore.dateFormatsLoaded()) {
        this.dateFormats.set(this.dateFormatStore.filteredDateFormats());
      }
    });

  }
  
  handleSubmit(data: OrganizationBootstrap) {

    console.log('data', data);
    const validatedFields = FormValidator.validate(data as any, this.orgFields());
  
    const hasErrors = validatedFields.some(fld => fld.errors?.length);
    if (hasErrors) {
      this.orgFields.set(validatedFields);
      return;
    }
  
          this.store.dispatch(organizationActions.bootstrapOrganization({ organization: data }));
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
