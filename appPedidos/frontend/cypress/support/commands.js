// cypress/support/commands.js

// Comando para login
Cypress.Commands.add('login', (email = Cypress.env('testUser').email, password = Cypress.env('testUser').password) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    
    // Verificar que estamos en la página de login
    cy.contains('Iniciar Sesión').should('be.visible');
    
    // Llenar formulario
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type(password);
    
    // Hacer clic en el botón de login
    cy.get('button[type="submit"]').click();
    
    // Verificar que el login fue exitoso
    cy.url().should('include', '/admin');
    cy.window().its('localStorage.token').should('exist');
  });
});

// Comando para crear un restaurante de prueba
Cypress.Commands.add('createTestRestaurant', (restaurantData = {}) => {
  const defaultData = {
    nombre: 'Restaurante Test Cypress',
    descripcion: 'Restaurante creado para pruebas automatizadas',
    categorias: ['General'],
    branches: [{
      nombre: 'Sucursal Principal',
      direccion: 'Calle 10 #43-12',
      comuna: 'Comuna 14'
    }]
  };

  const data = { ...defaultData, ...restaurantData };

  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/restaurantes/crear`,
    headers: {
      'Authorization': `Bearer ${window.localStorage.getItem('token')}`
    },
    body: data
  }).then((response) => {
    expect(response.status).to.eq(201);
    return cy.wrap(response.body.restaurante || response.body);
  });
});

// Comando para crear un producto de prueba
Cypress.Commands.add('createTestProduct', (restaurantId, productData = {}) => {
  const defaultData = {
    nombre: 'Producto Test Cypress',
    especificaciones: 'Producto creado para pruebas automatizadas',
    precio: 15000,
    categoria: 'Otras',
    restaurante_Id: restaurantId,
    todasLasSucursales: true
  };

  const data = { ...defaultData, ...productData };

  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/productos`,
    headers: {
      'Authorization': `Bearer ${window.localStorage.getItem('token')}`
    },
    body: data
  }).then((response) => {
    expect(response.status).to.eq(201);
    return cy.wrap(response.body.producto || response.body);
  });
});

// Comando para limpiar datos de prueba
Cypress.Commands.add('cleanupTestData', () => {
  // Obtener token del localStorage
  cy.window().then((win) => {
    const token = win.localStorage.getItem('token');
    if (token) {
      // Obtener y eliminar restaurantes de prueba
      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/restaurantes/mine`,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        failOnStatusCode: false
      }).then((response) => {
        if (response.status === 200 && response.body) {
          const restaurants = Array.isArray(response.body) ? response.body : [];
          restaurants.forEach(restaurant => {
            if (restaurant.nombre.includes('Test') || restaurant.nombre.includes('Cypress')) {
              cy.request({
                method: 'DELETE',
                url: `${Cypress.env('apiUrl')}/restaurantes/eliminar/${restaurant.id}`,
                headers: {
                  'Authorization': `Bearer ${token}`
                },
                failOnStatusCode: false
              });
            }
          });
        }
      });
    }
  });
});

// Comando para verificar elementos del dashboard
Cypress.Commands.add('verifyDashboardElements', () => {
  cy.get('[data-testid="dashboard-header"]', { timeout: 10000 }).should('be.visible');
  cy.contains('Dashboard de Administración').should('be.visible');
  cy.get('.dashboard-stats').should('be.visible');
});

// Comando para navegar a la gestión de productos
Cypress.Commands.add('navigateToProducts', (restaurantId) => {
  cy.visit(`/admin/productos/${restaurantId}`);
  cy.contains('Productos').should('be.visible');
});

// Comando para llenar formulario de restaurante
Cypress.Commands.add('fillRestaurantForm', (data) => {
  if (data.nombre) {
    cy.get('input[name="nombre"]').clear().type(data.nombre);
  }
  if (data.descripcion) {
    cy.get('textarea[name="descripcion"]').clear().type(data.descripcion);
  }
  
  // Llenar datos de sucursal
  if (data.branch) {
    cy.get('input[name="nombre"]').eq(1).clear().type(data.branch.nombre);
    cy.get('input[name="direccion"]').clear().type(data.branch.direccion);
    cy.get('input[name="comuna"]').clear().type(data.branch.comuna);
  }
});

// Comando para llenar formulario de producto
Cypress.Commands.add('fillProductForm', (data) => {
  if (data.nombre) {
    cy.get('input[name="nombre"]').clear().type(data.nombre);
  }
  if (data.especificaciones) {
    cy.get('textarea[name="especificaciones"]').clear().type(data.especificaciones);
  }
  if (data.precio) {
    cy.get('input[name="precio"]').clear().type(data.precio.toString());
  }
  if (data.categoria) {
    cy.get('select[name="categoria"]').select(data.categoria);
  }
});

// Comando para verificar tabla de productos
Cypress.Commands.add('verifyProductInTable', (productName) => {
  cy.get('.products-table').should('be.visible');
  cy.get('.products-table tbody tr').should('contain', productName);
});

// Comando para interceptar llamadas API
Cypress.Commands.add('interceptAPI', () => {
  cy.intercept('GET', '**/restaurantes/mine', { fixture: 'restaurants.json' }).as('getRestaurants');
  cy.intercept('POST', '**/restaurantes/crear', { fixture: 'restaurant-created.json' }).as('createRestaurant');
  cy.intercept('POST', '**/productos', { fixture: 'product-created.json' }).as('createProduct');
  cy.intercept('GET', '**/restaurantes/*/productos', { fixture: 'products.json' }).as('getProducts');
});