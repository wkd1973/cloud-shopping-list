import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-on-background pb-20">
      <header className="bg-surface sticky top-0 shadow-sm z-40 h-16 flex items-center px-4">
        <Link href="/auth/login" className="active:scale-95 transition-transform duration-200 text-primary">
          <span className="material-symbols-outlined" data-icon="arrow_back">arrow_back</span>
        </Link>
        <h1 className="font-headline-md text-[20px] font-bold text-primary ml-4">Regulamin Usługi</h1>
      </header>
      
      <main className="max-w-screen-sm mx-auto p-6 text-on-surface-variant font-body-md text-[14px] leading-relaxed space-y-6">
        <section>
          <h2 className="text-[18px] font-bold text-on-surface mb-2">1. Postanowienia ogólne</h2>
          <p>
            Niniejszy Regulamin określa zasady korzystania z bezpłatnej aplikacji internetowej typu SaaS przeznaczonej do zarządzania listami zakupów (dalej: "Aplikacja"). Użytkownik korzystając z Aplikacji, akceptuje warunki niniejszego Regulaminu.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-bold text-on-surface mb-2">2. Zasady dostępu i konta</h2>
          <p>
            1. Korzystanie z Aplikacji wymaga założenia konta użytkownika przy użyciu ważnego adresu e-mail.<br/>
            2. Użytkownik zobowiązany jest do zachowania w tajemnicy hasła dostępowego.<br/>
            3. Zakazuje się przesyłania treści niezgodnych z prawem, wulgarnych lub obraźliwych na wspólnych listach zakupów.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-bold text-on-surface mb-2">3. Odpowiedzialność</h2>
          <p>
            1. Aplikacja udostępniana jest w stanie "takim, jakim jest" (as is). Twórcy nie ponoszą odpowiedzialności za ewentualne przerwy w dostępności usług chmurowych ani za przypadkową utratę danych (choć dokładamy wszelkich starań, by dane były bezpieczne na platformie Supabase).<br/>
            2. Twórcy zastrzegają sobie prawo do wprowadzania aktualizacji oraz przerw technicznych.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-bold text-on-surface mb-2">4. Prawa autorskie</h2>
          <p>
            Oprogramowanie, interfejs oraz rozwiązania graficzne zastosowane w Aplikacji podlegają ochronie praw autorskich. Zakazuje się kopiowania elementów interfejsu (UX/UI) bez zgody twórców.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-bold text-on-surface mb-2">5. Zmiany w regulaminie</h2>
          <p>
            Regulamin może ulec zmianie. Informacje o istotnych modyfikacjach zostaną przekazane użytkownikom drogą elektroniczną.
          </p>
        </section>
      </main>
    </div>
  )
}
