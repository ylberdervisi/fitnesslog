import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Kjøres første gang appen åpnes (og ved senere skjemaendringer).
 * SQLiteProvider kaller denne automatisk via onInit-propen.
 *
 * Mønsteret er en enkel "migration" — vi lagrer en versjon i PRAGMA,
 * og legger til nye steg etter hvert som skjemaet utvikler seg.
 */
export async function migrateDb(db: SQLiteDatabase) {
  // Slå på foreign key enforcement. SQLite har dette AV som default,
  // og innstillingen er per connection — må kjøres hver gang DB åpnes.
  // Uten dette virker ikke ON DELETE CASCADE på workout_sets.
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const DATABASE_VERSION = 2;

  const result = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  let currentVersion = result?.user_version ?? 0;


  // Selv hvis versjonen er oppdatert, sjekk at v2-tabellene faktisk finnes.
  // (Hvis en tidligere migrasjon feilet stille, kan versjonen være bumpet uten at
  // tabellene ble opprettet.)
  if (currentVersion >= DATABASE_VERSION) {
    const workoutsTable = await db.getFirstAsync<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='workouts'`
    );
    if (workoutsTable) {
      return;
    }
    currentVersion = 1; // tving v1→v2 migrasjonen
  }

  if (currentVersion === 0) {
    // Første gang appen åpnes på enheten.
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE exercises (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        muscle_group TEXT NOT NULL
      );
    `);

    // Seed med standard øvelser.
    const seed: Array<[string, string, string]> = [
      ['1', 'Knebøy', 'Bein'],
      ['2', 'Benkpress', 'Bryst'],
      ['3', 'Markløft', 'Rygg'],
      ['4', 'Skulderpress', 'Skulder'],
      ['5', 'Pull-ups', 'Rygg'],
      ['6', 'Bicep curl', 'Armer'],
      ['7', 'Tricep dips', 'Armer'],
      ['8', 'Utfall', 'Bein'],
      ['9', 'Rows', 'Rygg'],
      ['10', 'Planke', 'Kjerne'],
    ];

    for (const [id, name, muscleGroup] of seed) {
      await db.runAsync(
        'INSERT INTO exercises (id, name, muscle_group) VALUES (?, ?, ?)',
        [id, name, muscleGroup]
      );
    }

    currentVersion = 1;
  }

  if (currentVersion === 1) {
    // Legg til tabeller for treningsøkter og sett.
    await db.execAsync(`
      CREATE TABLE workouts (
        id TEXT PRIMARY KEY NOT NULL,
        created_at TEXT NOT NULL,
        notes TEXT
      );
      CREATE TABLE workout_sets (
        id TEXT PRIMARY KEY NOT NULL,
        workout_id TEXT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
        exercise_id TEXT NOT NULL REFERENCES exercises(id),
        weight REAL NOT NULL,
        reps INTEGER NOT NULL,
        set_order INTEGER NOT NULL
      );
      CREATE INDEX idx_workout_sets_workout ON workout_sets(workout_id);
      CREATE INDEX idx_workout_sets_exercise ON workout_sets(exercise_id);
    `);
    currentVersion = 2;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
