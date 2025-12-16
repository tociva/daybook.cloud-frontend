import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DbcDatePicker } from './dbc-date-picker';

describe('DbcDatePicker', () => {
  let component: DbcDatePicker;
  let fixture: ComponentFixture<DbcDatePicker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DbcDatePicker]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DbcDatePicker);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
