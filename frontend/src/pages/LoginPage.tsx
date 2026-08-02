import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Chrome, Cpu, EyeOff, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginFormValues {
  email: string;
  password: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: 'analyst@dfir.local',
      password: 'changeme',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setError('');
    try {
      await login(values.email, values.password);
      navigate('/');
    } catch {
      setError('Authentication failed');
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.16),_transparent_32%),#020617] px-4 py-8 text-[#E4E4E7] sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[28px] border border-slate-800/80 bg-slate-950/70 shadow-[0_24px_90px_rgba(2,8,23,0.45)] backdrop-blur lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative flex items-center overflow-hidden bg-slate-900/70 px-6 py-10 sm:px-10 lg:px-14 lg:py-16">
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(16,185,129,0.12),transparent_45%,rgba(14,165,233,0.12))]" />
            <div className="relative max-w-md space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-500/10 text-emerald-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-400">DFIR Studio</p>
                </div>
              </div>

              <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">Sign in to continue.</h1>
              <p className="text-base leading-7 text-slate-400">Access the DFIR timeline workspace for investigations and response.</p>
            </div>
          </div>

          <div className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-14 lg:py-16">
            <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md space-y-5">
              <div className="space-y-2">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-400">Authentication</p>
                <h2 className="text-2xl font-semibold text-white">Sign in</h2>
                <p className="text-sm text-slate-400">Access the DFIR timeline workspace</p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-300">
                  Email
                  <div className="mt-1 flex items-center rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-3 shadow-[0_0_0_1px_rgba(15,23,42,0.4)] transition focus-within:border-cyan-500/50 focus-within:bg-slate-900">
                    <Mail className="mr-2 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      className="w-full border-0 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                      placeholder="analyst@company.com"
                      {...register('email', { required: 'Email is required' })}
                    />
                  </div>
                  {errors.email ? <p className="mt-1 text-xs text-red-400">{errors.email.message}</p> : null}
                </label>

                <label className="block text-sm font-medium text-slate-300">
                  Password
                  <div className="mt-1 flex items-center rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-3 shadow-[0_0_0_1px_rgba(15,23,42,0.4)] transition focus-within:border-cyan-500/50 focus-within:bg-slate-900">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="w-full border-0 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                      placeholder="Enter your password"
                      {...register('password', { required: 'Password is required' })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="ml-2 text-slate-500 transition hover:text-cyan-400"
                      aria-label="Toggle password visibility"
                    >
                      <EyeOff className="h-4 w-4" />
                    </button>
                  </div>
                  {errors.password ? <p className="mt-1 text-xs text-red-400">{errors.password.message}</p> : null}
                </label>
              </div>

              <div className="flex items-center justify-end">
                <a href="#" className="text-sm font-medium text-slate-400 transition hover:text-cyan-400">
                  Forgot password?
                </a>
              </div>

              {error ? <p className="text-sm text-red-400">{error}</p> : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>

              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-slate-800" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">or</span>
                <div className="h-px flex-1 bg-slate-800" />
              </div>

              <button
                type="button"
                className="flex w-full items-center justify-center rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-500/50 hover:bg-slate-800"
              >
                <Chrome className="mr-2 h-4 w-4" />
                Continue with Google
              </button>

              <p className="text-center text-sm text-slate-400">
                Need an account?{' '}
                <Link to="/register" className="font-semibold text-cyan-400 transition hover:text-cyan-300">
                  Create one
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
