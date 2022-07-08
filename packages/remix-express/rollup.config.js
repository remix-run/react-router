const { getAdapterConfig } = require("../../rollup.utils");

/** @returns {import("rollup").RollupOptions[]} */
module.exports = function rollup() {
  return [getAdapterConfig("express")];
};
