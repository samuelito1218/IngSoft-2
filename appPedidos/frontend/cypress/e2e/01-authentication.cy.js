// cypress/e2e/01-authentication.cy.js

describe('Autenticación', () => {
  beforeEach(() => {
    // Limpiar localStorage antes de cada prueba
    cy.clearLocalStorage();
  });

  it('debe mostrar la página de login correctamente', () => {
    cy.visit('/login');
    
    // Verificar elementos de la página
    cy.contains('Iniciar Sesión').should('be.visible');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
    
    // Verificar que el botón está inicialmente deshabilitado o habilitado
    cy.get('button[type="submit"]').should('contain', 'Iniciar Sesión');
  });

  it('debe mostrar errores de validación con campos vacíos', () => {
    cy.visit('/login');
    
    // Intentar enviar formulario vacío
    cy.get('button[type="submit"]').click();
    
    // Verificar validación HTML5
    cy.get('input[type="email"]:invalid').should('exist');
  });

  it('debe mostrar error con credenciales incorrectas', () => {
    cy.visit('/login');
    
    // Llenar con credenciales incorrectas
    cy.get('input[type="email"]').type('usuario@incorrecto.com');
    cy.get('input[type="password"]').type('passwordincorrecto');
    
    // Enviar formulario
    cy.get('button[type="submit"]').click();
    
    // Verificar mensaje de error
    cy.contains('Credenciales incorrectas').should('be.visible');
  });

  it('debe hacer login exitoso con credenciales correctas', () => {
    cy.visit('/login');
    
    // Interceptar la llamada de login
    cy.intercept('POST', '**/auth/login', {
      statusCode: 200,
      body: {
        token: 'fake-jwt-token',
        user: {
          id: '1',
          email: 'admin@test.com',
          name: 'Usuario Test',
          role: 'ADMIN'
        }
      }
    }).as('loginRequest');
    
    // Llenar formulario con credenciales correctas
    cy.get('input[type="email"]').type(Cypress.env('testUser').email);
    cy.get('input[type="password"]').type(Cypress.env('testUser').password);
    
    // Enviar formulario
    cy.get('button[type="submit"]').click();
    
    // Verificar que se hizo la llamada
    cy.wait('@loginRequest');
    
    // Verificar redirección al dashboard
    cy.url().should('include', '/admin');
    cy.contains('Dashboard de Administración').should('be.visible');
  });

  it('debe mantener la sesión después de recargar la página', () => {
    // Simular login exitoso
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'fake-jwt-token');
      win.localStorage.setItem('user', JSON.stringify({
        id: '1',
        email: 'admin@test.com',
        name: 'Usuario Test'
      }));
    });
    
    cy.visit('/admin');
    
    // Verificar que está autenticado
    cy.contains('Dashboard de Administración').should('be.visible');
    
    // Recargar página
    cy.reload();
    
    // Verificar que sigue autenticado
    cy.contains('Dashboard de Administración').should('be.visible');
  });

  it('debe hacer logout correctamente', () => {
    // Simular login
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'fake-jwt-token');
      win.localStorage.setItem('user', JSON.stringify({
        id: '1',
        email: 'admin@test.com',
        name: 'Usuario Test'
      }));
    });
    
    cy.visit('/admin');
    
    // Buscar y hacer clic en logout
    cy.get('[data-testid="logout-button"]', { timeout: 5000 })
      .should('be.visible')
      .click();
    
    // Verificar redirección a login
    cy.url().should('include', '/login');
    
    // Verificar que el localStorage se limpió
    cy.window().its('localStorage.token').should('not.exist');
  });

  it('debe redirigir a login si no está autenticado', () => {
    // Intentar acceder a ruta protegida sin autenticación
    cy.visit('/admin/restaurantes');
    
    // Verificar redirección a login
    cy.url().should('include', '/login');
  });
});