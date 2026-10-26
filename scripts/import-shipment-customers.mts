// One-time import: creates a customer profile for every recipient in the
// Big Red Creative Productions shipping-label history. The shipping export
// has no emails, so every imported customer is created with email = null
// (allowed since migration 0020). Each customer also gets one internal
// note summarizing their shipping history, attributed to the active owner.
//
// The customer list itself (names) is NOT committed to this repo — it is
// passed in as a JSON file path, so no customer data lives in git.
//
// Dry run (default — writes nothing, prints what would happen):
//   npx tsx scripts/import-shipment-customers.mts path/to/shipment-customers.json
// Apply:
//   npx tsx scripts/import-shipment-customers.mts path/to/shipment-customers.json --apply
//
// Safe to re-run: a customer whose first + last name (case-insensitive)
// already exists is skipped, never duplicated or overwritten.

import { existsSync, readFileSync } from "node:fs";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { and, eq, sql } from "drizzle-orm";
import ws from "ws";
import * as schema from "../src/db/schema";

neonConfig.webSocketConstructor = ws;

type ImportRow = {
  firstName: string;
  lastName: string;
  company: string | null;
  shipments: number;
  refunded: number;
  postage: number;
  firstShipped: string;
  lastShipped: string;
};

// Same safe .env.local parsing pattern used by the other scripts in this
// folder — never logs the file's contents.
function loadEnvLocal(path: string): Record<string, string> {
  const text = readFileSync(path, "utf8");
  const env: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const [, , inputPath, ...flags] = process.argv;
if (!inputPath) {
  throw new Error("Usage: npx tsx scripts/import-shipment-customers.mts <customers.json> [--apply]");
}
const apply = flags.includes("--apply");

const rows: ImportRow[] = JSON.parse(readFileSync(inputPath, "utf8"));
for (const row of rows) {
  if (typeof row.firstName !== "string" || !row.firstName.trim()) {
    throw new Error("Every row needs a non-empty firstName — aborting before any connection is made.");
  }
}

// .env.local when run locally; the process environment when run somewhere
// (e.g. a cloud session) where DATABASE_URL is set as an environment variable.
const envLocalPath = new URL("../.env.local", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const databaseUrl = (existsSync(envLocalPath) ? loadEnvLocal(envLocalPath).DATABASE_URL : undefined) ?? process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL not found in .env.local or the environment — aborting before any connection is made.");
}

const pool = new Pool({ connectionString: databaseUrl });
const db = drizzle(pool, { schema });

function noteBody(row: ImportRow): string {
  const shipmentWord = row.shipments === 1 ? "shipment" : "shipments";
  const range = row.firstShipped === row.lastShipped ? `on ${row.firstShipped}` : `between ${row.firstShipped} and ${row.lastShipped}`;
  const refunded = row.refunded > 0 ? ` (${row.refunded} refunded label${row.refunded === 1 ? "" : "s"} not counted)` : "";
  return `Imported from Big Red Creative Productions shipping history: ${row.shipments} ${shipmentWord} ${range}${refunded}, $${row.postage.toFixed(2)} in postage. No email on file yet.`;
}

async function main() {
  const [owner] = await db
    .select({ id: schema.adminUsers.id })
    .from(schema.adminUsers)
    .where(and(eq(schema.adminUsers.role, "owner"), eq(schema.adminUsers.active, true)))
    .limit(1);
  if (!owner) {
    throw new Error("No active owner in admin_users — aborting.");
  }

  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    const firstName = row.firstName.trim();
    const lastName = row.lastName.trim();

    const [existing] = await db
      .select({ id: schema.customers.id })
      .from(schema.customers)
      .where(
        and(
          sql`lower(${schema.customers.firstName}) = ${firstName.toLowerCase()}`,
          sql`lower(${schema.customers.lastName}) = ${lastName.toLowerCase()}`,
        ),
      )
      .limit(1);
    if (existing) {
      skipped += 1;
      continue;
    }

    if (!apply) {
      created += 1;
      continue;
    }

    // One transaction per customer: the customer row, its history note,
    // and its audit event commit or roll back together.
    await db.transaction(async (tx) => {
      const [customer] = await tx
        .insert(schema.customers)
        .values({ firstName, lastName, email: null, company: row.company })
        .returning({ id: schema.customers.id });

      await tx.insert(schema.notes).values({
        entityType: "customer",
        entityId: customer.id,
        adminUserId: owner.id,
        body: noteBody(row),
      });

      // No name/company in metadata, matching the audit convention.
      await tx.insert(schema.auditLog).values({
        adminUserId: owner.id,
        action: "customer.created",
        entityType: "customer",
        entityId: customer.id,
        metadata: { source: "shipments_import" },
      });
    });
    created += 1;
  }

  console.log(
    apply
      ? `Done: ${created} customers created, ${skipped} skipped (already existed).`
      : `Dry run: ${created} customers would be created, ${skipped} skipped (already exist). Re-run with --apply to write.`,
  );
}

main()
  .catch((error) => {
    console.error("Import failed:", error instanceof Error ? error.message : "unknown error");
    process.exitCode = 1;
  })
  .finally(() => pool.end());
