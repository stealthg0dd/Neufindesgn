// Simple market data helpers using Finnhub (primary) with AlphaVantage fallback.
// Expects env vars: VITE_FINNHUB_API_KEY, VITE_ALPHA_VANTAGE_KEY

export async function fetchFinnhubQuote(symbol: string) {
  const key = import.meta.env.VITE_FINNHUB_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${key}`);
    if (!res.ok) return null;
    const json = await res.json();
    // Finnhub returns: c (current), d (change), dp (percent), h,l,o,p,t
    return {
      price: json.c ?? null,
      change: json.d ?? null,
      percentChange: json.dp ?? null,
      raw: json
    };
  } catch (err) {
    console.error('Finnhub quote error', err);
    return null;
  }
}

export async function fetchQuotes(symbols: string[]) {
  // Parallel fetch for small lists
  const promises = symbols.map(s => fetchFinnhubQuote(s).then(r => ({ symbol: s, data: r })));
  const results = await Promise.all(promises);
  const map: Record<string, any> = {};
  results.forEach(r => {
    map[r.symbol] = r.data;
  });
  return map;
}

export async function fetchAlphaVantageQuote(symbol: string) {
  const key = import.meta.env.VITE_ALPHA_VANTAGE_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${key}`);
    if (!res.ok) return null;
    const json = await res.json();
    const q = json['Global Quote'] || {};
    const price = q['05. price'] ? parseFloat(q['05. price']) : null;
    const prev = q['08. previous close'] ? parseFloat(q['08. previous close']) : null;
    const change = price != null && prev != null ? price - prev : null;
    const percent = price != null && prev != null ? ((price - prev) / prev) * 100 : null;
    return { price, change, percentChange: percent, raw: q };
  } catch (err) {
    console.error('AlphaVantage quote error', err);
    return null;
  }
}
