import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '../utils/supabase/client';
import { OnboardingFlow } from '../components/onboarding/OnboardingFlow';

export function Onboarding() {
  const navigate = useNavigate();
  const supabase = createClient();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Not authenticated, redirect to login
        navigate('/login');
      }
    };
    checkAuth();
  }, [navigate, supabase]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950">
      <OnboardingFlow />
    </div>
  );
}
