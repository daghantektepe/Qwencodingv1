import { describe, it, expect } from "vitest";
import {
  checkConsistency,
  findDuplicateUuids,
  findOrphanEntities,
  findBrokenCrossReferences,
  type ConsistencyEntity,
  type ConsistencyDocument,
  type ConsistencyIssue,
} from "../src/services/consistency-checker";

// ---------------------------------------------------------------------------
// Yardımcı fabrikalar
// ---------------------------------------------------------------------------

function makeEntity(
  overrides: Partial<ConsistencyEntity> = {}
): ConsistencyEntity {
  return {
    id: overrides.id ?? "entity-1",
    uuid: overrides.uuid ?? "11111111-1111-4111-8111-111111111111",
    name: overrides.name ?? "Entity",
    type: overrides.type ?? "character",
    ...overrides,
  };
}

function makeDocument(
  overrides: Partial<ConsistencyDocument> = {}
): ConsistencyDocument {
  return {
    id: overrides.id ?? "doc-1",
    uuid: overrides.uuid ?? "22222222-2222-4222-8222-222222222222",
    title: overrides.title ?? "Document",
    content: overrides.content ?? "",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 1. Yinelenen UUID tespiti
// ---------------------------------------------------------------------------

describe("consistency-checker / findDuplicateUuids", () => {
  it("aynı uuid'ye sahip iki varlığı yinelenen olarak raporlar", () => {
    const sharedUuid = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const entities: ConsistencyEntity[] = [
      makeEntity({ id: "e1", uuid: sharedUuid, name: "Alice" }),
      makeEntity({ id: "e2", uuid: sharedUuid, name: "Alice Clone" }),
      makeEntity({
        id: "e3",
        uuid: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        name: "Bob",
      }),
    ];

    const duplicates = findDuplicateUuids(entities);

    expect(duplicates).toBeDefined();
    expect(Array.isArray(duplicates)).toBe(true);
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].uuid).toBe(sharedUuid);
    expect(duplicates[0].entityIds.sort()).toEqual(["e1", "e2"]);
  });

  it("benzersiz uuid'lerde yinelenen döndürmez", () => {
    const entities: ConsistencyEntity[] = [
      makeEntity({ id: "e1", uuid: "11111111-1111-4111-8111-111111111111" }),
      makeEntity({ id: "e2", uuid: "22222222-2222-4222-8222-222222222222" }),
      makeEntity({ id: "e3", uuid: "33333333-3333-4333-8333-333333333333" }),
    ];

    const duplicates = findDuplicateUuids(entities);
    expect(duplicates).toEqual([]);
  });

  it("boş liste için boş dizi döndürür", () => {
    expect(findDuplicateUuids([])).toEqual([]);
  });

  it("üç aynı uuid'yi tek bir grupta toplar", () => {
    const shared = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
    const entities: ConsistencyEntity[] = [
      makeEntity({ id: "e1", uuid: shared }),
      makeEntity({ id: "e2", uuid: shared }),
      makeEntity({ id: "e3", uuid: shared }),
    ];

    const duplicates = findDuplicateUuids(entities);
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].entityIds.sort()).toEqual(["e1", "e2", "e3"]);
  });

  it("uuid tanımsız varlıkları yinelenen saymaz", () => {
    const entities: ConsistencyEntity[] = [
      makeEntity({ id: "e1", uuid: undefined as unknown as string }),
      makeEntity({ id: "e2", uuid: undefined as unknown as string }),
    ];
    expect(findDuplicateUuids(entities)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 2. Yetim karakter tespiti
// ---------------------------------------------------------------------------

describe("consistency-checker / findOrphanEntities", () => {
  it("hiçbir belgede geçmeyen karakteri yetim olarak raporlar", () => {
    const entities: ConsistencyEntity[] = [
      makeEntity({
        id: "e1",
        uuid: "11111111-1111-4111-8111-111111111111",
        name: "Alice",
      }),
      makeEntity({
        id: "e2",
        uuid: "22222222-2222-4222-8222-222222222222",
        name: "Ghost",
      }),
    ];
    const documents: ConsistencyDocument[] = [
      makeDocument({
        id: "d1",
        content:
          "Alice burada konuşuyor. [[11111111-1111-4111-8111-111111111111]]",
      }),
    ];

    const orphans = findOrphanEntities(entities, documents);

    expect(orphans).toHaveLength(1);
    expect(orphans[0].entityId).toBe("e2");
    expect(orphans[0].name).toBe("Ghost");
  });

  it("tüm varlıklar referans veriliyorsa yetim döndürmez", () => {
    const entities: ConsistencyEntity[] = [
      makeEntity({
        id: "e1",
        uuid: "11111111-1111-4111-8111-111111111111",
        name: "Alice",
      }),
      makeEntity({
        id: "e2",
        uuid: "22222222-2222-4222-8222-222222222222",
        name: "Bob",
      }),
    ];
    const documents: ConsistencyDocument[] = [
      makeDocument({
        id: "d1",
        content: "[[11111111-1111-4111-8111-111111111111]]",
      }),
      makeDocument({
        id: "d2",
        content: "[[22222222-2222-4222-8222-222222222222]]",
      }),
    ];

    const orphans = findOrphanEntities(entities, documents);
    expect(orphans).toEqual([]);
  });

  it("düz isim geçişini yetim saymaz (uuid referansı esas alınır)", () => {
    const entities: ConsistencyEntity[] = [
      makeEntity({
        id: "e1",
        uuid: "11111111-1111-4111-8111-111111111111",
        name: "Alice",
      }),
    ];
    const documents: ConsistencyDocument[] = [
      makeDocument({
        id: "d1",
        content: "Alice bir cümlede geçiyor ama etiketli değil.",
      }),
    ];
    const orphans = findOrphanEntities(entities, documents);
    expect(orphans).toHaveLength(1);
  });

  it("hiç belge yoksa tüm varlıkları yetim olarak döndürür", () => {
    const entities: ConsistencyEntity[] = [
      makeEntity({ id: "e1", uuid: "11111111-1111-4111-8111-111111111111" }),
      makeEntity({ id: "e2", uuid: "22222222-2222-4222-8222-222222222222" }),
    ];
    const orphans = findOrphanEntities(entities, []);
    expect(orphans).toHaveLength(2);
  });

  it("boş varlık listesinde boş dizi döndürür", () => {
    expect(findOrphanEntities([], [makeDocument()])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 3. Bozuk çapraz referans tespiti
// ---------------------------------------------------------------------------

describe("consistency-checker / findBrokenCrossReferences", () => {
  it("var olmayan uuid'ye işaret eden belge bağlantısını bozuk olarak raporlar", () => {
    const entities: ConsistencyEntity[] = [
      makeEntity({
        id: "e1",
        uuid: "11111111-1111-4111-8111-111111111111",
        name: "Alice",
      }),
    ];
    const missing = "99999999-9999-4999-8999-999999999999";
    const documents: ConsistencyDocument[] = [
      makeDocument({
        id: "d1",
        uuid: "22222222-2222-4222-8222-222222222222",
        content: `[[${missing}]] ve [[11111111-1111-4111-8111-111111111111]]`,
      }),
    ];

    const broken = findBrokenCrossReferences(entities, documents);

    expect(broken).toHaveLength(1);
    expect(broken[0].missingUuid).toBe(missing);
    expect(broken[0].documentId).toBe("d1");
  });

  it("tüm bağlantılar geçerliyse bozuk döndürmez", () => {
    const entities: ConsistencyEntity[] = [
      makeEntity({ id: "e1", uuid: "11111111-1111-4111-8111-111111111111" }),
    ];
    const documents: ConsistencyDocument[] = [
      makeDocument({
        id: "d1",
        content: "[[11111111-1111-4111-8111-111111111111]]",
      }),
    ];

    const broken = findBrokenCrossReferences(entities, documents);
    expect(broken).toEqual([]);
  });

  it("aynı eksik referansı birden fazla belgede ayrı ayrı raporlar", () => {
    const missing = "99999999-9999-4999-8999-999999999999";
    const documents: ConsistencyDocument[] = [
      makeDocument({ id: "d1", content: `[[${missing}]]` }),
      makeDocument({ id: "d2", content: `[[${missing}]]` }),
    ];

    const broken = findBrokenCrossReferences([], documents);
    expect(broken).toHaveLength(2);
    expect(broken.map((b) => b.documentId).sort()).toEqual(["d1", "d2"]);
  });

  it("bağlantı içermeyen belgelerde boş dizi döndürür", () => {
    const documents: ConsistencyDocument[] = [
      makeDocument({ id: "d1", content: "sadece düz metin" }),
    ];
    expect(findBrokenCrossReferences([], documents)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 4. Toplu rapor (checkConsistency) entegrasyonu
// ---------------------------------------------------------------------------

describe("consistency-checker / checkConsistency (entegrasyon)", () => {
  it("temiz projede sorun üretmez", () => {
    const entities: ConsistencyEntity[] = [
      makeEntity({
        id: "e1",
        uuid: "11111111-1111-4111-8111-111111111111",
        name: "Alice",
      }),
    ];
    const documents: ConsistencyDocument[] = [
      makeDocument({
        id: "d1",
        uuid: "22222222-2222-4222-8222-222222222222",
        content: "[[11111111-1111-4111-8111-111111111111]]",
      }),
    ];

    const report = checkConsistency(entities, documents);

    expect(report).toBeDefined();
    expect(report.issues).toBeDefined();
    expect(Array.isArray(report.issues)).toBe(true);
    expect(report.issues).toHaveLength(0);
    expect(report.ok).toBe(true);
  });

  it("yinelenen uuid, yetim varlık ve bozuk referansı aynı raporda birleştirir", () => {
    const shared = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const orphanUuid = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    const missing = "99999999-9999-4999-8999-999999999999";

    const entities: ConsistencyEntity[] = [
      makeEntity({ id: "e1", uuid: shared, name: "Alice" }),
      makeEntity({ id: "e2", uuid: shared, name: "Alice Clone" }),
      makeEntity({ id: "e3", uuid: orphanUuid, name: "Ghost" }),
    ];
    const documents: ConsistencyDocument[] = [
      makeDocument({ id: "d1", content: `[[${shared}]] ve [[${missing}]]` }),
    ];

    const report = checkConsistency(entities, documents);

    expect(report.issues.length).toBeGreaterThan(0);

    const kinds = report.issues.map((issue: ConsistencyIssue) => issue.kind);
    expect(kinds).toContain("duplicate-uuid");
    expect(kinds).toContain("orphan-entity");
    expect(kinds).toContain("broken-reference");
    expect(report.ok).toBe(false);
  });

  it("boş projede boş sorun listesi döndürür", () => {
    const report = checkConsistency([], []);
    expect(report.issues).toEqual([]);
    expect(report.ok).toBe(true);
  });

  it("summary alanı sorun türlerine göre sayım içerir", () => {
    const shared = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const entities: ConsistencyEntity[] = [
      makeEntity({ id: "e1", uuid: shared }),
      makeEntity({ id: "e2", uuid: shared }),
    ];
    const documents: ConsistencyDocument[] = [
      makeDocument({ id: "d1", content: `[[${shared}]]` }),
    ];

    const report = checkConsistency(entities, documents);

    expect(report.summary).toBeDefined();
    expect(typeof report.summary.duplicateUuid).toBe("number");
    expect(typeof report.summary.orphanEntity).toBe("number");
    expect(typeof report.summary.brokenReference).toBe("number");
    expect(report.summary.duplicateUuid).toBeGreaterThanOrEqual(1);
    expect(report.summary.total).toBe(report.issues.length);
  });
});
