export const fmt$ = (n: number) => n < 0.01 ? `$${n.toFixed(4)}` : n < 100 ? `$${n.toFixed(2)}` : `$${n.toLocaleString(undefined,{maximumFractionDigits:0})}`;
export const fmtNum = (n: number) => n.toLocaleString();
export const pct = (a: number, b: number) => Math.min(100, Math.round((a / b) * 100));
