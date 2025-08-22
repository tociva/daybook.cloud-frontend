import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ActionCreator, Store } from '@ngrx/store';
import { FormValidator } from '../../../../../../util/form/form-validator';
import { FormUtil } from '../../../../../../util/form/form.util';
import { willPassRequiredStringValidation } from '../../../../../../util/form/validation.uti';
import { FormField } from '../../../../../../util/types/form-field.model';
import { TwoColumnFormComponent } from '../../../../../shared/forms/two-column-form/two-column-form.component';
import { ItemNotFound } from '../../../../../shared/item-not-found/item-not-found';
import { SkeltonLoader } from '../../../../../shared/skelton-loader/skelton-loader';
import { customerActions, CustomerCU, CustomerStore } from '../../../store/customer';
import { Country } from '../../../../../shared/store/country/country.model';
import { toFlagEmoji } from '../../../../../../util/common.util';
import { loadCountries } from '../../../../../shared/store/country/country.action';
import { CountryStore } from '../../../../../shared/store/country/country.store';
import { CurrencyStore } from '../../../../../shared/store/currency/currency.store';
import { DateFormatStore } from '../../../../../shared/store/date-format/date-format.store';
import { Currency } from '../../../../../shared/store/currency/currency.model';
import { DateFormat } from '../../../../../shared/store/date-format/date-format.model';

@Component({
  selector: 'app-create-customer',
  imports: [TwoColumnFormComponent, SkeltonLoader, ItemNotFound],
  templateUrl: './create-customer.html',
  styleUrl: './create-customer.css'
})
export class CreateCustomer implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  readonly customerStore = inject(CustomerStore);
  readonly selectedCustomer = this.customerStore.selectedItem;
  successAction = signal<ActionCreator[] | ActionCreator | null>(null);
  protected loading = true;
  protected mode:'create'|'edit' = 'create';
  private itemId = signal<string | null>(null);
  countries = signal<Country[]>([]);
  countryStore = inject(CountryStore);
  currencyStore = inject(CurrencyStore);
  dateFormatStore = inject(DateFormatStore);
  currencies = signal<Currency[]>([]);
  dateFormats = signal<DateFormat[]>([]);
  
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
  
  readonly formFields = signal<FormField[]>([
    // 🟦 Basic Details
    { key: 'name', label: 'Name', type: 'text', required: true, group: 'Basic Details', validators:(value: unknown) => {
      if(!willPassRequiredStringValidation(value as string)) {
        return ['Name is required'];
      }
      return [];
    }},
    { key: 'mobile', label: 'Mobile', type: 'text', required: false, group: 'Basic Details'},
    { key: 'email', label: 'Email', type: 'email', required: false, group: 'Basic Details'},
    { key: 'gstin', label: 'GSTIN', type: 'text', required: false, group: 'Basic Details'},
    
    // 🟦 Additional Details
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
        optionDisplayValue: (item: Country) => `${toFlagEmoji(item.iso)} ${item.name}`,
        inputDisplayValue: (item: Country) => `${toFlagEmoji(item.iso)} ${item.name}`,
        trackBy: (item: Country) => item.name,
        onSearch: (value: string) => {
          this.countryStore.setSearch(value);
        },
      }
     },
    { key: 'state', label: 'State', type: 'text', required: false, group: 'Basic Details'},
    { key: 'description', label: 'Description', type: 'text', required: false, group: 'Basic Details'},
    
    // 🟦 Address Details
    { key: 'address.name', label: 'House/Building Name', type: 'text', required: true, group: 'Address Details'},
    { key: 'address.line1', label: 'Address Line 1', type: 'text', required: true, group: 'Address Details'},
    { key: 'address.line2', label: 'Address Line 2', type: 'text', required: false, group: 'Address Details'},
    { key: 'address.street', label: 'Street', type: 'text', required: false, group: 'Address Details'},
    { key: 'address.city', label: 'City', type: 'text', required: false, group: 'Address Details'},
    { key: 'address.state', label: 'State', type: 'text', required: false, group: 'Address Details'},
    { key: 'address.zip', label: '`ZIP` Code', type: 'text', required: false, group: 'Address Details'},
    { key: 'address.country', label: 'Country', type: 'text', required: false, group: 'Address Details'},
  ]);

  readonly form: FormGroup = FormUtil.buildForm(this.formFields(), this.fb);

  readonly title = signal('Customer Setup');

  private fillFormEffect = effect(() => {
    const customer = this.selectedCustomer();
    if (customer) {
      this.form.patchValue(customer);
      this.loading = false;
    }
  });

  private loadErrorEffect = effect(() => {
    const error = this.customerStore.error();
    if (error && this.mode === 'edit') {
      this.loading = false;
    }
  });

  ngOnInit(): void {
    const lastSegment = this.route.snapshot.url[this.route.snapshot.url.length - 1]?.path;

    if (lastSegment === 'create') {
      this.mode = 'create';
      this.successAction.set(customerActions.createCustomerSuccess);
      this.loading = false;
    } else if (lastSegment === 'edit') {
      this.itemId.set(this.route.snapshot.paramMap.get('id') || null);
      if(this.itemId()) {
        this.successAction.set(customerActions.updateCustomerSuccess);
        this.mode = 'edit';
        this.loading = true;
        this.store.dispatch(customerActions.loadCustomerById({ id: this.itemId()! }));
      }else{
        this.loading = false;
      }
    }
  }

  onDestroy() {
    this.fillFormEffect.destroy();
    this.loadErrorEffect.destroy();
  }

  handleSubmit = (data: CustomerCU) => {
    const validatedFields = FormValidator.validate(data as any, this.formFields());
    const hasErrors = validatedFields.some(fld => fld.errors?.length);
    if (hasErrors) {
      this.formFields.set(validatedFields);
      return;
    }

    // Ensure address object is properly structured
    const customer = {
      ...data,
      address: {
        name: data.address?.name || '',
        line1: data.address?.line1 || '',
        line2: data.address?.line2 || '',
        street: data.address?.street || '',
        city: data.address?.city || '',
        state: data.address?.state || '',
        zip: data.address?.zip || '',
        country: data.address?.country || '',
      },
      status: data.status !== undefined ? Number(data.status) : 1
    };

    if(this.mode === 'create') {
      this.store.dispatch(customerActions.createCustomer({ customer }));
    }else{
      this.store.dispatch(customerActions.updateCustomer({ id: this.itemId()!, customer }));
    }
  }
}
