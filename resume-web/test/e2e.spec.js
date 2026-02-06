// @ts-check
import { test, expect } from '@playwright/test';

// 환경변수에서 로그인 정보 로드
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123';

/**
 * 로그인 헬퍼 함수
 */
async function loginAsAdmin(page) {
    await page.getByRole('button', { name: 'Log In' }).click();
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.locator('form button[type="submit"]').click();
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible({ timeout: 10000 });
}

// ============================================================
// 1. 공개 페이지 테스트 (비로그인 상태)
// ============================================================
test.describe('Public View - 비로그인 공개 페이지', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.removeItem('token'));
        await page.reload();
        await page.waitForLoadState('networkidle');
    });

    test('메인 페이지가 정상적으로 로드되어야 한다', async ({ page }) => {
        await expect(page).toHaveTitle(/Full Stack Developer/);
        await expect(page.getByText('Loading resume data...')).not.toBeVisible();
    });

    test('프로필 헤더가 올바르게 표시되어야 한다', async ({ page }) => {
        // 이름 표시
        await expect(page.locator('h1').first()).toBeVisible();
        await expect(page.locator('h1').first()).toContainText('전영창');

        // 역할 표시
        await expect(page.getByText('15+ Years Full Stack Developer')).toBeVisible();

        // Contact Me 버튼
        await expect(page.getByText('Contact Me')).toBeVisible();
    });

    test('Log In 버튼이 표시되어야 한다', async ({ page }) => {
        await expect(page.getByRole('button', { name: 'Log In' })).toBeVisible();
    });

    test('비로그인 시 Create Post 바가 표시되지 않아야 한다', async ({ page }) => {
        await expect(page.getByPlaceholder('Create Post')).not.toBeVisible();
    });

    test('경력 목록이 표시되어야 한다', async ({ page }) => {
        // 첫 번째 경력 항목 확인
        await expect(page.getByText('SK인텔릭스 SCM 대시보드 개발')).toBeVisible();
        await expect(page.getByText('광명S&S').first()).toBeVisible();

        // 기술 스택 태그 확인
        await expect(page.getByText('Java').first()).toBeVisible();
    });

    test('경력 항목에 Edit 버튼이 표시되지 않아야 한다', async ({ page }) => {
        const editButtons = page.getByRole('button', { name: 'Edit' });
        await expect(editButtons).toHaveCount(0);
    });

    test('스킬 섹션이 표시되어야 한다 (데스크톱)', async ({ page }) => {
        await expect(page.getByText('About Skills')).toBeVisible();

        // 카테고리별 스킬 확인
        await expect(page.getByText('Backend').first()).toBeVisible();
        await expect(page.getByText('Frontend').first()).toBeVisible();
        await expect(page.getByText('Database').first()).toBeVisible();

        // 개별 스킬 아이템
        await expect(page.locator('text=Spring Boot').first()).toBeVisible();
        await expect(page.locator('text=Vue.js').first()).toBeVisible();
    });

    test('Personal Projects 섹션이 표시되어야 한다', async ({ page }) => {
        await expect(page.getByText('Personal Projects')).toBeVisible();
        await expect(page.getByText('Resume Web')).toBeVisible();
    });

    test('저작권 정보가 표시되어야 한다', async ({ page }) => {
        // 데스크톱에서는 사이드바에 저작권이 있음 (푸터는 lg:hidden)
        const currentYear = new Date().getFullYear().toString();
        await expect(page.getByText(new RegExp(`${currentYear}.*전영창`)).first()).toBeVisible();
    });
});


