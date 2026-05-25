# Database-skjema (v2)

Lokal SQLite-database via `expo-sqlite`. Schema-migrasjoner ligger i [src/db.ts](../src/db.ts) og kjøres automatisk ved oppstart via `SQLiteProvider`-ens `onInit`-prop.

## Oversikt

Tre tabeller:

- **`exercises`** — katalogen av øvelser man kan velge mellom
- **`workouts`** — én rad per treningsøkt
- **`workout_sets`** — hvert enkelt sett (kobler workout + exercise)

```
exercises  ◀── (FK, NO cascade) ── workout_sets ── (FK, CASCADE) ──▶ workouts
```

---

## Tabell: `exercises`

Katalogen over øvelser brukeren kan velge mellom. Seedes med 10 standardøvelser ved første oppstart. Brukeren kan legge til og slette egne.

| Kolonne        | Type    | Constraints              | Beskrivelse                                         |
|----------------|---------|--------------------------|-----------------------------------------------------|
| `id`           | TEXT    | PRIMARY KEY, NOT NULL    | Klient-generert ID. Seed bruker `'1'..'10'`, nye bruker `Date.now().toString()` |
| `name`         | TEXT    | NOT NULL                 | Visningsnavn, f.eks. `'Benkpress'`                  |
| `muscle_group` | TEXT    | NOT NULL                 | Muskelgruppe, f.eks. `'Bryst'`. Default `'Annet'` hvis ikke angitt |

### Eksempelrad
```
id: "2"
name: "Benkpress"
muscle_group: "Bryst"
```

### TypeScript-type
```ts
type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;  // ← camelCase i app, snake_case i DB
};
```

---

## Tabell: `workouts`

Én treningsøkt. Holder kun metadata om økten — selve settene ligger i `workout_sets`.

| Kolonne      | Type | Constraints              | Beskrivelse                                       |
|--------------|------|--------------------------|---------------------------------------------------|
| `id`         | TEXT | PRIMARY KEY, NOT NULL    | Klient-generert: `Date.now().toString()`          |
| `created_at` | TEXT | NOT NULL                 | ISO 8601-string fra `new Date().toISOString()`. f.eks. `'2026-05-23T18:45:00.000Z'` |
| `notes`      | TEXT | (nullable)               | Valgfri tekstnotat. Ikke brukt i UI ennå          |

### Eksempelrad
```
id: "1748112000000"
created_at: "2026-05-23T18:00:00.000Z"
notes: null
```

### TypeScript-type
```ts
type Workout = {
  id: string;
  createdAt: string;       // ISO-string
  setCount: number;        // aggregert, ikke en kolonne — fra COUNT() i query
  exerciseNames: string[]; // aggregert, ikke en kolonne — fra GROUP_CONCAT() i query
};
```

> ⚠️ `setCount` og `exerciseNames` er **ikke** kolonner i `workouts`. De beregnes i HistoryScreen sin query med JOIN + aggregat-funksjoner.

---

## Tabell: `workout_sets`

Hvert enkelt sett som ble logget i en økt. Kobler en `workout` med en `exercise`, og lagrer vekt + reps.

| Kolonne       | Type    | Constraints                                          | Beskrivelse                                     |
|---------------|---------|------------------------------------------------------|-------------------------------------------------|
| `id`          | TEXT    | PRIMARY KEY, NOT NULL                                | Klient-generert: `${workoutId}_${setIndex}`     |
| `workout_id`  | TEXT    | NOT NULL, FK → `workouts(id)` **ON DELETE CASCADE**  | Hvilken økt settet tilhører. Sletter du økten, slettes settene automatisk |
| `exercise_id` | TEXT    | NOT NULL, FK → `exercises(id)`                       | Hvilken øvelse. **Ingen cascade** — sletter du en øvelse, blir settene stående (historikk bevares) |
| `weight`      | REAL    | NOT NULL                                             | Vekt i kg. Tillater desimaler (f.eks. `80.5`)   |
| `reps`        | INTEGER | NOT NULL                                             | Antall reps                                     |
| `set_order`   | INTEGER | NOT NULL                                             | Rekkefølgen settet ble logget i (0-basert)      |

### Indekser
```sql
CREATE INDEX idx_workout_sets_workout  ON workout_sets(workout_id);
CREATE INDEX idx_workout_sets_exercise ON workout_sets(exercise_id);
```
Begge er FK-kolonner som brukes i JOINs — indekser gjør spørringer raske.

