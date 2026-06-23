import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Shield, Loader2, Brain } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Prediction {
  appointment_id: string;
  risk_level: 'low' | 'medium' | 'high';
  risk_score: number;
  factors: string[];
}

interface Props {
  appointments: any[];
}

const riskConfig = {
  low: { color: 'text-success', bg: 'bg-success/10', border: 'border-success/20', icon: Shield, label: 'Low Risk' },
  medium: { color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', icon: AlertTriangle, label: 'Medium Risk' },
  high: { color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20', icon: AlertTriangle, label: 'High Risk' },
};

export function NoShowPrediction({ appointments }: Props) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [shown, setShown] = useState(false);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const upcoming = appointments
        .filter(a => ['pending', 'confirmed'].includes(a.status))
        .slice(0, 10)
        .map(a => ({
          id: a.id,
          date: a.appointment_date,
          time: a.start_time,
          service: a.services?.name,
          customer: a.profiles?.full_name || a.customer_profile?.full_name || 'Unknown',
          status: a.status,
          created_at: a.created_at,
        }));

      const noShows = appointments.filter(a => a.status === 'no_show').length;
      const total = appointments.length;

      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          type: 'no_show_prediction',
          context: {
            appointments: upcoming,
            historicalData: { total, noShows },
          },
        },
      });
      if (error) throw error;
      setPredictions(data?.predictions || []);
      setShown(true);
    } catch (err) {
      console.error('No-show prediction error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Brain className="h-5 w-5 text-accent" />
          No-Show Risk Analysis
        </CardTitle>
        <Button variant="outline" size="sm" onClick={fetchPredictions} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />}
          {shown ? 'Refresh' : 'Analyze'}
        </Button>
      </CardHeader>
      <CardContent>
        {!shown ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Click Analyze to get AI-powered no-show predictions for upcoming appointments.</p>
        ) : predictions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No upcoming appointments to analyze.</p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {predictions.map((pred) => {
              const cfg = riskConfig[pred.risk_level];
              const apt = appointments.find(a => a.id === pred.appointment_id);
              const Icon = cfg.icon;
              return (
                <div key={pred.appointment_id} className={cn('rounded-lg border p-3 flex items-start gap-3', cfg.border, cfg.bg)}>
                  <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', cfg.color)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">
                        {apt?.profiles?.full_name || apt?.customer_profile?.full_name || 'Customer'}
                      </p>
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', cfg.bg, cfg.color)}>
                        {pred.risk_score}% {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{pred.factors.join(' • ')}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
