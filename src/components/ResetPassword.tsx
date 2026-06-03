import React, { useState, useEffect } from 'react';
import { Loader2, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { authService } from '../services/authService';

interface ResetPasswordProps {
  onResetComplete: () => void;
}

export default function ResetPassword({ onResetComplete }: ResetPasswordProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRecoveryToken, setHasRecoveryToken] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery') || hash.includes('access_token')) {
      setHasRecoveryToken(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
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

    setIsLoading(true);
    try {
      await authService.updatePassword(password);
      setSuccess(true);
      setTimeout(onResetComplete, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
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
          <div className="bg-surface-soft rounded-xl border border-hairline p-5 sm:p-8 md:p-12 lg:p-14 text-center space-y-6">
            <CheckCircle className="w-16 h-16 text-semantic-up mx-auto" />
            <h1 className="text-2xl md:text-3xl font-bold text-ink tracking-tight">Password updated</h1>
            <p className="text-sm md:text-base text-muted font-medium">Redirecting to sign in...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!hasRecoveryToken) {
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
          <div className="bg-surface-soft rounded-xl border border-hairline p-5 sm:p-8 md:p-12 lg:p-14 text-center space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold text-ink tracking-tight">Invalid reset link</h1>
            <p className="text-sm md:text-base text-muted font-medium">This password reset link is invalid or has expired.</p>
            <button
              type="button"
              onClick={onResetComplete}
              className="btn-primary w-full h-12 sm:h-14 md:h-16 text-sm md:text-base"
            >
              Back to Sign In
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

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
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-ink tracking-tight">Set new password</h1>
          <p className="text-sm md:text-base text-muted font-medium">Enter your new password below</p>
        </div>

        <div className="bg-surface-soft rounded-xl border border-hairline p-5 sm:p-8 md:p-12 lg:p-14">
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-7">
            <div className="space-y-1.5 md:space-y-2">
              <label className="text-xs md:text-sm font-semibold text-muted uppercase tracking-[0.2em] ml-1">New Password</label>
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
                  Updating...
                </span>
              ) : 'Update Password'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
