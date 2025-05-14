import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import CloudinaryService from '../../services/CloudinaryService';
import './AddRestaurant.css';

export default function AddRestaurant() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    image: null,
    branches: [
      { nombre: '', direccion: '', comuna: '' }
    ]
  });
  const [msg, setMsg] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = e => {
    setForm(prev => ({ ...prev, image: e.target.files[0] }));
  };

  const handleBranchChange = (index, e) => {
    const { name, value } = e.target;
    const updated = [...form.branches];
    updated[index] = { ...updated[index], [name]: value };
    setForm(prev => ({ ...prev, branches: updated }));
  };

  const addBranch = () => {
    setForm(prev => ({
      ...prev,
      branches: [...prev.branches, { nombre: '', direccion: '', comuna: '' }]
    }));
  };

  const removeBranch = index => {
    setForm(prev => {
      const updated = prev.branches.filter((_, i) => i !== index);
      return { ...prev, branches: updated.length ? updated : [{ nombre: '', direccion: '', comuna: '' }] };
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg('');
    setSuccess('');

    try {
      // 1) Subir imagen si existe
      let imageUrl = '';
      if (form.image) {
        imageUrl = await CloudinaryService.uploadProfileImage(form.image);
      }

      // 2) Crear restaurante
      const resRest = await api.post('/restaurantes/crear', {
        nombre: form.nombre,
        descripcion: form.descripcion,
        ownerId: user.id,
        imageUrl
      });

      const newRestId = resRest.data.restaurante.id;

      // 3) Crear sucursales en paralelo
      await Promise.all(
        form.branches.map(branch =>
          api.post('/sucursales', {
            nombre: branch.nombre,
            direccion: branch.direccion,
            comuna: branch.comuna,
            restaurante_Id: newRestId
          })
        )
      );

      // 4) Mostrar éxito y limpiar
      setSuccess('¡Restaurante y sucursales creados con éxito!');
      setForm({
        nombre: '',
        descripcion: '',
        image: null,
        branches: [{ nombre: '', direccion: '', comuna: '' }]
      });
    } catch (error) {
      console.error('Error creando restaurante o sucursales:', error);
      setMsg(
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Error al crear restaurante o sucursales'
      );
    }
  };

  return (
    <div className="add-restaurant-container">
      <h2>Crear Restaurante</h2>

      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Restaurante */}
        <div className="form-group">
          <label htmlFor="nombre">Nombre del Restaurante</label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            value={form.nombre}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="descripcion">Descripción</label>
          <textarea
            id="descripcion"
            name="descripcion"
            rows={3}
            value={form.descripcion}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="image">Imagen de Portada</label>
          <input
            id="image"
            name="image"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>

        <hr />

        {/* Sucursales dinámicas */}
        {form.branches.map((branch, idx) => (
          <div key={idx} className="branch-group">
            <h3 className="branch-title">
              Sucursal {idx + 1}
              {form.branches.length > 1 && (
                <button
                  type="button"
                  className="remove-branch-btn"
                  onClick={() => removeBranch(idx)}
                >
                  ×
                </button>
              )}
            </h3>

            <div className="form-group">
              <label htmlFor={`branchNombre-${idx}`}>Nombre de la Sucursal</label>
              <input
                id={`branchNombre-${idx}`}
                name="nombre"
                type="text"
                value={branch.nombre}
                onChange={e => handleBranchChange(idx, e)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor={`direccion-${idx}`}>Dirección</label>
              <input
                id={`direccion-${idx}`}
                name="direccion"
                type="text"
                value={branch.direccion}
                onChange={e => handleBranchChange(idx, e)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor={`comuna-${idx}`}>Comuna</label>
              <input
                id={`comuna-${idx}`}
                name="comuna"
                type="text"
                value={branch.comuna}
                onChange={e => handleBranchChange(idx, e)}
                required
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          className="add-branch-btn"
          onClick={addBranch}
        >
          + Agregar otra sucursal
        </button>

        <button type="submit" className="submit-btn">
          Crear Restaurante
        </button>
      </form>

      {msg && <p className="message error">{msg}</p>}
    </div>
  );
}