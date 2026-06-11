import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserRoleEntity } from "../entity/user-role.entity";
import { AbstractRepository } from "./abstract.repository";

@Injectable()
export class UserRoleRepository extends AbstractRepository<UserRoleEntity> {
  constructor(@InjectRepository(UserRoleEntity) repository: Repository<UserRoleEntity>) {
    super(repository);
  }
}
