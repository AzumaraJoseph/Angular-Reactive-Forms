import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs/operators'


function emailMatcher (c: AbstractControl): { [key: string]: boolean } | null {
  const emailControl = c.get('email');
  const confirmControl = c.get('confirmEmail');

  if (emailControl?.pristine || confirmControl?.pristine) {
    return null;
  }

  if (emailControl?.value === confirmControl?.value) {
    return null;
  }
  return { 'match': true };
}

function ratingRange (min: number, max: number): ValidatorFn {    // factory function to wrap the custom validation fn to accept more parameters and return validatorFn
  return  (c: AbstractControl): {[key: string]: boolean} | null => { // custom validation function; and can only receive one parameter: abstractctrl
    if (c.value !== null && (isNaN(c.value) || c.value < min || c.value > max)) {
      return { 'range': true};
    }
    return null
  }
}

interface ValidationMessage {
  [key: string]: string;
}

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css']
})
export class CustomerComponent implements OnInit {
  customerForm!: FormGroup;
  errorMessage!: string;


  private validationMessages: ValidationMessage = {
    required: 'Please enter your email address.',
    email: 'Please enter a valid email address.'
  }

  get addresses (): FormArray {
    return <FormArray>this.customerForm.get('addresses');
  }

  constructor( private fb: FormBuilder) { }

  ngOnInit(): void {
    this.customerForm = this.fb.group({
      firstName: [ '', [Validators.required, Validators.minLength(3)] ],
      lastName: [ '', [Validators.required, Validators.maxLength(50)] ], // { value: 'Azumara', disabled: true} or ['', validators]
      emailGroup: this.fb.group({
        email: [ '', [Validators.required, Validators.email] ],
        confirmEmail: [ '', Validators.required ]
      }, { validator: emailMatcher }), //as AbstractControlOptions
      phone: '',
      notification: 'email',
      rating: [null, ratingRange(1, 5)],
      sendCatalog: true,
      addresses: this.fb.array([ this.buildAddress() ]),  // we can access by index and not by name
    });    
    
    this.customerForm.get('emailGroup')?.valueChanges.subscribe(value => console.log(JSON.stringify(value)));

    this.customerForm.get('notification')?.valueChanges.subscribe(value => this.setNotification(value));

    const emailControl = this.customerForm.get('emailGroup.email');
    emailControl?.valueChanges.pipe(
      debounceTime(1000)
    ).subscribe(value => this.setMessage(emailControl, 'email'));
  }

  buildAddress (): FormGroup {
    return this.fb.group({
      addressType: 'home',
      street1: '',
      street2: '',
      city: '',
      state: '',
      zipCode: Number
    })
  }

  addAddress (): void {
    this.addresses.push(this.buildAddress());
  }

  populateData (): void {
    this.customerForm.patchValue({
      firstName: 'John',
      lastName: 'Azumarest',
      email: 'jackmuller@ymail.com',
      sendCatalog: false
    })
  }

  setNotification (notifyVia: string): void {
    const phoneControl = this.customerForm.get('phone');

    if (notifyVia === 'text') {
      phoneControl?.setValidators(Validators.required);
    } else {
      phoneControl?.clearValidators()
    }
    phoneControl?.updateValueAndValidity();
  }

  setMessage (c: AbstractControl, controlName: string): void {
    this.errorMessage = '';
    
    if ((c.touched || c.dirty) && c.errors) {
      this.errorMessage = Object.keys(c.errors).map(key => this.validationMessages[key]).join(' ') || 'Invalid ' + controlName + ' value';
    }
  }

  save(): void {
    console.log(this.customerForm);
    console.log('Saved: ' + JSON.stringify(this.customerForm.value));
  }
}
