import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UmlComponentesComponent } from './uml-componentes.component';

describe('UmlComponentesComponent', () => {
  let component: UmlComponentesComponent;
  let fixture: ComponentFixture<UmlComponentesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UmlComponentesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UmlComponentesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
