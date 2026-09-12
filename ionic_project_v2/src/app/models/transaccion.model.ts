export interface Transaccion {
  id: string;
  tipo: 'ingreso' | 'gasto';
  monto: number;
  categoria: string;
  fecha: Date;
  descripcion?: string;
}

export interface ResumenFinanciero {
  balanceActual: number;
  ingresosTotales: number;
  gastosTotales: number;
}