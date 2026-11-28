// Faz 127 - Belge Düzeyinde Tutarlılık Kontrolü ve Çapraz Referans Doğrulama Motoru
// Deterministik doğrulama motoru: belge<->varlık çapraz referans, yetim varlık tespiti,
// yinelenen UUID, geçersiz çapraz referans raporlaması.
//
// Bu modül saf (pure) fonksiyonlardan oluşur; hiçbir yan etkisi yoktur ve
// girdi dizileri mutasyona uğratılmaz. Tüm fonksiyonlar deterministiktir.

export type ConsistencyEntityType =
  | "character"
  | "location"
  | "item"
  | "faction"
  | "event"
  | "note"
  | "unknown";

export interface ConsistencyEntity {
  id: string;
  uuid: string;
  name: string;
  type: ConsistencyEntityType;
}

export interface ConsistencyDocument {
  id: string;
  uuid: string;
  title: string;
  content: string;
}

export type ConsistencyIssueKind =
  | "duplicate-uuid"
  | "orphan-entity"
  | "broken-reference";

export interface DuplicateUuidIssue {
  kind: "duplicate-uuid";
  uuid: string;
  entityIds: string[];
}

export interface OrphanEntityIssue {
  kind: "orphan-entity";
  entityId: string;
  uuid: string;
  name: string;
}

export interface BrokenReferenceIssue {
  kind: "broken-reference";
  documentId: string;
  documentUuid: string;
  missingUuid: string;
}

export type ConsistencyIssue =
  | DuplicateUuidIssue
  | OrphanEntityIssue
  | BrokenReferenceIssue;

export interface ConsistencySummary {
  duplicateUuid: number;
  orphanEntity: number;
  brokenReference: number;
  total: number;
}

export interface ConsistencyReport {
  issues: ConsistencyIssue[];
  summary: ConsistencySummary;
  ok: boolean;
}

// [[uuid]] biçimindeki çapraz referans etiketlerini yakalar.
const WIKILINK_UUID_REGEX =
  /\[\[\s*([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\s*\]\]/g;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function normalizeUuid(uuid: unknown): string | null {
  if (!isNonEmptyString(uuid)) return null;
  return uuid.trim().toLowerCase();
}

function extractReferencedUuids(content: string): string[] {
  if (!isNonEmptyString(content)) return [];
  const found: string[] = [];
  WIKILINK_UUID_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = WIKILINK_UUID_REGEX.exec(content)) !== null) {
    found.push(match[1].toLowerCase());
  }
  return found;
}

// ---------------------------------------------------------------------------
// 1. Yinelenen UUID tespiti
// ---------------------------------------------------------------------------

export function findDuplicateUuids(
  entities: ConsistencyEntity[]
): DuplicateUuidIssue[] {
  if (!Array.isArray(entities) || entities.length === 0) return [];

  const byUuid = new Map<string, string[]>();
  for (const entity of entities) {
    const uuid = normalizeUuid(entity?.uuid);
    if (!uuid) continue;
    const bucket = byUuid.get(uuid);
    if (bucket) {
      bucket.push(entity.id);
    } else {
      byUuid.set(uuid, [entity.id]);
    }
  }

  const duplicates: DuplicateUuidIssue[] = [];
  for (const [uuid, entityIds] of byUuid.entries()) {
    if (entityIds.length > 1) {
      duplicates.push({
        kind: "duplicate-uuid",
        uuid,
        entityIds: [...entityIds].sort(),
      });
    }
  }
  return duplicates;
}

// ---------------------------------------------------------------------------
// 2. Yetim varlık tespiti (hiçbir belgede [[uuid]] olarak geçmeyen varlık)
// ---------------------------------------------------------------------------

export function findOrphanEntities(
  entities: ConsistencyEntity[],
  documents: ConsistencyDocument[]
): OrphanEntityIssue[] {
  if (!Array.isArray(entities) || entities.length === 0) return [];
  const docs = Array.isArray(documents) ? documents : [];

  const referenced = new Set<string>();
  for (const doc of docs) {
    for (const uuid of extractReferencedUuids(doc?.content ?? "")) {
      referenced.add(uuid);
    }
  }

  const orphans: OrphanEntityIssue[] = [];
  for (const entity of entities) {
    const uuid = normalizeUuid(entity?.uuid);
    if (!uuid) continue;
    if (!referenced.has(uuid)) {
      orphans.push({
        kind: "orphan-entity",
        entityId: entity.id,
        uuid,
        name: entity.name,
      });
    }
  }
  return orphans;
}

// ---------------------------------------------------------------------------
// 3. Bozuk çapraz referans tespiti (var olmayan varlığa işaret eden [[uuid]])
// ---------------------------------------------------------------------------

export function findBrokenCrossReferences(
  entities: ConsistencyEntity[],
  documents: ConsistencyDocument[]
): BrokenReferenceIssue[] {
  const docs = Array.isArray(documents) ? documents : [];
  if (docs.length === 0) return [];

  const knownUuids = new Set<string>();
  if (Array.isArray(entities)) {
    for (const entity of entities) {
      const uuid = normalizeUuid(entity?.uuid);
      if (uuid) knownUuids.add(uuid);
    }
  }

  const broken: BrokenReferenceIssue[] = [];
  for (const doc of docs) {
    const refs = extractReferencedUuids(doc?.content ?? "");
    const seen = new Set<string>();
    for (const uuid of refs) {
      if (seen.has(uuid)) continue;
      seen.add(uuid);
      if (!knownUuids.has(uuid)) {
        broken.push({
          kind: "broken-reference",
          documentId: doc.id,
          documentUuid: doc.uuid,
          missingUuid: uuid,
        });
      }
    }
  }
  return broken;
}

// ---------------------------------------------------------------------------
// 4. Toplu rapor
// ---------------------------------------------------------------------------

export function checkConsistency(
  entities: ConsistencyEntity[],
  documents: ConsistencyDocument[]
): ConsistencyReport {
  const duplicates = findDuplicateUuids(entities);
  const orphans = findOrphanEntities(entities, documents);
  const broken = findBrokenCrossReferences(entities, documents);

  const issues: ConsistencyIssue[] = [...duplicates, ...orphans, ...broken];

  const summary: ConsistencySummary = {
    duplicateUuid: duplicates.length,
    orphanEntity: orphans.length,
    brokenReference: broken.length,
    total: issues.length,
  };

  return {
    issues,
    summary,
    ok: issues.length === 0,
  };
}
