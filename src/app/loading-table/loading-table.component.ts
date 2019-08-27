import {Component} from '@angular/core'
import {ILoadingOverlayAngularComp} from 'ag-grid-angular'

@Component({
  selector: 'app-loading-table',
  templateUrl: './loading-table.component.html',
  styleUrls : ['./loading-table.component.scss']
})
export class LoadingTableComponent implements ILoadingOverlayAngularComp {
  private params: any

  agInit(params): void {
    this.params = params
  }

}
