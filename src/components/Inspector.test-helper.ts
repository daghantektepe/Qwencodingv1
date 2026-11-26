/**
 * Helper utilities used by the Inspector persistence test.
 *
 * The file is intentionally tiny – it only re‑exports the `Inspector` component
 * with a deterministic `docId` prop so that the test can render it without
 * needing the full application context.
 */
import React from "react";
import Inspector from "./Inspector";

export const InspectorWithDoc = ({ docId }: { docId: string }) => (
  <Inspector docId={docId} />
);
