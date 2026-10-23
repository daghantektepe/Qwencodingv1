/**
 * mermaidService.ts — Faz 77: Mermaid Diyagram ve Grafik Servisi
 */

export type DiagramType =
  | 'flowchart'
  | 'sequence'
  | 'class'
  | 'state'
  | 'pie'
  | 'gitGraph'
  | 'unknown';

export interface DiagramSyntaxResult {
  isValid: boolean;
  error?: string;
  diagramType: DiagramType;
}

export class MermaidService {
  /**
   * Diyagram türünü kodun ilk satırından tespit eder
   */
  public detectType(code: string): DiagramType {
    const trimmed = code.trim().toLowerCase();
    if (trimmed.startsWith('graph') || trimmed.startsWith('flowchart')) return 'flowchart';
    if (trimmed.startsWith('sequencediagram')) return 'sequence';
    if (trimmed.startsWith('classdiagram')) return 'class';
    if (trimmed.startsWith('statediagram')) return 'state';
    if (trimmed.startsWith('pie')) return 'pie';
    if (trimmed.startsWith('gitgraph')) return 'gitGraph';
    return 'unknown';
  }

  /**
   * Mermaid sözdizimi geçerliliğini denetler
   */
  public validateSyntax(code: string): DiagramSyntaxResult {
    const trimmed = code.trim();
    if (!trimmed) {
      return {
        isValid: false,
        error: 'Diyagram kodu boş olamaz.',
        diagramType: 'unknown',
      };
    }

    const type = this.detectType(trimmed);
    if (type === 'unknown') {
      return {
        isValid: false,
        error: 'Geçersiz veya desteklenmeyen Mermaid diyagram türü (örn: graph TD, sequenceDiagram, pie vb. ile başlamalıdır).',
        diagramType: 'unknown',
      };
    }

    // Parantez ve tırnak dengesi kontrolü
    let openBracketCount = 0;
    let openCurlyCount = 0;
    let openQuoteCount = 0;

    for (let i = 0; i < trimmed.length; i++) {
      const ch = trimmed[i];
      if (ch === '[') openBracketCount++;
      else if (ch === ']') openBracketCount--;
      else if (ch === '{') openCurlyCount++;
      else if (ch === '}') openCurlyCount--;
      else if (ch === '"' && trimmed[i - 1] !== '\\') openQuoteCount++;
    }

    if (openBracketCount !== 0) {
      return {
        isValid: false,
        error: 'Diyagramda kapanmamış köşeli parantez ([ ]) bulundu.',
        diagramType: type,
      };
    }

    if (openCurlyCount !== 0) {
      return {
        isValid: false,
        error: 'Diyagramda kapanmamış süslü parantez ({ }) bulundu.',
        diagramType: type,
      };
    }

    if (openQuoteCount % 2 !== 0) {
      return {
        isValid: false,
        error: 'Diyagramda kapanmamış çift tırnak (") işareti bulundu.',
        diagramType: type,
      };
    }

    return {
      isValid: true,
      diagramType: type,
    };
  }

  /**
   * Mermaid kodundan vektör SVG grafiği üretir
   */
  public renderSvg(code: string, id = `mermaid-${Date.now()}`): string {
    const validation = this.validateSyntax(code);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Geçersiz Mermaid kodu');
    }

    const lines = code
      .trim()
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const type = validation.diagramType;

    if (type === 'pie') {
      return this.renderPieChartSvg(lines, id);
    }

    if (type === 'sequence') {
      return this.renderSequenceSvg(lines, id);
    }

