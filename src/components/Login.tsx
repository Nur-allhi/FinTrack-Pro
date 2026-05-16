import React, { useState, useEffect } from 'react';
import { ShieldCheck, Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { authService } from '../services/authService';

interface LoginProps {
  onLogin: (token: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'choose' | 'email'>('choose');

  useEffect(() => {
    if (localStorage.getItem('auth_token')) return;
    authService.getSession().then(session => {
      if (session?.access_token) {
        authService.signOut();
      }
    }).catch(() => {});
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      await authService.signInWithGoogle();
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed');
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const data = await authService.signInWithPassword(email, password);
      if (data.session?.access_token) {
        onLogin(data.session.access_token);
      } else {
        setError('No session returned');
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas p-6 transition-colors relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[160px] translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -translate-x-1/4 translate-y-1/4" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary/20">
            <ShieldCheck className="w-10 h-10 text-on-primary" />
          </div>
          <h1 className="text-4xl font-normal text-ink tracking-tight mb-3">Welcome back</h1>
          <p className="text-muted font-medium">Sign in to access your financial dashboard.</p>
        </div>

        <div className="bg-canvas rounded-xl border border-hairline p-10 md:p-12 shadow-2xl shadow-ink/5">
          {mode === 'choose' && (
            <div className="space-y-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full h-[56px] text-base font-bold rounded-full border-2 border-hairline text-ink hover:bg-surface-soft hover:border-muted transition-all flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                {isLoading ? 'Signing in...' : 'Sign in with Google'}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-hairline" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-canvas px-3 text-muted font-bold tracking-wider">or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMode('email')}
                disabled={isLoading}
                className="w-full h-[56px] text-base font-bold rounded-full border-2 border-hairline text-ink hover:bg-surface-soft hover:border-muted transition-all flex items-center justify-center gap-2"
              >
                <Mail className="w-5 h-5 text-muted" />
                Sign in with Email
              </button>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-semantic-down/5 text-semantic-down p-4 rounded-md text-xs font-bold uppercase tracking-wider border border-semantic-down/10 flex items-center gap-3"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-semantic-down" />
                  {error}
                </motion.div>
              )}
            </div>
          )}

          {mode === 'email' && (
            <form onSubmit={handleEmailSignIn} className="space-y-6">
              <button
                type="button"
                onClick={() => { setMode('choose'); setError(''); }}
                className="text-xs font-bold text-primary uppercase tracking-wider hover:underline mb-4 block"
              >
                &larr; Back
              </button>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted uppercase tracking-[0.2em] ml-1">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-surface-soft border border-hairline rounded-md text-ink placeholder:text-muted/50 focus:border-primary focus:bg-canvas transition-all outline-none text-sm font-medium"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted uppercase tracking-[0.2em] ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-surface-soft border border-hairline rounded-md text-ink placeholder:text-muted/50 focus:border-primary focus:bg-canvas transition-all outline-none text-sm font-medium"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-semantic-down/5 text-semantic-down p-4 rounded-md text-xs font-bold uppercase tracking-wider border border-semantic-down/10 flex items-center gap-3"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-semantic-down" />
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full h-[56px] text-base"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : 'Sign In'}
              </button>
            </form>
          )}

          <div className="mt-12 text-center pt-8 border-t border-hairline">
            <p className="text-xs font-medium text-muted uppercase tracking-widest">
              Secured by <span className="text-ink font-bold">Institutional Flow</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
