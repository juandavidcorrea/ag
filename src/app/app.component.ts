import {Component, ViewChild} from '@angular/core'
import {HttpClient} from '@angular/common/http'
import {ColDef} from 'ag-grid-community'
import {TableComponent} from './table/table.component'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  @ViewChild(TableComponent, {static: true})
  public table: TableComponent<any>

  public data

  public readonly columnDefs: ColDef[] = [
    {headerName: 'Id', field: 'id'},
    {
      headerName: 'Usuario',
      field: 'userId',
      editable: true,
    },
    {
      headerName: 'Title', field: 'title', editable: true,
    },
    {
      headerName: 'Info', field: 'body', resizable: true, headerClass: 'resizable-header', editable: true,
    },
  ]

  constructor(
    private readonly http: HttpClient
  ) {
    this.data = this.getData()
  }

  getData = () =>
    this.http
      .get<any[]>('https://jsonplaceholder.typicode.com/posts')


  public dataChanged($event): void {
    this.table.loading(true)
    setTimeout(() => {
      this.table.loading(false).apply()
    }, 5000)
  }
}

