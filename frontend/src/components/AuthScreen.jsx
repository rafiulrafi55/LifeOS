import { useState } from 'react';
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { authApi } from '../lib/api';

// origin alone omits Vite's base path (e.g. GitHub Pages project subpath)
function getRedirectUrl() {
  return `${window.location.origin}${import.meta.env.BASE_URL}`;
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

    try {
      if (isSignup) {
        const data = await authApi.signUp({
          email: form.email,
          password: form.password,
          username: form.username.trim().toLowerCase(),
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
        });

        if (data.session) {
          await supabase.auth.setSession(data.session);
        } else {
          setStatus({ type: 'success', message: 'Check your inbox to confirm your email, then come back to sign in.' });
        }
      } else {
        const loginIdentifier = form.email.trim();

        if (!loginIdentifier) {
          setStatus({ type: 'error', message: 'Missing email or username' });
          return;
        }

        const data = await authApi.login({ email: loginIdentifier, password: form.password });
        await supabase.auth.setSession(data.session);
      }
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword() {
    if (!form.email) {
      setStatus({ type: 'error', message: 'Enter your email address first.' });
      return;
    }

    try {
      await authApi.requestPasswordReset({ email: form.email, redirectTo: getRedirectUrl() });
      setStatus({ type: 'success', message: 'Password reset instructions are on their way.' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    }
  }

  async function handleOAuthSignIn(provider) {
    setStatus({ type: '', message: '' });

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: getRedirectUrl() },
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

export default AuthScreen;
