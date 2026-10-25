# Wspólna Mapa

Mała aplikacja webowa do dobrowolnego udostępniania lokalizacji dwóch osób na wspólnej mapie.

## Wymagania
- Node.js 18 lub nowszy
- Internet do pobrania zależności i kafelków mapy

## Uruchomienie lokalne
1. Zainstaluj Node.js z https://nodejs.org/
2. Rozpakuj projekt.
3. Otwórz terminal w folderze projektu.
4. Uruchom `npm install`
5. Uruchom `npm start`
6. Otwórz http://localhost:3000

Lokalne uruchomienie pozwala przetestować aplikację na tym samym komputerze. Aby zaprosić kolegę z innego urządzenia, aplikacja musi być wdrożona na serwerze dostępnym z internetu z HTTPS. Wtedy skopiuj link zaproszenia z aplikacji i wyślij go koledze.

## Jak korzystać
1. Wpisz nazwę i kliknij „Utwórz pokój”.
2. Kliknij „Kopiuj” i wyślij link drugiej osobie.
3. Kolega otwiera link, wpisuje nazwę i klika „Dołącz”.
4. Każda osoba osobno klika „Włącz moje udostępnianie” i zezwala przeglądarce na GPS.
5. Każda osoba może zatrzymać udostępnianie przyciskiem.

## Ważne ograniczenia i prywatność
- Nick Discorda sam w sobie nie ujawnia GPS; ten projekt nie łączy się z Discordem.
- Aplikacja nie omija uprawnień telefonu ani przeglądarki.
- Lokalizacje są przechowywane tylko w pamięci serwera; pozycje nie są zapisywane do bazy ani plików. Po restarcie serwera pokoje znikają.
- Wersja demonstracyjna nie ma kont, silnego uwierzytelniania ani trwałego przechowywania. Udostępniaj link tylko zaufanej osobie; nie używaj do wrażliwych sytuacji bez dodatkowych zabezpieczeń.
- Przeglądarka zwykle wymaga HTTPS, aby udostępniać GPS poza `localhost`.
- Linki Leaflet i OpenStreetMap wymagają połączenia z internetem.

## Udostępnienie koledze z innej miejscowości (wdrożenie online)
`localhost` działa wyłącznie na Twoim urządzeniu. Aby kolega z Bielska Podlaskiego mógł wejść, aplikacja musi być publicznie wdrożona.

Najprostsza ścieżka:
1. Załóż konto na https://render.com/ i zaloguj się.
2. Umieść folder projektu w repozytorium GitHub.
3. W Render utwórz nową usługę Web Service i połącz repozytorium.
4. Ustaw Build Command: `npm install`, Start Command: `npm start`.
5. Render udostępni adres HTTPS w rodzaju `https://nazwa-uslugi.onrender.com`.
6. Otwórz ten adres, utwórz pokój i wyślij koledze link zaproszenia z aplikacji.

Dołączony `render.yaml` zawiera przykładową konfigurację wdrożenia. Darmowe usługi hostingowe mogą usypiać się po bezczynności. Link zaproszenia musi korzystać z publicznego adresu HTTPS, a nie `localhost`. Ta wersja jest demonstracyjna, bez kont i silnego uwierzytelniania; pokoje i pozycje znikają po restarcie serwera.
