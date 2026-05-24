// ============================================================
// components/portfolio-table/portfolio-table.component.spec.ts
// Testes unitários das fórmulas de cálculo
// Execução: ng test
// ============================================================

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PortfolioTableComponent } from './portfolio-table.component';
import { StockService } from '../../services/stock.service';
import { PortfolioRow } from '../../models/stock.model';

describe('PortfolioTableComponent — Fórmulas', () => {
  let component: PortfolioTableComponent;
  let fixture: ComponentFixture<PortfolioTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PortfolioTableComponent],
      imports: [HttpClientTestingModule],
      providers: [StockService],
    }).compileComponents();

    fixture = TestBed.createComponent(PortfolioTableComponent);
    component = fixture.componentInstance;
  });

  // ── Testes das fórmulas com os dados do enunciado ──────────

  describe('calcularTotalAquisicao()', () => {
    it('MSFT: 20 × 320 = 6.400', () => {
      expect(component.calcularTotalAquisicao(20, 320)).toBe(6400);
    });

    it('TSLA: 50 × 220 = 11.000', () => {
      expect(component.calcularTotalAquisicao(50, 220)).toBe(11000);
    });
  });

  describe('calcularValorAtual()', () => {
    it('MSFT: 20 × 330 = 6.600', () => {
      expect(component.calcularValorAtual(20, 330)).toBe(6600);
    });

    it('TSLA: 50 × 224 = 11.200', () => {
      expect(component.calcularValorAtual(50, 224)).toBe(11200);
    });
  });

  describe('calcularVariacao()', () => {
    it('MSFT: (330 - 320) / 320 × 100 ≈ 3.125%', () => {
      const variacao = component.calcularVariacao(330, 320);
      expect(variacao).toBeCloseTo(3.125, 2);
    });

    it('TSLA: (224 - 220) / 220 × 100 ≈ 1.818%', () => {
      const variacao = component.calcularVariacao(224, 220);
      expect(variacao).toBeCloseTo(1.818, 2);
    });

    it('deve retornar null se PU for 0 (divisão por zero)', () => {
      expect(component.calcularVariacao(100, 0)).toBeNull();
    });
  });

  describe('calcularTotais()', () => {
    it('deve calcular variação global ≈ 2.29% com MSFT e TSLA', () => {
      const rows: PortfolioRow[] = [
        {
          ticker: 'MSFT', empresa: 'Microsoft', dataCompra: '2026-03-01',
          quantidade: 20, precoUnitario: 320,
          cotacaoAtual: 330, isLoading: false, hasError: false,
          totalAquisicao: 6400, valorAtual: 6600, variacao: 3.125,
        },
        {
          ticker: 'TSLA', empresa: 'Tesla', dataCompra: '2026-03-20',
          quantidade: 50, precoUnitario: 220,
          cotacaoAtual: 224, isLoading: false, hasError: false,
          totalAquisicao: 11000, valorAtual: 11200, variacao: 1.818,
        },
      ];

      const totais = component.calcularTotais(rows);

      expect(totais.totalAquisicao).toBe(17400);  // 6400 + 11000
      expect(totais.valorAtual).toBe(17800);       // 6600 + 11200
      // (17800 / 17400 - 1) × 100 ≈ 2.2988%
      expect(totais.variacaoGlobal).toBeCloseTo(2.2988, 2);
    });
  });

  // ── Testes das classes de cor (ngClass) ────────────────────

  describe('getVariacaoClass()', () => {
    it('variação positiva → variacao-positive', () => {
      expect(component.getVariacaoClass(3.125)).toBe('variacao-positive');
    });

    it('variação negativa → variacao-negative', () => {
      expect(component.getVariacaoClass(-1.5)).toBe('variacao-negative');
    });

    it('variação zero → variacao-neutral', () => {
      expect(component.getVariacaoClass(0)).toBe('variacao-neutral');
    });

    it('variação null → variacao-neutral', () => {
      expect(component.getVariacaoClass(null)).toBe('variacao-neutral');
    });
  });

  describe('formatarVariacao()', () => {
    it('positivo: +3.13%', () => {
      expect(component.formatarVariacao(3.125)).toBe('+3.13%');
    });

    it('negativo: -1.50%', () => {
      expect(component.formatarVariacao(-1.5)).toBe('-1.50%');
    });

    it('null: —', () => {
      expect(component.formatarVariacao(null)).toBe('—');
    });
  });
});