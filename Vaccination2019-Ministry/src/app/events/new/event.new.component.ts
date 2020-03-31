import {AfterViewInit, Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatStepper } from '@angular/material';
import { Event, EventType } from '../../models/vaccination';
import { Vaccine } from '../../models/vaccine';
import { environment } from '../../../environments/environment.example';
import { LoaderService } from '../../core/loader.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, startWith, switchMap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { Address } from 'ngx-google-places-autocomplete/objects/address';
import { GooglePlaceDirective } from 'ngx-google-places-autocomplete';
import { dateInputMask } from '../../core/formats';
import { HealthcareProvider } from '../../models/user';

class Step {
  intervalFromPrevious: number;
  form: FormGroup;
  hcProviders: HealthcareProvider[];
}

@Component({
  selector: 'app-new-vaccination',
  templateUrl: './event.new.component.html',
})
export class NewEventComponent implements OnInit, AfterViewInit, OnDestroy {

  eventType: EventType;
  vaccines: Vaccine[] = [];
  vaccinesForm: FormGroup;
  @ViewChild('stepper') stepper: MatStepper;
  @ViewChild('placesRef0') placesRef0: GooglePlaceDirective;
  @ViewChild('placesRef1') placesRef1: GooglePlaceDirective;
  @ViewChild('placesRef2') placesRef2: GooglePlaceDirective;
  vaccinationEvent: Event;
  autocompletedVaccines: Observable<Vaccine[]>;
  autocompleteInterval;

  steps: Step[];
  stepsSettings = [
    {},
    { intervalFromPrevious: 30 },
    { intervalFromPrevious: 150 },
    { intervalFromPrevious: 90 },
  ];

  constructor(
    private dialogRef: MatDialogRef<NewEventComponent>,
    private formBuilder: FormBuilder,
    private loaderService: LoaderService,
    private http: HttpClient,
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.vaccinationEvent = data.vaccinationEvent;
    if (this.vaccinationEvent) {
      this.eventType = EventType.BLOOD_TEST;
    } else {
      this.eventType = EventType.VACCINATION;
    }
  }

