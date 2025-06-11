import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UmlPaquetesComponent } from './uml-paquetes.component';

describe('UmlPaquetesComponent', () => {
  let component: UmlPaquetesComponent;
  let fixture: ComponentFixture<UmlPaquetesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UmlPaquetesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UmlPaquetesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
