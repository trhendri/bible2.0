import { useState, useEffect } from 'react';
import { useSession } from '@/context/SessionProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, BookOpen, CheckCircle } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';

interface ReadingPlan {
  id: string;
  name: string;
  description: string;
  duration_days: number;
  is_public: boolean;
}

const ReadingProgressTracker = () => {
  const { session, supabase } = useSession();
  const [plans, setPlans] = useState<ReadingPlan[]>([]);
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('reading_plans')
        .select('*')
        .eq('is_public', true);

      if (error) throw error;
      setPlans(data || []);
    } catch (err) {
      showError('Failed to load reading plans');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startPlan = async (planId: string) => {
    if (!session?.user) {
      showError('You must be logged in to start a plan');
      return;
    }

    try {
      const { error } = await supabase
        .from('reading_progress')
        .insert({
          user_id: session.user.id,
          plan_id: planId,
          day_completed: 0
        });

      if (error) throw error;
      setActivePlan(planId);
      showSuccess('Reading plan started!');
    } catch (err) {
      showError('Failed to start reading plan');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return (
    <Card className="w-full max-w-4xl mx-auto mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          Reading Plans
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => (
              <div key={plan.id} className="p-4 border rounded-lg">
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <p className="text-muted-foreground mb-4">{plan.description}</p>
                <p className="text-sm mb-4">
                  Duration: {plan.duration_days} days
                </p>
                <Button
                  onClick={() => startPlan(plan.id)}
                  disabled={activePlan === plan.id}
                >
                  {activePlan === plan.id ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Plan Active
                    </>
                  ) : (
                    'Start Plan'
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReadingProgressTracker;