import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserEntity } from "../entity/user.entity";
import { AbstractRepository } from "./abstract.repository";

@Injectable()
export class UserRepository extends AbstractRepository<UserEntity> {
  constructor(@InjectRepository(UserEntity) repository: Repository<UserEntity>) {
    super(repository);
  }

  findByEmail(email: string): Promise<UserEntity | null> {
    return this.repository.findOne({ where: { email: email.toLowerCase() } });
  }

  findByIdentifier(identifier: string): Promise<UserEntity | null> {
    const value = identifier.toLowerCase();
    return this.repository.findOne({
      where: [{ email: value }, { phone: identifier }],
      relations: ["roles", "buyerProfile", "sellerProfile", "consents"],
    });
  }

  findProfileById(id: string): Promise<UserEntity | null> {
    return this.repository.findOne({
      where: { id },
      relations: ["roles", "buyerProfile", "sellerProfile", "consents"],
    });
  }

  findByRole(role: string): Promise<UserEntity[]> {
    return this.repository.createQueryBuilder("user")
      .leftJoinAndSelect("user.roles", "role")
      .where("role.role = :role", { role })
      .getMany();
  }

  findByPhone(phone: string): Promise<UserEntity | null> {
    return this.repository.findOne({ where: { phone } });
  }
}
