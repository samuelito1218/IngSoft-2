import './commands';

beforeEach(() => {
  cy.window().then((win) => {
    cy.stub(win.console, 'error').as('consoleError');
  });
});

Cypress.on('uncaught:exception', (err, runnable) => {
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false;
  }
  if (err.message.includes('fetch')) {
    return false;
  }
  return true;
});