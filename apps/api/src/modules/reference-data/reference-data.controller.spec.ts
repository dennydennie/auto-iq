import { type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request = require("supertest");
import { ReferenceDataController } from "./reference-data.controller";
import { ReferenceDataService } from "./reference-data.service";

const referenceData = {
  makes: [{ id: "toyota", name: "Toyota", popularModels: ["Hilux"] }],
  bodyTypes: [{ value: "SUV", label: "SUV" }],
  fuelTypes: [],
  transmissionTypes: [],
  driveTypes: [],
  conditionGrades: [],
  viewingLocations: [],
};

describe("ReferenceDataController", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ReferenceDataController],
      providers: [
        {
          provide: ReferenceDataService,
          useValue: { getAll: jest.fn().mockResolvedValue(referenceData) },
        },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1");
    await app.init();
  });

  afterAll(async () => app.close());

  it("returns catalogue reference data without a session", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/reference-data")
      .expect(200)
      .expect(referenceData);
  });
});
