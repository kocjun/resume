import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from backend directory
dotenv.config({ path: path.resolve(__dirname, '../resume-backend/.env') });

// Docker 배포 환경(nginx:80) 또는 Vite dev 서버(5173) 선택
const isDocker = process.env.TEST_TARGET === 'docker';
const baseURL = isDocker ? 'http://localhost' : 'http://localhost:5173';

export default defineConfig({
    testDir: './test',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 1,
    workers: 1,
    reporter: [['html'], ['list']],
    timeout: 30000,
    expect: {
        timeout: 10000,
    },
    use: {
        baseURL,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        actionTimeout: 10000,
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        // {
        //   name: 'firefox',
        //   use: { ...devices['Desktop Firefox'] },
        // },
        // {
        //   name: 'webkit',
        //   use: { ...devices['Desktop Safari'] },
        // },
        // {
        //   name: 'mobile-chrome',
        //   use: { ...devices['Pixel 5'] },
        // },
    ],
    // Docker 환경에서는 웹서버 시작 불필요
    ...(!isDocker && {
        webServer: {
            command: 'npm run dev',
            url: 'http://localhost:5173',
            reuseExistingServer: !process.env.CI,
        },
    }),
});
