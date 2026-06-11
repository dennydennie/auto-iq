import { ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RolesGuard } from "./roles.guard";

describe("RolesGuard", () => {
  it("allows a matching role", () => {
    const guard = new RolesGuard(mockReflector(["SELLER"]));
    expect(guard.canActivate(mockContext(["SELLER"]))).toBe(true);
  });

  it("denies a missing role", () => {
    const guard = new RolesGuard(mockReflector(["ADMIN"]));
    expect(() => guard.canActivate(mockContext(["SELLER"]))).toThrow(ForbiddenException);
  });
});

function mockReflector(required: string[]) {
  return { getAllAndOverride: jest.fn().mockReturnValue(required) } as unknown as Reflector;
}

function mockContext(roles: string[]) {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ currentUser: { roles } }),
    }),
  } as never;
}