  ngOnInit() {
    this.vaccinesForm = this.formBuilder.group({
      vaccines: [''],
      initialCount: ['']
    });

    this.autocompletedVaccines = this.vaccinesForm.get('vaccines').valueChanges.pipe(
      startWith(null),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(val => {
        return this.vaccineSearch(val);
      })
    );

    let viewSteps;
    if (this.eventType === EventType.VACCINATION) {
      viewSteps = this.stepsSettings.slice(0, 3);
    } else {
      viewSteps = this.stepsSettings.slice(this.stepsSettings.length - 1);
    }
    this.steps = viewSteps.map(step => ({
      intervalFromPrevious: step.intervalFromPrevious,
      form: this.formBuilder.group({
        type: [this.eventType],
        date: [''],
        alternativeDate: [''],
        place: this.formBuilder.group({
          name: [''],
          address: [''],
          addressDetails: this.formBuilder.group({
            streetAddress: [{value: '', disabled: true}],
            streetNumber: [{value: '', disabled: true}],
            city: [{value: '', disabled: true}],
            state: [{value: '', disabled: true}],
            zipCode: [{value: '', disabled: true}],
            country: [{value: '', disabled: true}],
          }),
          latitude: [''],
          longitude: ['']
        }),
        bigIds: [''],
      }),
      hcProviders: [],
    }));
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      Array.from(document.querySelectorAll('.date')).forEach(dateInputMask);
    }, 200);
    this.autocompleteInterval = setInterval(() => {
      // dirty hack because of 'ngx-google-places-autocomplete' rewrite autocomplete value after draw complete
      document.querySelector('#place\\.address').setAttribute('autocomplete', 'address-' + this.currentMinute());
    }, 100);
  }

  ngOnDestroy() {
    clearInterval(this.autocompleteInterval);
  }

  currentMinute() {
    const mills = (new Date()).getTime();
    return  mills - (mills % 60000);
  }

  vaccineSearch(batchCode): Observable<Vaccine[]> {
    return this.http.get<Vaccine[]>(environment.endPoint + '/vaccines/search', {params: {batchCode: batchCode || ''}});
  }

  displayVaccine(vaccine) {
    return vaccine.batchCode;
  }

  addVaccine() {
    const batchCode = this.vaccinesForm.get('vaccines').value && this.vaccinesForm.get('vaccines').value.batchCode;
    if (!batchCode) {
      return;
    }
    const [vaccineExists] = this.vaccines.filter(vaccine => `${vaccine.batchCode}` === batchCode);
    if (vaccineExists) {
      this.vaccinesForm.get('vaccines').setErrors({msg: this.translate.instant('Event.Vaccine in event')});
      return;
    }
    this.vaccineSearch(batchCode).toPromise()
      .then(res => {
        const [vaccine] = res;
        if (!vaccine) {
          this.vaccinesForm.get('vaccines').setErrors({msg: this.translate.instant('Event.Vaccine could not be found')});
        } else {
          this.vaccines.push(res[0]);
          this.vaccinesForm.get('vaccines').setValue('');
        }
      })
      .catch(err => {
        this.vaccinesForm.get('vaccines').setErrors({msg: this.translate.instant('Event.Vaccine could not be found')});
      });
  }

  removeVaccine(batchCode) {
    this.vaccines = this.vaccines.filter(vaccine => vaccine.batchCode !== batchCode);
  }

  addHCProvider(step: Step) {
    const bigId = step.form.get('bigIds').value;
    const [hcProviderExist] = step.hcProviders.filter(hcProvider => `${hcProvider.bigId}` === bigId);
    if (hcProviderExist) {
      step.form.get('bigIds').setErrors({msg: this.translate.instant('Event.BIGid in event')});
      return;
    }
    this.http.get<HealthcareProvider>(environment.endPoint + '/users/big/' + bigId)
      .subscribe(
        res => {
          step.hcProviders.push(res);
          step.form.get('bigIds').setValue('');
        },
        () => {
          step.form.get('bigIds').setErrors({msg: this.translate.instant('Event.Healthcare provider could not be found')});
        }
      );
  }

  removeHCProvider(step, bigId) {
    step.hcProviders = step.hcProviders.filter(hcProvider => hcProvider.bigId !== bigId);
  }

  async add() {
    this.loaderService.increase();
    try {
      const params: any = {};
      params.steps = this.steps.map(step => {
        const stepDate = {...step.form.getRawValue()};
        stepDate.bigIds = step.hcProviders.map(hcProvider => hcProvider.bigId);
        return stepDate;
      });
      if (this.eventType === EventType.VACCINATION) {
        params.vaccines = this.vaccines.map(vaccine => vaccine._id);
        params.initialCount = this.vaccinesForm.get('initialCount').value;
      } else if (this.eventType === EventType.BLOOD_TEST) {
        params.vaccinationEvent = this.vaccinationEvent && this.vaccinationEvent._id;
        Object.assign(params, params.steps[0]);
        delete params.steps;
        delete params.vaccine;
      }

      try {
        let url = environment.endPoint + '/vaccinations';
        if (this.eventType === EventType.BLOOD_TEST) {
          url += '/' + this.vaccinationEvent._id;
        }
        await this.http.put<Event>(url, params).toPromise();
        this.dialogRef.close({ update: true });
        this.loaderService.decrease();
      } catch (err) {
        this.handle400(err);
      }
    } finally {
      this.loaderService.decrease();
    }
  }

  handle400(err) {
    if (err.status === 400) {
      let step = 3;
      err.error.fields.forEach(field => {
        const pathContainer = field.path || field.param;
        const path = pathContainer.replace('body', '').replace(/"]\["/g, '|').replace(/\["/g, '').replace(/"]/g, '').split('|');
        let tabIndex = 0;
        if (['vaccines', 'initialCount'].includes(path[0])) {
          this.vaccinesForm.get(path[0]).setErrors({ msg: field.message });
          tabIndex = 0;
        } else {
          let subPath;
          if (this.isVaccination()) {
            subPath = [...path];
          } else {
            subPath = ['steps', 0, ...path];
          }
          if (subPath[0] === 'steps') {
            tabIndex = Number.parseInt(subPath[1], 10) + 1;
            if (subPath.length === 3) {
              this.steps[subPath[1]].form.get(subPath[2]).setErrors({msg: field.message});
            } else {
              this.steps[subPath[1]].form.get(subPath[2]).get(subPath[3]).setErrors({msg: field.message});
            }
          }
        }
        if (tabIndex < step) {
          step = tabIndex;
        }
      });
      if (!this.isVaccination()) {
        step = 0;
      }
      this.stepper.selectedIndex = step;
    }
  }

  handleAddressChange(address: Address, stepNumber: number) {
    this.steps
      .slice(stepNumber)
      .map(step => step.form.get('place'))
      .forEach(place => {
        place.get('address').setValue(address.formatted_address);
        place.get('latitude').setValue(address.geometry.location.lat());
        place.get('longitude').setValue(address.geometry.location.lng());
        const addressDetails = place.get('addressDetails');
        const googleAddressToVaccinationAddressMapping = {
          postal_code: 'zipCode',
          country: 'country',
          administrative_area_level_1: 'state',
          administrative_area_level_2: 'city',
          route: 'streetAddress',
          street_number: 'streetNumber',
        };
        for (const key of Object.keys(googleAddressToVaccinationAddressMapping)) {
          addressDetails.get(googleAddressToVaccinationAddressMapping[key]).setValue('');
        }
        for (const key of Object.keys(address.address_components)) {
          const componentName = address.address_components[key].types[0];
          const mapping = googleAddressToVaccinationAddressMapping[componentName];
          if (mapping) {
            addressDetails.get(mapping).setValue(address.address_components[key].long_name);
          }
        }
      });
  }

  placeNameChanged(event, stepNumber: number) {
    this.steps
      .slice(stepNumber)
      .map(step => step.form.get('place').get('name'))
      .forEach(name => name.setValue(event.target.value));
  }

  isVaccination() {
    return this.eventType === EventType.VACCINATION;
  }
}
