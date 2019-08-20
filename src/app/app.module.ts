import {BrowserModule} from '@angular/platform-browser'
import {NgModule} from '@angular/core'

import {AppComponent} from './app.component'
import {AgGridModule} from 'ag-grid-angular'
import {HttpClientModule} from '@angular/common/http'
import 'ag-grid-enterprise'
import {TableComponent} from './table/table.component'

@NgModule({
  declarations: [
    AppComponent,
    TableComponent
  ],
  imports: [
    BrowserModule,
    AgGridModule.withComponents([AppComponent]),
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
