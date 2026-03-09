import React, { useState, useEffect, useCallback, Component } from 'react';
import { COLORS } from './config';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { console.error('App crash:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center', color: '#FF4757', background: '#0A0E1A', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>{'\u26A0\uFE0F'}</p>
          <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Произошла ошибка</p>
          <p style={{ fontSize: 14, color: '#8a8fa8', marginBottom: 20 }}>Попробуйте перезагрузить приложение</p>
          <button onClick={() => window.location.reload()} style={{ padding: '10px 24px', borderRadius: 10, background: '#00E68A', color: '#000', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
            Перезагрузить
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
import { useTelegram } from './hooks/useTelegram';
import { api } from './services/api';

import { TabBar } from './components/ui/TabBar';
import { Onboarding } from './screens/Onboarding';
import { Home } from './screens/Home';
import { Matches } from './screens/Matches';
import { CreateMatch } from './screens/CreateMatch';
import { ScoreEntry } from './screens/ScoreEntry';
import { Tournaments } from './screens/Tournaments';
import { Leaderboard } from './screens/Leaderboard';
import { Stats } from './screens/Stats';
import { Profile } from './screens/Profile';
import { Admin } from './screens/Admin';
import { PlayerProfile } from './screens/PlayerProfile';
import { FAQ } from './screens/FAQ';
import { TournamentLive } from './screens/TournamentLive';
import { BookCourt } from './screens/BookCourt';
// HIDDEN: Padel Camp — will enable later
// import { PadelCamp } from './screens/PadelCamp';
// HIDDEN: Coach features — will enable later
// import { CoachPanel } from './screens/CoachPanel';
// import { CoachStudentDetail } from './screens/CoachStudentDetail';
// import { CoachSessionDetail } from './screens/CoachSessionDetail';
// import { FindCoach } from './screens/FindCoach';
// import { CoachProfile } from './screens/CoachProfile';

export default function App() {
  const { user: tgUser, initData, hapticFeedback } = useTelegram();
  const [state, setState] = useState('loading'); // loading, onboarding, app
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [subScreen, setSubScreen] = useState(null); // { name, params }
  const [error, setError] = useState(null);
  const [deepLinkMatchId, setDeepLinkMatchId] = useState(null);

  useEffect(() => {
    // Check for deep link params
    const urlParams = new URLSearchParams(window.location.search);
    const matchParam = urlParams.get('match');
    if (matchParam) {
      const parsed = parseInt(matchParam, 10);
      if (!isNaN(parsed)) {
        setDeepLinkMatchId(parsed);
        setActiveTab('matches');
      }
    }
    const tournamentParam = urlParams.get('tournament');
    if (tournamentParam) {
      const parsed = parseInt(tournamentParam, 10);
      if (!isNaN(parsed)) {
        setSubScreen({ name: 'tournamentLive', params: { tournamentId: parsed } });
      }
    }
    authenticate();
  }, []);

  // Listen for auth-expired events from the API layer
  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null);
      setState('loading');
      authenticate();
    };
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  async function authenticate() {
    try {
      // Build initData - use real Telegram data or dev fallback
      let authData = initData;

      if (!authData && import.meta.env.DEV) {
        // Dev fallback
        const devUser = tgUser || {
          id: 123456789,
          first_name: 'Dev',
          last_name: 'User',
          username: 'devuser',
        };
        const params = new URLSearchParams();
        params.set('user', JSON.stringify(devUser));
        params.set('hash', 'dev');
        authData = params.toString();
      }

      if (!authData) {
        const tgAvailable = !!window.Telegram;
        const webAppAvailable = !!window.Telegram?.WebApp;
        const initDataValue = window.Telegram?.WebApp?.initData;
        const version = window.Telegram?.WebApp?.version;
        const platform = window.Telegram?.WebApp?.platform;
        setError(`Откройте приложение через Telegram\n\nDebug: TG=${tgAvailable}, WebApp=${webAppAvailable}, initData=${!!initDataValue}, v=${version}, platform=${platform}`);
        setState('error');
        return;
      }

      const result = await api.auth.telegram(authData);
      api.setToken(result.token);
      setUser(result.user);

      if (result.needsOnboarding) {
        setState('onboarding');
      } else {
        // Load full profile
        const fullUser = await api.users.me();
        setUser(fullUser);
        setState('app');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'Ошибка авторизации');
      setState('error');
    }
  }

  const refreshUser = useCallback(async () => {
    try {
      const fullUser = await api.users.me();
      setUser(fullUser);
    } catch (err) {
      console.error('Refresh user error:', err);
    }
  }, []);

  const handleOnboardingComplete = async (data) => {
    try {
      await api.users.onboard(data);
      const fullUser = await api.users.me();
      setUser(fullUser);
      setState('app');
      hapticFeedback('notification', 'success');
    } catch (err) {
      console.error('Onboarding error:', err);
      alert(err.message || 'Ошибка');
    }
  };

  const handleNavigate = useCallback((target, params = {}) => {
    hapticFeedback('selection');

    // Sub-screens
    if (['createMatch', 'score', 'stats', 'admin', 'playerProfile', 'faq', 'tournamentLive', 'bookCourt'].includes(target)) {
      setSubScreen({ name: target, params });
      return;
    }

    // Tabs
    setSubScreen(null);
    setActiveTab(target);
  }, [hapticFeedback]);

  const handleTabChange = useCallback((tab) => {
    hapticFeedback('selection');
    setSubScreen(null);
    setActiveTab(tab);
  }, [hapticFeedback]);

  const handleLogout = useCallback(() => {
    api.clearToken();
    setUser(null);
    setState('loading');
    authenticate();
  }, []);

  // Loading
  if (state === 'loading') {
    return (
      <ErrorBoundary>
        <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <img src="/logo.png" alt="Padel GO" style={{ width: 200, marginBottom: 20 }} />
            <p style={{ color: COLORS.textDim, fontSize: 15 }}>Загрузка...</p>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // Error
  if (state === 'error') {
    return (
      <ErrorBoundary>
        <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', padding: 20 }}>
            <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>{'\u26A0\uFE0F'}</span>
            <p style={{ color: COLORS.danger, fontSize: 16, fontWeight: 600 }}>Ошибка</p>
            <p style={{ color: COLORS.textDim, fontSize: 14, marginTop: 8, whiteSpace: 'pre-line' }}>{error}</p>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // Onboarding
  if (state === 'onboarding') {
    return <ErrorBoundary><Onboarding onComplete={handleOnboardingComplete} /></ErrorBoundary>;
  }

  // Sub-screens (rendered above tabs)
  if (subScreen) {
    const subContent = (() => {
      switch (subScreen.name) {
        case 'createMatch':
          return (
            <div style={containerStyle}>
              <CreateMatch
                user={user}
                onBack={() => setSubScreen(null)}
                onCreated={() => {
                  setSubScreen(null);
                  setActiveTab('matches');
                  hapticFeedback('notification', 'success');
                }}
              />
            </div>
          );
        case 'score':
          return (
            <div style={containerStyle}>
              <ScoreEntry
                user={user}
                matchId={subScreen.params?.matchId}
                onBack={() => setSubScreen(null)}
                onNavigate={handleNavigate}
                onDone={() => {
                  setSubScreen(null);
                  setActiveTab('home');
                  refreshUser();
                  hapticFeedback('notification', 'success');
                }}
              />
            </div>
          );
        case 'stats':
          return (
            <div style={containerStyle}>
              <Stats
                user={user}
                onBack={() => setSubScreen(null)}
                onNavigate={handleNavigate}
              />
            </div>
          );
        case 'admin':
          return (
            <div style={containerStyle}>
              <Admin onBack={() => setSubScreen(null)} />
            </div>
          );
        case 'playerProfile':
          return (
            <div style={containerStyle}>
              <PlayerProfile
                userId={subScreen.params?.userId}
                currentUser={user}
                onBack={() => setSubScreen(null)}
                onNavigate={handleNavigate}
              />
            </div>
          );
        case 'faq':
          return (
            <div style={containerStyle}>
              <FAQ onBack={() => setSubScreen(null)} />
            </div>
          );
        case 'tournamentLive':
          return (
            <div style={containerStyle}>
              <TournamentLive
                tournamentId={subScreen.params?.tournamentId}
                user={user}
                onBack={() => setSubScreen(null)}
                onNavigate={handleNavigate}
              />
            </div>
          );
        case 'bookCourt':
          return (
            <div style={containerStyle}>
              <BookCourt
                venueId={subScreen.params?.venueId}
                onBack={() => setSubScreen(null)}
              />
            </div>
          );
        // HIDDEN: Padel Camp — will enable later
        // case 'padelCamp':
        //   return (
        //     <div style={containerStyle}>
        //       <PadelCamp onBack={() => setSubScreen(null)} />
        //     </div>
        //   );
        // HIDDEN: Coach screens — will enable later
        // case 'coachPanel':
        // case 'coachStudentDetail':
        // case 'coachSessionDetail':
        // case 'findCoach':
        // case 'coachProfile':
        default:
          return null;
      }
      return null;
    })();

    if (subContent) {
      return <ErrorBoundary>{subContent}</ErrorBoundary>;
    }
  }

  // Main app with tabs
  return (
    <ErrorBoundary>
      <div style={containerStyle}>
        {activeTab === 'home' && <Home user={user} onNavigate={handleNavigate} />}
        {activeTab === 'matches' && <Matches user={user} onNavigate={handleNavigate} highlightMatchId={deepLinkMatchId} />}
        {activeTab === 'tournaments' && <Tournaments user={user} onNavigate={handleNavigate} />}
        {activeTab === 'leaderboard' && <Leaderboard user={user} onNavigate={handleNavigate} />}
        {activeTab === 'profile' && (
          <Profile
            user={user}
            onUpdate={refreshUser}
            onLogout={handleLogout}
            onNavigate={handleNavigate}
          />
        )}
        <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </ErrorBoundary>
  );
}

const containerStyle = {
  maxWidth: 420,
  margin: '0 auto',
  padding: '12px 16px',
  minHeight: '100vh',
  background: COLORS.bg,
};
