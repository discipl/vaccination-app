import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatDialog, MatPaginator, MatTableDataSource } from '@angular/material';
import { NewEventComponent } from '../new/event.new.component';
import { Vaccination } from '../../models/vaccination';
import { HttpClient } from '@angular/common/http';
import { LoaderService } from '../../core/loader.service';
import { AuthService } from '../../core/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-vaccinations',
  templateUrl: './vaccinations.component.html',
})
export class VaccinationsComponent {
  @Input() dataSource: MatTableDataSource<Vaccination>;
  displayedColumns: string[] = ['vaccine', 'date', 'place', 'reservedCount', 'initialCount', 'bloodTest'];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Output() search = new EventEmitter<any>();
  role: string;

  constructor(
    public dialog: MatDialog,
    public http: HttpClient,
    public loaderService: LoaderService,
    public authService: AuthService,
    private translate: TranslateService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.role = this.authService.getRole();
  }

  newVaccinationDialog() {
    this.createDialog({});
  }

  newBloodTestDialog(vaccinationEvent) {
    this.createDialog({ vaccinationEvent });
  }

  createDialog(data) {
    const dialog = this.dialog.open(
      NewEventComponent,
      {
        data,
        minHeight: 500
      });
    dialog.afterClosed().subscribe(result => {
      if (result && result.update) {
        this.search.emit();
      }
    });
  }

  prepareData() {
    const data = [];
    if (this.dataSource && this.dataSource.data) {
      this.dataSource.data.forEach(vaccination => {
        data.push({
          _id: vaccination._id,
          vaccines: vaccination.vaccines,
          bloodTestExists: vaccination.steps.length === 4,
          vaccination
        });
        vaccination.steps.forEach((step, i) => {
          data.push({
            name: this.translate.instant(i === 3 ? 'General.Blood test' : 'General.Vaccination'),
            parentId: vaccination._id,
            allowedDates: step.allowedDates,
            place: step.place && step.place.name,
            initialCount: step.initialCount,
            availableCount: step.availableCount
          });
        });
      });
    }
    return data;
  }

  showDetails(element) {
    const vaccinationId = element.parentId || element._id;
    this.router.navigate([`${vaccinationId}`], { relativeTo: this.route });
  }

}
