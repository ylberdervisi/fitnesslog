# fitnesslog — context for Claude in VS Code

@AGENTS.md

## What this project is

A personal treningslogg-app i React Native + Expo. Brukeren (Ylber Dervisi) trener selv, og bygger appen både for å bruke den daglig og som **portefølje-prosjekt** for å skifte karriere fra Magento-utvikling mot mobilutvikling.

GitHub: <https://github.com/ylberdervisi/fitnesslog>

## Bruker-kontekst

- **Ylber** har 7+ års erfaring som Magento-utvikler hos Aksell. PHP, MySQL, Docker, etc.
- **Helt ny til React/RN.** Lærer underveis. Tenker fortsatt i imperativ stil av og til.
- **Foretrekker norsk** i samtaler og kommentarer; engelsk i kode (variabler, commits).
- **Vil utføre selv.** Ikke spør om "permission" før hvert steg. Kjør tekniske oppgaver autonomt; han stopper hvis han er uenig.
- **Steg-for-steg.** Foretrekker små, fokuserte instruksjoner — ikke store enkeltvise dumps.
- **Han skriver den meningsfulle logikken.** Du gjør boilerplate, skjelett, og forklarer konsepter. Han skriver det som faktisk lærer ham noe.

## Pedagogisk modus

Cadence per feature:
1. **Konsept** (2–5 min) — forklar nytt React/RN-konsept, gjerne med Magento-parallell
2. **Skjelett** (du skriver) — fil-struktur, imports, TODO-kommentarer der han skal fylle inn
3. **Han fyller inn** — den faktiske logikken
4. **Review** — påpek *idiomer*, ikke bare feil. "I RN gjør vi gjerne X i stedet for Y, fordi…"
5. **Han skriver commit-meldingen selv** (Conventional Commits-stil: `feat:`, `fix:`, `refactor:`)

Når han står fast: **ikke gi fasiten**. Gi et hint som peker mot løsningen.

## Tech stack

- **Expo SDK 54** (NB: ikke nyere — App Store-Expo Go støtter kun til 54 per mai 2026)
- **react-native 0.81.5**, **TypeScript**
- **React Navigation** (bottom tabs)
- **expo-sqlite** med `SQLiteProvider` + `useSQLiteContext`-mønsteret
- **Ingen ekstra state-manager** (Redux/Zustand) — bare `useState`/`useEffect` så langt
- **Ingen backend** — alt lagres lokalt i SQLite

## Filstruktur

```
fitnesslog/
├── App.tsx                    # NavigationContainer + SQLiteProvider + Suspense
├── src/
│   ├── db.ts                  # migrateDb — schema migrations med PRAGMA user_version
│   ├── types.ts (eller .tsx)  # Exercise-type, delt mellom filer
│   ├── components/
│   │   └── ExerciseRow.tsx    # Én rad i øvelse-listen, med onDelete-callback
│   └── screens/
│       ├── ExercisesScreen.tsx    # Liste over øvelser, søk, legg til, slett
│       ├── LogWorkoutScreen.tsx   # Logg ny treningsøkt med flere sett
│       └── HistoryScreen.tsx      # TOM — neste feature å bygge
```

## Database-skjema (v2)

```sql
exercises (id TEXT PK, name TEXT, muscle_group TEXT)
workouts (id TEXT PK, created_at TEXT, notes TEXT)
workout_sets (
  id TEXT PK,
  workout_id REFERENCES workouts ON DELETE CASCADE,
  exercise_id REFERENCES exercises,    -- NO cascade (bevarer historikk)
  weight REAL, reps INTEGER, set_order INTEGER
)
```

Migrasjoner i `src/db.ts` er **idempotente** og **selvhelende** — sjekker både `user_version` og om tabellene faktisk finnes (en tidligere bug satte versjon uten å lage tabeller).

## Koding-konvensjoner

- **SQL: snake_case.** TS: camelCase. Map mellom dem i queries.
- **Database er sannheten, state er cache.** Etter INSERT/DELETE, kall `loadX()` for å re-laste.
- **`Pending*`-typer** for objekter som lever i state før de er skrevet til DB (se `PendingSet`).
- **Lokal `*DbRow`-type** når SQL-formatet skiller seg fra app-typen.
- **Custom `id` klient-side:** `Date.now().toString()` for nye rader. Unik nok for personlig bruk.
- **Norsk i UI**, engelsk i kode. Bruker er sluttbruker.
- **TypeScript strict** — fiks røde understreker, ikke ignorer.

## Hva som er gjort (status)

- ✅ GitHub-oppsett, SSH, separate identiteter (jobb vs personlig) via `includeIf` i `~/.gitconfig`
- ✅ Profil-README repo `ylberdervisi/ylberdervisi`
- ✅ Expo + TypeScript scaffold
- ✅ Bottom tab-navigasjon (3 skjermer)
- ✅ ExercisesScreen: list, søk (case-insensitive, derived state), legg til (modal), slett (long-press + Alert)
- ✅ ExerciseRow ekstrahert som egen komponent med onDelete-callback
- ✅ SQLite-persistens for øvelser
- ✅ LogWorkoutScreen: velg øvelse, logg sett (vekt × reps), lagre økt i transaksjon med workouts + workout_sets

## Hva som er neste

1. **HistoryScreen** — vis lagrede økter, drill ned i sett per økt. Bruker JOIN over workout_sets + exercises.
2. **Personlig rekord per øvelse** — `MAX(weight)` aggregering. Vis i ExercisesScreen eller egen seksjon.
3. **Rediger øvelse** — modal med forhåndsutfylte verdier.
4. **Edit/slett sett underveis** — tap på sett-raden i LogWorkoutScreen.
5. **CV-oppdatering** — først når appen har innhold som tåler å vises offentlig.

Avansert (senere):
- `expo-router` migrasjon hvis prosjektet vokser
- Supabase-sync hvis han vil bruke appen på flere enheter
- App Store publisering via EAS Build

## Kjente quirks / workarounds

- **Telefon LAN funker ikke** på hjemmenettverket hans (klient-isolasjon på ruteren). Han bruker **iPhone-hotspot** for `npx expo start` — Mac kobles til hotspot, da fungerer LAN-modus rett.
- **Xcode er delvis installert** — bare SDK, ikke iOS Simulator runtime. Han hopper over Simulator-bruk inntil videre.
- **Ngrok tunnel** har vært ustabil. Foretrekk LAN via hotspot fremfor `--tunnel`.
- **Expo Go App Store-versjon støtter SDK 54** per mai 2026. Hvis nyere SDK blir behov, må vi gå over til dev-client.

## Git-identitet

`~/.gitconfig` har `includeIf` for `~/dev/`-mappa. Alle commits her bruker:
```
Ylber Dervisi <285466441+ylberdervisi@users.noreply.github.com>
```
Andre mapper bruker jobb-identitet (Aksell). **Ikke endre global git-config.**

## Hvordan kjøre lokalt

```bash
cd ~/dev/fitnesslog
npx expo start --clear   # --clear hvis cache trolig stale
# trykk 'r' for reload, 'i' for iOS Simulator (krever Xcode runtime), 'w' for web
```

iPhone: skann QR med Camera-appen, åpne i Expo Go.
