import * as driver from "rado/driver"
import { eq, internalTable, SyncDatabase, table } from "rado";
import { id, text } from "rado/universal";
import { PGlite } from "@electric-sql/pglite";

type AvailableDrivers =
  | 'mysql2'
  | 'pg'
  | '@electric-sql/pglite'
  | 'better-sqlite3'

  type DatabaseClient<Driver extends AvailableDrivers> = Parameters<
  (typeof driver)[Driver]
>[0]
type DatabaseOption<Driver extends AvailableDrivers> = {
  driver: Driver
  client: DatabaseClient<Driver>
}

type DatabaseDeclaration =
  | DatabaseOption<'mysql2'>
  | DatabaseOption<'pg'>
  | DatabaseOption<'@electric-sql/pglite'>
  | DatabaseOption<'better-sqlite3'>

// TODO: Somehow find a way to generate this from the .env
const dbConfig: DatabaseDeclaration = {
  driver: "@electric-sql/pglite",
  client: new PGlite()
}

export const db = driver[dbConfig.driver](dbConfig.client);

const Links = table("links", {
  id: id(),
  slug: text().unique().notNull(),
  url: text().notNull(),
});

export const runMigrations = async () => {
  console.log("Running migrations...");
  // HACK: rado doesn't give us a way to only create the database if it doesn't exist
  await db.create(Links).catch(() => {})
};
export const findEntry = async (slug: string) =>
  (await db.select().from(Links).where(eq(Links.slug, slug)).limit(1))[0];

export const insertData = (slug: string, url: string) =>
  db.insert(Links).values({ slug, url });
