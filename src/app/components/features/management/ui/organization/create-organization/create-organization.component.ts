import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-create-organization',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-organization.component.html',
  styleUrl: './create-organization.component.css'
})
export class CreateOrganizationComponent {
  private fb = inject(FormBuilder);

  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    mobile: [''],
    address: this.fb.group({
      line1: [''],
      line2: [''],
      city: [''],
      pincode: [''],
    }),
    description: [''],
    country: [null],
    state: [''],
    fiscalstart: ['', Validators.required],
    fiscalname: ['', Validators.required],
    startdate: ['', Validators.required],
    enddate: ['', Validators.required],
    gstin: [''],
    invnumber: [''],
    currency: [null],
    jnumber: [''],
  });

  submitForm() {
    if (this.form.valid) {
      console.log(this.form.value);
    }
  }
}
