export type ModifierOption = {
  id: string;
  name: string;
  priceDelta?: number;
  defaultSelected?: boolean;
};

export type ModifierGroupDoc = {
  name: string;
  required?: boolean;
  min?: number;
  max?: number;
  multi?: boolean;
  isVariantGroup?: boolean;
  options: ModifierOption[];
};

export type ModifierGroupRecord = {
  id: string;
  name: string;
  required: boolean;
  min: number;
  max: number;
  multi: boolean;
  isVariantGroup?: boolean;
  options: ModifierOption[];
};

