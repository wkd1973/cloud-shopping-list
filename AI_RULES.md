# Reguły współpracy z AI (AI Workflow Rules)

Ten plik zawiera instrukcje i zasady postępowania dla asystentów AI pracujących nad tym projektem.

## 1. Weryfikacja po zmianach (Automated Build Check)
**Zawsze** po wprowadzeniu jakichkolwiek modyfikacji w plikach źródłowych (np. `.tsx`, `.ts`, `.css`), asystent AI ma obowiązek:
1. Uruchomić komendę `npm run build` w tle (używając np. narzędzia `run_command` i wysyłając zadanie do tła).
2. Poczekać na wynik kompilacji przed ostatecznym zatwierdzeniem zmian i zakończeniem zadania.
3. W przypadku wystąpienia błędów kompilacji (np. błędy TypeScript, linting), automatycznie przeanalizować logi błędu, nanieść poprawki i ponownie uruchomić proces weryfikacji.

Cel: Zapewnienie, że repozytorium przez cały czas pozostaje w stanie pozwalającym na bezbłędne wdrożenie na środowisko produkcyjne (zawsze `green build`).
