import { useEffect, useState } from 'react';
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, Sparkles } from 'lucide-react';
import { supabase } from './lib/supabase';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <main className="loading-screen"><span className="loader" />Restoring your workspace...</main>;
  }

  return session ? <Workspace session={session} /> : <AuthScreen />;
}

function AuthScreen() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', firstName: '', lastName: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const isSignup = mode === 'signup';

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setStatus({ type: '', message: '' });
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setStatus({ type: '', message: '' });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setStatus({ type: '', message: '' });

    let result;

    if (isSignup) {
      result = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            username: form.username.trim().toLowerCase(),
            first_name: form.firstName.trim(),
            last_name: form.lastName.trim(),
          },
        },
      });
    } else {
      const loginIdentifier = form.email.trim();

      if (!loginIdentifier) {
        result = { error: { message: 'Missing email or username' } };
      } else {
        const { data: email, error: lookupError } = await supabase.rpc('resolve_login_email', {
          login_identifier: loginIdentifier,
        });
        result = lookupError
          ? { error: lookupError }
          : email
            ? await supabase.auth.signInWithPassword({ email, password: form.password })
            : { error: { message: 'Invalid email or username' } };
      }
    }

    setSubmitting(false);

    if (result.error) {
      setStatus({ type: 'error', message: result.error.message });
      return;
    }

    if (isSignup && !result.data.session) {
      setStatus({ type: 'success', message: 'Check your inbox to confirm your email, then come back to sign in.' });
    }
  }

  async function handleResetPassword() {
    if (!form.email) {
      setStatus({ type: 'error', message: 'Enter your email address first.' });
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: window.location.origin,
    });

    setStatus(error
      ? { type: 'error', message: error.message }
      : { type: 'success', message: 'Password reset instructions are on their way.' });
  }

  async function handleOAuthSignIn(provider) {
    setStatus({ type: '', message: '' });

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });

    if (error) {
      setStatus({ type: 'error', message: error.message });
    }
  }

  return (
    <main className="auth-layout">
      <section className="brand-panel">
        <div className="brand-mark"><Sparkles size={18} /> LifeOS</div>
        <div className="brand-copy">
          <p className="eyebrow">A calmer command center</p>
          <h1>Make room for the life you are building</h1>
          <p className="brand-description">Bring your tasks, goals, notes, moments, and money into one thoughtful place</p>
        </div>
        <div className="brand-footer"><span className="status-dot" /> Your private life dashboard</div>
      </section>

      <section className="form-panel">
        <div className="form-wrap">
          <div className="mobile-brand"><div className="brand-mark"><Sparkles size={18} /> LifeOS</div></div>
          <div className="form-heading">
            <p className="eyebrow">{isSignup ? 'Begin with intention' : 'Welcome back'}</p>
            <h2>{isSignup ? 'Create your space.' : 'Pick up where you left off'}</h2>
            <p>{isSignup ? 'A clearer view of your days is a few details away.' : 'Your most important things are waiting for you'}</p>
          </div>

          <div className="mode-switch" role="tablist" aria-label="Authentication mode">
            <button className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')} type="button">Sign in</button>
            <button className={mode === 'signup' ? 'active' : ''} onClick={() => switchMode('signup')} type="button">Create account</button>
          </div>

          <form onSubmit={handleSubmit}>
            {isSignup && <label>Username<input name="username" value={form.username} onChange={updateField} placeholder="example1234ii" autoComplete="username" pattern="[a-z0-9_]{3,30}" minLength="3" maxLength="30" required /></label>}
            {isSignup && <div className="field-row"><label>First name<input name="firstName" value={form.firstName} onChange={updateField} placeholder="First name" autoComplete="given-name" required /></label><label>Last name<input name="lastName" value={form.lastName} onChange={updateField} placeholder="Last name" autoComplete="family-name" required /></label></div>}
            <label>{isSignup ? 'Email address' : 'Email or username'}<div className="input-with-icon"><Mail size={17} /><input name="email" type={isSignup ? 'email' : 'text'} value={form.email} onChange={updateField} placeholder={isSignup ? 'you@example.com' : 'you@example.com or username'} autoComplete={isSignup ? 'email' : 'username'} required /></div></label>
            <label>Password<div className="input-with-icon"><LockKeyhole size={17} /><input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={updateField} placeholder="At least 6 characters" autoComplete={isSignup ? 'new-password' : 'current-password'} minLength="6" required /><button className="icon-button" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>

            {!isSignup && <button className="reset-button" type="button" onClick={handleResetPassword}>Forgot your password?</button>}
            {status.message && <div className={`status-message ${status.type}`} role="alert">{status.type === 'success' && <Check size={16} />}{status.message}</div>}
            <button className="submit-button" type="submit" disabled={submitting}>{submitting ? 'Working...' : isSignup ? 'Create my account' : 'Sign in to LifeOS'}<ArrowRight size={18} /></button>
          </form>

          <div className="oauth-divider"><span>or</span></div>
          <div className="oauth-group">
            <button className="oauth-button" type="button" onClick={() => handleOAuthSignIn('google')}>
              <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62Z" />
                <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18Z" />
                <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.16.28-1.7V4.96H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.04l2.97-2.33Z" />
                <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.96L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58Z" />
              </svg>
              Continue with Google
            </button>
            <button className="oauth-button" type="button" onClick={() => handleOAuthSignIn('github')}>
              <svg width="17" height="17" viewBox="0 0 16 16" aria-hidden="true" fill="#181717">
                <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
              </svg>
              Continue with GitHub
            </button>
          </div>

          <p className="terms">By continuing, you agree to use LifeOS as a private space for your own information.</p>
        </div>
      </section>
    </main>
  );
}

