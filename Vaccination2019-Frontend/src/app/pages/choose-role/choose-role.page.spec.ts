import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChooseRolePage } from './choose-role.page';

describe('ChooseRolePage', () => {
  let component: ChooseRolePage;
  let fixture: ComponentFixture<ChooseRolePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChooseRolePage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChooseRolePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
