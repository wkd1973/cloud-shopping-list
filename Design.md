# Dokumentacja Projektowa - Cloud Shopping List (Design.md)

Ten dokument opisuje strukturę widoków (stron), używane komponenty oraz główny system projektowy (Design System) wykorzystywany w aplikacji "Zakupy".

## 1. System Projektowy i Estetyka (Design System)

Aplikacja opiera się na **Tailwind CSS** i celuje w czysty, nowoczesny i przyjazny dla użytkownika interfejs typu Mobile-First.

### Kolorystyka
- **Główny motyw (Primary):** Szmaragdowy (Emerald).
  - Tła akcentujące: `bg-emerald-500`, `bg-emerald-600` (np. główne przyciski zapisu/logowania).
  - Tła pomocnicze: `bg-emerald-50`, `bg-emerald-100` (dla podświetleń, aktywnych przycisków kategorii).
  - Obramowania i focus: `ring-emerald-100`, `border-emerald-400`.
- **Tła i neutralne (Grays):**
  - Główne tło aplikacji: jasnoszare `bg-gray-50`.
  - Karty i modale: `bg-white` z subtelnymi ramkami `border-gray-200`.
  - Typografia: `text-gray-800` (nagłówki, główny tekst), `text-gray-500` / `text-gray-400` (drobne teksty, notatki, puste stany).
- **Kolory Kategorii:** Wykorzystywane do wyróżnienia typów produktów (np. Niebieski dla nabiału, Zielony dla warzyw, Czerwony dla mięsa).

### Typografia
- Wykorzystane czcionki bazowe (skonfigurowane w `globals.css`): **DM Sans** (dla tekstów czytanych) oraz **DM Mono** (kod/tokeny).
- Styl jest minimalistyczny – polega na klasach tekstowych Tailwind: `text-sm`, `text-xs`, przy wykorzystaniu `font-semibold` dla nagłówków i `font-medium` dla ważnych akcentów.

### Kształty i cienie
- Bardzo miękkie, duże zaokrąglenia rogów, charakterystyczne dla nowoczesnych aplikacji mobilnych (tzw. "squircle"): `rounded-xl`, `rounded-2xl`.
- Cienie używane oszczędnie (`shadow-sm` dla kart list, `shadow-xl` dla pełnych okien modalnych).

### Interakcje i Animacje
- **Dotyk/Kliknięcie:** Każdy przycisk reaguje zmniejszeniem (`active:scale-95` lub `active:scale-[0.98]`) oraz płynnym przejściem kolorów (`transition-all`).
- **Animacje CSS (z globals.css):** 
  - `fadeSlideIn` (`.item-new`) – subtelny wjazd nowo dodanych produktów od góry.
  - `shake` – animacja błędu formularza (trzęsienie).

### Ikonografia
- Aplikacja w głównej mierze rezygnuje z bibliotek ikon rastrowych na rzecz wbudowanych **Emoji** (np. 🛒, 🏠, 🥦, 🥛). Nadaje to interfejsowi bardzo lekkiego, wręcz "konsumenckiego" charakteru.
- Małe ikony nawigacyjne (hamburger menu, krzyżyk, strzałka w tył) bazują na prostych grafikach SVG w kodzie (Heroicons-style).

---

## 2. Architektura Widoków (Strony)

Aplikacja zbudowana jest z czterech głównych widoków dostępnych dla użytkownika.

### A. Ekran Logowania (`/auth/login`)
- **Cel:** Bezhasłowe logowanie (Magic Link).
- **Layout:** Wyśrodkowana, wąska karta (max-w-sm) na jasnoszarym tle.
- **Zawartość:**
  - Duża ikona wózka 🛒 na zielonym tle, tytuł "Zakupy" i podtytuł.
  - Formularz wejściowy (`LoginForm.tsx`): pole na adres e-mail i duży zielony przycisk "Wyślij link logowania".
  - Obsługuje stany wysyłania (ładowanie, sukces ze zmianą ikony na 📬 "Sprawdź skrzynkę", błąd).

