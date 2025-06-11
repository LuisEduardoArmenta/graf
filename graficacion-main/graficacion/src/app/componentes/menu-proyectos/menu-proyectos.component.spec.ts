import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuProyectosComponent } from './menu-proyectos.component';

describe('MenuProyectosComponent', () => {
  let component: MenuProyectosComponent;
  let fixture: ComponentFixture<MenuProyectosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuProyectosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenuProyectosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
