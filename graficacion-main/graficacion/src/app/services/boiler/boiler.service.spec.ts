import { TestBed } from '@angular/core/testing';

import { BoilerService } from './boiler.service';

describe('BoilerService', () => {
  let service: BoilerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BoilerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