### B. Panel Główny - Ekran List Zakupów (`/list`)
- **Cel:** Przegląd wszystkich list przypisanych do wybranego gospodarstwa (domu).
- **Komponenty i Layout (`ListsScreen.tsx`):**
  - **Header (nagłówek):** Przyklejony (sticky) do góry. Zawiera nazwę gospodarstwa. Jeżeli użytkownik ma więcej gospodarstw, nazwa zamienia się w rozwijaną listę (Select / Dropdown). Obok znajduje się przycisk profilu/wylogowania oraz dla adminów - przycisk "Zaproś".
  - **Siatka list (Grid):** Podział na kafelki z 2 kolumnami na mobile i 3 na większych ekranach. Każdy kafelek to biały kwadrat z zaokrągleniami, ikoną Emoji, nazwą i liczbą produktów.
  - **Karta "Nowa Lista":** Kafelek z przerywaną ramką wywołujący proces tworzenia nowej listy.
- **Modale w ramach tego widoku:**
  - **`OnboardingModal.tsx`:** Pojawia się natychmiast na pełnym ekranie, jeśli użytkownik zalogował się po raz pierwszy i nie należy do żadnego domu. Wymusza podanie nazwy gospodarstwa.
  - **Modal Nowej Listy:** Pozwala wpisać nazwę i wybrać Emoji dla listy (spośród predefiniowanej palety emoji).
  - **`InviteModal.tsx`:** Okienko generujące i pozwalające skopiować unikalny link zaproszenia do gospodarstwa domowego.

### C. Ekran Konkretnej Listy (`/list/[listId]`)
- **Cel:** Przegląd, odznaczanie i dodawanie produktów.
- **Komponenty i Layout (`ShoppingList.tsx`):**
  - **Header (nagłówek):** Przycisk wstecz, Emoji listy + Tytuł, podtytuł z informacją ile produktów zostało do kupienia. Posiada też menu (trzy kropki) np. do powiadomień Push.
  - **Pasek Filtrów (`CategoryFilter.tsx`):** Przewijany w poziomie pasek z ikonami kategorii (pigułki z Emoji i nazwą). Aktywna kategoria jest podświetlona. Służy do filtrowania produktów.
  - **Lista Produktów:**
    - Renderowana przez zbiór `ItemRow.tsx`.
    - Pozycje pogrupowane są na elementy do kupienia (u góry) i już kupione (przekreślone na dole, wyszarzone).
    - Każdy rząd to kółko do zaznaczania (z kolorową obwódką zależną od kategorii) oraz nazwa produktu z notatką.
  - **Pasek dodawania (`AddItemForm.tsx`):** Przyklejony na stałe do samego dołu ekranu obszar roboczy.
    - Zawiera input tekstowy reagujący na wpisywanie **pływającą listą (dropdown) podpowiedzi**. Pula podpowiedzi jest dynamicznie generowana poprzez połączenie historycznych zakupów (z serwera) i bieżących przedmiotów na liście (wspiera natychmiastowe podpowiadanie nowo dodanych rzeczy).
    - Zapobiega dodawaniu duplikatów – jeśli dodasz produkt będący na liście, operacja zostanie zignorowana, a istniejący wiersz wyróżni się **krótką animacją pulsowania (migotania)** i zmianą tła.
    - W przypadku duplikatów aplikacja automatycznie przeskroluje ekran do wybranego produktu, a jeśli produkt ten znajduje się w zwiniętej sekcji kupionych – najpierw ją automatycznie rozwinie.
    - Po rozwinięciu formularza ujawnia wybór kategorii (kolorowe pigułki) i opcjonalne pole na ilość (np. 2kg).

### D. Ekran Akceptacji Zaproszenia (`/invite/[token]`)
- **Cel:** Logika procesowania wejścia przez zlinkowany token.
- **Layout:** W większości "niewidzialny" ekran, który wykonuje weryfikację i przekierowuje do `/list`.
- **Przypadki błędne (`InviteError.tsx`):** Jeśli link wygasł lub był już użyty, pojawia się wycentrowany komunikat z czerwoną ikoną ostrzeżenia i przyciskiem powrotu.
