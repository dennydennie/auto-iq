import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function exportOpenApi() {
  const app = await NestFactory.create(AppModule, {
    abortOnError: false,
    logger: false,
    preview: true,
  });
  app.setGlobalPrefix("api/v1");
  const outputPath = resolve(
    process.cwd(),
    process.env.OPENAPI_OUTPUT_PATH ?? "../../docs/api/openapi.json",
  );
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle("Auto IQ API")
      .setDescription("Internal API contract for Auto IQ")
      .setVersion("0.1.0")
      .build(),
  );

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(document, null, 2));
  await app.close();
}

void exportOpenApi().catch((error: unknown) => {
  const detail = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`OpenAPI export failed:\n${detail}\n`);
  process.exitCode = 1;
});
