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
import { findEntry, insertData, runMigrations } from "./database.js";
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
      }),
    },
  },
  async (req, _) => {
    const url = new URL(req.body.url).href;
    const slug = rand();
    await insertData(slug, url);
    return new URL(slug, apiURL).href;
  }
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
      const { url } = await findEntry(slug);
      return res.redirect(url);
    } catch (e) {
      return res.status(404).send(e);
    }
  }
);

await runMigrations();
app.listen({ port, host }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit();
  }
  console.log(`Listening at ${address}`);
});
