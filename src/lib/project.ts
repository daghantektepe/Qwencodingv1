export type NodeType = 'folder' | 'document';

export interface ScrivNode {
  id: string;
  title: string;
  type: NodeType;
  text?: string;
  synopsis: string;
  status: string;
  label: string;
  targetWords: number;
  children: ScrivNode[];
}

export interface ScrivProject {
  id: string;
  title: string;
  rootDir?: string;
  targetWords: number;
  updatedAt: string;
  documents: ScrivNode[];
}

export function countWords(text = ''): number {
  const matches = text.trim().match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu);
  return matches ? matches.length : 0;
}

export function flattenNodes(nodes: ScrivNode[]): ScrivNode[] {
  return nodes.flatMap((node) => [node, ...flattenNodes(node.children)]);
}

export function findNode(nodes: ScrivNode[], id: string): ScrivNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const child = findNode(node.children, id);
    if (child) return child;
  }
  return undefined;
}

export function updateNode(nodes: ScrivNode[], id: string, patch: Partial<ScrivNode>): ScrivNode[] {
  return nodes.map((node) => {
    if (node.id === id) return { ...node, ...patch };
    return { ...node, children: updateNode(node.children, id, patch) };
  });
}

export function projectWordCount(project: ScrivProject): number {
  return flattenNodes(project.documents).reduce((total, node) => total + countWords(node.text), 0);
}

export function createSampleProject(): ScrivProject {
  const chapterId = crypto.randomUUID();
  return {
    id: crypto.randomUUID(),
    title: 'The Glass Harbor',
    targetWords: 80000,
    updatedAt: new Date().toISOString(),
    documents: [
      {
        id: crypto.randomUUID(),
        title: 'Manuscript',
        type: 'folder',
        synopsis: 'Primary draft folder',
        status: 'Drafting',
        label: 'Book',
        targetWords: 80000,
        children: [
          {
            id: chapterId,
            title: 'Chapter One',
            type: 'document',
            text: 'Mira arrived at the harbor before sunrise, notebook in hand and a storm waiting offshore.',
            synopsis: 'Mira returns home and finds the first clue.',
            status: 'Drafting',
            label: 'Scene',
            targetWords: 1800,
            children: [],
          },
        ],
      },
      {
        id: crypto.randomUUID(),
        title: 'Research',
        type: 'folder',
        synopsis: 'Notes, references, and worldbuilding',
        status: 'Collecting',
        label: 'Reference',
        targetWords: 0,
        children: [],
      },
    ],
  };
}
