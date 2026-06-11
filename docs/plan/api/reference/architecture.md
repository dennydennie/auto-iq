# API Architecture

## Stack

| Layer | Choice |
| --- | --- |
| Runtime | Node.js 22 LTS |
| Framework | NestJS 11.x |
| ORM | TypeORM + `pg` |
| Database | PostgreSQL 16+ |
| Cache / coordination | Redis |
| Object storage | S3-compatible: MinIO locally; **Tigris** on Railway (staging/production) |
| API docs | `@nestjs/swagger` |
| Validation | `class-validator`, `class-transformer` |
| Auth | `@nestjs/passport` with HttpOnly cookie sessions for web; optional JWT only for future non-browser clients per [ADR 0001](../../../adr/0001-web-auth-and-csrf.md) |
| Rate limiting | `@nestjs/throttler` |
| Error monitoring | Sentry (`@sentry/nestjs`) |

## Modular monolith layout

Follow the same structural pattern as **arcpay-be**: persistence lives under a single `db` package; feature modules stay thin and import `DbModule` for repositories.

```text
apps/api/src/
  main.ts
  app.module.ts              # TypeOrmModule.forRootAsync + imports DbModule
  config/
    database.config.ts         # registerAs('typeorm') + standalone DataSource for CLI
  common/                      # filters, interceptors, pipes, guards, decorators
  db/
    db.module.ts               # forFeature(entities) + all repository providers + exports
    entity/                    # TypeORM entities (*.entity.ts)
    repository/
      abstract.repository.ts
      *.repository.ts          # one custom repository per aggregate/table group
  modules/                     # feature modules (no local TypeOrmModule.forFeature)
    identity/
    accounts/
    seller-profiles/
    ...
    health/
    storage/
```

## DbModule (central persistence)

`DbModule` is the only place that wires TypeORM feature registration and custom repositories, matching arcpay-be:

1. **`TypeOrmModule.forFeature([...all entities])`** — every entity registered once in `db.module.ts`.
2. **`providers`** — every `*Repository` class listed explicitly.
3. **`exports`** — `TypeOrmModule` plus every repository (and any small db-scoped helpers, e.g. scope services, if needed later).

`AppModule` configures the connection globally:

```typescript
ConfigModule.forRoot({ isGlobal: true, load: [typeorm] }),
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (config: ConfigService) => config.get('typeorm'),
  inject: [ConfigService],
}),
DbModule,
// ...feature modules
```

`config/database.config.ts` supplies `TypeOrmModuleOptions` and a `DataSource` export for `typeorm migration:run`. Use `synchronize: false` in every durable environment; migrations only. See [ADR 0002](../../../adr/0002-typeorm-migration-discipline.md).

### Repository pattern

Each repository extends a thin `AbstractRepository<T>` that wraps the injected TypeORM `Repository<T>`:

```typescript
@Injectable()
export class UserRepository extends AbstractRepository<UserEntity> {
  constructor(@InjectRepository(UserEntity) repository: Repository<UserEntity>) {
    super(repository);
  }
}
```

Domain-specific query methods live on the custom repository class, not in services as raw `Repository<T>` usage.

### Feature module usage

Feature modules **import `DbModule`** and inject exported repositories into services. They do **not** call `TypeOrmModule.forFeature` locally.

```typescript
@Module({
  imports: [DbModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class IdentityModule {}
```

```typescript
@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userRoleRepository: UserRoleRepository,
  ) {}
}
```

When adding a new table:

1. Add entity under `db/entity/`.
2. Add repository under `db/repository/`.
3. Register entity in `forFeature`, repository in `providers` and `exports` inside `db.module.ts`.
4. Import entities and repositories from concrete paths. Do not add app-internal barrel imports for `db/`; public package barrels are limited to stable package entrypoints such as `@auto-iq/contracts`.

## Module rules

- One NestJS feature module per business capability under `modules/`.
- Feature modules own: **services, controllers, DTOs, and tests** only.
- **Entities and repositories** live under `db/` and are registered only in `DbModule`.
- Cross-module orchestration goes through exported **application services**, not direct use of another feature module’s controllers.
- Do not inject repositories across bounded contexts from unrelated feature code without going through a service API; prefer a dedicated application service when multiple repositories must coordinate.
- Public catalogue reads use dedicated query methods on listing repositories (or a catalogue query service) that never select private verification columns.
- Shared API shapes live in `packages/contracts` (or `packages/types`); controllers map entities to contract DTOs.

## API versioning and errors

- All routes under `/api/v1`.
- Consistent error envelope: `code`, `message`, `details` (field errors), `correlationId`.
- Map domain failures to HTTP status explicitly (409 for invalid state transitions, 403 for authorization, 404 when resource hidden for IDOR protection).

## Transaction boundaries

- State transitions (listing status, verification, inspection, viewing) run in a single DB transaction with an append-only history row.
- Use `repository.manager.transaction(...)` or an injected `DataSource` from a repository’s manager for multi-entity writes.
- File metadata registration and presign issuance can be separate short transactions; finalize upload in one transaction with validation.

## Integrations (by phase)

| Integration | Introduced in |
| --- | --- |
| PostgreSQL + TypeORM + `DbModule` | [01-foundation](../01-foundation/plan.md) |
| Redis | [01-foundation](../01-foundation/plan.md) |
| S3 / MinIO (local), Tigris (Railway) | [03-seller-listings](../03-seller-listings/plan.md), [08-production](../08-production/plan.md) |
| Email / SMS providers | [06-viewings-notifications](../06-viewings-notifications/plan.md) |

Deferred: WhatsApp, TIDA partner import pipeline, financing/insurance/escrow.
