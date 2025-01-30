import * as driver from "rado/driver";
import { eq, table } from "rado";
import { id, text } from "rado/universal";

import { PGlite } from "@electric-sql/pglite";
import { createPool as mysqlPool } from "mysql2/promise";
import pg from "pg";
import sqliteDatabase from "better-sqlite3";

type AvailableDrivers =
	| "mysql2"
	| "pg"
	| "@electric-sql/pglite"
	| "better-sqlite3";

type DatabaseClient<Driver extends AvailableDrivers> = Parameters<
	(typeof driver)[Driver]
>[0];
type DatabaseOption<Driver extends AvailableDrivers> = {
	driver: Driver;
	client: DatabaseClient<Driver>;
};

type DatabaseDeclaration =
	| DatabaseOption<"mysql2">
	| DatabaseOption<"pg">
	| DatabaseOption<"@electric-sql/pglite">
	| DatabaseOption<"better-sqlite3">;

const dbConnection = (): DatabaseDeclaration => {
	switch (process.env.DATABASE_TYPE) {
		case "mysql": {
			if (!process.env.MYSQL_CONNECTION_URL)
				throw new Error("MYSQL_CONNECTION_URL not set");
			return {
				driver: "mysql2",
				client: mysqlPool(process.env.MYSQL_CONNECTION_URL),
			};
		}
		case "postgres": {
			if (!process.env.POSTGRES_CONNECTION_URL)
				throw new Error("POSTGRES_CONNECTION_URL not set");
			return {
				driver: "pg",
				client: new pg.Pool({
					connectionString: process.env.POSTGRES_CONNECTION_URL,
				}),
			};
		}
		case "sqlite": {
			return {
				driver: "better-sqlite3",
				client: new sqliteDatabase(process.env.SQLITE_DATABASE),
			};
		}
		case "pglite": {
			return {
				driver: "@electric-sql/pglite",
				client: new PGlite(process.env.PGLITE_DATA_DIR),
			};
		}
		default: {
			throw new Error(
				"DATABASE_TYPE was not set or is not one of the following values: mysql, postgres, sqlite, pglite",
			);
		}
	}
};

const dbConfig = dbConnection();
// @ts-ignore
export const db = driver[dbConfig.driver](dbConfig.client);

const Links = table("links", {
	id: id(),
	slug: text().unique().notNull(),
	url: text().notNull(),
});

export const runMigrations = async () => {
	console.log("Running migrations...");
	// HACK: rado doesn't give us a way to only create the database if it doesn't exist
	await db.create(Links).catch(() => {});
};

// @ts-ignore
export const listAllEntries = async () => await db.select().from(Links);

export const findEntryBySlug = async (slug: string) =>
	// @ts-ignore
	(await db.select().from(Links).where(eq(Links.slug, slug)).limit(1))[0];

export const findEntriesByURL = (url: string) =>
	db
		.select()
		// @ts-ignore
		.from(Links)
		.where(eq(Links.url, url));

export const insertData = (slug: string, url: string) =>
	db.insert(Links).values({ slug, url });