// ============================================================
// 2. 로그인 모달 테스트
// ============================================================
test.describe('Login Modal - 로그인 모달 동작', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.removeItem('token'));
        await page.reload();
        await page.waitForLoadState('networkidle');
    });

    test('Log In 버튼 클릭 시 로그인 모달이 열려야 한다', async ({ page }) => {
        await page.getByRole('button', { name: 'Log In' }).click();

        // 모달 타이틀 확인
        await expect(page.getByRole('heading', { name: 'Log In' })).toBeVisible();

        // 입력 필드 확인
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();

        // 제출 버튼 확인
        await expect(page.locator('form button[type="submit"]')).toBeVisible();
    });

    test('모달 외부 클릭 시 닫혀야 한다', async ({ page }) => {
        await page.getByRole('button', { name: 'Log In' }).click();
        await expect(page.getByRole('heading', { name: 'Log In' })).toBeVisible();

        // 모달 외부(backdrop) 클릭 - self modifier가 있는 루트 div
        await page.locator('.fixed.inset-0.z-50').click({ position: { x: 10, y: 10 } });

        await expect(page.getByRole('heading', { name: 'Log In' })).not.toBeVisible();
    });

    test('빈 필드로 제출하면 브라우저 validation이 작동해야 한다', async ({ page }) => {
        await page.getByRole('button', { name: 'Log In' }).click();

        const emailInput = page.locator('input[type="email"]');
        await expect(emailInput).toHaveAttribute('required', '');

        await page.locator('form button[type="submit"]').click();

        // 모달이 여전히 열려있어야 함
        await expect(page.getByRole('heading', { name: 'Log In' })).toBeVisible();
    });

    test('잘못된 자격증명으로 로그인 시 에러 메시지가 표시되어야 한다', async ({ page }) => {
        await page.getByRole('button', { name: 'Log In' }).click();

        await page.fill('input[type="email"]', 'wrong@email.com');
        await page.fill('input[type="password"]', 'wrongpassword');
        await page.locator('form button[type="submit"]').click();

        await expect(page.locator('.text-red-400')).toBeVisible({ timeout: 10000 });
    });

    test('Demo credentials 힌트가 표시되어야 한다', async ({ page }) => {
        await page.getByRole('button', { name: 'Log In' }).click();
        await expect(page.getByText('Demo credentials')).toBeVisible();
    });
});


// ============================================================
// 3. 인증 플로우 테스트
// ============================================================
test.describe('Authentication Flow - 인증 플로우', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.removeItem('token'));
        await page.reload();
        await page.waitForLoadState('networkidle');
    });

    test('올바른 자격증명으로 로그인에 성공해야 한다', async ({ page }) => {
        await loginAsAdmin(page);

        // Log In 버튼이 사라졌는지 확인
        await expect(page.getByRole('button', { name: 'Log In' })).not.toBeVisible();

        // 네비게이션바에 이메일 표시 확인 (대소문자 무시)
        await expect(page.locator('.sticky.top-0').getByText(/@gmail\.com/i)).toBeVisible();
    });

    test('로그인 후 페이지 새로고침 시 인증 상태가 유지되어야 한다', async ({ page }) => {
        await loginAsAdmin(page);

        await page.reload();
        await page.waitForLoadState('networkidle');

        await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
        await expect(page.getByText('Loading resume data...')).not.toBeVisible();
    });

    test('로그인 후 API 데이터가 로드되어야 한다', async ({ page }) => {
        await loginAsAdmin(page);

        await expect(page.getByText('Loading resume data...')).not.toBeVisible();
        await expect(page.locator('h1').first()).toContainText('전영창');
        await expect(page.getByText('Failed to Load Data')).not.toBeVisible();
    });

    test('로그인 후 Create Post 바가 표시되어야 한다', async ({ page }) => {
        await loginAsAdmin(page);
        await expect(page.getByPlaceholder('Create Post')).toBeVisible();
    });

    test('로그인 후 경력 항목에 Edit 버튼이 표시되어야 한다', async ({ page }) => {
        await loginAsAdmin(page);

        const editButtons = page.getByRole('button', { name: 'Edit' });
        const count = await editButtons.count();
        expect(count).toBeGreaterThan(0);
    });

    test('로그아웃이 정상적으로 작동해야 한다', async ({ page }) => {
        await loginAsAdmin(page);

        await page.getByRole('button', { name: 'Logout' }).click();

        await expect(page.getByRole('button', { name: 'Log In' })).toBeVisible();
        await expect(page.getByPlaceholder('Create Post')).not.toBeVisible();
        await expect(page.getByRole('button', { name: 'Edit' })).toHaveCount(0);
    });

    test('로그아웃 후 새로고침 시 비로그인 상태가 유지되어야 한다', async ({ page }) => {
        await loginAsAdmin(page);

        await page.getByRole('button', { name: 'Logout' }).click();
        await expect(page.getByRole('button', { name: 'Log In' })).toBeVisible();

        await page.reload();
        await page.waitForLoadState('networkidle');

        await expect(page.getByRole('button', { name: 'Log In' })).toBeVisible();
        await expect(page.getByPlaceholder('Create Post')).not.toBeVisible();
    });
});


