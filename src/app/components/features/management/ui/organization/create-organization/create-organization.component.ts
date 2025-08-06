import { Component, effect, inject, model, signal } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Store } from '@ngrx/store';
import { FormValidator } from '../../../../../../../util/form/form-validator';
import { FormUtil } from '../../../../../../../util/form/form.util';
import { willPassEmailValidation, willPassRequiredValidation } from '../../../../../../../util/form/validation.uti';
import { FormField } from '../../../../../../../util/types/form-field.model';
import { AutoComplete } from '../../../../../shared/auto-complete/auto-complete';
import { TwoColumnFormComponent } from '../../../../../shared/forms/two-column-form/two-column-form.component';
import { loadCountries } from '../../../../../shared/store/country/country.action';
import { Country } from '../../../../../shared/store/country/country.model';
import { CountryStore } from '../../../../../shared/store/country/country.store';
import { OrganizationBootstrap } from '../../../store/organization/organization.model';

@Component({
  selector: 'app-create-organization',
  standalone: true,
  imports: [TwoColumnFormComponent, AutoComplete],
  templateUrl: './create-organization.component.html',
  styleUrl: './create-organization.component.css',
})
export class CreateOrganizationComponent {
  private readonly fb = inject(FormBuilder);

  private readonly countryStore = inject(CountryStore);

  private readonly store = inject(Store);

  countries = signal<Country[]>([]);

  selectedCountry = signal<Country | null>(null);
  
  readonly orgFields = signal<FormField[]>([
    // 🟦 Basic Details
    { key: 'name', label: 'Name', type: 'text', required: true, group: 'Basic Details', validators:(value: unknown) => {
      if(!willPassRequiredValidation(value as string)) {
        return ['Name is required'];
      }
      return [];
    } },
    { key: 'email', label: 'Email', type: 'email', required: true, group: 'Basic Details', validators:(value: unknown) => {
      if(!willPassRequiredValidation(value as string)) {
        return ['Email is required'];
      }
      if(!willPassEmailValidation(value as string)) {
        return ['Invalid email address'];
      }
      return [];
    } },
    { key: 'mobile', label: 'Mobile', type: 'text', group: 'Basic Details' },
    { key: 'state', label: 'State', type: 'text', group: 'Basic Details' },
    { key: 'description', label: 'Description', type: 'textarea', group: 'Basic Details' },
  
    // 🟩 Address Info
    { key: 'address.line1', label: 'Line 1', type: 'text', group: 'Address Info', required: true, validators:(value: unknown) => {
      if(!willPassRequiredValidation(value as string)) {
        return ['Address Line 1 is required'];
      }
      return [];
    } },
    { key: 'address.line2', label: 'Line 2', type: 'text', group: 'Address Info' },
    { key: 'address.city', label: 'City', type: 'text', group: 'Address Info' },
    { key: 'address.pincode', label: 'Pincode', type: 'text', group: 'Address Info' },
    { key: 'gstin', label: 'GSTIN', type: 'text', group: 'Address Info' },
    { key: 'country', label: 'Country', type: 'auto-complete', group: 'Address Info',
      autoComplete: {
        items: this.countries,
        displayValue: (item: Country) => item.name,
        trackBy: (item: Country) => item.name,
        onSearch: (value: string) => {
          this.countryStore.setSearch(value);
        },
        onSelect: (item: Country) => {
          this.selectedCountry.set(item);
        }
      }
     },
    {
      key: 'currency',
      label: 'Currency',
      type: 'select',
      group: 'Address Info',
      required: true,
      options: [
        { label: 'INR', value: 'INR' },
        { label: 'USD', value: 'USD' },
      ]
    },
  
    // 🟨 Financial Info
    { key: 'fiscalstart', label: 'Fiscal Start', type: 'date', group: 'Financial Info', required: true, validators:(value: unknown) => {
      if(!willPassRequiredValidation(value as string)) {
        return ['Fiscal Start is required'];
      }
      return [];
    } },
    { key: 'fiscalname', label: 'Fiscal Name', type: 'text', group: 'Financial Info', required: true, validators:(value: unknown) => {
      if(!willPassRequiredValidation(value as string)) {
        return ['Fiscal Name is required'];
      }
      return [];
    } },
    { key: 'startdate', label: 'Start Date', type: 'date', group: 'Financial Info', required: true, validators:(value: unknown) => {
      if(!willPassRequiredValidation(value as string)) {
        return ['Start Date is required'];
      }
      return [];
    } },
    { key: 'enddate', label: 'End Date', type: 'date', group: 'Financial Info', required: true, validators:(value: unknown) => {
      if(!willPassRequiredValidation(value as string)) {
        return ['End Date is required'];
      }
      return [];
    } },
  
    // 🔢 Numbering Formats
    { key: 'invnumber', label: 'Invoice No.', type: 'text', group: 'Numbering Formats', required: true, validators:(value: unknown) => {
      if(!willPassRequiredValidation(value as string)) {
        return ['Invoice No. is required'];
      }
      return [];
    } },
    { key: 'jnumber', label: 'Journal No.', type: 'text', group: 'Numbering Formats', required: true, validators:(value: unknown) => {
      if(!willPassRequiredValidation(value as string)) {
        return ['Journal No. is required'];
      }
      return [];
    } },
  ]);
  

  readonly form: FormGroup = FormUtil.buildForm(this.orgFields(), this.fb);


  readonly formModel = signal({
    form: this.form,
    fields: this.orgFields(),
    title: 'Organization Setup',
  });



  constructor() {

    effect(() => {
      if (this.countryStore.countriesLoaded()) {
        this.countries.set(this.countryStore.filteredCountries());
        
      } 
      else {
        this.store.dispatch(loadCountries());
      }
    });

  }
  
  handleSubmit(data: OrganizationBootstrap) {
    const validatedFields = FormValidator.validate(data as any, this.orgFields());
  
    const hasErrors = validatedFields.some(fld => fld.errors?.length);
    if (hasErrors) {
      this.formModel.set({
        ...this.formModel(),
        fields: validatedFields
      });
      return;
    }
  
    console.log('✅ Valid submission:', data);
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
