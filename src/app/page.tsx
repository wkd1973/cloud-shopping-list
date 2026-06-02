import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const isLoggedIn = !!session

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans overflow-x-hidden relative">
      {/* Dekoracyjne tło z gradientem (Glassmorphism) */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-br from-emerald-100/40 via-teal-50/20 to-transparent -z-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10 pointer-events-none" />
      <div className="absolute top-40 left-0 w-72 h-72 bg-emerald-300/10 rounded-full blur-3xl translate-y-1/4 -translate-x-1/2 -z-10 pointer-events-none" />

      {/* Nawigacja (Navbar) */}
      <nav className="max-w-screen-xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary text-on-primary rounded-xl flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-[24px]">cloud_done</span>
          </div>
          <span className="text-[20px] font-bold text-on-surface tracking-tight">Zakupy w chmurze</span>
        </div>
        <div className="hidden sm:flex items-center gap-6">
          <Link href="#funkcje" className="text-[15px] font-medium text-on-surface-variant hover:text-primary transition-colors">
            Funkcje
          </Link>
          <Link href="/help" className="text-[15px] font-medium text-on-surface-variant hover:text-primary transition-colors">
            Pomoc
          </Link>
          <Link href={isLoggedIn ? "/list" : "/auth/login"} className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-[14px] shadow-sm hover:opacity-90 active:scale-95 transition-all">
            {isLoggedIn ? "Otwórz aplikację" : "Zaloguj się"}
          </Link>
        </div>
        <div className="sm:hidden">
          <Link href={isLoggedIn ? "/list" : "/auth/login"} className="px-4 py-2 bg-primary text-on-primary rounded-xl font-bold text-[14px] shadow-sm hover:opacity-90 active:scale-95 transition-all">
            {isLoggedIn ? "Otwórz" : "Zaloguj"}
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center">
        
        {/* Hero Section */}
        <section className="w-full max-w-screen-xl mx-auto px-6 py-16 sm:py-24 lg:py-32 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-6 duration-1000">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-border-subtle text-[13px] font-medium text-primary mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Vercel Analytics & PWA Active
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-on-surface tracking-tight mb-6 max-w-4xl leading-[1.15]">
            Koniec z papierowymi karteczkami. <br className="hidden lg:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal-500">Zawsze zsynchronizowani.</span>
          </h1>
          <p className="text-lg sm:text-xl text-on-surface-variant max-w-2xl mb-10 leading-relaxed font-medium">
            Inteligentna, współdzielona lista zakupów działająca w czasie rzeczywistym. Organizuj zakupy, zapraszaj domowników i twórz szablony ulubionych dań.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link 
              href={isLoggedIn ? "/list" : "/auth/login"} 
              className="px-8 py-4 bg-primary text-on-primary rounded-2xl font-bold text-[16px] shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {isLoggedIn ? "Przejdź do swoich list" : "Zacznij za darmo"}
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </Link>
            <Link 
              href="#funkcje"
              className="px-8 py-4 bg-surface-container text-on-surface rounded-2xl font-bold text-[16px] shadow-sm hover:bg-surface-container-high active:scale-95 transition-all flex items-center justify-center"
            >
              Dowiedz się więcej
            </Link>
          </div>

          {/* Mockup wizualny */}
          <div className="mt-16 sm:mt-24 w-full max-w-4xl relative">
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent z-10 pointer-events-none rounded-2xl" />
            <div className="bg-white/60 backdrop-blur-xl border border-white/40 p-2 sm:p-4 rounded-[2rem] shadow-2xl shadow-primary/10">
              <div className="bg-surface rounded-2xl border border-outline-variant overflow-hidden shadow-inner relative aspect-[16/10] sm:aspect-[21/9]">
                {/* Atrapa interfejsu (Mockup) */}
                <div className="absolute inset-0 p-4 sm:p-8 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <div className="h-8 w-40 bg-surface-container rounded-lg animate-pulse" />
                    <div className="h-8 w-8 bg-surface-container rounded-full animate-pulse" />
                  </div>
                  <div className="flex gap-4 mb-6">
                    <div className="h-10 flex-1 bg-surface-container rounded-xl animate-pulse" />
                    <div className="h-10 flex-1 bg-surface-container rounded-xl animate-pulse" />
                    <div className="h-10 flex-1 bg-surface-container rounded-xl animate-pulse hidden sm:block" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="h-14 w-full bg-emerald-50 rounded-xl border border-emerald-100 flex items-center px-4 gap-3">
                      <div className="w-6 h-6 rounded-md bg-primary/20" />
                      <div className="h-4 w-32 bg-primary/30 rounded-md" />
                    </div>
                    <div className="h-14 w-full bg-surface-container-lowest rounded-xl border border-outline-variant flex items-center px-4 gap-3">
                      <div className="w-6 h-6 rounded-md border-2 border-outline" />
                      <div className="h-4 w-48 bg-outline-variant rounded-md" />
                    </div>
                    <div className="h-14 w-full bg-surface-container-lowest rounded-xl border border-outline-variant flex items-center px-4 gap-3">
                      <div className="w-6 h-6 rounded-md border-2 border-outline" />
                      <div className="h-4 w-24 bg-outline-variant rounded-md" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="funkcje" className="w-full bg-surface-container-lowest border-y border-outline-variant py-20 sm:py-32">
          <div className="max-w-screen-xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-on-surface mb-4">Wszystko, czego potrzebujesz na zakupach</h2>
              <p className="text-lg text-on-surface-variant max-w-2xl mx-auto font-medium">Stworzone z myślą o prostocie, szybkości i bezproblemowym dzieleniu się domowymi obowiązkami.</p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Feature 1 */}
              <div className="bg-surface border border-outline-variant rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-[28px]">bolt</span>
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-3">Na żywo w chmurze</h3>
                <p className="text-on-surface-variant text-[15px] leading-relaxed">Gdy odhaczasz produkt w sklepie, Twoja rodzina widzi to natychmiast na swoich ekranach. Bez opóźnień.</p>
              </div>

              {/* Feature 2 */}
              <div className="bg-surface border border-outline-variant rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-[28px]">group_add</span>
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-3">Współdzielenie domostwa</h3>
                <p className="text-on-surface-variant text-[15px] leading-relaxed">Zaproś żonę, męża, dzieci czy współlokatorów. Każdy ma dostęp do tej samej, wspólnej listy domowej.</p>
              </div>

              {/* Feature 3 */}
              <div className="bg-surface border border-outline-variant rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-[28px]">app_shortcut</span>
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-3">Zainstaluj jako aplikację (PWA)</h3>
                <p className="text-on-surface-variant text-[15px] leading-relaxed">Dodaj do ekranu głównego telefonu. Działa i wygląda jak natywna aplikacja, ale bez pobierania ze sklepu.</p>
              </div>

              {/* Feature 4 */}
              <div className="bg-surface border border-outline-variant rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-[28px]">receipt_long</span>
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-3">Inteligentne Szablony</h3>
                <p className="text-on-surface-variant text-[15px] leading-relaxed">Zapisuj ulubione pule produktów (np. "Sobotni Grill" 🥩) i dodawaj je na listę jednym kliknięciem.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface py-12 border-t border-outline-variant">
        <div className="max-w-screen-xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">cloud_done</span>
            <span className="font-bold text-on-surface text-[15px]">Zakupy w chmurze</span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-[14px] text-on-surface-variant font-medium">
            <Link href="/terms" className="hover:text-primary transition-colors">Regulamin</Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">Polityka Prywatności</Link>
            <Link href="/help" className="hover:text-primary transition-colors">Pomoc (FAQ)</Link>
          </div>
          <p className="text-[13px] text-outline-variant font-medium">
            © {new Date().getFullYear()} Wszelkie prawa zastrzeżone.
          </p>
        </div>
      </footer>
    </div>
  )
}