import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UmlCasosUsoComponent } from './uml-casos-uso.component';

describe('UmlCasosUsoComponent', () => {
  let component: UmlCasosUsoComponent;
  let fixture: ComponentFixture<UmlCasosUsoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UmlCasosUsoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UmlCasosUsoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
