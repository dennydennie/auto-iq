import { ApiProperty } from "@nestjs/swagger";

class ReadinessChecksDto {
  @ApiProperty({ enum: ["up", "down"] })
  db!: "up" | "down";

  @ApiProperty({ enum: ["up", "down"] })
  redis!: "up" | "down";

  @ApiProperty({ enum: ["up", "down"] })
  storage!: "up" | "down";
}

export class LiveResponseDto {
  @ApiProperty({ enum: ["ok"] })
  status!: "ok";
}

export class ReadinessResponseDto {
  @ApiProperty({ enum: ["ok", "error"] })
  status!: "ok" | "error";

  @ApiProperty({ type: () => ReadinessChecksDto })
  checks!: ReadinessChecksDto;
}
