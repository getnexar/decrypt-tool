# Test Engineer Reference

## Domain-Specific Testing Patterns

### Backend API Testing

**Framework Recommendations:**
- **Node.js:** Jest + Supertest + TestContainers
- **Python:** pytest + requests + pytest-docker
- **Go:** testing + httptest + testcontainers-go

**Key Patterns:**
- Test all CRUD operations
- Verify request/response schemas
- Test authentication/authorization
- Validate error responses
- Test rate limiting
- Check pagination
- Verify data validation
- Test concurrent requests
- Validate database transactions

**Example Test Structure (Node.js/Jest):**
```javascript
describe('POST /api/users', () => {
  it('creates user with valid data', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ email: 'test@example.com', password: 'secure123' })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.email).toBe('test@example.com');
  });

  it('returns 400 for missing email', async () => {
    await request(app)
      .post('/api/users')
      .send({ password: 'secure123' })
      .expect(400);
  });

  it('returns 409 for duplicate email', async () => {
    await createUser({ email: 'test@example.com' });
    await request(app)
      .post('/api/users')
      .send({ email: 'test@example.com', password: 'secure123' })
      .expect(409);
  });

  it('sanitizes password in response', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ email: 'test@example.com', password: 'secure123' })
      .expect(201);

    expect(response.body.password).toBeUndefined();
  });
});

describe('GET /api/users/:id', () => {
  it('returns user when found', async () => {
    const user = await createUser({ email: 'test@example.com' });
    const response = await request(app)
      .get(`/api/users/${user.id}`)
      .expect(200);

    expect(response.body.id).toBe(user.id);
  });

  it('returns 404 when user not found', async () => {
    await request(app)
      .get('/api/users/999999')
      .expect(404);
  });

  it('requires authentication', async () => {
    const user = await createUser();
    await request(app)
      .get(`/api/users/${user.id}`)
      .expect(401);
  });
});
```

**Contract Testing:**
```javascript
// Using Pact for consumer-driven contract tests
const { Pact } = require('@pact-foundation/pact');

describe('User API Contract', () => {
  const provider = new Pact({
    consumer: 'FrontendApp',
    provider: 'UserAPI'
  });

  beforeAll(() => provider.setup());
  afterAll(() => provider.finalize());

  it('returns user list', async () => {
    await provider.addInteraction({
      state: 'user exists',
      uponReceiving: 'a request for users',
      withRequest: {
        method: 'GET',
        path: '/api/users'
      },
      willRespondWith: {
        status: 200,
        body: [{ id: 1, email: 'test@example.com' }]
      }
    });

    // Execute test
  });
});
```

---

### Frontend E2E Testing

**Framework Recommendations:**
- **Playwright** - Modern, fast, cross-browser
- **Cypress** - Developer-friendly, great DX
- **Puppeteer** - Lightweight, Chrome-focused

**Key Patterns:**
- Test complete user journeys
- Verify accessibility (keyboard navigation, ARIA)
- Check responsive behavior
- Test error states and loading indicators
- Validate form interactions
- Test navigation and routing
- Verify data persistence
- Test authentication flows

**Example Test Structure (Playwright):**
```javascript
import { test, expect } from '@playwright/test';

test.describe('User Registration Flow', () => {
  test('completes registration successfully', async ({ page }) => {
    await page.goto('/register');

    // Fill form
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.fill('[name="confirmPassword"]', 'SecurePass123!');

    // Submit
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('.welcome-message')).toContainText('Welcome');
  });

  test('validates email format', async ({ page }) => {
    await page.goto('/register');

    await page.fill('[name="email"]', 'invalid-email');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    await expect(page.locator('.error-message')).toContainText('Invalid email');
  });

  test('requires password match', async ({ page }) => {
    await page.goto('/register');

    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.fill('[name="confirmPassword"]', 'DifferentPass123!');
    await page.click('button[type="submit"]');

    await expect(page.locator('.error-message')).toContainText('Passwords must match');
  });
});

test.describe('Accessibility', () => {
  test('navigates form with keyboard', async ({ page }) => {
    await page.goto('/register');

    // Tab through form fields
    await page.keyboard.press('Tab');
    await expect(page.locator('[name="email"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('[name="password"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('[name="confirmPassword"]')).toBeFocused();
  });

  test('has proper ARIA labels', async ({ page }) => {
    await page.goto('/register');

    const emailInput = page.locator('[name="email"]');
    await expect(emailInput).toHaveAttribute('aria-label', 'Email address');

    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toHaveAttribute('aria-label', 'Submit registration');
  });
});

test.describe('Responsive Design', () => {
  test('displays mobile layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');

    await expect(page.locator('.mobile-nav')).toBeVisible();
    await expect(page.locator('.desktop-nav')).not.toBeVisible();
  });

  test('displays desktop layout', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/dashboard');

    await expect(page.locator('.desktop-nav')).toBeVisible();
    await expect(page.locator('.mobile-nav')).not.toBeVisible();
  });
});
```

