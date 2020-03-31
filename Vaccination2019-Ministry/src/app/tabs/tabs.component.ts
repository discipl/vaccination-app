import { Component, OnInit } from '@angular/core';
import { LanguageService } from '../core/language.service';
import { AuthService } from '../core/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
})
export class TabsComponent implements OnInit {
  role: string;
  constructor(
    private languageService: LanguageService,
    private authService: AuthService,
    private router: Router) {
    this.role = authService.getRole();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  setLanguage(language: string) {
    this.languageService.setLanguage(language);
  }

  ngOnInit(): void {
    if (this.router.url === '/') {
      this.router.navigate(['/vaccines']);
    }
  }

  getLanguage() {
    return this.languageService.selected;
  }

  isHcpManager() {
    return this.authService.isHcpManager();
  }
}