### Eksempelrader (én økt med tre sett benkpress)
```
id: "1748112000000_0"  workout_id: "1748112000000"  exercise_id: "2"  weight: 80.0  reps: 8  set_order: 0
id: "1748112000000_1"  workout_id: "1748112000000"  exercise_id: "2"  weight: 80.0  reps: 7  set_order: 1
id: "1748112000000_2"  workout_id: "1748112000000"  exercise_id: "2"  weight: 80.0  reps: 6  set_order: 2
```

### TypeScript-type
```ts
type WorkoutSet = {
  id: string;
  workoutId: string;
  exerciseName: string;  // ← hentes via JOIN, ikke en kolonne
  weight: number;
  reps: number;
  setOrder: number;
};

// I logikken under lagring brukes PendingSet før det skrives til DB:
type PendingSet = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
};
```

---

## Relasjoner

### `workouts` → `workout_sets` (1:N, CASCADE)
Én økt har mange sett. Sletter du en økt, slettes alle dens sett automatisk takket være `ON DELETE CASCADE`. Du trenger ikke å rydde manuelt.

### `exercises` → `workout_sets` (1:N, NO cascade)
Én øvelse kan brukes i mange sett på tvers av økter. **Ingen cascade** — sletter du f.eks. "Pull-ups" fra øvelseslisten, blir historiske sett som refererte til den stående. `exercise_id` peker på en rad som ikke lenger finnes, så JOIN-en med `exercises` vil ikke returnere navn for de settene. Dette er bevisst — historikken skal ikke endre seg fordi en øvelse fjernes.

> Hvis du noen gang vil "vaske bort" foreldreløse sett, kan du kjøre:
> ```sql
> DELETE FROM workout_sets WHERE exercise_id NOT IN (SELECT id FROM exercises);
> ```

---

## Konvensjoner

- **SQL: snake_case.** TS: camelCase. Map mellom dem i queries (`r.created_at → createdAt`)
- **`*DbRow`-typer** lokalt i screen-filer når SQL-formatet skiller seg fra app-typen
- **`Pending*`-typer** for objekter som lever i state før de er skrevet til DB (se `PendingSet` i LogWorkoutScreen)
- **Database er sannheten, state er cache.** Etter INSERT/DELETE, kall `loadX()` for å re-laste
- **Klient-genererte IDer:** `Date.now().toString()` for nye rader. Unikt nok for personlig bruk

---

## Vanlige queries (referanse)

### Hent alle øvelser
```sql
SELECT id, name, muscle_group FROM exercises ORDER BY name;
```

### Hent alle økter med antall sett + øvelsesnavn (HistoryScreen)
```sql
SELECT 
  w.id,
  w.created_at,
  COUNT(ws.id) AS set_count,
  GROUP_CONCAT(DISTINCT e.name) AS exercise_names
FROM workouts w
LEFT JOIN workout_sets ws ON ws.workout_id = w.id
LEFT JOIN exercises e ON e.id = ws.exercise_id
GROUP BY w.id
ORDER BY w.created_at DESC;
```

### Hent alle sett for en spesifikk økt
```sql
SELECT 
  ws.id, ws.weight, ws.reps, ws.set_order,
  e.name AS exercise_name
FROM workout_sets ws
JOIN exercises e ON e.id = ws.exercise_id
WHERE ws.workout_id = ?
ORDER BY ws.set_order;
```

### Hent siste sett for én øvelse (til "forrige gang"-feature)
```sql
SELECT 
  ws.weight, ws.reps, ws.set_order, w.created_at
FROM workout_sets ws
JOIN workouts w ON w.id = ws.workout_id
WHERE ws.exercise_id = ?
ORDER BY w.created_at DESC
LIMIT 10;  -- juster etter behov
```

### Personlig rekord (PR) per øvelse
```sql
SELECT 
  e.name,
  MAX(ws.weight) AS pr_weight
FROM workout_sets ws
JOIN exercises e ON e.id = ws.exercise_id
GROUP BY ws.exercise_id;
```

---

## Inspisere databasen ad-hoc

Legg dette midlertidig inn i en skjerm for å logge til terminalen:

```ts
console.log('exercises:', await db.getAllAsync('SELECT * FROM exercises'));
console.log('workouts:', await db.getAllAsync('SELECT * FROM workouts'));
console.log('sets:', await db.getAllAsync('SELECT * FROM workout_sets'));
```

Eller sjekk skjema-metadata direkte fra SQLite:
```ts
await db.getAllAsync(`SELECT name FROM sqlite_master WHERE type='table'`);
await db.getAllAsync('PRAGMA table_info(workouts)');
```
