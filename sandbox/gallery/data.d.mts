export const dataDir: string
export const picksFile: string
export const rankingFile: string
export function readJson<T>(p: string, fallback: T): T
export function writeData(file: string, value: unknown): void
export function backupCount(): number
export interface MigrationStep {
  from: string
  imported: number
  newer: number
  kept: number
  hadShared: boolean
}
export function migrate(): { picks?: MigrationStep; ranking?: MigrationStep }
export function lastMigration(): { picks?: MigrationStep; ranking?: MigrationStep }
