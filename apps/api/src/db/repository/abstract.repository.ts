import type { DeepPartial, FindOptionsWhere, Repository } from "typeorm";

export abstract class AbstractRepository<T extends { id: string }> {
  protected constructor(protected readonly repository: Repository<T>) {}

  create(data: DeepPartial<T>): T {
    return this.repository.create(data);
  }

  save(entity: T): Promise<T> {
    return this.repository.save(entity);
  }

  findById(id: string): Promise<T | null> {
    return this.repository.findOneBy({ id } as FindOptionsWhere<T>);
  }
}
