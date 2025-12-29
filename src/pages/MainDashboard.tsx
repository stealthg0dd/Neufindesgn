import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { fetchQuotes } from '../utils/market';
import { createClient } from '../utils/supabase/client';
import { Pie } from '../components/ui/chart';
import { Progress } from '../components/ui/progress';
import { Avatar } from '../components/ui/avatar';
import { Bell, User, ChevronDown } from 'lucide-react';

export default function MainDashboard() {
  const [holdings, setHoldings] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<Record<string, any>>({});
  const [portfolioValue, setPortfolioValue] = useState<number | null>(null);
  const [signals, setSignals] = useState<any[]>([]);
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

      // Load signals (try backend, fallback to simple generated signals)
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        const resp = await fetch(`${backendUrl}/api/signals/active`);
        if (resp.ok) {
          const json = await resp.json();
          setSignals(json.signals || []);
        } else {
          throw new Error('No backend signals');
        }
      } catch (err) {
        // Fallback sample signals
        setSignals([
          { id: 's1', asset: 'NVDA', direction: 'buy', confidence: 82 },
          { id: 's2', asset: 'TSLA', direction: 'sell', confidence: 76 },
        ]);
      }
    } catch (err) {
      console.warn('Failed to load holdings', err);
    }
  };

  return (
    <div className="min-h-screen p-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="font-bold text-lg">Neufin</div>
          <nav className="hidden md:flex items-center space-x-3">
            <Button variant="ghost">Portfolio</Button>
            <Button variant="ghost">Signals</Button>
            <Button variant="ghost">Analysis</Button>
            <Button variant="ghost">Settings</Button>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <button className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span className="text-sm bg-red-500 text-white rounded-full px-2">{signals.length}</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <Avatar>
              <div className="h-6 w-6 bg-gray-400 rounded-full" />
            </Avatar>
            <div className="hidden sm:block text-sm">John Doe</div>
            <ChevronDown className="h-4 w-4" />
          </div>

          <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hidden sm:inline-block">Upgrade to Pro</Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Sidebar */}
        <aside className="col-span-3">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm">Portfolio Value</div>
                <div className="text-2xl font-bold">${portfolioValue ?? '—'}</div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">Today's Change</div>
                    <div className="font-medium">—</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Alpha Score</div>
                    <div className="font-medium">—</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Menu</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>Overview</li>
                <li>Sentiment Engine</li>
                <li>Bias Analyzer</li>
                <li>Digital Twin</li>
                <li>Holdings</li>
                <li>Settings</li>
              </ul>
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

          {/* Bias Snapshot */}
          <section className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Bias Snapshot</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <Progress value={68} className="mx-auto" />
                    <div className="mt-2 text-sm">Loss Aversion</div>
                  </div>
                  <div className="text-center">
                    <Progress value={42} className="mx-auto" />
                    <div className="mt-2 text-sm">Disposition Effect</div>
                  </div>
                  <div className="text-center">
                    <Progress value={35} className="mx-auto" />
                    <div className="mt-2 text-sm">Overconfidence</div>
                  </div>
                  <div className="text-center">
                    <Progress value={28} className="mx-auto" />
                    <div className="mt-2 text-sm">Herding</div>
                  </div>
                </div>
                <div className="mt-4">
                  <Button variant="ghost">Deep Dive into Biases</Button>
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
                <div className="space-y-3">
                  {signals.map(sig => (
                    <div key={sig.id} className="p-3 border rounded flex items-start justify-between">
                      <div>
                        <div className="font-semibold">{sig.asset} <span className="text-sm text-muted-foreground">{sig.direction === 'buy' ? '🟢 BUY' : '🔴 SELL'}</span></div>
                        <div className="text-sm text-muted-foreground">Confidence: {sig.confidence}%</div>
                        <div className="text-sm mt-1">{sig.reason || sig.insight || 'Signal generated by algorithmic heuristics'}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono">${(quotes[sig.asset]?.price ?? '—')}</div>
                        <div className="text-sm text-muted-foreground">{quotes[sig.asset]?.percentChange ? `${quotes[sig.asset].percentChange}%` : ''}</div>
                      </div>
                    </div>
                  ))}
                </div>
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

          {/* Quick Actions & Insights */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button className="w-full">+ Add Holding</Button>
                <Button className="w-full">🔄 Sync Portfolio</Button>
                <Button className="w-full">🧪 Run Scenario</Button>
                <Button className="w-full">📊 Generate Report</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Top Movers</CardTitle>
            </CardHeader>
            <CardContent>
              <div>↑ NVDA: +5.2% ($1,240 gain)</div>
              <div>↑ MSFT: +2.1% ($580 gain)</div>
              <div>↓ TSLA: -1.8% ($320 loss)</div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
