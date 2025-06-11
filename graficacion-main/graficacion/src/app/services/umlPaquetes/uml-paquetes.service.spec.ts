import { TestBed } from '@angular/core/testing';

import { UmlPaquetesService } from './uml-paquetes.service';

describe('UmlPaquetesService', () => {
  let service: UmlPaquetesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UmlPaquetesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
