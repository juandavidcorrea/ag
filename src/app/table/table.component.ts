import {Component, EventEmitter, Input, Output} from '@angular/core'
import {AgGridEvent, ColDef, ColumnApi, GridOptions, RowNode} from 'ag-grid-community'

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

type Row<T> = T & { events: Events<Partial<T>> } & { rowEdited: boolean, rowApplied: boolean }

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent<T extends Any | object | {}> {

  public changeLog: Array<Change> = []
  public readonly rowSelection = 'multiple'
  public readonly columnDefs: ColDef[] = [
    {headerName: 'Id', field: 'id'},
    {
      headerName: 'Usuario',
      field: 'userId',
      editable: true,
      cellClassRules: {
        changePendingCell: (params) => params.data.events[params.colDef.field].cellEdited,
        rollbackChange: (params) => params.data.events[params.colDef.field].rollback
      }
    },
    {
      headerName: 'Title', field: 'title', editable: true,
      cellClassRules: {
        changePendingCell: (params) => params.data.events[params.colDef.field].cellEdited,
        rollbackChange: (params) => params.data.events[params.colDef.field].rollback
      }
    },
    {
      headerName: 'Info', field: 'body', resizable: true, headerClass: 'resizable-header', editable: true,
      cellClassRules: {
        changePendingCell: (params) => params.data.events[params.colDef.field].cellEdited,
        rollbackChange: (params) => params.data.events[params.colDef.field].rollback
      }
    },
  ]
  public readonly gridOptions: GridOptions = {
    rowSelection: 'multiple',
    rowClassRules: {
      changePending: 'data.rowEdited',
      changeApplied: 'data.rowApplied',
    },
  }
  public rowData: Row<T>[]

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
  public onGridReady(params: AgGridEvent): void {
    this.gridApi = params.api
    this.gridColumnApi = params.columnApi
  }

  /**
   *
   */
  public commit(): void {

    this.applyChanges()

    this.dataModified.emit(
      Array
        .from(new Set(this.changeLog.map(value => value.key)))
        .map((key: number) => this.gridApi.getRowNode(String(key)))
        .filter(row => !!row)
        .map(value => value.data)
        .filter(data => !!data)
        .map(data => {
          delete data.events
          delete data.rowEdited
          setTimeout(() => delete data.rowApplied) // wait to animation finish
          return data as T
        })
    )

    this.changeLog = []
    const data: T[] = []
    this.gridApi.forEachNode((node: RowNode) => data.push(node.data))
    setTimeout(() => this.initDataToManageChanges(data), 1000) // wait to animation finish to init data
  }

  /*
   * @param $event object that contains all info in cell and row
   */
  public cellValueChanged($event): void {

    const log: Log = {
      colDef: $event.colDef,
      newValue: $event.newValue,
      oldValue: $event.oldValue
    }

    this.changeLog.push(new Change(log, $event.rowIndex))

    const row = this.gridApi.getRowNode($event.rowIndex)
    row.data.events[$event.colDef.field].cellEdited = true
    row.data.events[$event.colDef.field].rollback = false
    row.data.rowEdited = true
    row.setData(row.data)
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
  }

  /**
   * rollback one change in a row
   * @param changes is all modifications done in row
   * @param row is an instance of ag-grid
   */
  private rollBackRow(changes: Change[], row: RowNode): Change {
    const lastChange = changes.pop()
    const havingChanges: boolean = changes
      .some(value => value.log.colDef.field === lastChange.log.colDef.field && value.key === lastChange.key)
    row.data[lastChange.log.colDef.field] = lastChange.log.oldValue
    row.data.events[lastChange.log.colDef.field].rollback = !havingChanges
    row.data.events[lastChange.log.colDef.field].cellEdited = havingChanges
    row.data.rowEdited = changes.some(value => value.key === lastChange.key)
    row.setData(row.data)
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
        .forEach(key => events[key] = {})
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

  }

  /**
   * rollback value in row from last change
   */


  /**
   *
   */
  private notPendingChanges(row: RowNode): void {
    const data: Row<T> = row.data
    data.rowEdited = false
    row.setData(data)
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
  }
}

