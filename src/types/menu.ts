export interface MenuItem {
  id: number;
  parentId: number | null;
  kodeMenu: string;
  namaMenu: string;
  path: string | null;
  icon: string | null;
  urutan: number;
  status: string;
  children: MenuItem[];
}
