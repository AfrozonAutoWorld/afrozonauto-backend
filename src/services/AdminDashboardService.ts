import { injectable, inject } from 'inversify';
import { TYPES } from '../config/types';
import { AdminDashboardRepository } from '../repositories/AdminDashboardRepository';

@injectable()
export class AdminDashboardService {
  constructor(
    @inject(TYPES.AdminDashboardRepository)
    private repo: AdminDashboardRepository,
  ) {}

  getDashboardStats() {
    return this.repo.getDashboardStats();
  }

  getPendingOrders(page = 1, limit = 10) {
    return this.repo.getPendingOrders(page, limit);
  }

  getRecentActivity(limit = 20) {
    return this.repo.getRecentActivity(limit);
  }
}