**Visual Regression Testing:**
```javascript
test('dashboard matches snapshot', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveScreenshot('dashboard.png');
});
```

---

### Firmware HIL Testing

**Framework Recommendations:**
- **pytest** - Python-based test framework
- **Unity** - C test framework for embedded
- **Robot Framework** - Keyword-driven testing

**Key Patterns:**
- Test hardware interactions via test harness
- Verify protocol compliance (I2C, SPI, UART, CAN, BLE)
- Test power states and transitions
- Validate memory usage and leaks
- Test real-time constraints
- Verify safety-critical scenarios
- Test OTA updates
- Validate sensor readings and actuator control

**Example Test Structure (pytest + test harness):**
```python
import pytest
from test_harness import TestHarness

@pytest.fixture
def device():
    """Setup test harness and device under test."""
    harness = TestHarness()
    harness.reset_device()
    yield harness
    harness.cleanup()

class TestI2CProtocol:
    def test_device_responds_to_address(self, device):
        """Verify device responds to correct I2C address."""
        response = device.i2c_scan()
        assert 0x42 in response, "Device not found at expected address"

    def test_register_read_write(self, device):
        """Test reading and writing I2C registers."""
        # Write to control register
        device.i2c_write(address=0x42, register=0x01, value=0xFF)

        # Read back
        value = device.i2c_read(address=0x42, register=0x01)
        assert value == 0xFF, f"Expected 0xFF, got {hex(value)}"

    def test_handles_bus_collision(self, device):
        """Verify device handles I2C bus collisions."""
        device.i2c_inject_collision()

        # Device should retry and succeed
        value = device.i2c_read(address=0x42, register=0x01)
        assert value is not None, "Device failed to recover from bus collision"

class TestPowerManagement:
    def test_sleep_mode_reduces_current(self, device):
        """Verify sleep mode reduces current consumption."""
        # Measure active current
        device.send_command("WAKE")
        active_current = device.measure_current()
        assert active_current > 10.0, f"Active current too low: {active_current}mA"

        # Enter sleep mode
        device.send_command("SLEEP")
        device.wait_ms(100)

        # Measure sleep current
        sleep_current = device.measure_current()
        assert sleep_current < 0.5, f"Sleep current too high: {sleep_current}mA"

    def test_wakes_from_interrupt(self, device):
        """Verify device wakes from sleep on interrupt."""
        device.send_command("SLEEP")
        device.wait_ms(100)

        # Trigger wake interrupt
        device.gpio_set_high(pin=5)
        device.wait_ms(10)

        # Verify device is awake
        status = device.get_status()
        assert status['awake'] == True, "Device did not wake from interrupt"

class TestSafetyConstraints:
    def test_temperature_shutdown(self, device):
        """Verify device shuts down at max temperature."""
        # Simulate high temperature
        device.set_temperature(85.0)
        device.wait_ms(100)

        # Verify shutdown
        status = device.get_status()
        assert status['shutdown_reason'] == 'OVER_TEMP'

    def test_overcurrent_protection(self, device):
        """Verify device protects against overcurrent."""
        # Set current limit
        device.send_command("SET_CURRENT_LIMIT", value=1000)

        # Inject overcurrent condition
        device.inject_current(2000)

        # Verify protection triggered
        status = device.get_status()
        assert status['fault'] == 'OVERCURRENT'
        assert status['output_enabled'] == False

class TestOTAUpdate:
    def test_successful_firmware_update(self, device):
        """Verify OTA firmware update process."""
        initial_version = device.get_version()

        # Upload new firmware
        device.start_ota_update('firmware_v2.bin')

        # Wait for update and reboot
        device.wait_for_reboot(timeout=30)

        # Verify new version
        new_version = device.get_version()
        assert new_version != initial_version
        assert new_version == "v2.0.0"

    def test_rollback_on_corrupt_firmware(self, device):
        """Verify device rolls back on corrupt firmware."""
        initial_version = device.get_version()

        # Upload corrupt firmware
        device.start_ota_update('corrupt_firmware.bin')
        device.wait_for_reboot(timeout=30)

        # Verify rollback to original version
        version = device.get_version()
        assert version == initial_version
```