// ============================================================
// 4. 경력 CRUD 테스트
// ============================================================
test.describe('Experience CRUD - 경력 관리', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.removeItem('token'));
        await page.reload();
        await page.waitForLoadState('networkidle');
        await loginAsAdmin(page);
    });

    test('Create Post 클릭 시 경력 생성 모달이 열려야 한다', async ({ page }) => {
        await page.getByPlaceholder('Create Post').click();

        await expect(page.getByText('Create Experience')).toBeVisible();

        // 입력 필드 확인 (ExperienceFormModal의 placeholder 기준)
        await expect(page.locator('input[placeholder="e.g. Samsung Electronics"]')).toBeVisible();
        await expect(page.locator('input[placeholder="e.g. Senior Developer"]')).toBeVisible();
        await expect(page.locator('input[placeholder="e.g. SCM Dashboard System"]')).toBeVisible();
        await expect(page.locator('input[placeholder="e.g. 2023.01 ~ 2024.12"]')).toBeVisible();
        await expect(page.locator('textarea[placeholder="Describe your role and achievements..."]')).toBeVisible();
        await expect(page.locator('input[placeholder="Add tech (Press Enter)"]')).toBeVisible();

        // Create 버튼 확인 (비활성 상태)
        const createBtn = page.getByRole('button', { name: 'Create' });
        await expect(createBtn).toBeVisible();
        await expect(createBtn).toBeDisabled();
    });

    test('새 경력을 생성할 수 있어야 한다', async ({ page }) => {
        const uniqueId = Date.now();
        const testCompany = `E2E Test Co ${uniqueId}`;
        const testProject = `Test Project ${uniqueId}`;

        await page.getByPlaceholder('Create Post').click();
        await expect(page.getByText('Create Experience')).toBeVisible();

        // 폼 입력
        await page.fill('input[placeholder="e.g. Samsung Electronics"]', testCompany);
        await page.fill('input[placeholder="e.g. Senior Developer"]', 'QA Engineer');
        await page.fill('input[placeholder="e.g. SCM Dashboard System"]', testProject);
        await page.fill('input[placeholder="e.g. 2023.01 ~ 2024.12"]', '2026.01 ~ Present');
        await page.fill('textarea[placeholder="Describe your role and achievements..."]', 'Playwright E2E 테스트로 생성된 경력 항목입니다.');

        // 기술 스택 추가
        const techInput = page.locator('input[placeholder="Add tech (Press Enter)"]');
        await techInput.fill('Playwright');
        await techInput.press('Enter');
        await techInput.fill('Node.js');
        await techInput.press('Enter');

        // 기술 스택 태그 확인 (모달 내 tech tag)
        const modal = page.locator('.fixed.inset-0');
        await expect(modal.locator('span').filter({ hasText: 'Playwright' }).first()).toBeVisible();
        await expect(modal.locator('span').filter({ hasText: 'Node.js' }).first()).toBeVisible();

        // Create 버튼 활성화 확인 후 클릭
        const createBtn = page.getByRole('button', { name: 'Create' });
        await expect(createBtn).toBeEnabled();
        await createBtn.click();

        // 모달 닫힘 확인
        await expect(page.getByText('Create Experience')).not.toBeVisible({ timeout: 10000 });

        // 새 항목이 목록에 표시되는지 확인
        await expect(page.getByText(testCompany)).toBeVisible({ timeout: 10000 });
        await expect(page.getByText(testProject)).toBeVisible();
    });

    test('경력 생성 시 필수 필드 없으면 Create 버튼이 비활성이어야 한다', async ({ page }) => {
        await page.getByPlaceholder('Create Post').click();
        await expect(page.getByText('Create Experience')).toBeVisible();

        const createBtn = page.getByRole('button', { name: 'Create' });
        const companyInput = page.locator('input[placeholder="e.g. Samsung Electronics"]');
        const projectInput = page.locator('input[placeholder="e.g. SCM Dashboard System"]');

        // 둘 다 비어있으면 비활성
        await expect(createBtn).toBeDisabled();

        // company만 입력 - 여전히 비활성
        await companyInput.fill('Test Company');
        await expect(createBtn).toBeDisabled();

        // company 비우고 project만 입력 - 여전히 비활성
        await companyInput.fill('');
        await projectInput.fill('Test Project');
        await expect(createBtn).toBeDisabled();

        // 둘 다 입력 - 활성화
        await companyInput.fill('Test Company');
        await expect(createBtn).toBeEnabled();
    });

    test('기술 스택 태그를 추가하고 클릭으로 제거할 수 있어야 한다', async ({ page }) => {
        await page.getByPlaceholder('Create Post').click();
        await expect(page.getByText('Create Experience')).toBeVisible();

        const techInput = page.locator('input[placeholder="Add tech (Press Enter)"]');
        const modal = page.locator('.fixed.inset-0');

        // 기술 스택 추가
        await techInput.fill('React');
        await techInput.press('Enter');

        // 모달 내에서 tech tag 확인 (bg-reddit-orange/10 클래스를 가진 span)
        const reactTag = modal.locator('span.text-reddit-orange').filter({ hasText: 'React' });
        await expect(reactTag).toBeVisible();

        // 클릭으로 제거
        await reactTag.click();
        await expect(reactTag).not.toBeVisible();
    });

    test('Cancel 버튼으로 경력 생성 모달을 닫을 수 있어야 한다', async ({ page }) => {
        await page.getByPlaceholder('Create Post').click();
        await expect(page.getByText('Create Experience')).toBeVisible();

        await page.getByRole('button', { name: 'Cancel' }).click();
        await expect(page.getByText('Create Experience')).not.toBeVisible();
    });

    test('경력 항목 Edit 버튼 클릭 시 수정 모달이 열려야 한다', async ({ page }) => {
        // 첫 번째 경력의 Edit 버튼 클릭
        const firstEditBtn = page.getByRole('button', { name: 'Edit' }).first();
        await firstEditBtn.click();

        // Edit Experience 모달 확인
        await expect(page.getByText('Edit Experience')).toBeVisible();

        // 기존 데이터가 폼에 채워져 있는지 확인
        const companyInput = page.locator('input[placeholder="e.g. Samsung Electronics"]');
        await expect(companyInput).not.toHaveValue('');

        // Save Changes 버튼 확인
        await expect(page.getByRole('button', { name: 'Save Changes' })).toBeVisible();
    });
});


