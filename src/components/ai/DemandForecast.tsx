import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ForecastItem {
  day: string;
  predicted_bookings: number;
  confidence: 'low' | 'medium' | 'high';
  peak_hours: string[];
  suggestion: string;
}

interface Props {
  appointments: any[];
  services: any[];
}

const confidenceColors: Record<string, string> = {
  high: 'hsl(175, 70%, 42%)',
  medium: 'hsl(38, 92%, 50%)',
  low: 'hsl(220, 10%, 70%)',
};

export function DemandForecast({ appointments, services }: Props) {
  const [forecast, setForecast] = useState<ForecastItem[]>([]);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [shown, setShown] = useState(false);

  const fetchForecast = async () => {
    setLoading(true);
    try {
      // Build weekly pattern from existing appointments
      const weeklyPattern: Record<string, number> = {};
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      appointments.forEach(a => {
        const d = new Date(a.appointment_date).getDay();
        const dayName = days[d];
        weeklyPattern[dayName] = (weeklyPattern[dayName] || 0) + 1;
      });

      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          type: 'demand_forecast',
          context: {
            weeklyPattern,
            totalBookings: appointments.length,
            services: services.map(s => ({ name: s.name, price: s.price, duration: s.duration_minutes })),
          },
        },
      });
      if (error) throw error;
      setForecast(data?.forecast || []);
      setSummary(data?.summary || '');
      setShown(true);
    } catch (err) {
      console.error('Demand forecast error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-accent" />
          AI Demand Forecast
        </CardTitle>
        <Button variant="outline" size="sm" onClick={fetchForecast} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {shown ? 'Refresh' : 'Generate Forecast'}
        </Button>
      </CardHeader>
      <CardContent>
        {!shown ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Click Generate to get AI-powered demand predictions for the next 7 days.</p>
        ) : (
          <div className="space-y-4">
            {summary && (
              <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
                <p className="text-sm text-foreground">{summary}</p>
              </div>
            )}
            {forecast.length > 0 && (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={forecast}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" fontSize={11} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => v.slice(0, 3)} />
                  <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value: number, _: string, entry: any) => {
                      const item = entry.payload as ForecastItem;
                      return [`${value} bookings (${item.confidence} confidence)`, 'Predicted'];
                    }}
                  />
                  <Bar dataKey="predicted_bookings" radius={[4, 4, 0, 0]}>
                    {forecast.map((entry, i) => (
                      <Cell key={i} fill={confidenceColors[entry.confidence] || confidenceColors.medium} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            {forecast.length > 0 && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {forecast.slice(0, 4).map(f => (
                  <div key={f.day} className="rounded-lg border border-border p-2.5 text-center">
                    <p className="text-xs font-medium text-muted-foreground">{f.day.slice(0, 3)}</p>
                    <p className="text-lg font-bold">{f.predicted_bookings}</p>
                    <p className="text-[10px] text-muted-foreground truncate">Peak: {f.peak_hours.join(', ')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
