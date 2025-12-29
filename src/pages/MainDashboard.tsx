import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { fetchQuotes } from '../utils/market';
import { createClient } from '../utils/supabase/client';
import { Pie } from '../components/ui/chart';

export default function MainDashboard() {
  const [holdings, setHoldings] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<Record<string, any>>({});
  const [portfolioValue, setPortfolioValue] = useState<number | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadHoldings();
  }, []);

  const loadHoldings = async () => {
    // Try backend first
    try {
      const { data: { session } } = await supabase.auth.getSession();
      let resp: Response | null = null;
      if (session) {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        resp = await fetch(`${backendUrl}/api/portfolio/get`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
      }

      let holdingsData: any[] = [];
      if (resp && resp.ok) {
        const json = await resp.json();
        holdingsData = json.holdings || [];
      } else {
        // Fallback mock
        holdingsData = [
          { symbol: 'AAPL', shares: 25, avgCost: 140 },
          { symbol: 'MSFT', shares: 10, avgCost: 300 },
          { symbol: 'GOOGL', shares: 5, avgCost: 120 }
        ];
      }

      setHoldings(holdingsData);

      const symbols = holdingsData.map(h => h.symbol).filter(Boolean);
      if (symbols.length) {
        const q = await fetchQuotes(symbols);
        setQuotes(q);
        const total = holdingsData.reduce((sum, h) => {
          const price = q[h.symbol]?.price ?? h.avgCost;
          return sum + (price * (h.shares || 0));
        }, 0);
        setPortfolioValue(Math.round(total * 100) / 100);
      }
    } catch (err) {
      console.warn('Failed to load holdings', err);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center space-x-4">
          <Button>Portfolio</Button>
          <Button>Signals</Button>
          <Button>Analysis</Button>
          <Button>Settings</Button>
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600">Upgrade to Pro</Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <aside className="col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>Portfolio Value: <strong>${portfolioValue ?? '—'}</strong></div>
                <div>Today's Change: <strong>—</strong></div>
                <div>Alpha Score: <strong>—</strong></div>
                <div>Active Signals: <strong>—</strong></div>
              </div>
            </CardContent>
          </Card>
        </aside>

        <main className="col-span-6">
          <section className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Your Portfolio</h3>
                    <Pie data={holdings.map(h => ({ label: h.symbol, value: h.shares }))} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-2">Neural Twin Optimal</h3>
                    <Pie data={holdings.map(h => ({ label: h.symbol, value: Math.max(1, h.shares - 2) }))} />
                  </div>
                </div>
                <div className="mt-4">
                  <Button>Rebalance to Twin</Button>
                </div>
              </CardContent>
            </Card>
          </section>

          <section>
            <Card>
              <CardHeader>
                <CardTitle>Active Signals</CardTitle>
              </CardHeader>
              <CardContent>
                <p>No live signals yet — this will populate from backend.</p>
              </CardContent>
            </Card>
          </section>
        </main>

        <aside className="col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Market Pulse</CardTitle>
            </CardHeader>
            <CardContent>
              <div>S&P 500: —</div>
              <div>VIX: —</div>
              <div>Market Sentiment: —</div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
