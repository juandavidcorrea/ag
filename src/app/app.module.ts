import {BrowserModule} from '@angular/platform-browser'
import {NgModule} from '@angular/core'

import {AppComponent} from './app.component'
import {AgGridModule} from 'ag-grid-angular'
import {HttpClientModule} from '@angular/common/http'
import 'ag-grid-enterprise'
import {TableComponent} from './table/table.component';
import {LoadingTableComponent} from './loading-table/loading-table.component';
import {NoRowsComponent} from './no-rows/no-rows.component'

@NgModule({
  declarations: [
    AppComponent,
    TableComponent,
    LoadingTableComponent,
    NoRowsComponent
  ],
  imports: [
    BrowserModule,
    AgGridModule.withComponents([AppComponent, NoRowsComponent, LoadingTableComponent]),
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
