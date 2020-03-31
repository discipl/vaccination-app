import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment.example';
import { MatDialog, MatPaginator, MatTableDataSource } from '@angular/material';
import { NewHcpManagerComponent } from './new/hcpManager.new.component';
import { LoaderService } from '../core/loader.service';
import * as _ from 'lodash';
import { HcpManager, HcpManagersResponse } from '../models/user';

@Component({
  selector: 'app-hcpManagers',
  templateUrl: './hcpManager.component.html',
})
export class HcpManagerComponent implements OnInit {
  filter: FormGroup;
  dataSource: MatTableDataSource<HcpManager>;
  displayedColumns: string[] = ['HCPManagerNumber'];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  PAGE_SIZE = 10;
  lastPageEvent;

  constructor(private formBuilder: FormBuilder,
              private http: HttpClient,
              public dialog: MatDialog,
              public loaderService: LoaderService) {
    this.filter = this.formBuilder.group({
      HCPManagerNumber: [''],
    });
  }

  ngOnInit() {
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
    this.http.get<HcpManagersResponse>(environment.endPoint + '/users/hcpManagers', { params }).toPromise()
      .then(res => {
        this.loaderService.decrease();
        let hcpManagers = [];
        for (let i = 0; i < this.lastPageEvent.pageIndex * this.lastPageEvent.pageSize; i++) {
          hcpManagers[i] = {};
        }
        hcpManagers = [...hcpManagers, ...res.items];
        for (let i = hcpManagers.length; i < res.pagination.count; i++) {
          hcpManagers[i] = {};
        }
        this.dataSource = new MatTableDataSource<HcpManager>(hcpManagers);
        this.dataSource.paginator = this.paginator;
      })
      .catch(() => this.loaderService.decrease());
  }

  openDialog(hcpManager?) {
    const dialogRef = this.dialog.open(NewHcpManagerComponent, {data: {hcpManager: hcpManager}});
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.update) {
        this.search();
      }
    });
  }
}
