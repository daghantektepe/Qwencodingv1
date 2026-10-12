import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CrdtEngine } from '../src/services/sync/CrdtEngine';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('CrdtEngine', () => {
  let engine: CrdtEngine;

  beforeEach(() => {
    localStorageMock.clear();
    engine = new CrdtEngine();
  });

  describe('Vector Clock', () => {
    it('should compare clocks correctly', () => {
      const clock1 = { client1: 1, client2: 2 };
      const clock2 = { client1: 2, client2: 1 };

      const result = engine.compareClocks(clock1, clock2);
      expect(result).toBe(2); // Çakışma
    });

    it('should detect greater clock', () => {
      const clock1 = { client1: 2, client2: 2 };
      const clock2 = { client1: 1, client2: 1 };

      const result = engine.compareClocks(clock1, clock2);
      expect(result).toBe(1); // clock1 > clock2
    });

    it('should detect equal clocks', () => {
      const clock1 = { client1: 1, client2: 1 };
      const clock2 = { client1: 1, client2: 1 };

      const result = engine.compareClocks(clock1, clock2);
      expect(result).toBe(0); // Eşit
    });

    it('should merge clocks correctly', () => {
      const clock1 = { client1: 2, client2: 1 };
      const clock2 = { client1: 1, client2: 3 };

      const merged = engine.mergeClocks(clock1, clock2);
      expect(merged).toEqual({ client1: 2, client2: 3 });
    });
  });

  describe('Document Operations', () => {
    it('should create a document', () => {
      const operation = engine.createOperation('client1', 'create', 'doc1', 'title', 'Test Document');
      
      expect(operation.type).toBe('create');
      expect(operation.docId).toBe('doc1');
      expect(operation.field).toBe('title');
      expect(operation.value).toBe('Test Document');

      const doc = engine.getDocument('doc1');
      expect(doc).toBeDefined();
      expect(doc?.title).toBe('Test Document');
    });

    it('should update a document', () => {
      engine.createOperation('client1', 'create', 'doc1', 'title', 'Test');
      engine.createOperation('client1', 'update', 'doc1', 'content', 'New content');

      const doc = engine.getDocument('doc1');
      expect(doc?.content).toBe('New content');
    });

    it('should delete a document', () => {
      engine.createOperation('client1', 'create', 'doc1', 'title', 'Test');
      engine.createOperation('client1', 'delete', 'doc1', 'deleted', true);

      const doc = engine.getDocument('doc1');
      expect(doc?.deleted).toBe(true);

      const allDocs = engine.getAllDocuments();
      expect(allDocs.length).toBe(0);
    });

    it('should get all documents', () => {
      engine.createOperation('client1', 'create', 'doc1', 'title', 'Doc 1');
      engine.createOperation('client1', 'create', 'doc2', 'title', 'Doc 2');

      const docs = engine.getAllDocuments();
      expect(docs.length).toBe(2);
    });
  });

  describe('Conflict Resolution', () => {
    it('should resolve conflicts with LWW strategy', () => {
      // İki farklı istemci aynı belgeyi güncellesin
      const op1 = engine.createOperation('client1', 'create', 'doc1', 'content', 'Content 1');
      
      // Daha yeni timestamp ile başka bir güncelleme
      const op2 = {
        ...op1,
        id: 'client2-1-' + (Date.now() + 1000),
        clientId: 'client2',
        value: 'Content 2',
        timestamp: Date.now() + 1000,
        clock: { client2: 1 },
      };

      engine.receiveOperation(op2);

      const doc = engine.getDocument('doc1');
      expect(doc?.content).toBe('Content 2'); // Daha yeni olan kazanmalı
    });

    it('should not apply duplicate operations', () => {
      const op = engine.createOperation('client1', 'create', 'doc1', 'title', 'Test');
      
      const applied = engine.receiveOperation(op);
      expect(applied).toBe(false); // Zaten uygulanmış
    });
  });

  describe('Persistence', () => {
    it('should persist to localStorage', () => {
      engine.createOperation('client1', 'create', 'doc1', 'title', 'Test');

      const stored = localStorage.getItem('crdt-engine');
      expect(stored).toBeTruthy();

      const data = JSON.parse(stored!);
      expect(data.documents.length).toBeGreaterThan(0);
    });

    it('should load from localStorage', () => {
      engine.createOperation('client1', 'create', 'doc1', 'title', 'Test');

      const newEngine = new CrdtEngine();
      const doc = newEngine.getDocument('doc1');
      expect(doc?.title).toBe('Test');
    });
  });

  describe('Operations History', () => {
    it('should track all operations', () => {
      engine.createOperation('client1', 'create', 'doc1', 'title', 'Test');
      engine.createOperation('client1', 'update', 'doc1', 'content', 'Content');

      const ops = engine.getAllOperations();
      expect(ops.length).toBe(2);
    });

    it('should get operations since clock', () => {
      const op1 = engine.createOperation('client1', 'create', 'doc1', 'title', 'Test');
      const clockAfterOp1 = { ...engine.getLocalClock() };
      
      engine.createOperation('client1', 'update', 'doc1', 'content', 'Content');

      const ops = engine.getOperationsSince(clockAfterOp1);
      expect(ops.length).toBe(1);
      expect(ops[0].field).toBe('content');
    });
  });
});
