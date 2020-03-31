import { Injectable } from '@angular/core';
import {VaccineType} from '../models/vaccine';
import {environment} from '../../environments/environment.example';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class VaccinesService {

  constructor(private http: HttpClient) { }

  async getVaccineTypes(): Promise<VaccineType[]> {
    return (await this.http.get<VaccineType[]>(`${environment.endPoint}/vaccines/types`).toPromise())
      .map(t => {
        const type = new VaccineType();
        Object.assign(type, t);
        return type;
      });
  }
}
