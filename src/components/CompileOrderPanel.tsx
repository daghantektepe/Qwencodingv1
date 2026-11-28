import React, { useMemo, useState } from "react";
import {
  resolveCompileOrder,
  type CompileDocumentNode,
  type CompilePreferences,
  type CompileSortStrategy,
} from "../services/compile-order";

export interface CompileOrderPanelProps {
  roots: CompileDocumentNode[];
  onConfirm?: (prefs: CompilePreferences) => void;
  initialPrefs?: Partial<CompilePreferences>;
}

const STRATEGY_OPTIONS: { value: CompileSortStrategy; label: string }[] = [
  { value: "manual", label: "Manuel" },
  { value: "alphabetical", label: "Alfabetik" },
  { value: "priority", label: "Öncelik" },
  { value: "status", label: "Durum" },
];

const DEFAULT_PREFS: CompilePreferences = {
  strategy: "manual",
  statusFilter: undefined,
  priorityRange: undefined,
  priorityDirection: "asc",
  caseInsensitive: true,
};

export const CompileOrderPanel: React.FC<CompileOrderPanelProps> = ({
  roots,
  onConfirm,
  initialPrefs,
}) => {
  const [prefs, setPrefs] = useState<CompilePreferences>({
    ...DEFAULT_PREFS,
    ...initialPrefs,
  });

  const result = useMemo(
    () => resolveCompileOrder(roots, prefs),
    [roots, prefs]
  );

  const handleStrategyChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    setPrefs((prev) => ({
      ...prev,
      strategy: e.target.value as CompileSortStrategy,
    }));
  };

  const handleConfirm = (): void => {
    if (onConfirm) onConfirm(prefs);
  };

  return (
    <div
      className="compile-order-panel"
      data-testid="compile-order-panel"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 12,
      }}
    >
      <header style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <label htmlFor="compile-strategy" style={{ fontWeight: 600 }}>
          Sıralama:
        </label>
        <select
          id="compile-strategy"
          data-testid="compile-strategy"
          value={prefs.strategy}
          onChange={handleStrategyChange}
        >
          {STRATEGY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </header>

      <section
        data-testid="compile-summary"
        style={{
          display: "flex",
          gap: 16,
          fontSize: 13,
          color: "#444",
        }}
      >
        <span data-testid="summary-included">
          Dahil: <strong>{result.summary.includedCount}</strong>
        </span>
        <span data-testid="summary-excluded">
          Hariç: <strong>{result.summary.excludedCount}</strong>
        </span>
        <span data-testid="summary-cycles">
          Döngü: <strong>{result.summary.cycleCount}</strong>
        </span>
      </section>

      <ol
        data-testid="compile-order-list"
        style={{ margin: 0, paddingLeft: 20 }}
      >
        {result.included.map((entry) => (
          <li
            key={entry.id}
            data-testid={`compile-entry-${entry.id}`}
            style={{ paddingLeft: entry.depth * 12 }}
          >
            <span>{entry.title}</span>{" "}
            <small style={{ color: "#888" }}>
              (öncelik {entry.priority}, durum {entry.status})
            </small>
          </li>
        ))}
      </ol>

      {result.excluded.length > 0 && (
        <details data-testid="compile-excluded">
          <summary>Hariç tutulanlar ({result.excluded.length})</summary>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {result.excluded.map((ex) => (
              <li key={ex.id} data-testid={`excluded-${ex.id}`}>
                {ex.title} — <em>{ex.reason}</em>
              </li>
            ))}
          </ul>
        </details>
      )}

      <button
        type="button"
        data-testid="compile-confirm"
        onClick={handleConfirm}
      >
        Sıralamayı Onayla
      </button>
    </div>
  );
};

export default CompileOrderPanel;
