const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'db', 'jetty.sqlite');
const db = new Database(dbPath);

console.log("Running migrations...");

const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');
const files = fs.readdirSync(migrationsDir).sort();

for (const file of files) {
  if (file.endsWith('.sql')) {
    const migration = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    db.exec(migration);
    console.log(`Executed migration: ${file}`);
  }
}

console.log("Migrations complete!");
db.close();
