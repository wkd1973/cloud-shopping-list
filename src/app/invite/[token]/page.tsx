// /invite/[token] — strona przyjęcia zaproszenia.
//
// Scenariusze:
// A) Użytkownik ZALOGOWANY → od razu dołącz do gospodarstwa
// B) Użytkownik NIEZALOGOWANY → przekieruj do logowania z tokenem w URL,
//    po zalogowaniu callback redirectuje tu z powrotem
//
// Server Component — wszystko dzieje się na serwerze:
// - Walidacja tokenu (czy istnieje, czy nie wygasł, czy nie użyty)
// - Dołączenie do gospodarstwa (insert + oznaczenie tokenu jako użytego)
// - Redirect do /list lub wyświetlenie błędu
//
// Dlaczego Server Component zamiast Route Handler?
// Chcemy pokazać użytkownikowi ładny widok (potwierdzenie lub błąd)
// zamiast ślepego redirectu.

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ token: string }>
}

export default async function InvitePage(props: Props) {
  const params = await props.params;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/auth/login?redirectTo=/invite/${params.token}`)
  }

  // Pobierz zaproszenie
  const { data: invite } = await supabase
    .from('household_invites')
    .select('*, household:households(name)')
    .eq('token', params.token)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!invite) {
    return <InviteError message="Ten link do zaproszenia nie jest już aktywny" />
  }

  // Sprawdź czy użytkownik już jest członkiem
  const { data: existing } = await supabase
    .from('household_members')
    .select('id')
    .eq('household_id', invite.household_id)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    redirect('/list')
  }

  // Akcja dołączenia
  async function joinAction() {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { error: joinError } = await supabase
      .from('household_members')
      .insert({
        household_id:  invite.household_id,
        user_id:       user.id,
        display_name:  user.email?.split('@')[0] ?? 'Domownik',
        role:          'member',
      })

    if (joinError) {
      redirect(`/invite/${params.token}?error=1`)
    }

    await supabase
      .from('household_invites')
      .update({ used_at: new Date().toISOString(), used_by: user.id })
      .eq('id', invite.id)

    redirect('/list')
  }

  return (
    <main className="bg-surface-bg min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      <div className="w-full max-w-[400px] px-margin-mobile flex flex-col items-center text-center animate-fade-in z-10">
        {/* Hero Icon */}
        <div className="mb-stack-lg p-6 bg-white rounded-full shadow-sm">
          <span className="material-symbols-outlined text-[48px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            house
          </span>
        </div>
        
        {/* Social Proof Section */}
        <div className="flex flex-col items-center space-y-4 mb-stack-lg">
          <div className="flex -space-x-3 items-center">
            <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden shadow-sm">
              <img alt="Profile 1" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYeVdNzpkDBWPWcjFkKkwOikhnv6uESGD5IoptK5pvUXSCp_OrbWSQTqgdVIno1hYfzuKhbaSq9F7ngNaptiJ97Hh7YPZVVT0uZzQwM4ucORaqDMtJqRXkSluk84Mr5Sl5P1OU6wrescg97NZIZNxI8COnWMM9gr-ENFaTbsyTYo3J1OBj4l4vtDffcVT1Le35MARMjtmaKK7v0dtfPKDtsQk8zQk-HA4BvjAj9-x4yIdOnKHX7awgZ9zQNYmUwGrNfA5-7J3D9DFr" />
            </div>
            <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden shadow-sm">
              <img alt="Profile 2" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAmm-50zQXbOqrN3Slg4_HskXsUvQibn-oXXruMiMTkrqGi3zTn6DgkiLkeejoT9C0XbC_GutGQFaRnw0_dxZCg8buxbXGtGBqDIfOPusaA1Me1WTWdI4gjXE3gSRHtR83jQz6-gi-yhZGFZrdfcWyD9bt3NF8HJuPxRFm5_GJKKLumPSfk3yzEt2lHsh48BZEvJF4ndvWnf1-kJsY663jeKPK6Kmx_tAb1KTL-EltRGRqQA9_Om4ZSFgmvQ7Q5DVileCGcfFygpCo" />
            </div>
            <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden shadow-sm">
              <img alt="Profile 3" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDuLDXp8CQ6bIqm15YuKviYyaK9zFATQOEtSxbb5jaVpAu2ZIpFaKJYohQdMQr9xK2c2OJnNOQZJGH1ZH4w3zi0EQvcHwnOdlRlHO5ZFfTVcG07g_ZhpHTlegWLfJr8Wf_m_7D48ANv9_yFjUODOl9HPIMuDFmFBDrvwrIw7BbmHlXjCjEEOY8m0cfWY4Rm6mzhLVFsN62DjFSoFHYBbhCNEcg7oOGp2Q1e_CykRsV-Ibd0qdMiCMKcsGsaqMM5zkvg5YBGbE8EHnZm" />
            </div>
          </div>
          
          <div className="space-y-2 px-4">
            <h1 className="font-headline-lg text-[24px] font-semibold text-text-primary tracking-tight">
              3 osoby już tu są!
            </h1>
            <p className="font-body-lg text-[16px] text-text-secondary">
              Dołącz do nich w domu <span className="font-bold text-text-primary">{invite.household?.name ?? 'Domowe'}</span>
            </p>
          </div>
        </div>

        {/* Quick Action Form */}
        <form action={joinAction} className="w-full">
          <button type="submit" className="group w-full py-4 bg-primary text-on-primary rounded-xl font-headline-md text-[20px] font-semibold flex items-center justify-center gap-3 shadow-md active:scale-95 transition-all duration-200 hover:shadow-lg">
            <span>Wchodzę!</span>
            <span className="material-symbols-outlined transition-transform group-hover:translate-x-1" style={{ fontVariationSettings: "'wght' 600" }}>
              arrow_forward
            </span>
          </button>
        </form>
      </div>
      
      {/* Visual Atmosphere Background blobs */}
      <div className="fixed -top-20 -right-20 w-80 h-80 bg-primary-container opacity-10 rounded-full blur-3xl -z-10"></div>
      <div className="fixed -bottom-20 -left-20 w-96 h-96 bg-tertiary-container opacity-5 rounded-full blur-3xl -z-10"></div>
    </main>
  )
}

function InviteError({ message }: { message: string }) {
  return (
    <main className="bg-surface-bg flex-grow flex items-center justify-center min-h-screen px-margin-mobile relative overflow-hidden">
      <div className="w-full max-w-[480px] bg-surface-container-lowest p-stack-lg rounded-2xl shadow-sm border border-outline-variant animate-fade-in flex flex-col items-center text-center z-10">
        
        {/* Error Icon Container */}
        <div className="mb-stack-lg relative mt-4">
          <div className="absolute inset-0 bg-error opacity-10 rounded-full scale-150 blur-xl"></div>
          <div className="relative w-24 h-24 bg-error-container rounded-full flex items-center justify-center text-error">
            <span className="material-symbols-outlined text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          </div>
        </div>

        {/* Typography Cluster */}
        <div className="space-y-stack-sm mb-stack-lg">
          <h1 className="font-headline-lg text-[24px] font-semibold text-on-surface">Ups! Coś poszło nie tak</h1>
          <p className="font-body-lg text-[16px] text-on-surface-variant max-w-[280px] mx-auto">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-stack-sm mt-4">
          <a href="/auth/login" className="w-full py-4 bg-primary text-on-primary font-headline-md text-[16px] font-semibold rounded-xl transition-all active:scale-95 shadow-md hover:bg-on-primary-fixed-variant flex items-center justify-center gap-2 inline-flex">
            <span className="material-symbols-outlined">login</span>
            Spróbuj się zalogować
          </a>
          <a href="/list" className="w-full py-4 bg-transparent border-2 border-outline-variant text-primary font-headline-md text-[16px] font-semibold rounded-xl transition-all hover:bg-surface-container-low active:scale-95 flex items-center justify-center gap-2 inline-flex">
            <span className="material-symbols-outlined">home</span>
            Wróć do strony głównej
          </a>
        </div>
      </div>

      {/* Visual Atmosphere: Background blobs */}
      <div className="fixed -top-20 -right-20 w-80 h-80 bg-primary-container opacity-10 rounded-full blur-3xl -z-10"></div>
      <div className="fixed -bottom-20 -left-20 w-96 h-96 bg-tertiary-container opacity-5 rounded-full blur-3xl -z-10"></div>
    </main>
  )
}
