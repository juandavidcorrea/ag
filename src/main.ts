import {enableProdMode} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import {LicenseManager} from 'ag-grid-enterprise';

// tslint:disable-next-line:max-line-length
LicenseManager.setLicenseKey('Nubox_Colombia_SAS_NuboxColombia_single_1_Devs__13_August_2020_[v2]_MTU5NzI3NjgwMDAwMA==582da7f5b8433459a69d707ac9b3b719');

import {AppModule} from './app/app.module';
import {environment} from './environments/environment';

if (environment.production) {
  enableProdMode()
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
