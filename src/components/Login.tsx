import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onLogin: (token: string, rememberMe: boolean) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        onLogin(data.token, rememberMe);
      } else {
        setError(data.message || 'Invalid username or password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/login/guest', { method: 'POST' });
      const data = await response.json();
      if (data.success) onLogin(data.token, false);
      else setError('Guest login unavailable.');
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
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
          <p className="text-muted font-medium">Access your institutional financial audit.</p>
        </div>

        <div className="bg-canvas rounded-xl border border-hairline p-10 md:p-12 shadow-2xl shadow-ink/5">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label htmlFor="login-username" className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] ml-1">Account ID / Email</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                <input
                  id="login-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-surface-soft border border-hairline rounded-md text-ink placeholder:text-muted/50 focus:border-primary focus:bg-canvas transition-all outline-none text-sm font-medium"
                  placeholder="name@institution.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label htmlFor="login-password" className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Secret Key</label>
                <button type="button" className="text-[10px] font-bold text-primary uppercase tracking-[0.1em] hover:underline">Recover Key</button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative w-5 h-5">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="peer absolute opacity-0 w-full h-full cursor-pointer"
                  />
                  <div className="w-5 h-5 rounded-sm border border-hairline peer-checked:bg-primary peer-checked:border-primary transition-all duration-200" />
                  <svg
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-muted group-hover:text-ink transition-colors uppercase tracking-widest">Stay Authorized</span>
              </label>
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
                  <span>Authorizing...</span>
                </div>
              ) : 'Sign In'}
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
              onClick={handleGuestLogin}
              disabled={isLoading}
              className="w-full h-[56px] text-base font-bold rounded-full border-2 border-hairline text-ink hover:bg-surface-soft hover:border-muted transition-all flex items-center justify-center gap-2"
            >
              <User className="w-5 h-5 text-muted" />
              Guest Access
            </button>
          </form>

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
