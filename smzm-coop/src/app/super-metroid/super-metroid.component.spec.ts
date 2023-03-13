import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperMetroidComponent } from './super-metroid.component';

describe('SuperMetroidComponent', () => {
  let component: SuperMetroidComponent;
  let fixture: ComponentFixture<SuperMetroidComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SuperMetroidComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SuperMetroidComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
