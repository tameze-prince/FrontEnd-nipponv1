export interface Country {
  id: number;
  name: string;
  code: string;
  currency: string;
  currencySymbol: string;
}

export interface City {
  id: number;
  name: string;
  countryId: number;
}