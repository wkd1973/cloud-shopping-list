import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-on-background pb-20">
      <header className="bg-surface sticky top-0 shadow-sm z-40 h-16 flex items-center px-4">
        <Link href="/auth/login" className="active:scale-95 transition-transform duration-200 text-primary">
          <span className="material-symbols-outlined" data-icon="arrow_back">arrow_back</span>
        </Link>
        <h1 className="font-headline-md text-[20px] font-bold text-primary ml-4">Polityka Prywatności</h1>
      </header>
      
      <main className="max-w-screen-sm mx-auto p-6 text-on-surface-variant font-body-md text-[14px] leading-relaxed space-y-6">
        <section>
          <h2 className="text-[18px] font-bold text-on-surface mb-2">1. Jakie dane zbieramy?</h2>
          <p>
            Podczas rejestracji przetwarzamy wyłącznie Twój adres e-mail oraz zaszyfrowane hasło w celu autoryzacji konta (korzystamy z zaufanego rozwiązania chmurowego Supabase Auth). Opcjonalnie przechowujemy Twoją nazwę użytkownika na potrzeby wyświetlania na listach domowników.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-bold text-on-surface mb-2">2. Ciasteczka (Cookies) i Pamięć Lokalna</h2>
          <p>
            Aplikacja jest typu PWA (Progressive Web App) i wykorzystuje:
            <br/>- <strong>Ciasteczka techniczne</strong> (tzw. sesyjne) niezbędne do utrzymania bezpiecznego logowania do bazy danych.
            <br/>- <strong>Lokalną pamięć przeglądarki (Cache Storage / LocalStorage)</strong>, aby aplikacja mogła działać błyskawicznie i pobierać szybciej zasoby (ikony, pliki robocze).
            <br/>
            Nie wykorzystujemy ciasteczek śledzących, marketingowych ani nie przekazujemy danych osobowych zewnętrznym sieciom reklamowym.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-bold text-on-surface mb-2">3. Cel przetwarzania danych</h2>
          <p>
            Twoje dane (w tym wprowadzane nazwy list i produktów) przetwarzane są wyłącznie w celu prawidłowego świadczenia usługi i synchronizacji stanu listy zakupów między domownikami w czasie rzeczywistym.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-bold text-on-surface mb-2">4. Prawa Użytkownika</h2>
          <p>
            Masz prawo dostępu do swoich danych, ich poprawiania, a także żądania całkowitego ich usunięcia (oraz usunięcia konta). Wszelkie wnioski należy składać do administratorów systemu.
          </p>
        </section>
      </main>
    </div>
  )
}
