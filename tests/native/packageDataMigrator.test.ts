import { describe, it, expect } from 'vitest';
import {
  migratePackageData,
  PackageDataV1,
  PackageDataV2,
} from '../../src/services/native/packageDataMigrator';

describe('packageDataMigrator', () => {
  it('throws an error for unsupported versions', () => {
    const unknownVersion = {
      version: 99,
      name: 'unknown',
      config: {},
    } as any;

    expect(() => migratePackageData(unknownVersion)).toThrowError(
      /Unsupported package data version/
    );
  });

  it('returns data unchanged when already at the current version', () => {
    const currentData: PackageDataV2 = {
      version: 2,
      name: 'current',
      config: { foo: 'bar' },
    };

    const result = migratePackageData(currentData);
    expect(result).toBe(currentData);
  });

  it('migrates version 1 data to version 2 correctly', () => {
    const v1Data: PackageDataV1 = {
      version: 1,
      name: 'my-package',
      config: JSON.stringify({ foo: 'bar', count: 3 }),
    };

    const result = migratePackageData(v1Data);
    const expected: PackageDataV2 = {
      version: 2,
      name: 'my-package',
      config: { foo: 'bar', count: 3 },
    };

    expect(result).toMatchObject(expected);
  });

  it('handles invalid JSON config in version 1 by falling back to empty object', () => {
    const v1Data: PackageDataV1 = {
      version: 1,
      name: 'bad-json',
      config: '{invalid json}',
    };

    const result = migratePackageData(v1Data);
    expect(result.version).toBe(2);
    expect(result.name).toBe('bad-json');
    expect(result.config).toEqual({});
  });
});
