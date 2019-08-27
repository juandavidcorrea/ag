import {Component } from '@angular/core'
import {INoRowsOverlayAngularComp} from 'ag-grid-angular'

@Component({
  selector: 'app-no-rows',
  templateUrl: './no-rows.component.html',
  styleUrls: ['./no-rows.component.scss']
})
export class NoRowsComponent implements INoRowsOverlayAngularComp {
  private params: any

  agInit(params): void {
    this.params = params
  }
}
