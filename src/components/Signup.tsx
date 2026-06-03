import React, { useState } from 'react';
import { Loader2, Mail, Lock, Eye, EyeOff, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';
import { authService } from '../services/authService';

interface SignupProps {
  onSignup: (token: string) => void;
  onBackToLogin: () => void;
}

export default function Signup({ onSignup, onBackToLogin }: SignupProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must contain at least 1 letter and 1 number');
      return;
    }

    setIsLoading(true);
    try {
      const data = await authService.signUp(email, password);
      if (data.session?.access_token) {
        onSignup(data.session.access_token);
      } else {
        setError('Check your email for a confirmation link, then sign in.');
        setIsLoading(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Signup failed';
      if (msg.includes('already')) {
        setError('An account with this email already exists');
      } else {
        setError(msg);
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas p-4 sm:p-6 md:p-12 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[160px] translate-x-1/4 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] -translate-x-1/4 translate-y-1/4" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="w-full sm:max-w-[32rem] md:max-w-[36rem] lg:max-w-[42rem] relative z-10 space-y-6 md:space-y-14"
      >
        <div className="text-center space-y-4 md:space-y-6">
          <div className="flex items-center justify-center gap-3 md:gap-4">
            <svg viewBox="0 0 512 512" className="w-12 h-12 md:w-16 md:h-16 shrink-0" xmlns="http://www.w3.org/2000/svg">
              <rect width="512" height="512" rx="110" fill="#1C1829" />
              <rect x="108" y="300" width="72" height="130" rx="14" fill="#A78BFA" />
              <rect x="220" y="235" width="72" height="195" rx="14" fill="#A78BFA" />
              <rect x="332" y="152" width="72" height="278" rx="14" fill="#A78BFA" />
              <polyline points="144,296 256,231 368,148" fill="none" stroke="#1ED47A" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="144" cy="296" r="9" fill="#1ED47A" />
              <circle cx="256" cy="231" r="9" fill="#1ED47A" />
              <circle cx="368" cy="148" r="18" fill="#1ED47A" />
              <circle cx="368" cy="148" r="9" fill="#1C1829" />
            </svg>
            <span className="text-3xl md:text-4xl lg:text-5xl font-bold text-ink leading-none tracking-tight">FinTrack <span className="text-semantic-up font-normal">Pro</span></span>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-ink tracking-tight">Create account</h1>
            <p className="text-sm md:text-base text-muted font-medium mt-1 md:mt-2">Sign up to start tracking your finances</p>
          </div>
        </div>

        <div className="bg-surface-soft rounded-xl border border-hairline p-5 sm:p-8 md:p-12 lg:p-14">
          <form onSubmit={handleSignup} className="space-y-4 md:space-y-7">
            <div className="space-y-1.5 md:space-y-2">
              <label className="text-xs md:text-sm font-semibold text-muted uppercase tracking-[0.2em] ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-11 md:pl-12 pr-4 py-3.5 md:py-4 bg-canvas border border-hairline rounded-lg text-sm md:text-base text-ink placeholder:text-muted/50 focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all outline-none"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <label className="text-xs md:text-sm font-semibold text-muted uppercase tracking-[0.2em] ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-11 md:pl-12 pr-11 py-3.5 md:py-4 bg-canvas border border-hairline rounded-lg text-sm md:text-base text-ink placeholder:text-muted/50 focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all outline-none"
                  placeholder="Min 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <label className="text-xs md:text-sm font-semibold text-muted uppercase tracking-[0.2em] ml-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 md:pl-12 pr-4 py-3.5 md:py-4 bg-canvas border border-hairline rounded-lg text-sm md:text-base text-ink placeholder:text-muted/50 focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all outline-none"
                  placeholder="Re-enter password"
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-semantic-down/5 text-semantic-down p-4 rounded-lg text-xs font-bold uppercase tracking-wider border border-semantic-down/10 flex items-center gap-3"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-semantic-down shrink-0" />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full h-12 sm:h-14 md:h-16 text-sm md:text-base"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Sign Up
                </span>
              )}
            </button>

            <div className="text-center pt-4 sm:pt-6 border-t border-hairline">
              <button
                type="button"
                onClick={onBackToLogin}
                className="text-sm text-muted hover:text-primary transition-colors"
              >
                Already have an account? <span className="font-bold text-primary">Sign In</span>
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
