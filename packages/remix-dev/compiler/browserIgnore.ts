// This file is an optimization so that rollup won't try to bundle any of these
// modules, which greatly speeds up the browser tree-shaking
import builtins from "builtin-modules";

const remixServerPackages = [
  "@remix-run/architect",
  "@remix-run/express",
  "@remix-run/node",
  "@remix-run/vercel"
];

const thirdPartyPackages = [
  "@databases/mysql",
  "@databases/pg",
  "@databases/sqlite",
  "@prisma/client",
  "apollo-server",
  "better-sqlite3",
  "bookshelf",
  "dynamodb",
  "firebase-admin",
  "mariadb",
  "mongoose",
  "mysql",
  "mysql2",
  "pg",
  "pg-hstore",
  "pg-native",
  "pg-pool",
  "postgres",
  "sequelize",
  "sqlite",
  "sqlite3",
  "tedious"
];

export let ignorePackages = [
  ...builtins,
  ...remixServerPackages,
  ...thirdPartyPackages
];
