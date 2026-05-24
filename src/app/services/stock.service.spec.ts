// ============================================================
// services/stock.service.spec.ts
// Testes unitários do StockService
// Execução: ng test
// ============================================================

import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { StockService } from './stock.service';
import { CarteiraItem } from '../models/stock.model';

describe('StockService', () => {
  let service: StockService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [StockService],
    });
    service = TestBed.inject(StockService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Garante que não há requests pendentes
  });

  it('deve ser criado com sucesso', () => {
    expect(service).toBeTruthy();
  });

  it('deve carregar a carteira do JSON', (done) => {
    const carteiraFake: CarteiraItem[] = [
      {
        ticker: 'MSFT',
        empresa: 'Microsoft',
        dataCompra: '2026-03-01',
        quantidade: 20,
        precoUnitario: 320,
      },
    ];

    service.carregarCarteira().subscribe((carteira) => {
      expect(carteira.length).toBe(1);
      expect(carteira[0].ticker).toBe('MSFT');
      done();
    });

    const req = httpMock.expectOne('/assets/carteira.json');
    expect(req.request.method).toBe('GET');
    req.flush(carteiraFake);
  });

  it('deve retornar dados de exemplo se o JSON falhar', (done) => {
    service.carregarCarteira().subscribe((carteira) => {
      expect(carteira.length).toBeGreaterThan(0);
      done();
    });

    const req = httpMock.expectOne('/assets/carteira.json');
    req.error(new ErrorEvent('Network error'));
  });
});