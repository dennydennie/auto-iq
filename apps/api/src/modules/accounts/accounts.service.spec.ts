import { SellerProfileEntity } from "../../db/entity/seller-profile.entity";
import { UserEntity } from "../../db/entity/user.entity";
import { UserRoleEntity } from "../../db/entity/user-role.entity";
import { AccountsService } from "./accounts.service";

function userProfile(overrides: Partial<UserEntity> = {}): UserEntity {
  const now = new Date("2026-06-30T00:00:00.000Z");
  return {
    id: "user-1",
    fullName: "Demo Buyer",
    email: "buyer@example.com",
    phone: "+263774397233",
    passwordHash: "hash",
    status: "ACTIVE",
    city: "Harare",
    phoneVerified: true,
    emailVerified: true,
    createdAt: now,
    updatedAt: now,
    roles: [{ role: "BUYER" } as UserRoleEntity],
    consents: [],
    buyerProfile: null,
    sellerProfile: null,
    ...overrides,
  };
}

describe("AccountsService", () => {
  it("activates seller access on an existing buyer account", async () => {
    const sellerProfile = { id: "seller-1", city: "Harare", consentsComplete: false, verified: false } as SellerProfileEntity;
    const activatedUser = userProfile({
      roles: [{ role: "BUYER" } as UserRoleEntity, { role: "SELLER" } as UserRoleEntity],
      sellerProfile,
    });
    const manager = { findOne: jest.fn().mockResolvedValue(userProfile()), save: jest.fn() };
    const dataSource = { transaction: jest.fn(async (work) => work(manager)) };
    const userRepository = { findProfileById: jest.fn().mockResolvedValue(activatedUser) };
    const service = new AccountsService({} as never, {} as never, userRepository as never, dataSource as never);

    const result = await service.activateSeller("user-1");

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(manager.findOne).toHaveBeenCalledWith(UserEntity, {
      where: { id: "user-1" },
      relations: ["roles", "sellerProfile"],
    });
    expect(manager.save).toHaveBeenCalledWith(UserRoleEntity, { userId: "user-1", role: "SELLER" });
    expect(manager.save).toHaveBeenCalledWith(SellerProfileEntity, {
      businessName: null,
      city: "Harare",
      consentsComplete: false,
      userId: "user-1",
      verified: false,
    });
    expect(result.roles).toEqual(["BUYER", "SELLER"]);
  });
});
