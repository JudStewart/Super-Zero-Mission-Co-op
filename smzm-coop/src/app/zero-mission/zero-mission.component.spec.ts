import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZeroMissionComponent } from './zero-mission.component';

describe('ZeroMissionComponent', () => {
  let component: ZeroMissionComponent;
  let fixture: ComponentFixture<ZeroMissionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ZeroMissionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ZeroMissionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
