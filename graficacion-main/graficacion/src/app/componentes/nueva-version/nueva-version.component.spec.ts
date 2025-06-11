import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NuevaVersionComponent } from './nueva-version.component';

describe('NuevaVersionComponent', () => {
  let component: NuevaVersionComponent;
  let fixture: ComponentFixture<NuevaVersionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NuevaVersionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NuevaVersionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