function Workspace({ session }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const userId = session.user.id;

    async function loadDashboard() {
      setLoading(true);
      setError('');

      const [profileRes, tasksRes, goalsRes, notesRes, financesRes, eventsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', userId).single(),
        supabase.from('tasks').select('*').eq('user_id', userId).order('due_date', { ascending: true }),
        supabase.from('goals').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('notes').select('*').eq('user_id', userId).order('updated_at', { ascending: false }).limit(5),
        supabase.from('finances').select('*').eq('user_id', userId).order('transaction_date', { ascending: false }),
        supabase.from('events').select('*').eq('user_id', userId).gte('start_at', new Date().toISOString()).order('start_at', { ascending: true }).limit(5),
      ]);

      if (!mounted) return;

      // Profile lookups 404 (PGRST116) for brand-new accounts before the signup trigger settles, so ignore that case.
      const firstError = [profileRes, tasksRes, goalsRes, notesRes, financesRes, eventsRes]
        .find((result) => result.error && result.error.code !== 'PGRST116');

      if (firstError) {
        setError(firstError.error.message);
        setLoading(false);
        return;
      }

      setData({
        profile: profileRes.data,
        tasks: tasksRes.data || [],
        goals: goalsRes.data || [],
        notes: notesRes.data || [],
        finances: financesRes.data || [],
        events: eventsRes.data || [],
      });
      setLoading(false);
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [session.user.id]);

  async function signOut() {
    await supabase.auth.signOut();
  }

  const displayName = data?.profile?.first_name || session.user.user_metadata?.username || session.user.email;
  const pendingTasks = data ? data.tasks.filter((task) => task.status !== 'completed' && task.status !== 'cancelled') : [];
  const completedTasks = data ? data.tasks.filter((task) => task.status === 'completed') : [];
  const activeGoals = data ? data.goals.filter((goal) => goal.status === 'active') : [];
  const avgProgress = activeGoals.length
    ? Math.round(activeGoals.reduce((sum, goal) => sum + goal.progress, 0) / activeGoals.length)
    : 0;
  const income = data ? data.finances.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + Number(entry.amount), 0) : 0;
  const expense = data ? data.finances.filter((entry) => entry.type === 'expense').reduce((sum, entry) => sum + Number(entry.amount), 0) : 0;
  const balance = income - expense;

  return (
    <main className="workspace">
      <header className="workspace-header">
        <div className="brand-mark"><Sparkles size={18} /> LifeOS</div>
        <button className="signout-button" onClick={signOut}>Sign out</button>
      </header>

      {loading && <section className="workspace-content"><p className="eyebrow">Loading your dashboard...</p></section>}

      {!loading && error && (
        <section className="workspace-content">
          <p className="eyebrow">Something went wrong</p>
          <h1>Couldn't load your data.</h1>
          <p>{error}</p>
        </section>
      )}

      {!loading && !error && data && (
        <section className="dashboard">
          <div className="dashboard-greeting">
            <p className="eyebrow">Welcome back</p>
            <h1>Good to see you, {displayName}.</h1>
          </div>

          <div className="dashboard-grid">
            <div className="dashboard-card">
              <p className="card-label">Tasks</p>
              <p className="card-value">{pendingTasks.length}</p>
              <p className="card-sub">{completedTasks.length} completed</p>
            </div>
            <div className="dashboard-card">
              <p className="card-label">Active goals</p>
              <p className="card-value">{activeGoals.length}</p>
              <p className="card-sub">{avgProgress}% avg progress</p>
            </div>
            <div className="dashboard-card">
              <p className="card-label">Balance</p>
              <p className="card-value">${balance.toFixed(2)}</p>
              <p className="card-sub">${income.toFixed(2)} in · ${expense.toFixed(2)} out</p>
            </div>
            <div className="dashboard-card">
              <p className="card-label">Upcoming events</p>
              <p className="card-value">{data.events.length}</p>
              <p className="card-sub">{data.events[0] ? new Date(data.events[0].start_at).toLocaleDateString() : 'Nothing scheduled'}</p>
            </div>
          </div>

          <div className="dashboard-panels">
            <div className="dashboard-panel">
              <h2>Upcoming tasks</h2>
              {pendingTasks.length === 0 ? <p className="empty-state">No pending tasks.</p> : (
                <ul>
                  {pendingTasks.slice(0, 5).map((task) => (
                    <li key={task.id}>
                      <span>{task.title}</span>
                      <span className="badge">{task.priority}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="dashboard-panel">
              <h2>Upcoming events</h2>
              {data.events.length === 0 ? <p className="empty-state">No upcoming events.</p> : (
                <ul>
                  {data.events.map((event) => (
                    <li key={event.id}>
                      <span>{event.title}</span>
                      <span>{new Date(event.start_at).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="dashboard-panel">
              <h2>Recent notes</h2>
              {data.notes.length === 0 ? <p className="empty-state">No notes yet.</p> : (
                <ul>
                  {data.notes.map((note) => (
                    <li key={note.id}><span>{note.title}</span></li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

export default App;