    // Default flowchart & graph render
    return this.renderFlowchartSvg(lines, id);
  }

  private renderFlowchartSvg(lines: string[], id: string): string {
    // Akış şeması satırlarını parse et (A --> B, A[Başlık] --> B(Sonuç))
    const nodes = new Map<string, { label: string; shape: 'rect' | 'circle' | 'diamond' }>();
    const edges: Array<{ from: string; to: string; label?: string }> = [];

    const linkRegex = /([A-Za-z0-9_-]+)(?:\[([^\]]+)\]|\(([^\)]+)\)|\{([^\}]+)\})?\s*(-->|---|-.->)\s*(?:\|([^|]+)\|)?\s*([A-Za-z0-9_-]+)(?:\[([^\]]+)\]|\(([^\)]+)\)|\{([^\}]+)\})?/;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(linkRegex);
      if (match) {
        const fromId = match[1];
        const fromLabel = match[2] || match[3] || match[4] || fromId;
        const fromShape = match[4] ? 'diamond' : match[3] ? 'circle' : 'rect';

        const toId = match[7];
        const toLabel = match[8] || match[9] || match[10] || toId;
        const toShape = match[10] ? 'diamond' : match[9] ? 'circle' : 'rect';

        const edgeLabel = match[6];

        if (!nodes.has(fromId)) nodes.set(fromId, { label: fromLabel, shape: fromShape });
        if (!nodes.has(toId)) nodes.set(toId, { label: toLabel, shape: toShape });

        edges.push({ from: fromId, to: toId, label: edgeLabel });
      } else {
        // Tekil düğüm tanımları (örn: A[Giriş])
        const singleNodeMatch = line.match(/([A-Za-z0-9_-]+)(?:\[([^\]]+)\]|\(([^\)]+)\)|\{([^\}]+)\})/);
        if (singleNodeMatch) {
          const nId = singleNodeMatch[1];
          const nLabel = singleNodeMatch[2] || singleNodeMatch[3] || singleNodeMatch[4] || nId;
          const nShape = singleNodeMatch[4] ? 'diamond' : singleNodeMatch[3] ? 'circle' : 'rect';
          if (!nodes.has(nId)) nodes.set(nId, { label: nLabel, shape: nShape });
        }
      }
    }

    if (nodes.size === 0) {
      nodes.set('A', { label: 'Başlangıç', shape: 'rect' });
      nodes.set('B', { label: 'Bitiş', shape: 'rect' });
      edges.push({ from: 'A', to: 'B' });
    }

    const nodeArray = Array.from(nodes.entries());
    const width = 600;
    const height = Math.max(260, nodeArray.length * 70);

    const nodePositions = new Map<string, { x: number; y: number }>();
    let yCursor = 50;
    const xLeft = 140;
    const xRight = 440;

    nodeArray.forEach(([nId], idx) => {
      const x = idx % 2 === 0 ? xLeft : xRight;
      nodePositions.set(nId, { x, y: yCursor });
      if (idx % 2 === 1) yCursor += 80;
    });

    let edgesSvg = '';
    edges.forEach((edge) => {
      const p1 = nodePositions.get(edge.from);
      const p2 = nodePositions.get(edge.to);
      if (p1 && p2) {
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        edgesSvg += `
          <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="#06b6d4" stroke-width="2" marker-end="url(#arrow-${id})" />
          ${edge.label ? `<text x="${midX}" y="${midY - 8}" fill="#94a3b8" font-size="11" text-anchor="middle" font-family="sans-serif">${edge.label}</text>` : ''}
        `;
      }
    });

    let nodesSvg = '';
    nodeArray.forEach(([nId, node]) => {
      const pos = nodePositions.get(nId) || { x: 200, y: 100 };
      if (node.shape === 'circle') {
        nodesSvg += `
          <g class="mermaid-node" data-node-id="${nId}">
            <circle cx="${pos.x}" cy="${pos.y}" r="32" fill="#0f172a" stroke="#0891b2" stroke-width="2" />
            <text x="${pos.x}" y="${pos.y + 4}" fill="#f8fafc" font-size="12" font-weight="600" text-anchor="middle" font-family="sans-serif">${node.label}</text>
          </g>
        `;
      } else if (node.shape === 'diamond') {
        const dSize = 36;
        const path = `M ${pos.x} ${pos.y - dSize} L ${pos.x + dSize} ${pos.y} L ${pos.x} ${pos.y + dSize} L ${pos.x - dSize} ${pos.y} Z`;
        nodesSvg += `
          <g class="mermaid-node" data-node-id="${nId}">
            <path d="${path}" fill="#0f172a" stroke="#eab308" stroke-width="2" />
            <text x="${pos.x}" y="${pos.y + 4}" fill="#f8fafc" font-size="11" font-weight="600" text-anchor="middle" font-family="sans-serif">${node.label}</text>
          </g>
        `;
      } else {
        nodesSvg += `
          <g class="mermaid-node" data-node-id="${nId}">
            <rect x="${pos.x - 65}" y="${pos.y - 20}" width="130" height="40" rx="8" fill="#0f172a" stroke="#0284c7" stroke-width="2" />
            <text x="${pos.x}" y="${pos.y + 5}" fill="#f8fafc" font-size="12" font-weight="600" text-anchor="middle" font-family="sans-serif">${node.label}</text>
          </g>
        `;
      }
    });

    return `
      <svg id="${id}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" class="mermaid-svg w-full h-auto">
        <defs>
          <marker id="arrow-${id}" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#06b6d4" />
          </marker>
        </defs>
        <rect width="100%" height="100%" fill="#020617" rx="12" />
        <g class="mermaid-edges">${edgesSvg}</g>
        <g class="mermaid-nodes">${nodesSvg}</g>
      </svg>
    `.trim();
  }

  private renderPieChartSvg(lines: string[], id: string): string {
    const fullCode = lines.join('\n');
    const titleMatch = fullCode.match(/title\s+"?([^"\n]+)"?/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Pasta Grafiği';

    const slices: Array<{ label: string; value: number }> = [];
    const sliceRegex = /"([^"]+)"\s*:\s*([0-9.]+)/;

    lines.forEach((l) => {
      const m = l.match(sliceRegex);
      if (m) {
        slices.push({ label: m[1], value: parseFloat(m[2]) });
      }
    });

    const total = slices.reduce((acc, s) => acc + s.value, 0) || 100;
    const colors = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

    let currentAngle = 0;
    const cx = 180;
    const cy = 160;
    const r = 100;

    let paths = '';
    let legends = '';

    slices.forEach((s, i) => {
      const sliceAngle = (s.value / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      currentAngle = endAngle;

      const x1 = cx + r * Math.cos((Math.PI * startAngle) / 180);
      const y1 = cy + r * Math.sin((Math.PI * startAngle) / 180);
      const x2 = cx + r * Math.cos((Math.PI * endAngle) / 180);
      const y2 = cy + r * Math.sin((Math.PI * endAngle) / 180);

      const largeArc = sliceAngle > 180 ? 1 : 0;
      const color = colors[i % colors.length];

      paths += `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${color}" stroke="#020617" stroke-width="2" />`;

      const pct = Math.round((s.value / total) * 100);
      legends += `
        <g transform="translate(320, ${60 + i * 26})">
          <rect width="14" height="14" rx="3" fill="${color}" />
          <text x="22" y="11" fill="#f8fafc" font-size="12" font-family="sans-serif">${s.label} (%${pct})</text>
        </g>
      `;
    });

    return `
      <svg id="${id}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 320" class="mermaid-svg w-full h-auto">
        <rect width="100%" height="100%" fill="#020617" rx="12" />
        <text x="270" y="32" fill="#38bdf8" font-size="15" font-weight="bold" text-anchor="middle" font-family="sans-serif">${title}</text>
        <g class="pie-slices">${paths}</g>
        <g class="pie-legends">${legends}</g>
      </svg>
    `.trim();
  }

  private renderSequenceSvg(lines: string[], id: string): string {
    const participants = new Set<string>();
    const messages: Array<{ from: string; to: string; text: string }> = [];

    const msgRegex = /([A-Za-z0-9_-]+)\s*(->>|->)\s*([A-Za-z0-9_-]+)\s*:\s*(.+)/;

    lines.forEach((l) => {
      const pMatch = l.match(/participant\s+([A-Za-z0-9_-]+)/);
      if (pMatch) participants.add(pMatch[1]);

      const m = l.match(msgRegex);
      if (m) {
        participants.add(m[1]);
        participants.add(m[3]);
        messages.push({ from: m[1], to: m[3], text: m[4] });
      }
    });

    const pArray = Array.from(participants);
    if (pArray.length === 0) {
      pArray.push('Yazar', 'Editör');
      messages.push({ from: 'Yazar', to: 'Editör', text: 'Taslak teslim edildi' });
    }

    const width = 580;
    const height = Math.max(240, 100 + messages.length * 50);

    const colWidth = width / (pArray.length + 1);
    const xMap = new Map<string, number>();
    pArray.forEach((p, idx) => xMap.set(p, colWidth * (idx + 1)));

    let lifelines = '';
    pArray.forEach((p) => {
      const x = xMap.get(p) || 100;
      lifelines += `
        <rect x="${x - 45}" y="20" width="90" height="30" rx="6" fill="#0f172a" stroke="#0284c7" stroke-width="2" />
        <text x="${x}" y="39" fill="#f8fafc" font-size="12" font-weight="600" text-anchor="middle" font-family="sans-serif">${p}</text>
        <line x1="${x}" y1="50" x2="${x}" y2="${height - 20}" stroke="#334155" stroke-dasharray="4 4" stroke-width="1.5" />
      `;
    });

    let msgSvg = '';
    messages.forEach((msg, idx) => {
      const x1 = xMap.get(msg.from) || 100;
      const x2 = xMap.get(msg.to) || 200;
      const y = 80 + idx * 45;

      msgSvg += `
        <line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#06b6d4" stroke-width="2" marker-end="url(#arrow-${id})" />
        <text x="${(x1 + x2) / 2}" y="${y - 6}" fill="#94a3b8" font-size="11" text-anchor="middle" font-family="sans-serif">${msg.text}</text>
      `;
    });

    return `
      <svg id="${id}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" class="mermaid-svg w-full h-auto">
        <defs>
          <marker id="arrow-${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#06b6d4" />
          </marker>
        </defs>
        <rect width="100%" height="100%" fill="#020617" rx="12" />
        ${lifelines}
        ${msgSvg}
      </svg>
    `.trim();
  }

  /**
   * Metin içerisindeki Mermaid bloklarını ayrıştırır
   */
  public extractMermaidBlocks(markdown: string): Array<{
    raw: string;
    code: string;
    startIndex: number;
    endIndex: number;
  }> {
    const blocks: Array<{
      raw: string;
      code: string;
      startIndex: number;
      endIndex: number;
    }> = [];

    const regex = /```mermaid\s*\n([\s\S]*?)```/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(markdown)) !== null) {
      blocks.push({
        raw: match[0],
        code: match[1].trim(),
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }

    return blocks;
  }
}

export const mermaidService = new MermaidService();
export default mermaidService;
