import {Component, EventEmitter, Input, Output} from '@angular/core'
import {AgGridEvent, ColDef, ColumnApi, GridOptions, RowNode} from 'ag-grid-community'
import {LoadingTableComponent} from '../loading-table/loading-table.component'
import {NoRowsComponent} from '../no-rows/no-rows.component'

type Any = any

interface Log {
  oldValue: any
  newValue: any
  colDef: ColDef
}

class Change {
  constructor(
    public log: Log,
    public key: string | number
  ) {
  }
}

type Events<T> = {
  [key in keyof T]: {
    rollback: boolean,
    cellEdited: boolean
  }
}

type Row<T> = T & { events: Events<Required<T>> } & { rowEdited: boolean, rowApplied: boolean }

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent<T extends Any | object | {}> {

  public changeLog: Array<Change> = []
  public readonly rowSelection = 'multiple'
  public columnDefs: ColDef[]
  public rowData: Row<T>[]

  public readonly gridOptions: GridOptions = {
    rowSelection: 'multiple',
    rowClassRules: {
      changePending: 'data.rowEdited',
      changeApplied: 'data.rowApplied',
    },
    animateRows: true,
    enableBrowserTooltips: true,
  }
  public frameworkComponents = {
    customLoadingOverlay: LoadingTableComponent,
    customNoRowsOverlay: NoRowsComponent,
  }
  public loadingOverlayComponent = 'customLoadingOverlay'
  public noRowsOverlayComponent = 'customNoRowsOverlay'

  private gridApi
  private gridColumnApi: ColumnApi

  @Output()
  public dataModified: EventEmitter<T[]> = new EventEmitter<T[]>()

  @Input()
  public set data(data: T[]) {
    if (!data) {
      return
    }
    this.initDataToManageChanges(data)
  }

  /**
   */
  public loading(loading: boolean): this {
    if (loading) {
      this.gridApi.showLoadingOverlay()
    } else {
      this.gridApi.hideOverlay()
    }
    return this
  }

  /**
   *
   */
  public apply() {
    this.applyChanges()
    this.changeLog = []
    const data: T[] = []
    this.gridApi.forEachNode((node: RowNode) => data.push(node.data))
    setTimeout(() => this.initDataToManageChanges(data), 1000) // wait to animation finish to init data
  }

  /**/
  public failApply(error: string): this {
    alert(error)
    return this
  }

  @Input()
  public set columnDefsTable(def: ColDef[]) {
    this.columnDefs = def
      .map(col => {
        if (!col.editable) {
          return col
        }
        col.cellClassRules = {
          ...col.cellClassRules,
          changePendingCell: (params) => params.data.events[params.colDef.field].cellEdited,
          rollbackChange: (params) => params.data.events[params.colDef.field].rollback
        }
        return col
      })
  }

  /**
   */
  public onGridReady(params: AgGridEvent): void {
    this.gridApi = params.api
    this.gridColumnApi = params.columnApi

  }

  /**
   *
   */
  private emitCommit(): void {
    this.dataModified.emit(
      Array
        .from(new Set(this.changeLog.map(value => value.key)))
        .map((key: number) => this.gridApi.getRowNode(String(key)))
        .filter(row => !!row)
        .map(value => ({
          ...value.data
        }))
        .filter(data => !!data)
        .map<T>(data => {
          delete data.events
          delete data.rowEdited
          setTimeout(() => delete data.rowApplied) // wait to animation finish
          return data
        })
    )
    return void 0
  }


  /*
   * @param $event object that contains all info in cell and row
   */
  public cellValueChanged($event): void {

    const {colDef, newValue, oldValue, rowIndex} = $event
    if (String(oldValue) === String(newValue)) {
      return
    }

    const log: Log = {colDef, newValue, oldValue}

    this.changeLog.push(new Change(log, rowIndex))

    const row = this.gridApi.getRowNode(rowIndex)
    row.data.events[colDef.field].cellEdited = true
    row.data.events[colDef.field].rollback = false
    row.data.rowEdited = true
    row.setData(row.data)
    return void 0
  }

  /**
   * roolback modifications
   */
  public rollBackChangesStepByStep(): void {
    let lastChange = this.changeLog[this.changeLog.length - 1]
    if (!lastChange) {
      return alert('no tienes cambios')
    }

    const changesInRow = this.changeLog.filter(change => change.key === lastChange.key)
    const row = this.gridApi.getRowNode(String(lastChange.key))

    lastChange = this.rollBackRow(changesInRow, row)
    this.changeLog.splice(this.changeLog.indexOf(lastChange), 1)
    return void 0
  }

  /**
   *
   */
  public rollBackByRow(): void {
    const rowsSelected = this.gridApi.getSelectedNodes()
    if (rowsSelected.length > 1 || !rowsSelected.length) {
      return alert('debe seleccionar el registro que quiere rollbaquear')
    }

    const row = rowsSelected.pop()
    const changesInRow = this.changeLog.filter(change => change.key === row.rowIndex)
    if (!changesInRow.length) {
      return alert('No tiene cambios pendientes en este registro. ') // controlar con evento changeSelection
    }

    const lastChange = this.rollBackRow(changesInRow, row)
    this.changeLog.splice(this.changeLog.indexOf(lastChange), 1)
    return void 0
  }

  /**
   * rollback one change in a row
   * @param changes is all modifications done in row
   * @param row is an instance of ag-grid
   */
  private rollBackRow(changes: Change[], row: RowNode): Change {
    const lastChange: Change = changes.pop()
    const havingChanges: boolean = changes
      .some(value => value.log.colDef.field === lastChange.log.colDef.field && value.key === lastChange.key)
    row.data[lastChange.log.colDef.field] = lastChange.log.oldValue
    row.data.events[lastChange.log.colDef.field].rollback = !havingChanges
    row.data.events[lastChange.log.colDef.field].cellEdited = havingChanges
    row.data.rowEdited = changes.some(value => value.key === lastChange.key)
    row.setData(row.data)

    setTimeout(() => {
      // to remove class rollback to not show animation again
      row.data.events[lastChange.log.colDef.field].rollback = false
      row.setData(row.data)
    }, 1000)

    return lastChange
  }

  /**
   *
   */
  public rollBackAllChanges(): void {
    this.changeLog.forEach(change => {
      const row = this.gridApi.getRowNode(String(change.key))
      this.rollBackRow([change], row)
      this.notPendingChanges(row)
    })
    this.changeLog = []
    return void 0
  }

  /**
   *
   */
  public rollBackAllChangesSelected(): void {
    this.gridApi
      .getSelectedNodes()
      .forEach(row => {
        const changes = this.changeLog.filter(value => value.key === row.rowIndex) || []
        changes.reverse().forEach(change => {
          this.rollBackRow([change], row)
          this.changeLog.splice(this.changeLog.indexOf(change), 1)
        })
        this.notPendingChanges(row)
      })

    return void 0
  }

  /**
   * @param data is all info to show in table
   */
  private initDataToManageChanges(data: T[] = []): void {

    function init(t: T) {
      const events = {}
      Object
        .keys(t)
        .filter(t => t !== 'events')
        .forEach(key => events[key] = Object())
      return events
    }

    this.rowData = data.map<Row<T>>(
      row => ({
        ...row,
        events: init(row),
        rowApplied: false,
        rowEdited: false
      } as any)
    )

    setTimeout(() => {
      if (this.gridColumnApi) {
        this.gridColumnApi.autoSizeAllColumns()
      }
    })

    return void 0

  }

  /**
   *
   */
  private notPendingChanges(row: RowNode): void {
    const data: Row<T> = row.data
    data.rowEdited = false
    row.setData(data)
    return void 0
  }

  /**
   *
   */
  private applyChanges(): void {
    this.changeLog.forEach((change) => {
      const row: RowNode = this.gridApi.getRowNode(String(change.key))
      if (!row) {
        return
      }
      const data: Row<T> = row.data
      Object.keys(data.events).forEach(key => {
        data.events[key].rollback = false
        data.events[key].cellEdited = false
        data.rowEdited = false
        data.rowApplied = true
        row.setData(data)
      })
    })
    return void 0
  }
}

