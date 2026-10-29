import { expect, test } from '@playwright/test';

const id = '00000000-0000-4000-8000-000000000002';
const admin = '00000000-0000-4000-8000-000000000001';
for (const width of [375, 1440]) {
  test(`Admin grants an Employee business responsibility at ${width}px`, async ({ page, context }) => {
    await page.setViewportSize({ width, height: 900 });
    await context.addCookies([{ name: 'securaai_access', value: 'responsibility-test', domain: '127.0.0.1', path: '/', httpOnly: true }]);
    await page.route('**/api/auth/session', (route) => route.fulfill({ json: { success: true, data: { user: {
      id: admin, email: 'admin@example.test', fullName: 'Admin', status: 'active', mustChangePassword: false,
      roles: [{ code: 'ADMIN', name: 'Admin' }], permissions: ['users.read', 'users.assign-role'],
    } } } }));
    await page.route(/\/api\/users(?:\?.*)?$/, (route) => route.fulfill({ json: { success: true, data: {
      items: [{ id, fullName: 'Employee Test', email: 'employee@example.test', status: 'active', employeeCode: null, department: null, roles: [{ code: 'EMPLOYEE', name: 'Employee' }] }],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 }, summary: { active: 1, locked: 0, inactive: 0, disabled: 0 },
    } } }));
    await page.route('**/api/users/departments', (route) => route.fulfill({ json: { success: true, data: { departments: [] } } }));
    await page.route('**/api/users/access-assignment-options', (route) => route.fulfill({ json: { success: true, data: {
      roles: [{ code: 'EMPLOYEE', name: 'Employee' }],
      scopeCodes: [{ code: 'RISK_OWNER', name: 'Risk Owner' }, { code: 'CONTROL_OWNER', name: 'Control Owner' }, { code: 'ASSET_OWNER', name: 'Asset Owner' }],
      targetTypes: ['GLOBAL'], businessServices: [], assets: [],
    } } }));
    await page.route(`**/api/users/${id}/access-assignment`, (route) => {
      if (route.request().method() === 'PUT') {
        expect(route.request().postDataJSON()).toEqual({ role: 'EMPLOYEE', scopes: [{ scopeCode: 'RISK_OWNER', targetType: 'GLOBAL', expiresAt: null }] });
        return route.fulfill({ json: { success: true, data: { changed: true, role: 'EMPLOYEE', scopeCount: 1 } } });
      }
      return route.fulfill({ json: { success: true, data: {
        user: { id, fullName: 'Employee Test', email: 'employee@example.test', status: 'ACTIVE' }, role: 'EMPLOYEE', scopes: [],
        ownershipSummary: { businessServices: 0, assets: 0, risks: 0, treatmentPlans: 0, treatmentActions: 0, securityControls: 0, evidenceItems: 0, policies: 0 },
      } } });
    });
    await page.goto('/admin/users');
    await page.getByRole('button', { name: /More actions for Employee Test/ }).click();
    await page.getByRole('button', { name: 'Assign access to Employee Test' }).click();
    const dialog = page.getByRole('dialog', { name: 'Assign role, scope & ownership' });
    await dialog.getByRole('checkbox', { name: /Risk Owner/ }).check();
    expect((await dialog.boundingBox())?.width).toBeLessThanOrEqual(width);
    await dialog.getByRole('button', { name: 'Save assignment' }).click();
    await expect(dialog).not.toBeVisible();
  });
}
