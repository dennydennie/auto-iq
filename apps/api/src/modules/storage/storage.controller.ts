import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../../common/guards/auth.guard";
import { CsrfGuard } from "../../common/guards/csrf.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { DocumentPresignDto, ImagePresignDto } from "./dto/storage.dto";
import { StorageService } from "./storage.service";

@Controller("storage")
@UseGuards(AuthGuard, RolesGuard, CsrfGuard)
@Roles("SELLER")
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post("images/presign")
  presignImage(@Body() body: ImagePresignDto) {
    return this.storageService.presignImage(body.contentType, body.contentLength);
  }

  @Post("documents/presign")
  presignDocument(@Body() body: DocumentPresignDto) {
    return this.storageService.presignDocument(body.contentType, body.contentLength);
  }
}