// ============================================================
// 5. 네비게이션 바 테스트
// ============================================================
test.describe('Navigation Bar - 네비게이션 바', () => {

    test('네비게이션 바가 표시되어야 한다', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // sticky 네비게이션
        await expect(page.locator('.sticky.top-0')).toBeVisible();

        // 레딧 스타일 로고 아이콘
        await expect(page.locator('.bg-reddit-orange').first()).toBeVisible();

        // resume/ 텍스트
        await expect(page.getByText(/resume\//)).toBeVisible();
    });

    test('검색 바 모형이 데스크톱에서 표시되어야 한다', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        await expect(page.getByText('Search Resume')).toBeVisible();
    });
});


// ============================================================
// 6. 전체 플로우 통합 테스트
// ============================================================
test.describe('Full Flow Integration - 전체 플로우', () => {

    test('로그인 -> 경력 생성 -> 확인 -> 로그아웃 전체 플로우', async ({ page }) => {
        const uniqueId = Date.now();
        const testCompany = `Integration Test ${uniqueId}`;
        const testProject = `Full Flow Project ${uniqueId}`;

        // 1. 페이지 로드
        await page.goto('/');
        await page.evaluate(() => localStorage.removeItem('token'));
        await page.reload();
        await page.waitForLoadState('networkidle');

        // 2. 비로그인 상태 확인
        await expect(page.getByRole('button', { name: 'Log In' })).toBeVisible();
        await expect(page.getByPlaceholder('Create Post')).not.toBeVisible();

        // 3. 로그인
        await loginAsAdmin(page);

        // 4. 로그인 후 상태 확인
        await expect(page.getByPlaceholder('Create Post')).toBeVisible();
        await expect(page.getByText('Failed to Load Data')).not.toBeVisible();

        // 5. 경력 생성
        await page.getByPlaceholder('Create Post').click();
        await expect(page.getByText('Create Experience')).toBeVisible();

        await page.fill('input[placeholder="e.g. Samsung Electronics"]', testCompany);
        await page.fill('input[placeholder="e.g. Senior Developer"]', 'Integration Tester');
        await page.fill('input[placeholder="e.g. SCM Dashboard System"]', testProject);
        await page.fill('input[placeholder="e.g. 2023.01 ~ 2024.12"]', '2026.02 ~ Present');
        await page.fill('textarea[placeholder="Describe your role and achievements..."]', '통합 테스트로 생성된 경력');

        const techInput = page.locator('input[placeholder="Add tech (Press Enter)"]');
        await techInput.fill('Playwright');
        await techInput.press('Enter');

        await page.getByRole('button', { name: 'Create' }).click();

        // 6. 목록에서 새 경력 확인
        await expect(page.getByText(testCompany)).toBeVisible({ timeout: 10000 });
        await expect(page.getByText(testProject)).toBeVisible();

        // 7. 새로고침 후에도 유지되는지 확인
        await page.reload();
        await page.waitForLoadState('networkidle');
        await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
        await expect(page.getByText(testCompany)).toBeVisible({ timeout: 10000 });

        // 8. 로그아웃
        await page.getByRole('button', { name: 'Logout' }).click();
        await expect(page.getByRole('button', { name: 'Log In' })).toBeVisible();

        // 9. 비로그인 상태에서 fallback 데이터 사용 확인
        await expect(page.getByPlaceholder('Create Post')).not.toBeVisible();
    });
});


