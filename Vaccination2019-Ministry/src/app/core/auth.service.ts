import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment.example';
import { Role, User } from '../models/user';
import { LoginRequest } from '../models/login';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user: User;

  constructor(
    private http: HttpClient) {
  }

  initSession() {
    if (location.pathname !== '/login') {
      return this.http.get<User>(environment.endPoint + '/users').toPromise()
        .then(res => this.user = res)
        .catch(() => {});
    }
  }

  login(request: LoginRequest): Promise<User> {
    return this.http.post<User>(environment.endPoint + '/users/login', request).toPromise()
      .then(res => this.user = res);
  }

  logout() {
    return this.http.post(environment.endPoint + '/users/logout', {}).toPromise()
      .then(() => this.user = null);
  }

  isHcpManager() {
    return this.user && this.user.role === Role.HCP_MANAGER;
  }

  canAccessUrl(url: String): boolean {
    return this.user && this.user.role === Role.MINISTRY && url === '/hcpManagers';
  }

  getRole() {
    return this.user.role;
  }
}
