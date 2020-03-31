import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Vaccine, VaccineType } from '../../models/vaccine';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.example';
import { AuthService } from '../../core/auth.service';
import { ChartOptions } from 'chart.js';
import { Label } from 'ng2-charts';
import { TranslateService } from '@ngx-translate/core';
import { VaccinesService } from '../vaccines.service';
import { Statistics } from '../../models/statistics';

@Component({
  selector: 'app-vaccines-details',
  templateUrl: './vaccines.details.component.html',
})
export class VaccinesDetailsComponent implements OnInit {

  public pieChartOptions: ChartOptions = {
    responsive: true,
    legend: { position: 'top' }
  };
  public pieData = [];
  public pieChartLabels: Label[] = [];
  public pieChartData: number[] = [];
  public pieChartColors = [{ backgroundColor: ['#4472C4', '#ED7D31', '#A5A5A5'] }];

  public barChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 4,
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
  public barData = [];
  public barChartLabels = ['Amount, €'];
  public barChartData = [];

  vaccineTypes: VaccineType[] = [];

  vaccine: Vaccine;
  statistics: Statistics;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    public authService: AuthService,
    private translate: TranslateService,
    private vaccineService: VaccinesService
  ) {
  }

  async ngOnInit() {
    const id = this.route.snapshot.params.id;
    const promises = [];

    this.vaccineTypes = await this.vaccineService.getVaccineTypes();

    promises.push(
      this.http.get<Vaccine>(`${environment.endPoint}/vaccines/${id}`).toPromise()
        .then(res => this.vaccine = res));
    if (!this.authService.isHcpManager()) {
      promises.push(this.http.get<Statistics>(`${environment.endPoint}/vaccines/${id}/statistics`).toPromise()
        .then(res => {
          this.statistics = {};
          Object.assign(this.statistics, res);

          const reservedCount = this.statistics.initialCount - this.statistics.finishedCount - this.statistics.availableCount;
          this.pieData = [
            { label: this.translate.instant('Finished count'), data: this.statistics.finishedCount },
            { label: this.translate.instant('Available count'), data: this.statistics.availableCount },
            { label: this.translate.instant('Reserved count'), data: reservedCount },
          ];
          this.pieChartLabels = this.pieData.map(d => d.label);
          this.pieChartData = this.pieData.map(d => d.data);

          this.barData = [
            { label: this.translate.instant('Initial amount'), data: [this.statistics.initialAmount] },
            { label: this.translate.instant('Finished amount'), data: [this.statistics.finishedAmount] }
          ];
          this.barChartData = this.barData.map(d => ({ label: d.label, data: [d.data]}));
          const maxAmount = Math.max(this.statistics.initialAmount, this.statistics.finishedAmount);
          console.log(`steps ${maxAmount % 5}`);
          this.barChartOptions.scales.yAxes[0].ticks.stepSize = Math.ceil(maxAmount / 4);
          this.barChartOptions = {...this.barChartOptions};
        }));
    }
    await promises;

  }

  getVaccineType(_id) {
    const [type] = this.vaccineTypes.filter(v => v._id === _id);
    return type && type.toString();
  }

}
