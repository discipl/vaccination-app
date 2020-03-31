import { AfterViewInit, Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Vaccine, VaccineType } from '../../models/vaccine';
import { environment } from '../../../environments/environment.example';
import { LoaderService } from '../../core/loader.service';
import { integerInputMask } from '../../core/formats';
import { VaccinesService } from '../vaccines.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-vaccines.new',
  templateUrl: './vaccines.new.component.html',
})
export class NewVaccineComponent implements AfterViewInit, OnInit {
  form: FormGroup;
  vaccine: Vaccine;
  types: VaccineType[];
  @ViewChild('amountInput', {read: ViewContainerRef}) public amountInput;

  constructor(
    private dialogRef: MatDialogRef<NewVaccineComponent>,
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private loaderService: LoaderService,
    private vaccinesService: VaccinesService,
    public authService: AuthService
  ) {
    this.form = this.formBuilder.group({
      name: [this.vaccine ? this.vaccine.name : ''],
      type: [this.vaccine ? this.vaccine.type : ''],
      batchCode: [this.vaccine ? this.vaccine.batchCode : ''],
      price: [this.vaccine ? this.vaccine.price : ''],
      bloodTestPrice: [this.vaccine ? this.vaccine.bloodTestPrice : ''],
      initialAmount: [this.vaccine ? this.vaccine.initialAmount : ''],
    });
  }

  async ngOnInit() {
    this.types = await this.vaccinesService.getVaccineTypes();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      integerInputMask(this.amountInput);
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  add() {
    this.loaderService.increase();
    this.http.put<Vaccine>(environment.endPoint + '/vaccines', this.form.value).toPromise()
      .then(() => {
        this.dialogRef.close({update: true});
        this.loaderService.decrease();
      })
      .catch(err => {
        this.loaderService.decrease();
        if (err.status === 400) {
          err.error.fields.forEach(field => {
            const path = field.path.replace('body', '').replace('"]["', '|').replace('["', '').replace('"]', '').split('|');
            if (path.length === 1) {
              this.form.controls[path[0]].setErrors({msg: field.message});
            } else {
              this.form.get(path[0]).get(path[1]).setErrors({msg: field.message});
            }
          });
        }
      });
  }
}
