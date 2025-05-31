// cypress/e2e/03-product-management.cy.js

describe('Gestión de Productos', () => {
  let testRestaurant;

  before(() => {
    // Login y crear restaurante de prueba
    cy.login();
    cy.createTestRestaurant().then((restaurant) => {
      testRestaurant = restaurant;
    });
  });

  beforeEach(() => {
    cy.login();
  });

  after(() => {
    // Limpiar datos de prueba
    cy.cleanupTestData();
  });

  it('debe mostrar la página de productos correctamente', () => {
    // Interceptar llamadas necesarias
    cy.intercept('GET', `**/restaurantes/${testRestaurant.id}`, {
      statusCode: 200,
      body: testRestaurant
    }).as('getRestaurant');

    cy.intercept('GET', `**/restaurantes/${testRestaurant.id}/productos`, {
      statusCode: 200,
      body: []
    }).as('getProducts');

    cy.navigateToProducts(testRestaurant.id);
    
    cy.wait('@getRestaurant');
    cy.wait('@getProducts');

    // Verificar elementos de la página
    cy.contains('Productos').should('be.visible');
    cy.contains(testRestaurant.nombre).should('be.visible');
    cy.get('.add-product-btn').should('be.visible');
    cy.get('.search-field input').should('be.visible');
  });

  it('debe mostrar estado vacío cuando no hay productos', () => {
    cy.intercept('GET', `**/restaurantes/${testRestaurant.id}`, {
      statusCode: 200,
      body: testRestaurant
    }).as('getRestaurant');

    cy.intercept('GET', `**/restaurantes/${testRestaurant.id}/productos`, {
      statusCode: 200,
      body: []
    }).as('getProducts');

    cy.navigateToProducts(testRestaurant.id);
    
    cy.wait('@getRestaurant');
    cy.wait('@getProducts');

    // Verificar estado vacío
    cy.contains('No hay productos').should('be.visible');
    cy.contains('Comienza agregando productos').should('be.visible');
    cy.get('.add-empty-btn').should('be.visible');
  });

  it('debe abrir el formulario de creación de producto', () => {
    // Interceptar sucursales
    cy.intercept('GET', `**/restaurantes/${testRestaurant.id}/sucursales`, {
      statusCode: 200,
      body: [{
        id: 'sucursal-1',
        nombre: 'Sucursal Principal',
        direccion: 'Calle 10 #43-12',
        comuna: 'Comuna 14'
      }]
    }).as('getSucursales');

    cy.navigateToProducts(testRestaurant.id);
    
    // Hacer clic en agregar producto
    cy.get('.add-product-btn').click();
    
    // Verificar que se abre el modal
    cy.get('.product-modal').should('be.visible');
    cy.contains('Nuevo Producto').should('be.visible');
    
    cy.wait('@getSucursales');
    
    // Verificar campos del formulario
    cy.get('input[name="nombre"]').should('be.visible');
    cy.get('textarea[name="especificaciones"]').should('be.visible');
    cy.get('input[name="precio"]').should('be.visible');
    cy.get('select[name="categoria"]').should('be.visible');
  });

  it('debe validar campos obligatorios al crear producto', () => {
    cy.intercept('GET', `**/restaurantes/${testRestaurant.id}/sucursales`, {
      statusCode: 200,
      body: [{
        id: 'sucursal-1',
        nombre: 'Sucursal Principal',
        direccion: 'Calle 10 #43-12',
        comuna: 'Comuna 14'
      }]
    }).as('getSucursales');

    cy.navigateToProducts(testRestaurant.id);
    cy.get('.add-product-btn').click();
    
    cy.wait('@getSucursales');
    
    // Intentar enviar formulario vacío
    cy.get('.save-button').click();
    
    // Verificar mensajes de error
    cy.contains('El nombre del producto es obligatorio').should('be.visible');
  });

  it('debe crear un producto exitosamente', () => {
    cy.intercept('GET', `**/restaurantes/${testRestaurant.id}/sucursales`, {
      statusCode: 200,
      body: [{
        id: 'sucursal-1',
        nombre: 'Sucursal Principal',
        direccion: 'Calle 10 #43-12',
        comuna: 'Comuna 14'
      }]
    }).as('getSucursales');

    // Interceptar creación de producto
    cy.intercept('POST', '**/productos', {
      statusCode: 201,
      body: {
        producto: {
          id: 'product-test-id',
          nombre: 'Pizza Margherita Test',
          especificaciones: 'Pizza deliciosa con tomate y mozzarella',
          precio: 25000,
          categoria: 'Pizza',
          imageUrl: null,
          restaurante_Id: testRestaurant.id
        }
      }
    }).as('createProduct');

    cy.navigateToProducts(testRestaurant.id);
    cy.get('.add-product-btn').click();
    
    cy.wait('@getSucursales');

    // Llenar formulario
    cy.fillProductForm({
      nombre: 'Pizza Margherita Test',
      especificaciones: 'Pizza deliciosa con tomate y mozzarella',
      precio: 25000,
      categoria: 'Pizza'
    });

    // Seleccionar sucursal
    cy.get('.sucursal-dropdown-header').click();
    cy.contains('Todas las sucursales').click();

    // Enviar formulario
    cy.get('.save-button').click();

    // Verificar llamada API
    cy.wait('@createProduct');

    // Verificar que el modal se cierra
    cy.get('.product-modal').should('not.exist');
  });

  it('debe mostrar productos en la tabla', () => {
    // Interceptar con productos existentes
    cy.intercept('GET', `**/restaurantes/${testRestaurant.id}`, {
      statusCode: 200,
      body: testRestaurant
    }).as('getRestaurant');

    cy.intercept('GET', `**/restaurantes/${testRestaurant.id}/productos`, {
      statusCode: 200,
      body: [
        {
          id: 'prod-1',
          nombre: 'Pizza Margherita',
          especificaciones: 'Pizza clásica italiana',
          precio: 25000,
          categoria: 'Pizza',
          imageUrl: null
        },
        {
          id: 'prod-2',
          nombre: 'Hamburguesa Clásica',
          especificaciones: 'Hamburguesa con carne de res',
          precio: 18000,
          categoria: 'Hamburguesa',
          imageUrl: null
        }
      ]
    }).as('getProducts');

    cy.navigateToProducts(testRestaurant.id);
    
    cy.wait('@getRestaurant');
    cy.wait('@getProducts');

    // Verificar que se muestra la tabla
    cy.get('.products-table').should('be.visible');
    cy.get('.products-table tbody tr').should('have.length', 2);

    // Verificar contenido de la tabla
    cy.verifyProductInTable('Pizza Margherita');
    cy.verifyProductInTable('Hamburguesa Clásica');

    // Verificar precios formateados
    cy.contains('$25.000').should('be.visible');
    cy.contains('$18.000').should('be.visible');

    // Verificar botones de acción
    cy.get('.action-button.edit').should('have.length', 2);
    cy.get('.action-button.delete').should('have.length', 2);
  });

  it('debe permitir buscar productos', () => {
    // Interceptar con productos para búsqueda
    cy.intercept('GET', `**/restaurantes/${testRestaurant.id}`, {
      statusCode: 200,
      body: testRestaurant
    }).as('getRestaurant');

    cy.intercept('GET', `**/restaurantes/${testRestaurant.id}/productos`, {
      statusCode: 200,
      body: [
        {
          id: 'prod-1',
          nombre: 'Pizza Margherita',
          especificaciones: 'Pizza clásica italiana',
          precio: 25000,
          categoria: 'Pizza'
        },
        {
          id: 'prod-2',
          nombre: 'Hamburguesa Clásica',
          especificaciones: 'Hamburguesa con carne de res',
          precio: 18000,
          categoria: 'Hamburguesa'
        },
        {
          id: 'prod-3',
          nombre: 'Pizza Pepperoni',
          especificaciones: 'Pizza con pepperoni',
          precio: 28000,
          categoria: 'Pizza'
        }
      ]
    }).as('getProducts');

    cy.navigateToProducts(testRestaurant.id);
    
    cy.wait('@getRestaurant');
    cy.wait('@getProducts');

    // Inicialmente debe mostrar todos los productos
    cy.get('.products-table tbody tr').should('have.length', 3);

    // Buscar "pizza"
    cy.get('.search-field input').type('pizza');

    // Debe mostrar solo las pizzas
    cy.get('.products-table tbody tr').should('have.length', 2);
    cy.contains('Pizza Margherita').should('be.visible');
    cy.contains('Pizza Pepperoni').should('be.visible');
    cy.contains('Hamburguesa Clásica').should('not.exist');

    // Limpiar búsqueda
    cy.get('.search-field input').clear();

    // Debe mostrar todos los productos nuevamente
    cy.get('.products-table tbody tr').should('have.length', 3);
  });

  it('debe permitir editar un producto', () => {
    const productToEdit = {
      id: 'prod-1',
      nombre: 'Pizza Margherita',
      especificaciones: 'Pizza clásica italiana',
      precio: 25000,
      categoria: 'Pizza',
      imageUrl: null,
      sucursales_Ids: ['sucursal-1']
    };

    // Interceptar llamadas
    cy.intercept('GET', `**/restaurantes/${testRestaurant.id}`, {
      statusCode: 200,
      body: testRestaurant
    }).as('getRestaurant');

    cy.intercept('GET', `**/restaurantes/${testRestaurant.id}/productos`, {
      statusCode: 200,
      body: [productToEdit]
    }).as('getProducts');

    cy.intercept('GET', `**/restaurantes/${testRestaurant.id}/sucursales`, {
      statusCode: 200,
      body: [{
        id: 'sucursal-1',
        nombre: 'Sucursal Principal',
        direccion: 'Calle 10 #43-12',
        comuna: 'Comuna 14'
      }]
    }).as('getSucursales');

    cy.intercept('PUT', `**/productos/${productToEdit.id}`, {
      statusCode: 200,
      body: {
        producto: {
          ...productToEdit,
          nombre: 'Pizza Margherita Editada',
          precio: 27000
        }
      }
    }).as('updateProduct');

    cy.navigateToProducts(testRestaurant.id);
    
    cy.wait('@getRestaurant');
    cy.wait('@getProducts');

    // Hacer clic en editar
    cy.get('.action-button.edit').first().click();

    // Verificar que se abre el modal con datos
    cy.get('.product-modal').should('be.visible');
    cy.contains('Editar Producto').should('be.visible');
    
    cy.wait('@getSucursales');

    // Verificar que los campos tienen los valores actuales
    cy.get('input[name="nombre"]').should('have.value', 'Pizza Margherita');
    cy.get('input[name="precio"]').should('have.value', '25000');

    // Modificar datos
    cy.get('input[name="nombre"]').clear().type('Pizza Margherita Editada');
    cy.get('input[name="precio"]').clear().type('27000');

    // Guardar cambios
    cy.get('.save-button').click();

    // Verificar llamada API
    cy.wait('@updateProduct');

    // Verificar que el modal se cierra
    cy.get('.product-modal').should('not.exist');
  });

  it('debe permitir eliminar un producto', () => {
    const productToDelete = {
      id: 'prod-1',
      nombre: 'Pizza Margherita',
      especificaciones: 'Pizza clásica italiana',
      precio: 25000,
      categoria: 'Pizza'
    };

    // Interceptar llamadas
    cy.intercept('GET', `**/restaurantes/${testRestaurant.id}`, {
      statusCode: 200,
      body: testRestaurant
    }).as('getRestaurant');

    cy.intercept('GET', `**/restaurantes/${testRestaurant.id}/productos`, {
      statusCode: 200,
      body: [productToDelete]
    }).as('getProducts');

    cy.intercept('DELETE', `**/productos/${productToDelete.id}`, {
      statusCode: 200,
      body: { message: 'Producto eliminado' }
    }).as('deleteProduct');

    cy.navigateToProducts(testRestaurant.id);
    
    cy.wait('@getRestaurant');
    cy.wait('@getProducts');

    // Hacer clic en eliminar
    cy.get('.action-button.delete').first().click();

    // Verificar modal de confirmación
    cy.get('.confirm-modal').should('be.visible');
    cy.contains('Confirmar Eliminación').should('be.visible');
    cy.contains('Pizza Margherita').should('be.visible');

    // Confirmar eliminación
    cy.get('.delete-button').click();

    // Verificar llamada API
    cy.wait('@deleteProduct');

    // Verificar que el modal se cierra
    cy.get('.confirm-modal').should('not.exist');
  });

  it('debe validar precio numérico', () => {
    cy.intercept('GET', `**/restaurantes/${testRestaurant.id}/sucursales`, {
      statusCode: 200,
      body: [{
        id: 'sucursal-1',
        nombre: 'Sucursal Principal',
        direccion: 'Calle 10 #43-12',
        comuna: 'Comuna 14'
      }]
    }).as('getSucursales');

    cy.navigateToProducts(testRestaurant.id);
    cy.get('.add-product-btn').click();
    
    cy.wait('@getSucursales');

    // Intentar ingresar texto en campo de precio
    cy.get('input[name="precio"]').type('precio inválido');

    // El campo no debe aceptar texto
    cy.get('input[name="precio"]').should('have.value', '');

    // Probar con números válidos
    cy.get('input[name="precio"]').type('25000');
    cy.get('input[name="precio"]').should('have.value', '25000');

    // Probar con decimales
    cy.get('input[name="precio"]').clear().type('25000.50');
    cy.get('input[name="precio"]').should('have.value', '25000.50');
  });

  it('debe manejar la selección de sucursales', () => {
    cy.intercept('GET', `**/restaurantes/${testRestaurant.id}/sucursales`, {
      statusCode: 200,
      body: [
        {
          id: 'sucursal-1',
          nombre: 'Sucursal Centro',
          direccion: 'Calle 10 #43-12',
          comuna: 'Comuna 14'
        },
        {
          id: 'sucursal-2',
          nombre: 'Sucursal Norte',
          direccion: 'Carrera 15 #80-45',
          comuna: 'Comuna 11'
        }
      ]
    }).as('getSucursales');

    cy.navigateToProducts(testRestaurant.id);
    cy.get('.add-product-btn').click();
    
    cy.wait('@getSucursales');

    // Abrir dropdown de sucursales
    cy.get('.sucursal-dropdown-header').click();

    // Verificar opciones disponibles
    cy.contains('Todas las sucursales').should('be.visible');
    cy.contains('Sucursal Centro').should('be.visible');
    cy.contains('Sucursal Norte').should('be.visible');

    // Seleccionar sucursales específicas
    cy.contains('Sucursal Centro').click();
    cy.contains('Sucursal Norte').click();

    // Verificar que se actualiza el header
    cy.get('.sucursal-dropdown-header').should('contain', '2 sucursal(es) seleccionada(s)');

    // Probar seleccionar "Todas las sucursales"
    cy.get('.sucursal-dropdown-header').click();
    cy.contains('Todas las sucursales').click();
    cy.get('.sucursal-dropdown-header').should('contain', 'Todas las sucursales');
  });

  it('debe manejar errores de carga', () => {
    // Interceptar error en la carga del restaurante
    cy.intercept('GET', `**/restaurantes/${testRestaurant.id}`, {
      statusCode: 404,
      body: { error: 'Restaurante no encontrado' }
    }).as('getRestaurantError');

    cy.navigateToProducts(testRestaurant.id);
    
    cy.wait('@getRestaurantError');

    // Verificar mensaje de error
    cy.contains('No se pudieron cargar los datos').should('be.visible');
    cy.get('.retry-button').should('be.visible');
  });

  it('debe cerrar modal al hacer clic en cancelar', () => {
    cy.intercept('GET', `**/restaurantes/${testRestaurant.id}/sucursales`, {
      statusCode: 200,
      body: [{
        id: 'sucursal-1',
        nombre: 'Sucursal Principal',
        direccion: 'Calle 10 #43-12',
        comuna: 'Comuna 14'
      }]
    }).as('getSucursales');

    cy.navigateToProducts(testRestaurant.id);
    cy.get('.add-product-btn').click();
    
    cy.wait('@getSucursales');

    // Verificar que el modal está abierto
    cy.get('.product-modal').should('be.visible');

    // Hacer clic en cancelar
    cy.get('.cancel-button').click();

    // Verificar que el modal se cierra
    cy.get('.product-modal').should('not.exist');
  });

  it('debe navegar de vuelta a restaurantes', () => {
    cy.navigateToProducts(testRestaurant.id);

    // Hacer clic en el botón de volver
    cy.get('.back-button').click();

    // Verificar redirección
    cy.url().should('include', '/admin/restaurantes');
  });
});