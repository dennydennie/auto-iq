import "./instrument";
import {
  UnprocessableEntityException,
  ValidationPipe,
  type INestApplication,
  type ValidationError,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser = require("cookie-parser");
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { JsonLogger } from "./common/logging/json.logger";
import { CorrelationIdMiddleware } from "./common/middleware/correlation-id.middleware";
import { RequestLoggingMiddleware } from "./common/middleware/request-logging.middleware";
import type { CorrelatedRequest, HeaderResponse } from "./common/types/http";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: new JsonLogger() });
  const config = app.get(ConfigService);

  configureApp(app, config);
  await app.listen(Number(config.getOrThrow<string>("PORT")));
}

function configureApp(app: INestApplication, config: ConfigService) {
  const trustedProxyHops = config.get<number>("TRUST_PROXY_HOPS", 0);
  app
    .getHttpAdapter()
    .getInstance()
    .set("trust proxy", trustedProxyHops > 0 ? trustedProxyHops : false);
  registerCorrelationIds(app);
  registerRequestLogging(app);
  app.setGlobalPrefix("api/v1");
  app.use(cookieParser());
  app.enableCors({ credentials: true, origin: corsOrigin(config) });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: validationException,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  configureSwagger(app, config);
}

function registerCorrelationIds(app: INestApplication) {
  const middleware = new CorrelationIdMiddleware();
  app.use(
    (
      request: CorrelatedRequest,
      response: HeaderResponse,
      next: () => void,
    ) => {
      middleware.use(request, response, next);
    },
  );
}

function registerRequestLogging(app: INestApplication) {
  const middleware = new RequestLoggingMiddleware();
  app.use(
    (
      request: CorrelatedRequest,
      response: HeaderResponse & {
        on: (event: "finish", listener: () => void) => void;
        statusCode?: number;
        getHeader(name: string): number | string | string[] | undefined;
      },
      next: () => void,
    ) => {
      middleware.use(request, response, next);
    },
  );
}

function corsOrigin(config: ConfigService) {
  const allowed = config.getOrThrow<string>("CORS_ORIGINS").split(",");
  return (
    origin: string | undefined,
    callback: (error: Error | null, ok?: boolean) => void,
  ) => {
    callback(
      null,
      !origin || allowed.map((value) => value.trim()).includes(origin),
    );
  };
}

function configureSwagger(app: INestApplication, config: ConfigService) {
  if (config.get<string>("SWAGGER_ENABLED") !== "true") {
    return;
  }
  const document = SwaggerModule.createDocument(app, swaggerConfig());
  SwaggerModule.setup("api/docs", app, document);
}

function swaggerConfig() {
  return new DocumentBuilder()
    .setTitle("Auto IQ API")
    .setDescription("Internal API contract for Auto IQ")
    .setVersion("0.1.0")
    .build();
}

function validationException(errors: ValidationError[]) {
  return new UnprocessableEntityException({
    code: "VALIDATION_FAILED",
    message: errors.flatMap((error) => Object.values(error.constraints ?? {})),
  });
}

void bootstrap();
