import React, { useState } from 'react';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { authService } from '../services/authService';

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

export default function ForgotPassword({ onBackToLogin }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await authService.resetPassword(email);
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
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
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-ink tracking-tight">Check your email</h1>
            <p className="text-sm md:text-base text-muted font-medium">
              We sent a password reset link to <span className="text-ink font-bold">{email}</span>
            </p>
          </div>

          <div className="bg-surface-soft rounded-xl border border-hairline p-5 sm:p-8 md:p-12 lg:p-14 text-center space-y-6">
            <div className="bg-semantic-up/5 text-semantic-up p-4 rounded-lg text-sm font-bold border border-semantic-up/10">
              Reset link sent successfully
            </div>
            <button
              type="button"
              onClick={onBackToLogin}
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
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-ink tracking-tight">Forgot password?</h1>
          <p className="text-sm md:text-base text-muted font-medium">Enter your email and we'll send you a reset link</p>
        </div>

        <div className="bg-surface-soft rounded-xl border border-hairline p-5 sm:p-8 md:p-12 lg:p-14">
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-7">
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
                  Sending...
                </span>
              ) : 'Send Reset Link'}
            </button>

            <div className="text-center pt-4 sm:pt-6 border-t border-hairline">
              <button
                type="button"
                onClick={onBackToLogin}
                className="text-sm text-muted hover:text-primary transition-colors flex items-center justify-center gap-1 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
