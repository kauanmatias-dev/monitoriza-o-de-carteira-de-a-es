import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioTableComponent } from './components/portfolio-table/portfolio-table.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, PortfolioTableComponent],
  template: `<app-portfolio-table></app-portfolio-table>`,
})
export class AppComponent {}