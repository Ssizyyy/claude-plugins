export const dataDir: string
export const picksFile: string
export const rankingFile: string
export function readJson<T>(p: string, fallback: T): T
export function writeData(file: string, value: unknown, force?: boolean): void
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
export const ROLE_MAP: Record<string, string>
export function readPicks(): { picks: Record<string, any> }
export function readRanking(): any[]
