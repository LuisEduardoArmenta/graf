import { TestBed } from '@angular/core/testing';

import { ModalVersionesServicesService } from './modal-versiones-services.service';

describe('ModalVersionesServicesService', () => {
  let service: ModalVersionesServicesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModalVersionesServicesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
