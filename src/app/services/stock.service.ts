import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, of, forkJoin, timer } from 'rxjs';
import { map, catchError, switchMap, tap, delay } from 'rxjs/operators';
import { CarteiraItem, StockQuote, PortfolioRow } from '../models/stock.model';

@Injectable({ providedIn: 'root' })
export class StockService {

  private readonly MOCK_PRICES: Record<string, number> = {
  MSFT: 420.0,
  TSLA: 425.0,
  AAPL: 310.0,
  GOOGL: 385.0,
  AMZN: 265.0,
};

  constructor(private http: HttpClient) {}

  carregarCarteira(): Observable<CarteiraItem[]> {
  return this.http.get<CarteiraItem[]>('assets/carteira.json').pipe(
    tap(items => console.log('Carteira carregada:', items.length)),
    catchError(() => of(this.getCarteiraExemplo()))
  );
}

  obterCotacao(ticker: string): Observable<StockQuote> {
  const url = `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${environment.finnhubApiKey}`;
  
  return this.http.get<any>(url).pipe(
    map(response => ({
      ticker,
      price: response.c,
      change: response.d,
      changePercent: response.dp,
      timestamp: new Date(),
    })),
    catchError(() => {
      // Fallback para mock se a API falhar
      const base = this.MOCK_PRICES[ticker] ?? 100;
      return of({
        ticker,
        price: base,
        change: 0,
        changePercent: 0,
        timestamp: new Date(),
      });
    })
  );
}

  obterCotacoes(tickers: string[]): Observable<StockQuote[]> {
    if (tickers.length === 0) return of([]);
    return forkJoin(
      tickers.map(t => this.obterCotacao(t).pipe(
        catchError(() => of({ ticker: t, price: 0, change: 0, changePercent: 0, timestamp: new Date() }))
      ))
    );
  }

  obterCotacoesAutomaticas(tickers: string[], intervaloSegundos = 60): Observable<StockQuote[]> {
    return timer(0, intervaloSegundos * 1000).pipe(
      switchMap(() => this.obterCotacoes(tickers))
    );
  }

  private getCarteiraExemplo(): CarteiraItem[] {
    return [
      { ticker: 'MSFT', empresa: 'Microsoft', dataCompra: '2026-03-01', quantidade: 20, precoUnitario: 320 },
      { ticker: 'TSLA', empresa: 'Tesla',     dataCompra: '2026-03-20', quantidade: 50, precoUnitario: 220 },
    ];
  }
}