import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import {Vaccine, VaccinesResponse, VaccineType} from '../models/vaccine';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment.example';
import { MatDialog, MatPaginator, MatTableDataSource } from '@angular/material';
import { NewVaccineComponent } from './new/vaccines.new.component';
import { LoaderService } from '../core/loader.service';
import * as _ from 'lodash';
import {VaccinesService} from './vaccines.service';
import {AuthService} from '../core/auth.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-vaccines',
  templateUrl: './vaccines.component.html',
})
export class VaccinesComponent implements OnInit {
  filter: FormGroup;
  types: VaccineType[];
  dataSource: MatTableDataSource<Vaccine>;
  displayedColumns: string[];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  PAGE_SIZE = 10;
  lastPageEvent;
  role: string;

  constructor(private formBuilder: FormBuilder,
              private http: HttpClient,
              public dialog: MatDialog,
              public loaderService: LoaderService,
              private vaccinesService: VaccinesService,
              public authService: AuthService,
              private router: Router,
              private route: ActivatedRoute) {
    // noinspection JSAnnotator
    this.filter = this.formBuilder.group({
      vaccineType: [''],
      batchCode: [''],
    });
    this.role = this.authService.getRole();
    this.displayedColumns = ['name', 'type', 'batchCode', 'amount'];
    if (!this.isHcpManager()) {
      this.displayedColumns.push('price');
      this.displayedColumns.push('bloodTestPrice');
    }
  }

  async ngOnInit() {
    this.types = await this.vaccinesService.getVaccineTypes();
    setTimeout(() => {
      this.search();
    });
  }

  search(event?) {
    this.lastPageEvent = event || {pageSize: this.PAGE_SIZE, pageIndex: 0};
    let params = {...this.filter.value, ...this.lastPageEvent};
    params = _.pickBy(params, v => {
      return v || _.isNumber(v);
    });
    this.loaderService.increase();
    this.http.get<VaccinesResponse>(environment.endPoint + '/vaccines', {params}).toPromise()
      .then(res => {
        this.loaderService.decrease();
        let vaccines = [];
        for (let i = 0; i < this.lastPageEvent.pageIndex * this.lastPageEvent.pageSize; i++) {
          vaccines[i] = {};
        }
        vaccines = [...vaccines, ...res.items];
        for (let i = vaccines.length; i < res.pagination.count; i++) {
          vaccines[i] = {};
        }
        this.dataSource = new MatTableDataSource<Vaccine>(vaccines);
        this.dataSource.paginator = this.paginator;
      })
      .catch(() => this.loaderService.decrease());
  }

  openDialog() {
    const dialogRef = this.dialog.open(NewVaccineComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.update) {
        this.search();
      }
    });
  }

  openVaccine(row) {
    this.router.navigate([row._id], { relativeTo: this.route });
  }

  typeById(_id): VaccineType {
    return this.types.filter(type => type._id === _id).pop();
  }

  isHcpManager() {
    return this.authService.isHcpManager();
  }
}
