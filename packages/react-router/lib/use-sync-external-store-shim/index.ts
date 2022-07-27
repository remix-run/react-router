/**
 * Inlined into the react-router repo since use-sync-external-store does not
 * provide a UMD-compatible package, so we need this to be able to distribute
 * UMD react-router bundles
 */

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from "react";

import { useSyncExternalStore as client } from "./useSyncExternalStoreShimClient";
import { useSyncExternalStore as server } from "./useSyncExternalStoreShimServer";

const canUseDOM: boolean = !!(
  typeof window !== "undefined" &&
  typeof window.document !== "undefined" &&
  typeof window.document.createElement !== "undefined"
);
const isServerEnvironment = !canUseDOM;
const shim = isServerEnvironment ? server : client;

export const useSyncExternalStore =
  "useSyncExternalStore" in React
    ? ((module) => module.useSyncExternalStore)(React)
    : shim;
