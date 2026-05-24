// ============================================================
// models/stock.model.ts
// Define todas as interfaces de dados da aplicação
// ============================================================

/**
 * Representa um item da carteira carregado do JSON/BD.
 * Corresponde diretamente à estrutura do carteira.json.
 */
export interface CarteiraItem {
  ticker: string;          // Símbolo da ação (ex: MSFT)
  empresa: string;         // Nome da empresa (ex: Microsoft)
  dataCompra: string;      // Data de compra (formato ISO: YYYY-MM-DD)
  quantidade: number;      // Quantidade de ações compradas
  precoUnitario: number;   // Preço unitário de compra (PU)
}

/**
 * Representa uma linha completa da tabela, combinando os dados
 * da carteira com a cotação atual obtida da API.
 */
export interface PortfolioRow extends CarteiraItem {
  cotacaoAtual: number | null;   // Cotação do dia (null se ainda a carregar)
  isLoading: boolean;            // Estado de carregamento da cotação
  hasError: boolean;             // Indica erro ao obter cotação

  // Campos calculados (getters no componente ou pré-calculados)
  totalAquisicao: number;        // QT × PU
  valorAtual: number | null;     // QT × Cotação do Dia
  variacao: number | null;       // (Cotação - PU) / PU × 100 (%)
}

/**
 * Representa os totais globais da carteira (linha de rodapé).
 */
export interface PortfolioTotals {
  totalAquisicao: number;        // Soma de todos os totais de aquisição
  valorAtual: number;            // Soma de todos os valores atuais
  variacaoGlobal: number;        // (Valor Total Atual / Valor Total Aquisição - 1) × 100
}

/**
 * Resposta da API Finnhub para cotação em tempo real.
 * Endpoint: /quote?symbol=MSFT
 */
export interface FinnhubQuoteResponse {
  c: number;    // Current price (cotação atual)
  d: number;    // Change (variação absoluta do dia)
  dp: number;   // Percent change (variação percentual do dia)
  h: number;    // High price of the day
  l: number;    // Low price of the day
  o: number;    // Open price of the day
  pc: number;   // Previous close price
  t: number;    // Timestamp
}

/**
 * Resposta da API Alpha Vantage (alternativa).
 * Endpoint: GLOBAL_QUOTE
 */
export interface AlphaVantageResponse {
  'Global Quote': {
    '01. symbol': string;
    '05. price': string;
    '09. change': string;
    '10. change percent': string;
  };
}

/**
 * Resposta normalizada da API — independente do fornecedor.
 * Usada internamente pelo StockService para abstrair a fonte.
 */
export interface StockQuote {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: Date;
}

/**
 * Modos de ordenação disponíveis na tabela.
 */
export type SortField =
  | 'ticker'
  | 'empresa'
  | 'dataCompra'
  | 'quantidade'
  | 'precoUnitario'
  | 'totalAquisicao'
  | 'cotacaoAtual'
  | 'valorAtual'
  | 'variacao';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortState {
  field: SortField | null;
  direction: SortDirection;
}