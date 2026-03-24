import { Module } from '@nestjs/common';
import { AssetsCatalogController } from './assets-catalog.controller';
import { AssetsCatalogService } from './assets-catalog.service';

@Module({
  controllers: [AssetsCatalogController],
  providers: [AssetsCatalogService],
})
export class AssetsCatalogModule {}