// ============================================================
// 7. API 응답 테스트 (네트워크 인터셉트)
// ============================================================
test.describe('API Responses - API 응답 확인', () => {

    test('로그인 API가 JWT 토큰을 반환해야 한다', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.removeItem('token'));
        await page.reload();
        await page.waitForLoadState('networkidle');

        const loginPromise = page.waitForResponse(
            response => response.url().includes('/api/auth/login') && response.status() === 200
        );

        await page.getByRole('button', { name: 'Log In' }).click();
        await page.fill('input[type="email"]', ADMIN_EMAIL);
        await page.fill('input[type="password"]', ADMIN_PASSWORD);
        await page.locator('form button[type="submit"]').click();

        const loginResponse = await loginPromise;
        const body = await loginResponse.json();

        expect(body.token).toBeTruthy();
        expect(body.email).toBeTruthy();
    });

    test('로그인 후 이력서 API가 정상 데이터를 반환해야 한다', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.removeItem('token'));
        await page.reload();
        await page.waitForLoadState('networkidle');

        await page.getByRole('button', { name: 'Log In' }).click();
        await page.fill('input[type="email"]', ADMIN_EMAIL);
        await page.fill('input[type="password"]', ADMIN_PASSWORD);

        const resumePromise = page.waitForResponse(
            response => response.url().includes('/api/resume') && response.status() === 200
        );

        await page.locator('form button[type="submit"]').click();

        const resumeResponse = await resumePromise;
        const body = await resumeResponse.json();

        expect(body.profile).toBeTruthy();
        expect(body.profile.name).toBe('전영창');
        expect(body.skills).toBeTruthy();
        expect(body.experience).toBeTruthy();
        expect(body.experience.length).toBeGreaterThan(0);
    });

    test('잘못된 토큰으로 API 요청 시 401 응답이 와야 한다', async ({ page }) => {
        await page.goto('/');

        await page.evaluate(() => localStorage.setItem('token', 'invalid-fake-token'));

        const resumePromise = page.waitForResponse(
            response => response.url().includes('/api/resume')
        );

        await page.reload();

        const resumeResponse = await resumePromise;
        expect(resumeResponse.status()).toBe(401);
    });

    test('Health check 엔드포인트가 응답해야 한다', async ({ page }) => {
        const response = await page.request.get('/health');
        expect(response.ok()).toBeTruthy();
    });
});


