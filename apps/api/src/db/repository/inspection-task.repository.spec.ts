import type { Repository } from "typeorm";
import { InspectionTaskEntity } from "../entity/inspection-task.entity";
import { InspectionTaskRepository } from "./inspection-task.repository";

function inspectionQueryBuilder() {
  const builder = {
    addOrderBy: jest.fn(),
    andWhere: jest.fn(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    leftJoinAndSelect: jest.fn(),
    orderBy: jest.fn(),
    skip: jest.fn(),
    take: jest.fn(),
    where: jest.fn(),
  };
  for (const method of [
    "addOrderBy",
    "andWhere",
    "leftJoinAndSelect",
    "orderBy",
    "skip",
    "take",
    "where",
  ] as const) {
    builder[method].mockReturnValue(builder);
  }
  return builder;
}

describe("InspectionTaskRepository", () => {
  it("sorts paginated joined tasks by entity property paths", async () => {
    const builder = inspectionQueryBuilder();
    const typeorm = {
      createQueryBuilder: jest.fn().mockReturnValue(builder),
    } as unknown as Repository<InspectionTaskEntity>;
    const repository = new InspectionTaskRepository(typeorm);

    await repository.findInspectorPage("inspector-1");

    expect(builder.orderBy).toHaveBeenCalledWith(
      "task.scheduledAt",
      "ASC",
      "NULLS LAST",
    );
    expect(builder.addOrderBy).toHaveBeenCalledWith("task.createdAt", "DESC");
  });
});
