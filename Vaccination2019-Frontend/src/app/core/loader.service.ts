import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  isLoading = false;

  constructor(private loadingController: LoadingController) { }

  async present() {
    this.isLoading = true;

    return await this.loadingController.create({}).then(loadingElement => {
      loadingElement.present().then(() => {
        if (!this.isLoading) {
          loadingElement.dismiss();
        }
      });
    });
  }

  async dismiss() {
    if (!this.isLoading) {
      return;
    }
    this.isLoading = false;
    return await this.loadingController.dismiss();
  }
}
