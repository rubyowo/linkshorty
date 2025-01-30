import "dotenv/config";
import fastify from "fastify";
import {
	Type,
	type TypeBoxTypeProvider,
	TypeBoxValidatorCompiler,
} from "@fastify/type-provider-typebox";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import {
	findEntriesByURL,
	findEntryBySlug,
	insertData,
	listAllEntries,
	runMigrations,
} from "./database.js";
import { randomBytes } from "node:crypto";

const app = fastify()
	.setValidatorCompiler(TypeBoxValidatorCompiler)
	.withTypeProvider<TypeBoxTypeProvider>();
const port = +(process.env.PORT || 3000);
const host = process.env.HOST || "localhost";
const apiURL = new URL(process.env.URL || `http://${host}:${port}`);
// NOTE: since we're converting bytes to their hex form we divide by 2
const idLength = +(process.env.ID_LENGTH || 4) / 2;

app.register(cors);
app.register(fastifyStatic, {
	root: path.join(import.meta.dirname, "/public"),
	prefix: "/public/",
});
app.get("/", (_, res) => res.sendFile("index.html"));

const rand = () => randomBytes(idLength).toString("hex");
app.post(
	"/api/new",
	{
		schema: {
			body: Type.Object({
				url: Type.String(),
				generate: Type.Boolean(),
			}),
		},
	},
	async (req, _) => {
		const { url, generate } = req.body;
		const newURL = new URL(url).href;
		if (generate) {
			const slug = rand();
			await insertData(slug, newURL);

			return new URL(slug, apiURL).href;
		}

		const prexisting = await findEntriesByURL(newURL);
		if (prexisting[0]) {
			return new URL(prexisting[0].slug, apiURL).href;
		}
	},
);

app.get(
	"/:slug",
	{
		schema: {
			params: Type.Object({
				slug: Type.String(),
			}),
		},
	},
	async (req, res) => {
		try {
			const { slug } = req.params;
			const { url } = await findEntryBySlug(slug);
			return res.redirect(url);
		} catch (e) {
			return res.status(404).send(e);
		}
	},
);

await runMigrations();
app.listen({ port, host }, (err, address) => {
	if (err) {
		console.error(err);
		process.exit();
	}
	console.log(`Listening at ${address}`);
});
