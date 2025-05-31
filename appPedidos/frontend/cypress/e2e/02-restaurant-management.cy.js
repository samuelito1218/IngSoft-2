// cypress/e2e/02-restaurant-management.cy.js

describe('Gestión de Restaurantes', () => {
  beforeEach(() => {
    // Login antes de cada prueba
    cy.login();
    cy.visit('/admin/restaurantes');
  });

  afterEach(() => {
    // Limpiar datos después de cada prueba
    cy.cleanupTestData();
  });

  it('debe mostrar la página de restaurantes correctamente', () => {
    cy.contains('Mis Restaurantes').should('be.visible');
    
    // Verificar que el botón de crear está presente (ya sea en header o empty state)
    cy.get('body').then(($body) => {
      if ($body.find('.empty-state').length > 0) {
        cy.contains('Crear Restaurante').should('be.visible');
      } else {
        cy.get('.add-button').should('be.visible');
      }
    });
  });

  it('debe abrir el formulario de creación de restaurante', () => {
    // Hacer clic en crear restaurante (manejar tanto empty state como botón normal)
    cy.get('body').then(($body) => {
      if ($body.find('.empty-state').length > 0) {
        cy.contains('Crear Restaurante').click();
      } else {
        cy.get('.add-button').first().click();
      }
    });
    
    // Verificar que el formulario se abre
    cy.url().should('include', '/admin/restaurantes/nuevo');
    cy.contains('Crear Nuevo Restaurante').should('be.visible');
    
    // Verificar campos del formulario
    cy.get('input[name="nombre"]').should('be.visible');
    cy.get('textarea[name="descripcion"]').should('be.visible');
    cy.get('input[name="direccion"]').should('be.visible');
    cy.get('input[name="comuna"]').should('be.visible');
  });

  it('debe validar campos obligatorios al crear restaurante', () => {
    cy.visit('/admin/restaurantes/nuevo');
    
    // Intentar enviar formulario vacío
    cy.get('button[type="submit"]').click();
    
    // Verificar mensaje de error
    cy.contains('El nombre del restaurante es obligatorio').should('be.visible');
  });

  it('debe crear un restaurante exitosamente', () => {
    cy.visit('/admin/restaurantes/nuevo');
    
    // Interceptar la llamada de creación
    cy.intercept('POST', '**/restaurantes/crear', {
      statusCode: 201,
      body: {
        restaurante: {
          id: 'test-restaurant-id',
          nombre: 'Restaurante Test',
          descripcion: 'Descripción de prueba'
        }
      }
    }).as('createRestaurant');
    
    // Llenar formulario
    cy.fillRestaurantForm({
      nombre: 'Restaurante Test Cypress',
      descripcion: 'Restaurante creado en pruebas automatizadas',
      branch: {
        nombre: 'Sucursal Principal',
        direccion: 'Calle 10 #43-12',
        comuna: 'Comuna 14'
      }
    });
    
    // Enviar formulario
    cy.get('button[type="submit"]').click();
    
    // Verificar llamada API
    cy.wait('@createRestaurant');
    
    // Verificar mensaje de éxito
    cy.contains('Restaurante creado con éxito').should('be.visible');
    
    // Verificar redirección
    cy.url().should('include', '/admin/restaurantes');
  });

  it('debe poder agregar múltiples sucursales', () => {
    cy.visit('/admin/restaurantes/nuevo');
    
    // Llenar información básica
    cy.get('input[name="nombre"]').type('Restaurante Multi-Sucursal');
    cy.get('textarea[name="descripcion"]').type('Restaurante con múltiples sucursales');
    
    // Llenar primera sucursal
    cy.get('input[name="nombre"]').eq(1).type('Sucursal Centro');
    cy.get('input[name="direccion"]').type('Calle 50 #20-30');
    cy.get('input[name="comuna"]').type('Comuna 10');
    
    // Agregar segunda sucursal
    cy.get('.add-branch-btn').click();
    
    // Verificar que aparece nueva sucursal
    cy.contains('Sucursal 2').should('be.visible');
    
    // Llenar segunda sucursal
    cy.get('.branch-container').eq(1).within(() => {
      cy.get('input[name="nombre"]').type('Sucursal Norte');
      cy.get('input[name="direccion"]').type('Carrera 15 #80-45');
      cy.get('input[name="comuna"]').type('Comuna 11');
    });
    
    // Verificar que se puede eliminar sucursal
    cy.get('.remove-branch-btn').should('be.visible');
  });

  it('debe poder editar un restaurante existente', () => {
    // Crear restaurante primero
    cy.createTestRestaurant().then((restaurant) => {
      // Visitar página de edición
      cy.visit(`/admin/restaurantes/editar/${restaurant.id}`);
      
      // Verificar que el formulario se carga con datos
      cy.get('input[name="nombre"]').should('have.value', restaurant.nombre);
      
      // Modificar datos
      cy.get('input[name="nombre"]').clear().type('Restaurante Editado');
      cy.get('textarea[name="descripcion"]').clear().type('Descripción editada');
      
      // Interceptar actualización
      cy.intercept('PUT', `**/restaurantes/editar/${restaurant.id}`, {
        statusCode: 200,
        body: { message: 'Restaurante actualizado' }
      }).as('updateRestaurant');
      
      // Enviar formulario
      cy.get('button[type="submit"]').click();
      
      // Verificar llamada API
      cy.wait('@updateRestaurant');
      
      // Verificar mensaje de éxito
      cy.contains('Restaurante actualizado con éxito').should('be.visible');
    });
  });

  it('debe poder eliminar un restaurante', () => {
    // Simular que hay restaurantes
    cy.intercept('GET', '**/restaurantes/mine', {
      statusCode: 200,
      body: [{
        id: 'test-id',
        nombre: 'Restaurante Test',
        descripcion: 'Para eliminar',
        imageUrl: null,
        categorias: ['General']
      }]
    }).as('getRestaurants');
    
    cy.visit('/admin/restaurantes');
    cy.wait('@getRestaurants');
    
    // Hacer clic en eliminar
    cy.get('.action-button.delete').first().click();
    
    // Verificar modal de confirmación
    cy.contains('Confirmar Eliminación').should('be.visible');
    cy.contains('¿Está seguro que desea eliminar').should('be.visible');
    
    // Interceptar eliminación
    cy.intercept('DELETE', '**/restaurantes/eliminar/test-id', {
      statusCode: 200
    }).as('deleteRestaurant');
    
    // Confirmar eliminación
    cy.get('.delete-button').click();
    
    // Verificar llamada API
    cy.wait('@deleteRestaurant');
  });

  it('debe mostrar detalles del restaurante', () => {
    // Crear restaurante y simular datos
    cy.intercept('GET', '**/restaurantes/mine', {
      statusCode: 200,
      body: [{
        id: 'test-id',
        nombre: 'Restaurante Test',
        descripcion: 'Descripción test',
        imageUrl: null,
        categorias: ['Pizza', 'Italiana']
      }]
    }).as('getRestaurants');
    
    cy.intercept('GET', '**/restaurantes/test-id', {
      statusCode: 200,
      body: {
        id: 'test-id',
        nombre: 'Restaurante Test',
        descripcion: 'Descripción test',
        categorias: ['Pizza', 'Italiana']
      }
    }).as('getRestaurant');
    
    cy.intercept('GET', '**/restaurantes/test-id/productos', {
      statusCode: 200,
      body: []
    }).as('getProducts');
    
    cy.visit('/admin/restaurantes');
    cy.wait('@getRestaurants');
    
    // Hacer clic en el restaurante
    cy.get('.restaurant-card').first().click();
    
    // Verificar que se abre la página de detalles
    cy.url().should('include', '/admin/restaurantes/test-id');
    cy.wait('@getRestaurant');
    cy.wait('@getProducts');
    
    // Verificar elementos de la página
    cy.contains('Restaurante Test').should('be.visible');
    cy.get('.tab-navigation').should('be.visible');
    cy.contains('Productos').should('be.visible');
  });

  it('debe poder gestionar sucursales', () => {
    // Simular restaurante existente
    cy.intercept('GET', '**/restaurantes/test-id', {
      statusCode: 200,
      body: {
        id: 'test-id',
        nombre: 'Restaurante Test',
        descripcion: 'Test'
      }
    }).as('getRestaurant');
    
    cy.intercept('GET', '**/restaurantes/test-id/sucursales', {
      statusCode: 200,
      body: [{
        id: 'sucursal-1',
        nombre: 'Sucursal Principal',
        direccion: 'Calle 10 #43-12',
        comuna: 'Comuna 14'
      }]
    }).as('getSucursales');
    
    cy.visit('/admin/restaurantes/test-id');
    cy.wait('@getRestaurant');
    
    // Hacer clic en gestionar sucursales
    cy.get('.manage-branches-btn').click();
    
    // Verificar que se abre el modal
    cy.get('.sucursales-modal').should('be.visible');
    cy.contains('Gestión de Sucursales').should('be.visible');
    
    cy.wait('@getSucursales');
    
    // Verificar que se muestran las sucursales
    cy.contains('Sucursal Principal').should('be.visible');
    cy.contains('Calle 10 #43-12').should('be.visible');
  });
});