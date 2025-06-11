import { TestBed } from '@angular/core/testing';

import { UmlComponentesService } from './uml-componentes.service';

describe('UmlComponentesService', () => {
  let service: UmlComponentesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UmlComponentesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
