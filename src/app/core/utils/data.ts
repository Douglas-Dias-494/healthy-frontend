/** Data de hoje no formato "yyyy-MM-dd" (o mesmo de <input type="date"> e do LocalDate do Java). */
export function todayIso(): string {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${agora.getFullYear()}-${mes}-${dia}`;
}
