/**
 * Package data migration utilities.
 *
 * This module defines the data structures for package data version‑1 and
 * version‑2, the current version constant, and a public `migratePackageData`
 * function that converts older data formats to the latest one.
 *
 * If an unsupported version is supplied, the function throws an explicit
 * error so callers can handle the situation appropriately.
 */

export const CURRENT_VERSION = 2;

/**
 * Version‑1 package data shape.
 *
 * - `config` is stored as a JSON string.
 */
export interface PackageDataV1 {
  version: 1;
  name: string;
  config: string; // JSON string
}

/**
 * Version‑2 package data shape (the current format).
 *
 * - `config` is stored as a parsed object.
 */
export interface PackageDataV2 {
  version: typeof CURRENT_VERSION;
  name: string;
  config: Record<string, unknown>;
}

/**
 * Public API – migrates any supported package data object to the current
 * version (`PackageDataV2`). If the data is already at the current version it
 * is returned unchanged. For unknown versions an error is thrown.
 *
 * @param data - The raw package data object (may be any version).
 * @returns The data converted to `PackageDataV2`.
 * @throws Error when `data.version` is not recognised.
 */
export function migratePackageData(data: any): PackageDataV2 {
  // If the data is already at the current version, simply cast and return.
  if (data.version === CURRENT_VERSION) {
    return data as PackageDataV2;
  }

  // Handle known legacy versions.
  switch (data.version) {
    case 1:
      return migrateV1ToV2(data as PackageDataV1);
    default:
      // Any other version is unsupported.
      throw new Error(`Unsupported package data version: ${data.version}`);
  }
}

/**
 * Internal helper that converts a version‑1 data object to version‑2.
 *
 * Version‑1 stores the `config` field as a JSON string. Version‑2 stores it
 * as a parsed object.
 *
 * @param oldData - The version‑1 data.
 * @returns The converted version‑2 data.
 */
function migrateV1ToV2(oldData: PackageDataV1): PackageDataV2 {
  let parsedConfig: Record<string, unknown>;

  try {
    parsedConfig = JSON.parse(oldData.config);
  } catch {
    // If parsing fails we fall back to an empty object so the app can still
    // start and the user can be prompted to fix the configuration.
    parsedConfig = {};
  }

  return {
    version: CURRENT_VERSION,
    name: oldData.name,
    config: parsedConfig,
  };
}
