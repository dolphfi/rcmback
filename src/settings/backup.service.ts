import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execPromise = promisify(exec);

@Injectable()
export class BackupService {
    private readonly logger = new Logger(BackupService.name);

    async generateBackup(): Promise<string> {
        const dbHost = process.env.HOST_NAME || 'localhost';
        const dbPort = process.env.DB_PORT || '3306';
        const dbUser = process.env.DB_USERNAME || 'root';
        const dbPass = process.env.DB_PASSWORD || '';
        const dbName = process.env.DATABASE_NAME || 'kolabopos';

        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const timeStr = now.toISOString().slice(11, 19).replace(/:/g, '');

        // Format: dateheurenom.sql -> 202602271705kolabopos.sql
        const fileName = `${dateStr}${timeStr}${dbName}.sql`;
        const tempPath = path.join('/tmp', fileName);

        this.logger.log(`Starting backup: ${fileName}`);

        try {
            // Create a temporary options file for password to avoid insecure warning on CLI
            // Or just pass it in the command if security risk is acceptable for local environment
            // Using -p${dbPass} directly for simplicity here, but a my.cnf approach is better for production
            const command = `mysqldump -h ${dbHost} -P ${dbPort} -u ${dbUser} -p${dbPass} ${dbName} > ${tempPath}`;

            await execPromise(command);

            if (!fs.existsSync(tempPath)) {
                throw new Error('Backup file was not created');
            }

            this.logger.log(`Backup generated successfully at ${tempPath}`);
            return tempPath;
        } catch (error) {
            this.logger.error(`Backup generation failed: ${error.message}`);
            throw new InternalServerErrorException(`Backup failed: ${error.message}`);
        }
    }
}
