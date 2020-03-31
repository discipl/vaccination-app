import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environmentExample } from 'src/environments/environment.example';
import { User } from 'src/models/user-model';
import { HealthcareProviderRequest } from 'src/models/hcProvider-registration-model';
import { StudentRequest } from 'src/models/student-registration-model';

@Injectable({
  providedIn: 'root'
})
export class RegisterService {

  constructor(private http: HttpClient) { }

  addHealthcareProvider(register: HealthcareProviderRequest): Observable<User> {
    return this.http.put<User>(environmentExample.endPoint + 'users', register);
  }

  addStudent(register: StudentRequest): Observable<User> {
    return this.http.put<User>(environmentExample.endPoint + 'users', register);
  }
}
