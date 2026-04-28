export type Currency = Readonly<{
  code: string;
  fraction?: string;
  minorunit: number | null;
  name: string;
  numericcode: number;
  symbol: string;
}>;

