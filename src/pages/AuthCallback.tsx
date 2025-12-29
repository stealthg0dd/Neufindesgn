import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createClient } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { AlertCircle } from 'lucide-react';

export function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Auth callback - Processing OAuth response...');
        console.log('Current URL:', window.location.href);
        console.log('Hash:', window.location.hash);
        
        // First, wait a bit for Supabase to process the OAuth callback
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Try to get session from URL first (for OAuth callback)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken && refreshToken) {
          console.log('Found tokens in URL hash, setting session...');
          const { data: { session: newSession }, error: setError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (setError) {
            console.error('Error setting session:', setError);
            setError(`Failed to complete sign in: ${setError.message}`);
            setTimeout(() => navigate('/login'), 3000);
            return;
          }
          
          if (newSession) {
            console.log('Session established successfully');
            // Clear the hash from URL
            window.history.replaceState(null, '', window.location.pathname);
            await checkPortfolioAndRedirect(newSession.access_token);
            return;
          }
        }
        
        // If no tokens in URL, check existing session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setError(`Authentication error: ${sessionError.message}`);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (!session) {
          console.log('No valid session found');
          setError('No authentication data found. Redirecting to login...');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        console.log('Session found, checking portfolio...');
        await checkPortfolioAndRedirect(session.access_token);
        
      } catch (error: any) {
        console.error('Error in auth callback:', error);
        setError(`Unexpected error: ${error.message || 'Please try again'}`);
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    const checkPortfolioAndRedirect = async (accessToken: string) => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(
          `${backendUrl}/api/portfolio/check`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        const data = await response.json();
        // If user selected free trial before OAuth, activate it (best-effort)
        try {
          const wantTrial = localStorage.getItem('neufin_free_trial') === '1';
          if (wantTrial) {
            // Inform backend to activate trial for this user (optional)
            fetch(`${backendUrl}/api/user/start-trial`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ source: 'oauth', durationDays: 14 })
            }).catch(() => {});
            try { localStorage.removeItem('neufin_free_trial'); } catch (e) {}
            try { localStorage.setItem('neufin_free_trial_active', '1'); } catch (e) {}
          }
        } catch (e) {
          console.warn('Free trial activation skipped', e);
        }
        
        if (data.hasPortfolio && data.portfolio) {
          console.log('Portfolio found, redirecting to dashboard');
          navigate('/user-dashboard');
        } else {
          console.log('No portfolio found, redirecting to onboarding');
          navigate('/onboarding');
        }
      } catch (error) {
        console.error('Error checking portfolio:', error);
        // If portfolio check fails, proceed to onboarding
        navigate('/onboarding');
      }
    };

    handleAuthCallback();
  }, [navigate, location]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        {error ? (
          <div className="space-y-4">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
            <h2 className="text-xl font-semibold text-red-400">Authentication Error</h2>
            <p className="text-muted-foreground">{error}</p>
            <p className="text-sm text-muted-foreground">Redirecting to login page...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto" />
            <h2 className="text-xl font-semibold">Completing sign in...</h2>
            <p className="text-muted-foreground">Please wait while we set up your account</p>
          </div>
        )}
      </div>
    </div>
  );
}
