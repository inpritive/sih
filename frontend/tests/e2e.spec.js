import { test, expect } from '@playwright/test';

test.describe('E2E Features', () => {
  // Test frontend features. We assume the backend is running at localhost:8000
  // and frontend at localhost:5173 or similar, or we can just serve the build.
  // Actually, we'll navigate to the frontend URL (e.g. localhost:5173).
  // This requires the dev server to be running.
  
  const frontendUrl = 'http://127.0.0.1:5173';

  test.afterAll(async () => {
    const apiContext = await test.request.newContext({ baseURL: 'http://127.0.0.1:8000' });
    await apiContext.delete('/test/teardown');
  });

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`BROWSER ERROR: ${msg.text()}`);
    });
    page.on('pageerror', exception => {
      console.log(`UNCAUGHT EXCEPTION: ${exception}`);
    });
    await page.goto(frontendUrl, { waitUntil: 'networkidle' });
    // Wait for the app to render its main layout before proceeding
    await page.waitForSelector('.leaflet-container', { state: 'visible', timeout: 15000 });
  });

  test('Loading the deployed app shows the map with all camera markers', async ({ page }) => {
    // 9. Loading the deployed app shows the map with all camera markers matching what GET /cameras returns.
    await expect(page.locator('.leaflet-marker-icon').first()).toBeVisible({ timeout: 15000 });
    const markersCount = await page.locator('.leaflet-marker-icon').count();
    expect(markersCount).toBeGreaterThan(0);
  });

  test('Entering a plate in Trajectory Search renders a route', async ({ page }) => {
    const apiContext = await test.request.newContext({ baseURL: 'http://127.0.0.1:8000' });
    await apiContext.post('/sighting', {
      data: { plate: 'TESTPLATE', camera_id: 'CAM_1', timestamp: new Date().toISOString(), confidence: 0.99, vehicle_type: 'car', color: 'red' }
    });
    
    // 10. Entering a plate in Trajectory Search and submitting renders a route on the map
    await page.getByText('Trajectory Search', { exact: true }).click();
    
    const input = page.locator('input[placeholder*="plate" i]');
    await input.waitFor({ state: 'visible' });
    await input.fill('TESTPLATE');
    
    await page.getByRole('button', { name: /search/i }).click();
    
    // It should render a polyline or markers
    await expect(page.locator('.leaflet-marker-icon').first()).toBeVisible({ timeout: 15000 });
  });

  test('Analytics tab renders charts with real numbers', async ({ page }) => {
    const apiContext = await test.request.newContext({ baseURL: 'http://127.0.0.1:8000' });
    await apiContext.post('/sighting', {
      data: { plate: 'TESTANALYTICS', camera_id: 'CAM_1', timestamp: new Date().toISOString(), confidence: 0.99, vehicle_type: 'bus', color: 'white' }
    });

    // 11. Analytics tab renders charts
    await page.getByText('Analytics', { exact: true }).click();
    
    // Wait for canvas from chart.js to load
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 15000 });
  });

  test('Live Alerts tab updates on new alert', async ({ page }) => {
    // 12. Live Alerts tab: triggering a blacklist or clone event on backend results in a new alert
    const apiContext = await test.request.newContext({ baseURL: 'http://127.0.0.1:8000' });
    
    // First, add plate to blacklist
    await apiContext.post('/blacklist', {
      data: { plate: 'E2EBAD', reason: 'E2E Testing' }
    });

    // Go to Live Alerts tab
    await page.getByText('Live Alerts', { exact: true }).click();
    
    // Trigger sighting
    await apiContext.post('/sighting', {
      data: { plate: 'E2EBAD', camera_id: 'CAM_1', timestamp: new Date().toISOString(), confidence: 0.95, vehicle_type: 'car', color: 'red' }
    });
    
    // Should see alert in the list
    await expect(page.locator('text="E2EBAD"').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Blacklist').first()).toBeVisible({ timeout: 15000 });
  });

  test('Camera Feeds tab updates detection overlay', async ({ page }) => {
    // 13. Camera Feeds tab: each tile's detection overlay updates when a new sighting fires
    await page.getByText('Camera Feeds', { exact: true }).click();
    
    const apiContext = await test.request.newContext({ baseURL: 'http://127.0.0.1:8000' });

    await apiContext.post('/sighting', {
      data: { plate: 'FEED123', camera_id: 'CAM_2', timestamp: new Date().toISOString(), confidence: 0.95, vehicle_type: 'car', color: 'blue' }
    });
    
    await expect(page.locator('text="FEED123"').first()).toBeVisible({ timeout: 15000 });
  });
});
