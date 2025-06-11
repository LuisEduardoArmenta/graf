import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UmlClasesComponent } from './uml-clases.component';

describe('UmlClasesComponent', () => {
  let component: UmlClasesComponent;
  let fixture: ComponentFixture<UmlClasesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UmlClasesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UmlClasesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
