export interface CustomThemeFieldDef {
  key: string;
  label: string;
  type: 'text' | 'number';
  min?: number;
  max?: number;
}

export interface CustomTheme {
  id: string;
  slug: string;
  name: string;
  baseTemplate: 'classic' | 'nametag';
  isActive: boolean;
  sortOrder: number;
  frontBgColor: string;
  frontTextColor: string;
  frontBorderColor: string;
  backBgColor: string;
  backTextColor: string;
  backBorderColor: string;
  accentColor: string;
  fontFamily: string;
  borderStyle: 'none' | 'solid' | 'double';
  borderWidth: number;
  customFields: CustomThemeFieldDef[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomThemeMeta {
  [key: string]: string | number;
}
