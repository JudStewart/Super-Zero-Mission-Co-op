import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SocketTestingComponent } from './socket-testing.component';

describe('SocketTestingComponent', () => {
  let component: SocketTestingComponent;
  let fixture: ComponentFixture<SocketTestingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SocketTestingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SocketTestingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
