import { describe, it, expect } from "vitest";
import {
  resolveCompileOrder,
  type CompileDocumentNode,
  type CompilePreferences,
} from "../src/services/compile-order";

// ---------------------------------------------------------------------------
// Yardımcılar
// ---------------------------------------------------------------------------

function node(
  overrides: Partial<CompileDocumentNode> & { id: string; title: string }
): CompileDocumentNode {
  return {
    order: overrides.order ?? 0,
    ...overrides,
  };
}

const basePrefs: CompilePreferences = {
  strategy: "manual",
};

// ---------------------------------------------------------------------------
// 1. Manuel sıralama
// ---------------------------------------------------------------------------

describe("compile-order / manuel strateji", () => {
  it("kardeş düğümleri order alanına göre sıralar", () => {
    const roots: CompileDocumentNode[] = [
      node({ id: "c", title: "C", order: 3 }),
      node({ id: "a", title: "A", order: 1 }),
      node({ id: "b", title: "B", order: 2 }),
    ];

    const r = resolveCompileOrder(roots, { ...basePrefs, strategy: "manual" });
    expect(r.included.map((e) => e.id)).toEqual(["a", "b", "c"]);
    expect(r.summary.includedCount).toBe(3);
    expect(r.summary.excludedCount).toBe(0);
  });

  it("alt ağaçları önce ebeveynden sonra (depth-first) yürür", () => {
    const roots: CompileDocumentNode[] = [
      node({
        id: "root",
        title: "Root",
        order: 1,
        children: [
          node({ id: "child-b", title: "Child B", order: 2 }),
          node({ id: "child-a", title: "Child A", order: 1 }),
        ],
      }),
    ];

    const r = resolveCompileOrder(roots, basePrefs);
    expect(r.included.map((e) => e.id)).toEqual(["root", "child-a", "child-b"]);
    expect(r.included[1].depth).toBe(1);
    expect(r.included[2].depth).toBe(1);
  });

  it("boş ağaç için boş sonuç döndürür", () => {
    const r = resolveCompileOrder([], basePrefs);
    expect(r.included).toEqual([]);
    expect(r.excluded).toEqual([]);
    expect(r.summary.totalInput).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 2. Alfabetik sıralama
// ---------------------------------------------------------------------------

describe("compile-order / alfabetik strateji", () => {
  it("başlıklara göre büyük/küçük harf duyarsız sıralar", () => {
    const roots: CompileDocumentNode[] = [
      node({ id: "1", title: "banana", order: 1 }),
      node({ id: "2", title: "Apple", order: 2 }),
      node({ id: "3", title: "cherry", order: 3 }),
    ];

    const r = resolveCompileOrder(roots, {
      ...basePrefs,
      strategy: "alphabetical",
      caseInsensitive: true,
    });
    expect(r.included.map((e) => e.id)).toEqual(["2", "1", "3"]);
  });

  it("eşit başlıklarda order'a göre kararlı sıralar", () => {
    const roots: CompileDocumentNode[] = [
      node({ id: "x2", title: "Same", order: 2 }),
      node({ id: "x1", title: "Same", order: 1 }),
    ];

    const r = resolveCompileOrder(roots, {
      ...basePrefs,
      strategy: "alphabetical",
    });
    expect(r.included.map((e) => e.id)).toEqual(["x1", "x2"]);
  });
});

// ---------------------------------------------------------------------------
// 3. Öncelik sıralaması
// ---------------------------------------------------------------------------

describe("compile-order / öncelik stratejisi", () => {
  it("varsayılan olarak artan öncelikle (1 en önce) sıralar", () => {
    const roots: CompileDocumentNode[] = [
      node({ id: "p5", title: "P5", order: 1, priority: 5 }),
      node({ id: "p1", title: "P1", order: 2, priority: 1 }),
      node({ id: "p3", title: "P3", order: 3, priority: 3 }),
    ];

    const r = resolveCompileOrder(roots, {
      ...basePrefs,
      strategy: "priority",
    });
    expect(r.included.map((e) => e.id)).toEqual(["p1", "p3", "p5"]);
  });

  it("priorityDirection=desc ile azalan sıralar", () => {
    const roots: CompileDocumentNode[] = [
      node({ id: "p1", title: "P1", order: 1, priority: 1 }),
      node({ id: "p5", title: "P5", order: 2, priority: 5 }),
    ];

    const r = resolveCompileOrder(roots, {
      ...basePrefs,
      strategy: "priority",
      priorityDirection: "desc",
    });
    expect(r.included.map((e) => e.id)).toEqual(["p5", "p1"]);
  });

  it("öncelik tanımsızsa varsayılan 3 kabul edilir", () => {
    const roots: CompileDocumentNode[] = [
      node({ id: "a", title: "A", order: 1 }),
      node({ id: "b", title: "B", order: 2, priority: 2 }),
    ];

    const r = resolveCompileOrder(roots, {
      ...basePrefs,
      strategy: "priority",
    });
    // b (2) < a (varsayılan 3)
    expect(r.included.map((e) => e.id)).toEqual(["b", "a"]);
  });

  it("öncelik [1,5] aralığına kenetlenir", () => {
    const roots: CompileDocumentNode[] = [
      node({ id: "hi", title: "Hi", order: 1, priority: 99 }),
      node({ id: "lo", title: "Lo", order: 2, priority: -5 }),
    ];

    const r = resolveCompileOrder(roots, {
      ...basePrefs,
      strategy: "priority",
    });
    const hi = r.included.find((e) => e.id === "hi")!;
    const lo = r.included.find((e) => e.id === "lo")!;
    expect(hi.priority).toBe(5);
    expect(lo.priority).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// 4. Dahil/hariç bayrağı ve filtreleri
// ---------------------------------------------------------------------------

describe("compile-order / filtreler ve hariç tutma", () => {
  it("includeInCompile=false olan düğümleri ve alt ağaçlarını hariç tutar", () => {
    const roots: CompileDocumentNode[] = [
      node({ id: "keep", title: "Keep", order: 1 }),
      node({
        id: "skip",
        title: "Skip",
        order: 2,
        includeInCompile: false,
        children: [node({ id: "skip-child", title: "Child", order: 1 })],
      }),
    ];

    const r = resolveCompileOrder(roots, basePrefs);
    expect(r.included.map((e) => e.id)).toEqual(["keep"]);
    const excludedIds = r.excluded.map((e) => e.id);
    expect(excludedIds).toContain("skip");
    expect(excludedIds).not.toContain("skip-child");
    expect(
      r.excluded.find((e) => e.id === "skip")?.reason
    ).toBe("include-flag-false");
  });

  it("statusFilter aktifse yalnızca izinli durumları dahil eder", () => {
    const roots: CompileDocumentNode[] = [
      node({ id: "d1", title: "Draft1", order: 1, status: "draft" }),
      node({ id: "f1", title: "Final1", order: 2, status: "final" }),
      node({ id: "r1", title: "Rev1", order: 3, status: "revised" }),
    ];

    const r = resolveCompileOrder(roots, {
      ...basePrefs,
      statusFilter: ["final", "revised"],
    });
    expect(r.included.map((e) => e.id).sort()).toEqual(["f1", "r1"]);
    expect(r.excluded.map((e) => e.id)).toContain("d1");
  });

  it("priorityRange aktifse yalnızca aralıktaki öncelikleri dahil eder", () => {
    const roots: CompileDocumentNode[] = [
      node({ id: "p1", title: "P1", order: 1, priority: 1 }),
      node({ id: "p3", title: "P3", order: 2, priority: 3 }),
      node({ id: "p5", title: "P5", order: 3, priority: 5 }),
    ];

    const r = resolveCompileOrder(roots, {
      ...basePrefs,
      priorityRange: [1, 3],
    });
    expect(r.included.map((e) => e.id).sort()).toEqual(["p1", "p3"]);
    expect(
      r.excluded.find((e) => e.id === "p5")?.reason
    ).toBe("priority-filter");
  });
});

// ---------------------------------------------------------------------------
// 5. Döngü koruması ve özet
// ---------------------------------------------------------------------------

describe("compile-order / döngü ve özet", () => {
  it("döngüsel referansta sonsuz döngüye girmez", () => {
    const a: CompileDocumentNode = node({ id: "a", title: "A", order: 1 });
    const b: CompileDocumentNode = node({ id: "b", title: "B", order: 2 });
    // Döngü: a.children = [b], b.children = [a]
    a.children = [b];
    b.children = [a];

    const r = resolveCompileOrder([a], basePrefs);
    // Sonuç döner (asılı kalmaz), her düğüm en fazla bir kez dahil edilir.
    expect(r.included.length).toBe(2);
    expect(r.cycles.length).toBeGreaterThanOrEqual(1);
    expect(r.summary.cycleCount).toBe(r.cycles.length);
  });

  it("summary alanları tutarlıdır", () => {
    const roots: CompileDocumentNode[] = [
      node({ id: "k", title: "K", order: 1 }),
      node({
        id: "s",
        title: "S",
        order: 2,
        includeInCompile: false,
      }),
    ];

    const r = resolveCompileOrder(roots, basePrefs);
    expect(r.summary.totalInput).toBe(2);
    expect(r.summary.includedCount).toBe(r.included.length);
    expect(r.summary.excludedCount).toBe(r.excluded.length);
    expect(r.summary.includedCount + r.summary.excludedCount).toBe(2);
  });

  it("girdi dizisini mutasyona uğratmaz", () => {
    const roots: CompileDocumentNode[] = [
      node({ id: "c", title: "C", order: 3 }),
      node({ id: "a", title: "A", order: 1 }),
    ];
    const snapshot = roots.map((n) => ({ ...n }));

    resolveCompileOrder(roots, {
      ...basePrefs,
      strategy: "alphabetical",
    });

    expect(roots.map((n) => ({ ...n }))).toEqual(snapshot);
  });
});