---

## Test Coverage Standards

### Minimum Coverage Targets
- **Unit tests:** >80% line coverage
- **Integration tests:** All critical paths covered
- **E2E tests:** All primary user journeys covered
- **Performance tests:** Key operations within SLAs

### Coverage by Domain
**Backend:**
- Business logic: 90%+
- API endpoints: 100%
- Database queries: 85%+
- Error handling: 100%

**Frontend:**
- Components: 80%+
- User journeys: 100% of critical flows
- Edge cases: 70%+

**Firmware:**
- Safety-critical code: 100%
- Protocol handlers: 95%+
- Power management: 90%+

---

## Common Anti-Patterns

### ❌ Don't Do This:

1. **Testing Implementation Details**
```javascript
// Bad - tests internal implementation
it('calls setState with correct value', () => {
  const spy = jest.spyOn(component, 'setState');
  component.handleClick();
  expect(spy).toHaveBeenCalledWith({ clicked: true });
});

// Good - tests behavior
it('shows clicked state after button click', () => {
  component.handleClick();
  expect(component.getText()).toBe('Clicked!');
});
```

2. **Hardcoded Delays**
```javascript
// Bad - flaky test
it('loads data', async () => {
  fetchData();
  await sleep(1000); // What if it takes 1001ms?
  expect(getData()).toBeDefined();
});

// Good - wait for condition
it('loads data', async () => {
  fetchData();
  await waitFor(() => expect(getData()).toBeDefined());
});
```

3. **Shared State Between Tests**
```javascript
// Bad - tests depend on each other
let user;
it('creates user', () => {
  user = createUser();
});
it('updates user', () => {
  updateUser(user); // Fails if first test fails
});

// Good - independent tests
it('creates user', () => {
  const user = createUser();
  expect(user).toBeDefined();
});
it('updates user', () => {
  const user = createUser();
  updateUser(user);
});
```

4. **Skipping Test Cleanup**
```javascript
// Bad - leaves test data
it('creates record', () => {
  createRecord({ id: 1 });
  expect(getRecord(1)).toBeDefined();
});

// Good - cleans up
it('creates record', () => {
  const record = createRecord({ id: 1 });
  expect(getRecord(1)).toBeDefined();

  // Cleanup
  deleteRecord(1);
});
```

### ✅ Do This:

1. **Test Behavior, Not Implementation**
2. **Use Proper Wait Conditions**
3. **Keep Tests Independent**
4. **Clean Up Resources**
5. **Use Descriptive Test Names**
6. **Test One Thing Per Test**
7. **Use Test Fixtures for Setup**
8. **Mock External Dependencies**

---

## Performance Testing Patterns

### Load Testing (Backend)
```javascript
// Using k6 for load testing
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 100 },  // Ramp up
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% failure rate
  },
};

export default function() {
  let response = http.get('https://api.example.com/users');

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

### Performance Monitoring (Frontend)
```javascript
// Using Lighthouse CI
test('meets Core Web Vitals thresholds', async ({ page }) => {
  await page.goto('/');

  const metrics = await page.evaluate(() => {
    return new Promise((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        resolve(entries.map(e => ({ name: e.name, value: e.value })));
      }).observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
    });
  });

  const lcp = metrics.find(m => m.name === 'largest-contentful-paint');
  expect(lcp.value).toBeLessThan(2500); // LCP < 2.5s
});
```
