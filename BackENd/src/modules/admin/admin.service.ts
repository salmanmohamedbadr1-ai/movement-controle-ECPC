import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class AdminService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async truncateAll(): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.query(
        'TRUNCATE TABLE notifications, request_history, requests RESTART IDENTITY CASCADE',
      );
      await manager.query('DELETE FROM users WHERE role != $1', [
        UserRole.LEADER,
      ]);
    });
  }
}
