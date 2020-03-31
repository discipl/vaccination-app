import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {AuthService} from '../../../core/auth.service';
import {environment} from '../../../../environments/environment.example';
import {TranslateService} from '@ngx-translate/core';
import {ChartOptions} from 'chart.js';
import {HttpClient} from '@angular/common/http';
import {Vaccination} from '../../../models/vaccination';
import {Label} from 'ng2-charts';
import {Statistics} from '../../../models/statistics';
import {VaccineType} from '../../../models/vaccine';
import {VaccinesService} from '../../../vaccines/vaccines.service';
import {Role} from '../../../models/user';

@Component({
  selector: 'app-vaccination-details',
  templateUrl: './vaccination.details.component.html',
})
export class VaccinationDetailsComponent implements OnInit {
  vaccineTypes: VaccineType[];

  public pieChartOptions: ChartOptions = {
    responsive: true,
    legend: { position: 'top' }
  };
  public pieChartColors = [{ backgroundColor: ['#4472C4', '#ED7D31', '#A5A5A5'] }];

  public barChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    elements: {
      line: {
        fill: false,
      },
    },
    scales: {
      yAxes: [{
        ticks: {
          suggestedMin: 0
        }
      }]
    },
    legend: { position: 'top' }
  };

  vaccination: Vaccination;
  stepData: {
    statistics: Statistics,
    pieData: any[],
    barData: any[],
    pieChartLabels: Label[],
    pieChartData: number[],
    barChartLabels: Label[],
    barChartData: any[],
  }[];

  hcProviders: {}[];

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    public authService: AuthService,
    private translate: TranslateService,
    private vaccinesService: VaccinesService
  ) {
    this.stepData = [];
  }

  async ngOnInit() {
    this.vaccineTypes = await this.vaccinesService.getVaccineTypes();

    const id = this.route.snapshot.params.id;
    this.vaccination = await this.http.get<Vaccination>(`${environment.endPoint}/vaccinations/${id}`).toPromise();
    if (!this.authService.isHcpManager()) {
      this.http.get<Statistics[]>(`${environment.endPoint}/vaccinations/${id}/statistics`).toPromise()
        .then(res => {
          this.vaccination.steps.forEach((step, i) => {
            const statistics = new Statistics();
            Object.assign(statistics, res[i]);

            const reservedCount = statistics.initialCount - statistics.finishedCount - statistics.availableCount;
            const pieData = [
              { label: this.translate.instant('Finished count'), data: statistics.finishedCount },
              { label: this.translate.instant('Available count'), data: statistics.availableCount },
              { label: this.translate.instant('Reserved count'), data: reservedCount },
            ];
            const barData = [
              { label: this.translate.instant('Finished amount'), data: statistics.finishedAmount },
              { label: this.translate.instant('Initial amount'), data: statistics.initialAmount },
            ];
            const pieChartLabels = pieData.map(d => d.label);
            const pieChartData = pieData.map(d => d.data);
            const barChartLabels = ['Amount, €'];
            const barChartData = barData.map(d => ({ label: d.label, data: [d.data]}));

            this.stepData[i] = {
              statistics,
              pieData,
              barData,
              pieChartData,
              pieChartLabels,
              barChartData,
              barChartLabels,
            };
          });
        });
    }
    this.hcProviders = await Promise.all(
      this.vaccination.steps
        .map(step => this.http.get(`${environment.endPoint}/vaccinations/events/${step._id}/hcproviders`).toPromise()
        )
    );
  }

  getVaccineType(_id) {
    const [type] = this.vaccineTypes.filter(v => v._id === _id);
    return type && type.toString();
  }

  showMap(place) {
    return place && place.latitude && place.longitude;
  }
  isHCPManager() {
    return this.authService.getRole() === Role.HCP_MANAGER;
  }
}
