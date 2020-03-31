import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environmentExample } from 'src/environments/environment.example';
import { User } from 'src/models/user-model';
import { StudentRequest } from 'src/models/student-registration-model';
import { HealthcareProviderRequest } from 'src/models/hcProvider-registration-model';

@Injectable()
export class LoginService {

  constructor(private http: HttpClient) { }

  loginHealthcareProvider(login: HealthcareProviderRequest): Observable<User> {
    return this.http.post<User>(environmentExample.endPoint + 'users/login', login);
  }

  loginStudent(login: StudentRequest): Observable<User> {
    return this.http.post<User>(environmentExample.endPoint + 'users/login', login);
  }
}
