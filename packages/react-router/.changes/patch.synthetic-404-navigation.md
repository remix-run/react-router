Fix unmatched navigations crashing when multiple top-level routes have no root layout route

Preserve the synthetic 404 match when synchronizing route elements so unmatched navigations and revalidations reach the default error boundary.
