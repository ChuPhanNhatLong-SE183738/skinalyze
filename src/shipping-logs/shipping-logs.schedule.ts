import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ShippingLogsService } from './shipping-logs.service';

/**
 * 🤖 Scheduler for shipping logs auto-assignment
 * Runs every hour to check for unassigned shipping logs older than 24 hours
 * and automatically assigns them to random active staff members
 */
@Injectable()
export class ShippingLogsScheduler {
  private readonly logger = new Logger(ShippingLogsScheduler.name);

  constructor(private readonly shippingLogsService: ShippingLogsService) {}

  /**
   * 🕐 Runs every hour to auto-assign unassigned shipping logs
   * If a shipping log has been pending for more than 24 hours without a staff assignment,
   * it will be automatically assigned to a random active staff member
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleAutoAssignShippingLogs() {
    this.logger.log(
      '🔄 Running Cron: Auto-assign unassigned shipping logs after 24 hours...',
    );

    try {
      const result =
        await this.shippingLogsService.autoAssignUnassignedShippingLogs();

      if (result.assignedCount > 0) {
        this.logger.log(
          `✅ Auto-assigned ${result.assignedCount} shipping logs to staff members`,
        );
      } else {
        this.logger.log('✅ No shipping logs needed auto-assignment');
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `❌ Failed to auto-assign shipping logs: ${err.message}`,
        err.stack,
      );
    }
  }
}
