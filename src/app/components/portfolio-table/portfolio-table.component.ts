// ============================================================
// components/portfolio-table/portfolio-table.component.ts
// Componente principal: tabela de monitorização da carteira
// ============================================================

import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { StockService } from '../../services/stock.service';
import {
  CarteiraItem,
  PortfolioRow,
  PortfolioTotals,
  StockQuote,
  SortField,
  SortDirection,
  SortState,
} from '../../models/stock.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-portfolio-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './portfolio-table.component.html',
  styleUrls: ['./portfolio-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioTableComponent implements OnInit, OnDestroy {
  // ----------------------------------------------------------
  // Estado do componente
  // ----------------------------------------------------------
  rows: PortfolioRow[] = [];           // Linhas da tabela (dados + cálculos)
  totals: PortfolioTotals | null = null; // Linha de TOTAL (rodapé)
  isLoading = true;                    // Carregamento inicial
  lastUpdate: Date | null = null;      // Última atualização das cotações
  errorMessage = '';                   // Mensagem de erro global

  // Ordenação da tabela
  sortState: SortState = { field: null, direction: null };

  // Subject para destruição automática de subscrições
  private destroy$ = new Subject<void>();

  constructor(
    private stockService: StockService,
    private cdr: ChangeDetectorRef
  ) {}

  // ----------------------------------------------------------
  // Lifecycle Hooks
  // ----------------------------------------------------------

  ngOnInit(): void {
  this.stockService.carregarCarteira()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (itens) => {
        this.rows = itens.map(item => this.criarRowBase(item));
        this.isLoading = false;
        this.cdr.markForCheck();

        const tickers = itens.map(i => i.ticker);
        this.iniciarAtualizacaoCotacoes(tickers);
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
}

  ngOnDestroy(): void {
    // Cancela todas as subscrições ativas para evitar memory leaks
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ----------------------------------------------------------
  // Inicialização
  // ----------------------------------------------------------

  /**
   * 1. Carrega os dados da carteira (JSON/BD)
   * 2. Cria as linhas com estado de carregamento
   * 3. Inicia a atualização automática das cotações
   */
  private inicializarCarteira(): void {
    this.stockService
      .carregarCarteira()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (itens) => {
          // Inicializa as linhas com isLoading = true (spinner nas cotações)
          this.rows = itens.map((item) => this.criarRowBase(item));
          this.isLoading = false;
          this.cdr.markForCheck();

          // Inicia atualização automática a cada 60 segundos
          const tickers = itens.map((i) => i.ticker);
          this.iniciarAtualizacaoCotacoes(tickers);
        },
        error: (erro) => {
          this.errorMessage = 'Erro ao carregar a carteira. Tente novamente.';
          this.isLoading = false;
          this.cdr.markForCheck();
          console.error('[PortfolioTable] Erro ao inicializar:', erro);
        },
      });
  }

  /**
   * Subscreve ao Observable de atualização automática das cotações.
   * Cada emissão atualiza todas as linhas e recalcula os totais.
   */
  private iniciarAtualizacaoCotacoes(tickers: string[]): void {
    this.stockService
      .obterCotacoesAutomaticas(tickers, 60) // atualiza a cada 60s
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cotacoes) => {
          this.aplicarCotacoes(cotacoes);
          this.lastUpdate = new Date();
          this.cdr.markForCheck(); // Notifica o CD (OnPush)
        },
        error: (erro) => {
          console.error('[PortfolioTable] Erro ao obter cotações:', erro);
        },
      });
  }

  // ----------------------------------------------------------
  // Lógica de Cálculo (requisito central do TP3)
  // ----------------------------------------------------------

  /**
   * Cria uma PortfolioRow base a partir de um CarteiraItem.
   * Os campos de cotação ficam nulos até a API responder.
   */
  private criarRowBase(item: CarteiraItem): PortfolioRow {
    return {
      ...item,
      cotacaoAtual: null,
      isLoading: true,
      hasError: false,
      // Calculado imediatamente (independe da cotação)
      totalAquisicao: this.calcularTotalAquisicao(item.quantidade, item.precoUnitario),
      valorAtual: null,
      variacao: null,
    };
  }

  /**
   * Aplica as cotações recebidas da API às linhas da tabela.
   * Recalcula valorAtual e variação para cada linha.
   */
  private aplicarCotacoes(cotacoes: StockQuote[]): void {
    // Cria um Map para lookup O(1) por ticker
    const cotacaoMap = new Map<string, StockQuote>();
    cotacoes.forEach((c) => cotacaoMap.set(c.ticker, c));

    this.rows = this.rows.map((row) => {
      const cotacao = cotacaoMap.get(row.ticker);

      if (!cotacao || cotacao.price === 0) {
        return { ...row, isLoading: false, hasError: true };
      }

      const cotacaoAtual = cotacao.price;
      return {
        ...row,
        cotacaoAtual,
        isLoading: false,
        hasError: false,
        valorAtual: this.calcularValorAtual(row.quantidade, cotacaoAtual),
        variacao: this.calcularVariacao(cotacaoAtual, row.precoUnitario),
      };
    });

    // Recalcula os totais globais após atualizar todas as linhas
    this.totals = this.calcularTotais(this.rows);
  }

  // ----------------------------------------------------------
  // Funções de Cálculo (puras — fáceis de testar unitariamente)
  // ----------------------------------------------------------

  /**
   * Total de Aquisição = QT × PU
   */
  calcularTotalAquisicao(quantidade: number, precoUnitario: number): number {
    return quantidade * precoUnitario;
  }

  /**
   * Valor Atual = QT × Cotação do Dia
   */
  calcularValorAtual(quantidade: number, cotacao: number): number {
    return quantidade * cotacao;
  }

  /**
   * Variação (%) = (Cotação - PU) / PU × 100
   * Retorna null se PU for 0 (evita divisão por zero).
   */
  calcularVariacao(cotacao: number, precoUnitario: number): number | null {
    if (precoUnitario === 0) return null;
    return ((cotacao - precoUnitario) / precoUnitario) * 100;
  }

  /**
   * Calcula os totais globais da carteira (linha de rodapé).
   * Variação Global = (Valor Total Atual / Valor Total Aquisição - 1) × 100
   */
  calcularTotais(rows: PortfolioRow[]): PortfolioTotals {
    const rowsComCotacao = rows.filter(
      (r) => r.cotacaoAtual !== null && r.valorAtual !== null
    );

    const totalAquisicao = rows.reduce(
      (acc, row) => acc + row.totalAquisicao,
      0
    );

    const valorAtual = rowsComCotacao.reduce(
      (acc, row) => acc + (row.valorAtual ?? 0),
      0
    );

    // Inclui apenas as ações com cotação no cálculo global
    const totalAquisicaoComCotacao = rowsComCotacao.reduce(
      (acc, row) => acc + row.totalAquisicao,
      0
    );

    const variacaoGlobal =
      totalAquisicaoComCotacao > 0
        ? (valorAtual / totalAquisicaoComCotacao - 1) * 100
        : 0;

    return { totalAquisicao, valorAtual, variacaoGlobal };
  }

  // ----------------------------------------------------------
  // Classificação de Variação (para ngClass)
  // ----------------------------------------------------------

  /**
   * Retorna a classe CSS correspondente ao valor de variação.
   * Usado com [ngClass] no template HTML.
   * 🔴 negative → variacao < 0
   * 🟢 positive → variacao > 0
   * ⚫ neutral  → variacao === 0 ou null
   */
  getVariacaoClass(variacao: number | null): string {
    if (variacao === null) return 'variacao-neutral';
    if (variacao > 0) return 'variacao-positive';
    if (variacao < 0) return 'variacao-negative';
    return 'variacao-neutral';
  }

  /**
   * Retorna o ícone (seta) correspondente à variação.
   */
  getVariacaoIcon(variacao: number | null): string {
    if (variacao === null) return '—';
    if (variacao > 0) return '▲';
    if (variacao < 0) return '▼';
    return '●';
  }

  /**
   * Formata a variação para exibição, incluindo o sinal + ou -.
   * ex: 3.125 → "+3.13%"  |  -1.5 → "-1.50%"
   */
  formatarVariacao(variacao: number | null): string {
    if (variacao === null) return '—';
    const sinal = variacao > 0 ? '+' : '';
    return `${sinal}${variacao.toFixed(2)}%`;
  }

  // ----------------------------------------------------------
  // Ordenação da Tabela
  // ----------------------------------------------------------

  /**
   * Alterna a ordenação de uma coluna ao clicar no cabeçalho.
   * Ciclo: null → asc → desc → null
   */
  ordenarPor(campo: SortField): void {
    if (this.sortState.field === campo) {
      // Cicla entre asc → desc → null
      const proximo: Record<string, SortDirection | null> = {
        asc: 'desc',
        desc: null,
        null: 'asc',
      };
      this.sortState = {
        field: proximo[this.sortState.direction ?? 'null'] ? campo : null,
        direction: proximo[this.sortState.direction ?? 'null'] as SortDirection,
      };
    } else {
      this.sortState = { field: campo, direction: 'asc' };
    }

    this.aplicarOrdenacao();
  }

  private aplicarOrdenacao(): void {
    if (!this.sortState.field || !this.sortState.direction) {
      return; // Sem ordenação ativa
    }

    const { field, direction } = this.sortState;
    const multiplicador = direction === 'asc' ? 1 : -1;

    this.rows = [...this.rows].sort((a, b) => {
      const valA = a[field as keyof PortfolioRow];
      const valB = b[field as keyof PortfolioRow];

      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'string' && typeof valB === 'string') {
        return valA.localeCompare(valB, 'pt-PT') * multiplicador;
      }

      return ((valA as number) - (valB as number)) * multiplicador;
    });
  }

  getSortIcon(campo: SortField): string {
    if (this.sortState.field !== campo) return '⇅';
    if (this.sortState.direction === 'asc') return '↑';
    if (this.sortState.direction === 'desc') return '↓';
    return '⇅';
  }

  // ----------------------------------------------------------
  // Ações do utilizador
  // ----------------------------------------------------------

  /**
   * Força uma atualização imediata das cotações (botão Atualizar).
   */
  atualizarCotacoes(): void {
    const tickers = this.rows.map((r) => r.ticker);
    // Coloca todas as linhas em estado de carregamento
    this.rows = this.rows.map((r) => ({ ...r, isLoading: true }));
    this.cdr.markForCheck();

    this.stockService
      .obterCotacoes(tickers)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cotacoes) => {
          this.aplicarCotacoes(cotacoes);
          this.lastUpdate = new Date();
          this.cdr.markForCheck();
        },
      });
  }

  // TrackBy para otimizar o *ngFor (evita re-renderização desnecessária)
  trackByTicker(index: number, row: PortfolioRow): string {
    return row.ticker;
  }
}