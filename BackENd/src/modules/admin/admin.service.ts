import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AdminService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  // Mirrors the seed script's own reset scope exactly (src/database/seed.ts)
  // — full wipe including users. A fresh login fails afterward until the DB
  // is reseeded; an already-issued JWT still passes JwtAuthGuard within its
  // validity window since that guard never re-checks the DB, but any lookup
  // that does hit the DB (e.g. a fresh POST /auth/login) will not find a match.
  async truncateAll(): Promise<void> {
    await this.dataSource.query(
      'TRUNCATE TABLE notifications, request_history, requests, users RESTART IDENTITY CASCADE',
    );
  }
}
