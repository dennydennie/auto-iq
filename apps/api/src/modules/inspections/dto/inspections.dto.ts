import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from "class-validator";
import {
  INSPECTION_CATEGORIES,
  INSPECTION_FINDING_RATINGS,
  INSPECTION_TASK_STATUSES,
} from "../../../common/constants/listing.constants";

export class InspectionTaskListQueryDto {
  @IsOptional()
  @IsIn(INSPECTION_TASK_STATUSES)
  status?: (typeof INSPECTION_TASK_STATUSES)[number];

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class InspectionFindingInputDto {
  @IsIn(INSPECTION_CATEGORIES)
  category!: (typeof INSPECTION_CATEGORIES)[number];

  @IsString()
  @MinLength(1)
  label!: string;

  @IsIn(INSPECTION_FINDING_RATINGS)
  rating!: (typeof INSPECTION_FINDING_RATINGS)[number];

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  photoStorageKey?: string;
}

export class SubmitInspectionReportDto {
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => InspectionFindingInputDto)
  findings!: InspectionFindingInputDto[];

  @IsString()
  @MinLength(1)
  inspectorNote!: string;

  @IsBoolean()
  roadworthy!: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  overallScore?: number;
}
