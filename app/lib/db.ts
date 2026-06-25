import { createClient } from "@libsql/client";
import path from 'path';

// By default, connect to the Turso database if environment variables are present.
// Otherwise, fall back to the local SQLite file during development.
const isProduction = process.env.NODE_ENV === 'production';
const localDbPath = path.join(process.cwd(), 'db', 'jetty.sqlite');

const url = process.env.TURSO_DATABASE_URL || (isProduction ? 'file:/tmp/jetty.sqlite' : `file:${localDbPath}`);
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({
  url,
  authToken,
});

export default client;
