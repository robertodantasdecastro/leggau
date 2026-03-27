import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AssetsCatalogService {
  constructor(private readonly configService: ConfigService) {}

  getCatalog() {
    return {
      mascot: {
        name: 'Gau',
        brand: 'Leggau',
        visualStyle: 'thumb-creature',
        palette: {
          primary: '#1E90FF',
          success: '#42D392',
          accent: '#FFC64D',
          outline: '#FF8C42',
        },
      },
      api: {
        devBaseUrl:
          this.configService.get<string>('DEV_API_ALIAS_URL') ??
          this.configService.get<string>('DEV_API_BASE_URL') ??
          'http://localhost:8080/api',
        prodBaseUrl:
          this.configService.get<string>('PROD_API_BASE_URL') ??
          'https://api.leggau.com',
      },
      scenes: [
        {
          key: 'BathroomAdventure',
          mode: '3d',
          objective: 'Escovar os dentes',
        },
        {
          key: 'BedroomQuest',
          mode: '3d',
          objective: 'Arrumar a cama',
        },
      ],
      overlays: [
        {
          key: 'DailyProgressHud',
          mode: '2d',
          objective: 'Exibir pontos, tarefas e feedback do Gau',
        },
      ],
      audioCues: {
        success: 'gau_success_pop',
        reminder: 'gau_soft_prompt',
      },
    };
  }
}