// ============================================================
// 8. 데이터 일관성 테스트
// ============================================================
test.describe('Data Consistency - 데이터 일관성', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.removeItem('token'));
        await page.reload();
        await page.waitForLoadState('networkidle');
    });

    test('fallback 데이터에 모든 필수 섹션이 포함되어야 한다', async ({ page }) => {
        // 프로필 섹션
        await expect(page.locator('h1').first()).toBeVisible();
        await expect(page.getByText('15+ Years Full Stack Developer')).toBeVisible();

        // 경력 섹션 - 최소 5개 이상
        const experienceCards = page.locator('article, [class*="cursor-pointer"]').filter({ hasText: /\d{4}\.\d{2}/ });
        const count = await experienceCards.count();
        expect(count).toBeGreaterThanOrEqual(5);

        // 스킬 섹션
        await expect(page.getByText('About Skills')).toBeVisible();

        // Personal Projects
        await expect(page.getByText('Personal Projects')).toBeVisible();
    });

    test('경력 항목에 기술 스택 정보가 포함되어야 한다', async ({ page }) => {
        // 첫 번째 경력에 Java 기술 스택이 있는지 확인
        // ExperienceItem의 tech tag: class="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#272729]"
        const firstExperienceJava = page.locator('[class*="bg-\\[\\#272729\\]"]').filter({ hasText: /^Java$/ }).first();
        await expect(firstExperienceJava).toBeVisible();
    });

    test('개인정보가 마스킹 처리되어야 한다 (비로그인)', async ({ page }) => {
        const pageContent = await page.textContent('body');

        // 마스킹된 전화번호 확인 - 실제 번호가 노출되지 않아야 함
        expect(pageContent).not.toContain('010-8838-2248');
    });
});


// ============================================================
// 9. 테스트 데이터 정리 (Cleanup)
// ============================================================
test.describe('Cleanup - 테스트 데이터 정리', () => {

    test('테스트에서 생성한 경력 항목 삭제', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.removeItem('token'));
        await page.reload();
        await page.waitForLoadState('networkidle');

        await loginAsAdmin(page);

        const token = await page.evaluate(() => localStorage.getItem('token'));

        const resumeResponse = await page.request.get('/api/resume', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (resumeResponse.ok()) {
            const data = await resumeResponse.json();
            const testExperiences = data.experience.filter(
                /** @param {any} exp */
                (exp) => exp.company && (
                    exp.company.includes('E2E Test Co') ||
                    exp.company.includes('Integration Test') ||
                    exp.company === 'Playwright Test Company'
                )
            );

            for (const exp of testExperiences) {
                const expId = exp._id || exp.id;
                if (expId) {
                    await page.request.delete(`/api/resume/experience/${expId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                }
            }

            if (testExperiences.length > 0) {
                await page.reload();
                await page.waitForLoadState('networkidle');

                for (const exp of testExperiences) {
                    await expect(page.getByText(exp.company)).not.toBeVisible();
                }
            }
        }
    });
});
