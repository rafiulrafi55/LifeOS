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
          <p className="terms">By continuing, you agree to use LifeOS as a private space for your own information.</p>
        </div>
      </section>
    </main>
  );
}

function Workspace({ session }) {
  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <main className="workspace">
      <header className="workspace-header"><div className="brand-mark"><Sparkles size={18} /> LifeOS</div><button className="signout-button" onClick={signOut}>Sign out</button></header>
      <section className="workspace-content"><p className="eyebrow">Your space is ready</p><h1>Good to see you.</h1><p>Signed in as <strong>{session.user.user_metadata?.username || session.user.email}</strong>. Your LifeOS modules will live here.</p></section>
    </main>
  );
}

export default App;
