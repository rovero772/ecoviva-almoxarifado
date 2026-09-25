export function formatDateBR(date) {
  const d = new Date(date);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0));
}

export function nowIso() {
  return new Date().toISOString();
}

export function getStockStatus(current, minimum) {
  if (Number(current) <= 0) return 'Sem estoque';
  if (Number(current) <= Number(minimum)) return 'Estoque baixo';
  return 'Estoque normal';
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
