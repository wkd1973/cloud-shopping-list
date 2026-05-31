'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props { redirectTo?: string; error?: string }

export default function LoginForm({ redirectTo, error }: Props) {
  const [email, setEmail]   = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState(error ?? '')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading'); setErrorMsg('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=${redirectTo ?? '/list'}` },
    })
    if (error) { setStatus('error'); setErrorMsg(error.message) }
    else setStatus('sent')
  }

  async function handleGoogleLogin() {
    setStatus('loading'); setErrorMsg('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?redirectTo=${redirectTo ?? '/list'}` },
    })
    if (error) { setStatus('error'); setErrorMsg(error.message) }
  }

  async function handleFacebookLogin() {
    setStatus('loading'); setErrorMsg('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: { redirectTo: `${window.location.origin}/auth/callback?redirectTo=${redirectTo ?? '/list'}` },
    })
    if (error) { setStatus('error'); setErrorMsg(error.message) }
  }

  if (status === 'sent') {
    return (
      <div className="w-full text-center py-4">
        <div className="w-16 h-16 bg-category-produce/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-category-produce text-3xl">check_circle</span>
        </div>
        <p className="font-headline-md text-[20px] font-semibold text-on-surface">Sprawdź skrzynkę</p>
        <p className="text-on-surface-variant font-body-md text-[14px] mt-1">
          Wysłaliśmy link na <span className="font-medium text-on-surface">{email}</span>
        </p>
        <button onClick={() => setStatus('idle')} className="mt-6 text-sm font-semibold text-primary hover:text-surface-tint transition-colors">
          Wróć do logowania
        </button>
      </div>
    )
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="w-full space-y-stack-md">
        <div className="space-y-2">
          <label className="font-label-sm text-[12px] font-medium text-on-surface-variant ml-1" htmlFor="email">E-mail</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[20px]">mail</span>
            <input 
              id="email"
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              placeholder="twoj@email.pl" 
              required 
              disabled={status === 'loading'}
              className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-primary-container focus:border-primary-container outline-none transition-all font-body-md text-[14px] text-on-surface placeholder:text-outline-variant ${errorMsg ? 'border-error animate-shake' : 'border-outline-variant'}`}
            />
          </div>
          {errorMsg && <p className="text-error font-label-sm text-[12px] px-1 animate-shake">{errorMsg}</p>}
        </div>
        
        <button type="submit" disabled={status === 'loading' || !email.trim()}
          className="w-full bg-primary-container hover:bg-emerald-600 text-on-primary-container font-body-lg text-[16px] font-medium py-3.5 rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? (
            <>
              <svg className="animate-spin h-5 w-5 text-on-primary-container" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Wysyłanie...</span>
            </>
          ) : (
            <>
              <span>Wyślij link logowania</span>
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </>
          )}
        </button>
      </form>
      
      {/* Social/Secondary Actions */}
      <div className="w-full mt-stack-lg pt-stack-lg border-t border-surface-container flex flex-col gap-3">
        <button type="button" onClick={handleGoogleLogin} disabled={status === 'loading'} className="w-full py-2.5 px-4 bg-surface-container-low hover:bg-surface-container text-secondary font-body-md text-[14px] rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
          <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Kontynuuj przez Google
        </button>
        
        <button type="button" onClick={handleFacebookLogin} disabled={status === 'loading'} className="w-full py-2.5 px-4 bg-surface-container-low hover:bg-surface-container text-secondary font-body-md text-[14px] rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
          <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Kontynuuj przez Facebook
        </button>
      </div>
      <p className="mt-stack-lg font-label-sm text-[12px] text-on-surface-variant text-center">
        Link ważny przez 24 godziny · Bez hasła
      </p>
    </div>
  )
}
