import { BadRequestException, Injectable } from "@nestjs/common";
import * as bcrypt from "bcryptjs";

const COST_FACTOR = 12;

@Injectable()
export class PasswordService {
  assertStrong(password: string): void {
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    if (password.length < 8 || !hasLower || !hasUpper || !hasDigit) {
      throw new BadRequestException({
        code: "VALIDATION_FAILED",
        message: "Password must contain upper, lower, and numeric characters",
      });
    }
  }

  async hash(password: string): Promise<string> {
    this.assertStrong(password);
    return bcrypt.hash(password, COST_FACTOR);
  }

  verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
