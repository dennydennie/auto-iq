import * as Sentry from "@sentry/nestjs";
import { scrubSentryEvent } from "./common/sentry/sentry-scrubber";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    release: process.env.SENTRY_RELEASE,
    beforeSend(event) {
      return scrubSentryEvent(event) as typeof event | null;
    },
  });
}
