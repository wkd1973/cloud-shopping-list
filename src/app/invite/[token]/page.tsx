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
  params: { token: string }
}

export default async function InvitePage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Niezalogowany — idź do logowania, wróć po zalogowaniu
  if (!user) {
    redirect(`/auth/login?redirectTo=/invite/${params.token}`)
  }

  // Pobierz zaproszenie
  const { data: invite } = await supabase
    .from('household_invites')
    .select('*, households(id, name)')
    .eq('token', params.token)
    .is('used_at', null)                     // nieużyte
    .gt('expires_at', new Date().toISOString()) // nie wygasłe
    .single()

  if (!invite) {
    return <InviteError message="Link zaproszenia wygasł lub jest nieprawidłowy." />
  }

  const household = invite.households as { id: string; name: string }

  // Sprawdź czy użytkownik już jest członkiem
  const { data: existing } = await supabase
    .from('household_members')
    .select('id')
    .eq('household_id', household.id)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    // Już jest członkiem — po prostu idź do listy
    redirect('/list')
  }

  // Dołącz do gospodarstwa
  const { error: joinError } = await supabase
    .from('household_members')
    .insert({
      household_id:  household.id,
      user_id:       user.id,
      display_name:  user.email?.split('@')[0] ?? 'Domownik',
      role:          'member',
    })

  if (joinError) {
    return <InviteError message="Nie udało się dołączyć. Spróbuj ponownie." />
  }

  // Oznacz token jako użyty
  await supabase
    .from('household_invites')
    .update({ used_at: new Date().toISOString(), used_by: user.id })
    .eq('id', invite.id)

  // Sukces — redirect do listy
  redirect('/list')
}

function InviteError({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-4">🔗</div>
        <h1 className="text-lg font-semibold text-slate-200 mb-2">
          Nieprawidłowe zaproszenie
        </h1>
        <p className="text-slate-500 text-sm mb-6">{message}</p>
        <a
          href="/list"
          className="inline-block px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700
                     text-slate-300 text-sm transition-colors"
        >
          Przejdź do listy
        </a>
      </div>
    </main>
  )
}
