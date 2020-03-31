import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatPaginator, MatTableDataSource } from '@angular/material';
import { Vaccine } from '../models/vaccine';
import { HttpClient } from '@angular/common/http';
import { LoaderService } from '../core/loader.service';
import { environment } from '../../environments/environment.example';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, startWith, switchMap } from 'rxjs/operators';
import * as _ from 'lodash';
import { Event, EventType, Vaccination, VaccinationsResponse } from '../models/vaccination';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
})
export class EventsComponent implements OnInit {
  eventType: EventType;
  filter: FormGroup;
  dataSource: MatTableDataSource<Vaccination>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  PAGE_SIZE = 10;
  lastPageEvent;
  vaccines: Observable<Vaccine[]>;

  constructor(private formBuilder: FormBuilder,
              private http: HttpClient,
              public loaderService: LoaderService,
              private route: ActivatedRoute) {
    this.eventType = EventType.VACCINATION;
  }

  ngOnInit() {
    this.route.data.subscribe((data) => {
      this.filter = this.formBuilder.group({
        vaccine: [''],
        placeName: [''],
      });
      this.vaccines = this.filter.get('vaccine').valueChanges.pipe(
        startWith(null),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(val => {
          return this.vaccineSearch(val);
        })
      );
      setTimeout(async () => {
        await this.search();
      });
    });
  }

  vaccineSearch(batchCode) {
    return this.http.get<Vaccine[]>(environment.endPoint + '/vaccines/search', { params: { batchCode }});
  }

  displayVaccine(vaccine) {
    return vaccine.batchCode;
  }

  async search(event?) {
    this.lastPageEvent = event || { pageSize: this.PAGE_SIZE, pageIndex: 0 };
    let params = { ...this.filter.value, ...this.lastPageEvent, eventType: this.eventType };
    params.vaccine = params.vaccine && params.vaccine.batchCode || params.vaccine;
    params = _.pickBy(params, v => {
      return v || _.isNumber(v);
    });
    this.loaderService.increase();
    try {
      const res = await this.http.get<VaccinationsResponse>(environment.endPoint + '/vaccinations', { params }).toPromise();
      let vaccinations = [];
      for (let i = 0; i < this.lastPageEvent.pageIndex * this.lastPageEvent.pageSize; i++) {
        vaccinations[i] = {};
      }
      vaccinations = [...vaccinations, ...res.items];
      for (let i = vaccinations.length; i < res.pagination.count; i++) {
        vaccinations[i] = {};
      }
      vaccinations = vaccinations.map(e => {
        const entity = new Event();
        Object.assign(entity, e);
        return entity;
      });
      this.dataSource = new MatTableDataSource<Vaccination>(vaccinations);
      this.paginator.pageIndex = params.pageIndex;
      this.dataSource.paginator = this.paginator;
    } finally {
      this.loaderService.decrease();
    }
  }

  isVaccinations() {
    return this.eventType === EventType.VACCINATION;
  }
}
