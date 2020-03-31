import { Injectable } from '@angular/core';
import { User, Role } from 'src/models/user-model';
import { HttpClient } from '@angular/common/http';
import { environmentExample } from '../../../environments/environment.example';
import { Observable } from 'rxjs/internal/Observable';
import { of } from 'rxjs/internal/observable/of';

@Injectable()
export class AuthService {
    user: User;

    constructor(
        private http: HttpClient,
    ) {
    }

    initSession(): Promise<any> {
        if (this.isAuthenticated) {
            return this.loadUser();
        }
        return Promise.resolve();
    }

    get token() {
        return localStorage.getItem('token');
    }

    get isAuthenticated(): boolean {
        return !!this.token;
    }

    get role(): Role {
        return this.user ? this.user.role : null;
    }

    logout() {
        localStorage.clear();
        this.user = null;
    }

    loadUser(): Promise<User> {
        return this.http.get<User>(environmentExample.endPoint + 'users')
            .toPromise()
            .then(res => this.user = res);
    }

    getRole() {
      return this.user.role;
    }
}
