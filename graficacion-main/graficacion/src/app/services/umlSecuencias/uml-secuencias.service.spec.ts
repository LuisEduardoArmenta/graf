import { TestBed } from '@angular/core/testing';

import { UmlSecuenciasService } from './uml-secuencias.service';

describe('UmlSecuenciasService', () => {
  let service: UmlSecuenciasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UmlSecuenciasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
