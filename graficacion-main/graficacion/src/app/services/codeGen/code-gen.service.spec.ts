import { TestBed } from '@angular/core/testing';

import { CodeGenService } from './code-gen.service';

describe('CodeGenService', () => {
  let service: CodeGenService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CodeGenService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
