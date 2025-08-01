import { Component, ViewChild } from '@angular/core';
import { DbcForm, FieldConfig } from '../../../../core/common/dbc-form/dbc-form';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-create-organization',
  standalone: true,
  imports: [CommonModule, DbcForm, MatButtonModule],
  templateUrl: './create-organization.html',
  styleUrl: './create-organization.scss'
})
export class CreateOrganization {
  @ViewChild(DbcForm) formRef!: DbcForm;

  organizationFields: FieldConfig[] = [
    { name: 'name', type: 'text', label: 'Organization Name' },
    { name: 'email', type: 'text', label: 'Email Address' },
    { name: 'phone', type: 'number', label: 'Phone Number' },
    {
      name: 'city',
      type: 'autocomplete',
      label: 'City',
      options: ['Kochi', 'Mumbai', 'Delhi', 'Chennai'],
      filterFn: (term: string, options: string[]) =>
        options.filter(opt =>
          opt.toLowerCase().includes(term.toLowerCase())
        )
    },
    { name: 'isActive', type: 'checkbox', label: 'Active?' }
  ];

  ngAfterViewInit() {
    this.formRef.setFields(this.organizationFields, {
      isActive: true
    });
  }

  onSave() {
    const formData = this.formRef.value;
    console.log('Form submitted:', formData);

    // Example: dispatch NgRx action
    // this.store.dispatch(createOrganization({ data: formData }));
  }
}
