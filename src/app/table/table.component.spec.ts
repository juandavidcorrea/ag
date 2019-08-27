import {async, ComponentFixture, TestBed} from '@angular/core/testing'

import {TableComponent} from './table.component'

type Data = any

describe('TableComponent', () => {
  let component: TableComponent<Data>
  let fixture: ComponentFixture<TableComponent<Data>>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TableComponent]
    })
      .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(TableComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
