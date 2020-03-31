import { Component, Inject } from '@angular/core';
import { LoaderService } from '../../core/loader.service';
import { HttpClient } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { FormBuilder, FormGroup } from '@angular/forms';
import { environment } from '../../../environments/environment.example';
import { NewVaccineComponent } from '../../vaccines/new/vaccines.new.component';
import { HcpManager } from '../../models/user';

@Component({
  selector: 'app-hcpManager.new',
  templateUrl: './hcpManager.new.component.html',
})
export class NewHcpManagerComponent {
  form: FormGroup;
  hcpManager: HcpManager;

  constructor(
    private dialogRef: MatDialogRef<NewHcpManagerComponent>,
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private loaderService: LoaderService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data.hcpManager) {
      this.hcpManager = data.hcpManager;
    }
    this.form = this.formBuilder.group({
      HCPManagerNumber: [this.hcpManager ? this.hcpManager.HCPManagerNumber : ''],
      password: [''],
    });
    if (data.hcpManager) {
      this.form.disable();
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }

  add() {
    this.loaderService.increase();
    this.http.put<HcpManager>(environment.endPoint + '/users', this.form.value).toPromise()
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
