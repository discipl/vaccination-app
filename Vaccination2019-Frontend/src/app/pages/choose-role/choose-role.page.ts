import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Role } from 'src/models/user-model';

@Component({
  selector: 'app-choose-role',
  templateUrl: './choose-role.page.html',
  styleUrls: ['./choose-role.page.scss'],
})
export class ChooseRolePage {

  constructor(private router: Router) { }

  goToHealthcareProviderLogin() {
    this.router.navigate(['/login', Role.HealthcareProvider]);
  }

  goToStudentLogin() {
    this.router.navigate(['/login', Role.Student]);
  }
}
