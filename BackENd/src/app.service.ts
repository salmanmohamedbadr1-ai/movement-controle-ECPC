import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'welcome To Movment control ECPC 2026 system';
  }
}
