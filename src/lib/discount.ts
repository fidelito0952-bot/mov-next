export function calcularDescuento(total: number, porcentaje: number): number {
  if (!porcentaje || porcentaje <= 0) return total;
  return total - (total * porcentaje) / 100;
}
