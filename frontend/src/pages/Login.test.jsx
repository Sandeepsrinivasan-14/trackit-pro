import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, test, vi } from 'vitest';

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ login: vi.fn(), error: null, loading: false }),
}));

// VITE_DEMO_MODE is read when Login is first loaded, so load it in a fresh module registry
// for each case and render it to static markup.
async function renderLogin(demoMode) {
  vi.resetModules();
  vi.stubEnv('VITE_DEMO_MODE', demoMode ? 'true' : '');
  const { default: Login } = await import('./Login.jsx');
  return renderToStaticMarkup(React.createElement(Login));
}

afterEach(() => {
  vi.unstubAllEnvs();
});

test('renders the login form', async () => {
  expect(await renderLogin(false)).toContain('data-testid="password-input"');
});

test('hides demo accounts by default', async () => {
  expect(await renderLogin(false)).not.toContain('demo-accounts-info');
});

test('shows demo accounts only when VITE_DEMO_MODE=true', async () => {
  expect(await renderLogin(true)).toContain('demo-accounts-info');
});
