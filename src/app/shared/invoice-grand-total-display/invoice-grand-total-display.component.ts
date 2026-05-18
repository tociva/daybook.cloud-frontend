import { Component, computed, inject, input } from '@angular/core';
import { UserSessionStore } from '../../components/features/management/data/user-session/user-session.store';

@Component({
  selector: 'app-invoice-grand-total-display',
  standalone: true,
  templateUrl: './invoice-grand-total-display.component.html',
  styleUrl: './invoice-grand-total-display.component.css',
})
export class InvoiceGrandTotalDisplayComponent {
  private readonly userSession = inject(UserSessionStore);

  /** Grand-total string produced by the draft store (e.g. "12345.67"). */
  readonly grandtotal = input.required<string>();

  protected readonly currencySymbol = computed(() => {
    const session = this.userSession.session();
    const code = session?.fiscalyear?.currencycode ?? session?.branch?.currencycode ?? 'INR';
    const symbols: Record<string, string> = {
      AED: 'د.إ', AUD: 'A$',  BDT: '৳',   CAD: 'C$',  CHF: 'Fr',
      CNY: '¥',   EUR: '€',   GBP: '£',   INR: '₹',   JPY: '¥',
      LKR: 'Rs',  MYR: 'RM',  NPR: '₨',   NZD: 'NZ$', OMR: 'ر.ع.',
      PKR: '₨',   QAR: 'ر.ق', SAR: 'ر.س', SGD: 'S$',  USD: '$',
    };
    return symbols[code] ?? code;
  });

  protected readonly amountInWords = computed(() => {
    const session      = this.userSession.session();
    const currencycode = session?.fiscalyear?.currencycode ?? session?.branch?.currencycode ?? 'INR';
    const countrycode  = session?.branch?.countrycode ?? 'IN';
    return this.convertToWords(parseFloat(String(this.grandtotal())) || 0, currencycode, countrycode);
  });

  // ── Amount-in-words logic ───────────────────────────────────────────────────

  private convertToWords(amount: number, currencycode: string, countrycode: string): string {
    const ones = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
      'Seventeen', 'Eighteen', 'Nineteen',
    ];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const numToWords = (n: number): string => {
      if (n === 0) return '';
      if (n < 20) return ones[n]! + ' ';
      if (n < 100) return tens[Math.floor(n / 10)]! + (n % 10 ? ' ' + ones[n % 10]! : '') + ' ';
      return ones[Math.floor(n / 100)]! + ' Hundred ' + numToWords(n % 100);
    };

    const { major, minor } = this.getCurrencyNames(currencycode);
    const useIndianSystem  = countrycode === 'IN';

    const wholeAmount = Math.floor(amount);
    const subunit     = Math.round((amount - wholeAmount) * 100);

    let result = '';
    if (wholeAmount === 0) {
      result = 'Zero';
    } else if (useIndianSystem) {
      const crore     = Math.floor(wholeAmount / 10_000_000);
      const lakh      = Math.floor((wholeAmount % 10_000_000) / 100_000);
      const thousand  = Math.floor((wholeAmount % 100_000) / 1_000);
      const remainder = wholeAmount % 1_000;

      if (crore)     result += numToWords(crore)    + 'Crore ';
      if (lakh)      result += numToWords(lakh)     + 'Lakh ';
      if (thousand)  result += numToWords(thousand) + 'Thousand ';
      if (remainder) result += numToWords(remainder);
    } else {
      const billion   = Math.floor(wholeAmount / 1_000_000_000);
      const million   = Math.floor((wholeAmount % 1_000_000_000) / 1_000_000);
      const thousand  = Math.floor((wholeAmount % 1_000_000) / 1_000);
      const remainder = wholeAmount % 1_000;

      if (billion)   result += numToWords(billion)  + 'Billion ';
      if (million)   result += numToWords(million)  + 'Million ';
      if (thousand)  result += numToWords(thousand) + 'Thousand ';
      if (remainder) result += numToWords(remainder);
    }

    result = result.trim() + ' ' + major;
    if (subunit > 0) result += ' and ' + numToWords(subunit).trim() + ' ' + minor;
    return result + ' Only';
  }

  private getCurrencyNames(code: string): { major: string; minor: string } {
    const map: Record<string, { major: string; minor: string }> = {
      AED: { major: 'Dirhams',  minor: 'Fils' },
      AUD: { major: 'Dollars',  minor: 'Cents' },
      BDT: { major: 'Taka',     minor: 'Paisa' },
      CAD: { major: 'Dollars',  minor: 'Cents' },
      CHF: { major: 'Francs',   minor: 'Centimes' },
      CNY: { major: 'Yuan',     minor: 'Jiao' },
      EUR: { major: 'Euros',    minor: 'Cents' },
      GBP: { major: 'Pounds',   minor: 'Pence' },
      INR: { major: 'Rupees',   minor: 'Paise' },
      JPY: { major: 'Yen',      minor: 'Sen' },
      LKR: { major: 'Rupees',   minor: 'Cents' },
      MYR: { major: 'Ringgit',  minor: 'Sen' },
      NPR: { major: 'Rupees',   minor: 'Paisa' },
      NZD: { major: 'Dollars',  minor: 'Cents' },
      OMR: { major: 'Riyals',   minor: 'Baisa' },
      PKR: { major: 'Rupees',   minor: 'Paisa' },
      QAR: { major: 'Riyals',   minor: 'Dirhams' },
      SAR: { major: 'Riyals',   minor: 'Halalah' },
      SGD: { major: 'Dollars',  minor: 'Cents' },
      USD: { major: 'Dollars',  minor: 'Cents' },
    };
    return map[code] ?? { major: code, minor: 'Cents' };
  }
}
