import { TestBed } from '@angular/core/testing';

import { UmlClasesService } from './uml-clases.service';

describe('UmlClasesService', () => {
  let service: UmlClasesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UmlClasesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
