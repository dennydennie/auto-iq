import { validate } from "class-validator";
import { RegisterDto } from "./auth.dto";

function registration(role: string): RegisterDto {
  return Object.assign(new RegisterDto(), {
    fullName: "Tariro Moyo",
    email: "tariro@example.com",
    phone: "+263771234567",
    password: "secure-pass-1",
    city: "Harare",
    role,
  });
}

describe("RegisterDto", () => {
  it.each(["BUYER", "SELLER"])(
    "allows public %s registration",
    async (role) => {
      await expect(validate(registration(role))).resolves.toHaveLength(0);
    },
  );

  it("rejects public Inspector registration", async () => {
    const errors = await validate(registration("INSPECTOR"));

    expect(errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ property: "role" })]),
    );
  });
});
