'use client'

import { useRouter } from 'next/navigation'

export default function HelpPage() {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-background text-on-background pb-20">
      <header className="bg-surface sticky top-0 shadow-sm z-40 h-16 flex items-center px-4">
        <button onClick={() => router.back()} className="active:scale-95 transition-transform duration-200 text-primary">
          <span className="material-symbols-outlined" data-icon="arrow_back">arrow_back</span>
        </button>
        <h1 className="font-headline-md text-[20px] font-bold text-primary ml-4">Pomoc i Instrukcja</h1>
      </header>
      
      <main className="max-w-screen-sm mx-auto p-6 font-body-md space-y-8">
        
        <section className="bg-surface-container-low p-5 rounded-2xl border border-surface-container">
          <h2 className="text-[16px] font-bold text-primary mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">emoji_emotions</span>
            Jak dodawać Ikonki (Emoji)?
          </h2>
          <p className="text-[14px] text-on-surface-variant leading-relaxed mb-3">
            Nasza aplikacja wspiera natywne emotikony. Możesz używać ich w nazwach list zakupowych oraz przy tworzeniu Szablonów!
          </p>
          <ul className="text-[13px] text-on-surface-variant space-y-2 list-disc pl-4">
            <li><strong>Telefon (Android / iOS):</strong> Wykorzystaj wbudowaną klawiaturę Emoji w systemie (ikona uśmiechniętej buźki).</li>
            <li><strong>Windows:</strong> Naciśnij jednocześnie klawisze <kbd className="bg-surface-container-high px-1.5 py-0.5 rounded border border-outline-variant font-code-sm">Windows</kbd> + <kbd className="bg-surface-container-high px-1.5 py-0.5 rounded border border-outline-variant font-code-sm">.</kbd> (kropka).</li>
            <li><strong>Mac (Apple):</strong> Naciśnij jednocześnie klawisze <kbd className="bg-surface-container-high px-1.5 py-0.5 rounded border border-outline-variant font-code-sm">Cmd ⌘</kbd> + <kbd className="bg-surface-container-high px-1.5 py-0.5 rounded border border-outline-variant font-code-sm">Ctrl ⌃</kbd> + <kbd className="bg-surface-container-high px-1.5 py-0.5 rounded border border-outline-variant font-code-sm">Spacja</kbd>.</li>
          </ul>
        </section>

        <section className="bg-surface-container-low p-5 rounded-2xl border border-surface-container">
          <h2 className="text-[16px] font-bold text-primary mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
            Gdzie znikają usunięte produkty?
          </h2>
          <p className="text-[14px] text-on-surface-variant leading-relaxed">
            Dla wygody i uniknięcia irytujących powiadomień usunęliśmy okienka typu "Czy na pewno?". Zamiast tego wprowadziliśmy <strong>Zakładkę Kosz (Undo)</strong>.
            Gdy usuniesz produkt z listy aktywnej, natychmiast trafia on do Kosza. Możesz wejść do Kosza, by go przywrócić. Pamiętaj jednak, że to tzw. <em>"Kosz ulotny"</em> – czyści się automatycznie w momencie, gdy całkowicie opuścisz aplikację. Został stworzony wyłącznie do szybkiego ratowania omyłkowych kliknięć!
          </p>
        </section>

        <section className="bg-surface-container-low p-5 rounded-2xl border border-surface-container">
          <h2 className="text-[16px] font-bold text-primary mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">magic_button</span>
            Szablony i Inteligentne Podpowiedzi
          </h2>
          <p className="text-[14px] text-on-surface-variant leading-relaxed mb-3">
            Aplikacja została zaprojektowana po to, byś nie musiał przepisywać tego samego w nieskończoność:
          </p>
          <ul className="text-[13px] text-on-surface-variant space-y-2 list-disc pl-4">
            <li>Kiedy wpisujesz nowy produkt, system sam uczy się, do jakiej kategorii go zazwyczaj przypisujesz.</li>
            <li>Aby zaoszczędzić czas na długich listach, rozwiń <strong>Zarządzaj szablonami</strong> w górnym prawym menu (3 kropki). Stwórz tam gotowy pakiet (np. "Impreza" albo "Rosół"), by móc dodać 20 produktów do swojej listy za pomocą zaledwie jednego tapnięcia w ekran!</li>
          </ul>
        </section>

        <section className="bg-surface-container-low p-5 rounded-2xl border border-surface-container">
          <h2 className="text-[16px] font-bold text-primary mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">edit_note</span>
            Szybka edycja i dodawanie ilości
          </h2>
          <p className="text-[14px] text-on-surface-variant leading-relaxed">
            Chcesz dopisać, że chodzi Ci o "2 litry" Mleka, które jest już na liście? <strong>Nie musisz go usuwać!</strong> Kliknij po prostu na napis "Mleko" na liście – formularz na dole samoistnie się wypełni jego danymi, a przycisk "Dodaj" zamieni się na "Zapisz". Wpisz Ilość i zaktualizuj produkt w mgnieniu oka.
          </p>
        </section>

      </main>
    </div>
  )
}
