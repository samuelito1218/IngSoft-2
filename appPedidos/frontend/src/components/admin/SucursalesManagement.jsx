import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaBuilding, FaCheckCircle, FaExclamationTriangle, FaTrashAlt } from 'react-icons/fa';
import { api } from '../../services/api';
import './SucursalesManagement.css';

const SucursalesManagement = ({ restaurante, onClose }) => {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [nuevaSucursal, setNuevaSucursal] = useState({
    nombre: '',
    direccion: '',
    comuna: ''
  });
  const [mostrarFormNueva, setMostrarFormNueva] = useState(false);
  const [error, setError] = useState(null);
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    type: 'success',
    title: '',
    message: '',
    confirmText: '',
    onConfirm: null,
    showCancel: true
  });

  useEffect(() => {
    cargarSucursales();
  }, [restaurante.id]);

  const showConfirmation = (config) => {
    setConfirmModalConfig(config);
    setShowConfirmModal(true);
  };
  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setConfirmModalConfig({});
  };

  const cargarSucursales = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Cargando sucursales del restaurante ${restaurante.id}`);
      
      const response = await api.get(`/restaurantes/${restaurante.id}/sucursales`);
      console.log('Sucursales obtenidas:', response.data);
      
      setSucursales(response.data || []);
    } catch (error) {
      console.error('Error al cargar sucursales:', error);
      setError('Error al cargar las sucursales');
      setSucursales([]);
    } finally {
      setLoading(false);
    }
  };

  const crearSucursal = async () => {
    try {
      const { nombre, direccion, comuna } = nuevaSucursal;
      
      if (!nombre.trim()) {
        showConfirmation({
          type: 'warning',
          title: 'Campo requerido',
          message: 'El nombre de la sucursal es obligatorio',
          confirmText: 'Entendido',
          showCancel: false,
          onConfirm: closeConfirmModal
        });
        return;
      }
      if (!direccion.trim()) {
        showConfirmation({
          type: 'warning',
          title: 'Campo requerido',
          message: 'La dirección es obligatoria',
          confirmText: 'Entendido',
          showCancel: false,
          onConfirm: closeConfirmModal
        });
        return;
      }
      if (!comuna.trim()) {
        showConfirmation({
          type: 'warning',
          title: 'Campo requerido',
          message: 'La comuna es obligatoria',
          confirmText: 'Entendido',
          showCancel: false,
          onConfirm: closeConfirmModal
        });
        return;
      }

      console.log('Creando sucursal:', { ...nuevaSucursal, restaurante_Id: restaurante.id });

      const response = await api.post('/restaurantes/sucursales', {
        ...nuevaSucursal,
        restaurante_Id: restaurante.id
      });

      console.log('Sucursal creada:', response.data);

      await cargarSucursales();
      
      setNuevaSucursal({ nombre: '', direccion: '', comuna: '' });
      setMostrarFormNueva(false);
      

      showConfirmation({
        type: 'success',
        title: '¡Éxito!',
        message: `La sucursal "${nombre}" ha sido creada exitosamente`,
        confirmText: 'Perfecto',
        showCancel: false,
        onConfirm: closeConfirmModal
      });
    } catch (error) {
      console.error('Error al crear sucursal:', error);
      showConfirmation({
        type: 'danger',
        title: 'Error',
        message: 'No se pudo crear la sucursal. Por favor, intente nuevamente.',
        confirmText: 'Reintentar',
        showCancel: true,
        onConfirm: closeConfirmModal
      });
    }
  };

  const actualizarSucursal = async (sucursalId, datos) => {
    try {
      console.log('Actualizando sucursal:', sucursalId, datos);

      const response = await api.put(`/restaurantes/sucursales/${sucursalId}`, datos);
      console.log('Sucursal actualizada:', response.data);
      
      await cargarSucursales();
      setEditando(null);

      showConfirmation({
        type: 'success',
        title: '¡Actualizado!',
        message: `La sucursal "${datos.nombre}" ha sido actualizada exitosamente`,
        confirmText: 'Excelente',
        showCancel: false,
        onConfirm: closeConfirmModal
      });
    } catch (error) {
      console.error('Error al actualizar sucursal:', error);
      showConfirmation({
        type: 'danger',
        title: 'Error al actualizar',
        message: 'No se pudo actualizar la sucursal. Por favor, intente nuevamente.',
        confirmText: 'Reintentar',
        showCancel: true,
        onConfirm: closeConfirmModal
      });
    }
  };

  const confirmarEliminarSucursal = (sucursalId, nombreSucursal) => {
    showConfirmation({
      type: 'danger',
      title: 'Confirmar eliminación',
      message: `¿Estás seguro de que quieres eliminar la sucursal "${nombreSucursal}"?\n\nEsta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar',
      showCancel: true,
      onConfirm: () => {
        closeConfirmModal();
        eliminarSucursal(sucursalId, nombreSucursal);
      }
    });
  };

  const eliminarSucursal = async (sucursalId, nombreSucursal) => {
    try {
      console.log('Eliminando sucursal:', sucursalId);

      await api.delete(`/restaurantes/sucursales/${sucursalId}`);
      console.log('Sucursal eliminada exitosamente');
      
      await cargarSucursales();

      showConfirmation({
        type: 'success',
        title: '¡Eliminado!',
        message: `La sucursal "${nombreSucursal}" ha sido eliminada exitosamente`,
        confirmText: 'Entendido',
        showCancel: false,
        onConfirm: closeConfirmModal
      });
    } catch (error) {
      console.error('Error al eliminar sucursal:', error);
      showConfirmation({
        type: 'danger',
        title: 'Error al eliminar',
        message: 'No se pudo eliminar la sucursal. Por favor, intente nuevamente.',
        confirmText: 'Reintentar',
        showCancel: true,
        onConfirm: closeConfirmModal
      });
    }
  };

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        if (showConfirmModal) {
          closeConfirmModal();
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose, showConfirmModal]);

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  const SucursalCard = ({ sucursal }) => {
    const [editData, setEditData] = useState({
      nombre: sucursal.nombre,
      direccion: sucursal.direccion,
      comuna: sucursal.comuna
    });

    useEffect(() => {
      setEditData({
        nombre: sucursal.nombre,
        direccion: sucursal.direccion,
        comuna: sucursal.comuna
      });
    }, [sucursal]);

    const guardarCambios = () => {
      const { nombre, direccion, comuna } = editData;
      
      if (!nombre.trim()) {
        showConfirmation({
          type: 'warning',
          title: 'Campo requerido',
          message: 'El nombre de la sucursal es obligatorio',
          confirmText: 'Entendido',
          showCancel: false,
          onConfirm: closeConfirmModal
        });
        return;
      }
      if (!direccion.trim()) {
        showConfirmation({
          type: 'warning',
          title: 'Campo requerido',
          message: 'La dirección es obligatoria',
          confirmText: 'Entendido',
          showCancel: false,
          onConfirm: closeConfirmModal
        });
        return;
      }
      if (!comuna.trim()) {
        showConfirmation({
          type: 'warning',
          title: 'Campo requerido',
          message: 'La comuna es obligatoria',
          confirmText: 'Entendido',
          showCancel: false,
          onConfirm: closeConfirmModal
        });
        return;
      }
      
      actualizarSucursal(sucursal.id, editData);
    };

    const cancelarEdicion = () => {
      setEditData({
        nombre: sucursal.nombre,
        direccion: sucursal.direccion,
        comuna: sucursal.comuna
      });
      setEditando(null);
    };

    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        guardarCambios();
      } else if (e.key === 'Escape') {
        cancelarEdicion();
      }
    };

    const esEditando = editando === sucursal.id;

    return (
      <div className="sucursal-card">
        <div className="sucursal-header">
          <div className="sucursal-title">
            <div className="sucursal-icon">
              <FaBuilding />
            </div>
            <div className="sucursal-name">
              {esEditando ? (
                <input
                  type="text"
                  value={editData.nombre}
                  onChange={(e) => setEditData({...editData, nombre: e.target.value})}
                  onKeyDown={handleKeyPress}
                  className="edit-input"
                  placeholder="Nombre de la sucursal"
                  autoFocus
                />
              ) : (
                <h3>{sucursal.nombre}</h3>
              )}
            </div>
          </div>
          
          <div className="sucursal-actions">
            {esEditando ? (
              <>
                <button
                  onClick={guardarCambios}
                  className="action-btn save-btn"
                  title="Guardar cambios"
                >
                  <FaSave />
                </button>
                <button
                  onClick={cancelarEdicion}
                  className="action-btn cancel-btn"
                  title="Cancelar"
                >
                  <FaTimes />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditando(sucursal.id)}
                  className="action-btn edit-btn"
                  title="Editar sucursal"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => confirmarEliminarSucursal(sucursal.id, sucursal.nombre)}
                  className="action-btn delete-btn"
                  title="Eliminar sucursal"
                >
                  <FaTrash />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="sucursal-info">
          <div className="info-item">
            <div className="info-icon">
              <FaMapMarkerAlt />
            </div>
            {esEditando ? (
              <input
                type="text"
                value={editData.direccion}
                onChange={(e) => setEditData({...editData, direccion: e.target.value})}
                onKeyDown={handleKeyPress}
                className="edit-input"
                placeholder="Dirección"
              />
            ) : (
              <span>{sucursal.direccion}</span>
            )}
          </div>
          
          <div className="info-item">
            <div className="info-icon">
              <FaBuilding />
            </div>
            {esEditando ? (
              <input
                type="text"
                value={editData.comuna}
                onChange={(e) => setEditData({...editData, comuna: e.target.value})}
                onKeyDown={handleKeyPress}
                className="edit-input"
                placeholder="Comuna"
              />
            ) : (
              <span>Comuna: {sucursal.comuna}</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Componente del modal de confirmación
  const ConfirmModal = () => {
    if (!showConfirmModal) return null;

    const getIcon = () => {
      switch (confirmModalConfig.type) {
        case 'success':
          return <FaCheckCircle className="confirm-modal-icon success" />;
        case 'warning':
          return <FaExclamationTriangle className="confirm-modal-icon warning" />;
        case 'danger':
          return <FaTrashAlt className="confirm-modal-icon danger" />;
        default:
          return <FaCheckCircle className="confirm-modal-icon success" />;
      }
    };

    return (
      <div className="confirm-modal-overlay" onClick={closeConfirmModal}>
        <div className={`confirm-modal ${confirmModalConfig.type}`} onClick={handleModalClick}>
          <div className="confirm-modal-content">
            <div className="confirm-modal-header">
              {getIcon()}
              <h3 className="confirm-modal-title">{confirmModalConfig.title}</h3>
            </div>
            
            <div className="confirm-modal-body">
              <p className="confirm-modal-message">
                {confirmModalConfig.message}
              </p>
            </div>
            
            <div className="confirm-modal-actions">
              {confirmModalConfig.showCancel && (
                <button 
                  className="confirm-modal-btn cancel"
                  onClick={closeConfirmModal}
                >
                  Cancelar
                </button>
              )}
              <button 
                className={`confirm-modal-btn confirm ${confirmModalConfig.type}`}
                onClick={confirmModalConfig.onConfirm}
              >
                {confirmModalConfig.confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="sucursales-modal" onClick={handleModalClick}>
        <div className="modal-header">
          <div className="header-content">
            <h2>Gestión de Sucursales</h2>
            <p>Restaurante: {restaurante.nombre}</p>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Botón agregar sucursal */}
          <div className="add-section">
            <button className="add-button" onClick={() => setMostrarFormNueva(!mostrarFormNueva)}>
            </button>
          </div>

          {/* Formulario para agregar una nueva sucursal */}
          {mostrarFormNueva && (
            <div className="form-section">
              <h3>Nueva Sucursal</h3>
              <div className="form-grid">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nombre de la sucursal"
                  value={nuevaSucursal.nombre}
                  onChange={(e) => setNuevaSucursal({ ...nuevaSucursal, nombre: e.target.value })}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Dirección"
                  value={nuevaSucursal.direccion}
                  onChange={(e) => setNuevaSucursal({ ...nuevaSucursal, direccion: e.target.value })}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Comuna"
                  value={nuevaSucursal.comuna}
                  onChange={(e) => setNuevaSucursal({ ...nuevaSucursal, comuna: e.target.value })}
                />
                <div className="form-actions">
                  <button className="cancel-button" onClick={() => setMostrarFormNueva(false)}>
                    Cancelar
                  </button>
                  <button className="create-button" onClick={crearSucursal}>
                    Crear Sucursal
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Lista de sucursales */}
          <div className="sucursales-grid">
            {loading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Cargando sucursales...</p>
              </div>
            ) : error ? (
              <div className="error-container">
                <p>{error}</p>
                <button onClick={cargarSucursales} className="retry-button">
                  Reintentar
                </button>
              </div>
            ) : sucursales.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <FaBuilding />
                </div>
                <h3>No hay sucursales registradas</h3>
                <p>Crea la primera sucursal para este restaurante</p>
              </div>
            ) : (
              sucursales.map((sucursal) => (
                <SucursalCard key={sucursal.id} sucursal={sucursal} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal de confirmación */}
      <ConfirmModal />
    </div>
  );
};

export default SucursalesManagement;