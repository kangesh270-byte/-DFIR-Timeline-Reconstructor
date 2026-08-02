import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Cpu, Lock, Mail, ShieldCheck, Sparkles, User, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', username: '', full_name: '', title: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await register(form.email, form.password, form.username, form.full_name, form.title);
      navigate('/');
    } catch {
      setError('Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.18),_transparent_28%),#020617] px-4 py-8 text-[#E4E4E7] sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[28px] border border-slate-800/80 bg-slate-950/70 shadow-[0_24px_90px_rgba(2,8,23,0.45)] backdrop-blur lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative flex items-center overflow-hidden bg-slate-900/70 px-6 py-10 sm:px-10 lg:px-14 lg:py-16">
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(14,165,233,0.12),transparent_50%,rgba(16,185,129,0.12))]" />
            <div className="relative max-w-md space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-400">DFIR Studio</p>
                </div>
              </div>

              <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">Create your workspace.</h1>
              <p className="text-base leading-7 text-slate-400">Join the DFIR timeline workspace for investigations and response.</p>
            </div>
          </div>

          <div className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-14 lg:py-16">
            <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
              <div className="space-y-2">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-400">Register</p>
                <h2 className="text-2xl font-semibold text-white">Create your account</h2>
                <p className="text-sm text-slate-400">Join the DFIR timeline workspace</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-300 sm:col-span-2">
                  Email
                  <div className="mt-1 flex items-center rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-3 transition focus-within:border-cyan-500/50 focus-within:bg-slate-900">
                    <Mail className="mr-2 h-4 w-4 text-slate-500" />
                    <input
                      className="w-full border-0 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                      placeholder="analyst@company.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </label>

                <label className="block text-sm font-medium text-slate-300 sm:col-span-2">
                  Password
                  <div className="mt-1 flex items-center rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-3 transition focus-within:border-cyan-500/50 focus-within:bg-slate-900">
                    <Lock className="mr-2 h-4 w-4 text-slate-500" />
                    <input
                      className="w-full border-0 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                      placeholder="Create a strong password"
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                  </div>
                </label>

                <label className="block text-sm font-medium text-slate-300">
                  Username
                  <div className="mt-1 flex items-center rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-3 transition focus-within:border-cyan-500/50 focus-within:bg-slate-900">
                    <User className="mr-2 h-4 w-4 text-slate-500" />
                    <input
                      className="w-full border-0 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                      placeholder="analyst01"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                    />
                  </div>
                </label>

                <label className="block text-sm font-medium text-slate-300">
                  Title
                  <div className="mt-1 flex items-center rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-3 transition focus-within:border-cyan-500/50 focus-within:bg-slate-900">
                    <Briefcase className="mr-2 h-4 w-4 text-slate-500" />
                    <input
                      className="w-full border-0 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                      placeholder="SOC Analyst"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                  </div>
                </label>

                <label className="block text-sm font-medium text-slate-300 sm:col-span-2">
                  Full name
                  <div className="mt-1 flex items-center rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-3 transition focus-within:border-cyan-500/50 focus-within:bg-slate-900">
                    <User className="mr-2 h-4 w-4 text-slate-500" />
                    <input
                      className="w-full border-0 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                      placeholder="Full name"
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    />
                  </div>
                </label>
              </div>

              {error ? <p className="text-sm text-red-400">{error}</p> : null}

              <button className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110" type="submit">
                Create account
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>

              <p className="text-center text-sm text-slate-400">
                Already have an account?{' '}
                <Link className="font-semibold text-cyan-400 transition hover:text-cyan-300" to="/login">
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
