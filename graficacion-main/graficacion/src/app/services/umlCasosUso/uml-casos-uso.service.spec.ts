import { TestBed } from '@angular/core/testing';

import { UmlCasosUsoService } from './uml-casos-uso.service';

describe('UmlCasosUsoService', () => {
  let service: UmlCasosUsoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UmlCasosUsoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
