import { Controller, Get } from '@nestjs/common';
import { AssetsCatalogService } from './assets-catalog.service';

@Controller('assets-catalog')
export class AssetsCatalogController {
  constructor(private readonly assetsCatalogService: AssetsCatalogService) {}

  @Get()
  getCatalog() {
    return this.assetsCatalogService.getCatalog();
  }
}
