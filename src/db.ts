import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Kjøres første gang appen åpnes (og ved senere skjemaendringer).
 * SQLiteProvider kaller denne automatisk via onInit-propen.
 *
 * Mønsteret er en enkel "migration" — vi lagrer en versjon i PRAGMA,
 * og legger til nye steg etter hvert som skjemaet utvikler seg.
 */
export async function migrateDb(db: SQLiteDatabase) {
  const DATABASE_VERSION = 1;

  const result = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  let currentVersion = result?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
    return; // skjemaet er allerede oppdatert
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

  // Når vi senere legger til nye tabeller (workouts, sets osv.) gjør vi:
  //
  // if (currentVersion === 1) {
  //   await db.execAsync(`CREATE TABLE workouts (...);`);
  //   currentVersion = 2;
  // }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
