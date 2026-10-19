// react-router-dom v7 ships ESM only, which CRA's Jest cannot load, so mock what Login needs.
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), { virtual: true });
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({ login: jest.fn(), error: null, loading: false }),
}));

// REACT_APP_DEMO_MODE is read when Login is first loaded, so load it in a fresh module registry
// for each case and render it to static markup.
function renderLogin(demoMode) {
  if (demoMode) process.env.REACT_APP_DEMO_MODE = 'true';
  else delete process.env.REACT_APP_DEMO_MODE;
  let html = '';
  jest.isolateModules(() => {
    const React = require('react');
    const { renderToStaticMarkup } = require('react-dom/server');
    const Login = require('./Login').default;
    html = renderToStaticMarkup(React.createElement(Login));
  });
  return html;
}

afterEach(() => {
  delete process.env.REACT_APP_DEMO_MODE;
});

test('renders the login form', () => {
  expect(renderLogin(false)).toContain('data-testid="password-input"');
});

test('hides demo accounts by default', () => {
  expect(renderLogin(false)).not.toContain('demo-accounts-info');
});

test('shows demo accounts only when REACT_APP_DEMO_MODE=true', () => {
  expect(renderLogin(true)).toContain('demo-accounts-info');
});
