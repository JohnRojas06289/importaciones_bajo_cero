import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const Settings = () => {
  const [settings, setSettings] = useState({
    company: {
      name: 'Almacén de Chaquetas y Gorras',
      address: 'Calle Principal #123',
      phone: '+57 300 123 4567',
      email: 'ventas@almacenropa.com',
      taxId: '900123456-7'
    },
    pos: {
      currency: 'COP',
      taxRate: 19,
      receiptFooter: 'Gracias por su compra',
      autoprint: true,
      soundAlerts: true,
      lowStockAlert: 5
    },
    inventory: {
      trackLocation: true,
      requireApproval: false,
      autoReorder: false,
      defaultLocation: 'Exhibición Principal'
    },
    users: [
      { id: 1, name: 'Administrador', email: 'admin@almacen.com', role: 'admin', active: true },
      { id: 2, name: 'Vendedor 1', email: 'vendedor1@almacen.com', role: 'cashier', active: true },
      { id: 3, name: 'Inventarios', email: 'inventario@almacen.com', role: 'inventory', active: true }
    ]
  });

  const [activeTab, setActiveTab] = useState('company');
  const [isLoading, setIsLoading] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'cashier',
    password: '',
    active: true
  });

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Configuraciones guardadas exitosamente');
    } catch (error) {
      alert('Error al guardar configuraciones');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCompany = (field, value) => {
    setSettings(prev => ({
      ...prev,
      company: { ...prev.company, [field]: value }
    }));
  };

  const handleUpdatePOS = (field, value) => {
    setSettings(prev => ({
      ...prev,
      pos: { ...prev.pos, [field]: value }
    }));
  };

  const handleUpdateInventory = (field, value) => {
    setSettings(prev => ({
      ...prev,
      inventory: { ...prev.inventory, [field]: value }
    }));
  };

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    const user = {
      id: Math.max(...settings.users.map(u => u.id), 0) + 1,
      ...newUser
    };

    setSettings(prev => ({
      ...prev,
      users: [...prev.users, user]
    }));

    setNewUser({ name: '', email: '', role: 'cashier', password: '', active: true });
    setShowUserModal(false);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setNewUser(user);
    setShowUserModal(true);
  };

  const handleUpdateUser = () => {
    setSettings(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === editingUser.id ? { ...newUser } : u)
    }));
    setEditingUser(null);
    setNewUser({ name: '', email: '', role: 'cashier', password: '', active: true });
    setShowUserModal(false);
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('¿Está seguro de eliminar este usuario?')) {
      setSettings(prev => ({
        ...prev,
        users: prev.users.filter(u => u.id !== userId)
      }));
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'configuraciones_almacen.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target.result);
          setSettings(importedSettings);
          alert('Configuraciones importadas exitosamente');
        } catch (error) {
          alert('Error al importar configuraciones: archivo inválido');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Configuraciones</h1>
        <div className="header-actions">
          <button onClick={exportData} className="btn btn-secondary">
            📤 Exportar
          </button>
          <label className="btn btn-secondary">
            📥 Importar
            <input type="file" accept=".json" onChange={importData} style={{ display: 'none' }} />
          </label>
          <button 
            onClick={handleSaveSettings} 
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? 'Guardando...' : '💾 Guardar'}
          </button>
        </div>
      </div>

      <div className="settings-tabs">
        <button 
          className={`tab ${activeTab === 'company' ? 'active' : ''}`}
          onClick={() => setActiveTab('company')}
        >
          🏢 Empresa
        </button>
        <button 
          className={`tab ${activeTab === 'pos' ? 'active' : ''}`}
          onClick={() => setActiveTab('pos')}
        >
          🖥️ Punto de Venta
        </button>
        <button 
          className={`tab ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          📦 Inventario
        </button>
        <button 
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Usuarios
        </button>
        <button 
          className={`tab ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          ⚙️ Sistema
        </button>
      </div>

      <div className="settings-content">
        {/* Company Tab */}
        {activeTab === 'company' && (
          <div className="tab-content">
            <h2>Información de la Empresa</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Nombre de la empresa</label>
                <input
                  type="text"
                  value={settings.company.name}
                  onChange={(e) => handleUpdateCompany('name', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Dirección</label>
                <input
                  type="text"
                  value={settings.company.address}
                  onChange={(e) => handleUpdateCompany('address', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="tel"
                  value={settings.company.phone}
                  onChange={(e) => handleUpdateCompany('phone', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={settings.company.email}
                  onChange={(e) => handleUpdateCompany('email', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>NIT/RUT</label>
                <input
                  type="text"
                  value={settings.company.taxId}
                  onChange={(e) => handleUpdateCompany('taxId', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* POS Tab */}
        {activeTab === 'pos' && (
          <div className="tab-content">
            <h2>Configuración del Punto de Venta</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Moneda</label>
                <select
                  value={settings.pos.currency}
                  onChange={(e) => handleUpdatePOS('currency', e.target.value)}
                >
                  <option value="COP">Peso Colombiano (COP)</option>
                  <option value="USD">Dólar (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Tasa de impuesto (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={settings.pos.taxRate}
                  onChange={(e) => handleUpdatePOS('taxRate', parseFloat(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>Pie de factura</label>
                <textarea
                  value={settings.pos.receiptFooter}
                  onChange={(e) => handleUpdatePOS('receiptFooter', e.target.value)}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Nivel de alerta de stock bajo</label>
                <input
                  type="number"
                  min="1"
                  value={settings.pos.lowStockAlert}
                  onChange={(e) => handleUpdatePOS('lowStockAlert', parseInt(e.target.value))}
                />
              </div>
            </div>
            
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.pos.autoprint}
                  onChange={(e) => handleUpdatePOS('autoprint', e.target.checked)}
                />
                Imprimir facturas automáticamente
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.pos.soundAlerts}
                  onChange={(e) => handleUpdatePOS('soundAlerts', e.target.checked)}
                />
                Alertas sonoras
              </label>
            </div>
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="tab-content">
            <h2>Configuración de Inventario</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Ubicación por defecto</label>
                <select
                  value={settings.inventory.defaultLocation}
                  onChange={(e) => handleUpdateInventory('defaultLocation', e.target.value)}
                >
                  <option value="Exhibición Principal">Exhibición Principal</option>
                  <option value="Exhibición Gorras">Exhibición Gorras</option>
                  <option value="Bodega Principal">Bodega Principal</option>
                  <option value="Apartados">Apartados</option>
                </select>
              </div>
            </div>
            
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.inventory.trackLocation}
                  onChange={(e) => handleUpdateInventory('trackLocation', e.target.checked)}
                />
                Rastrear ubicación de productos
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.inventory.requireApproval}
                  onChange={(e) => handleUpdateInventory('requireApproval', e.target.checked)}
                />
                Requerir aprobación para movimientos de inventario
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.inventory.autoReorder}
                  onChange={(e) => handleUpdateInventory('autoReorder', e.target.checked)}
                />
                Reordenar automáticamente cuando el stock esté bajo
              </label>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="tab-content">
            <div className="users-header">
              <h2>Gestión de Usuarios</h2>
              <button 
                onClick={() => setShowUserModal(true)}
                className="btn btn-primary"
              >
                + Agregar Usuario
              </button>
            </div>
            
            <div className="users-table">
              <div className="table-header">
                <span>Nombre</span>
                <span>Email</span>
                <span>Rol</span>
                <span>Estado</span>
                <span>Acciones</span>
              </div>
              {settings.users.map(user => (
                <div key={user.id} className="table-row">
                  <span>{user.name}</span>
                  <span>{user.email}</span>
                  <span className={`role ${user.role}`}>
                    {user.role === 'admin' ? 'Administrador' : 
                     user.role === 'cashier' ? 'Cajero' : 'Inventario'}
                  </span>
                  <span className={`status ${user.active ? 'active' : 'inactive'}`}>
                    {user.active ? 'Activo' : 'Inactivo'}
                  </span>
                  <div className="actions">
                    <button 
                      onClick={() => handleEditUser(user)}
                      className="btn btn-sm btn-secondary"
                    >
                      Editar
                    </button>
                    {user.role !== 'admin' && (
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        className="btn btn-sm btn-danger"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* System Tab */}
        {activeTab === 'system' && (
          <div className="tab-content">
            <h2>Configuración del Sistema</h2>
            <div className="system-info">
              <div className="info-card">
                <h3>Información del Sistema</h3>
                <div className="info-grid">
                  <div><strong>Versión:</strong> 1.0.0</div>
                  <div><strong>Base de datos:</strong> SQLite</div>
                  <div><strong>Último backup:</strong> No disponible</div>
                  <div><strong>Espacio usado:</strong> ~2.5 MB</div>
                </div>
              </div>

              <div className="action-card">
                <h3>Mantenimiento</h3>
                <div className="maintenance-actions">
                  <button className="btn btn-secondary">
                    🗂️ Crear Backup
                  </button>
                  <button className="btn btn-secondary">
                    🔄 Restaurar Backup
                  </button>
                  <button className="btn btn-warning">
                    🧹 Limpiar Cache
                  </button>
                  <button className="btn btn-danger">
                    ⚠️ Reiniciar Sistema
                  </button>
                </div>
              </div>

              <div className="logs-card">
                <h3>Registro de Actividad</h3>
                <div className="logs">
                  <div className="log-entry">
                    <span className="timestamp">2025-07-11 10:30:22</span>
                    <span className="action">Usuario admin inició sesión</span>
                  </div>
                  <div className="log-entry">
                    <span className="timestamp">2025-07-11 10:25:15</span>
                    <span className="action">Producto CHQ001 vendido</span>
                  </div>
                  <div className="log-entry">
                    <span className="timestamp">2025-07-11 10:20:08</span>
                    <span className="action">Inventario actualizado</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Modal */}
      {showUserModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingUser ? 'Editar Usuario' : 'Agregar Usuario'}</h2>
              <button 
                onClick={() => {
                  setShowUserModal(false);
                  setEditingUser(null);
                  setNewUser({ name: '', email: '', role: 'cashier', password: '', active: true });
                }}
                className="close-btn"
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <div className="form-group">
                <label>Nombre completo</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Rol</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="cashier">Cajero</option>
                  <option value="inventory">Inventario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              {!editingUser && (
                <div className="form-group">
                  <label>Contraseña</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    required
                  />
                </div>
              )}
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newUser.active}
                    onChange={(e) => setNewUser({...newUser, active: e.target.checked})}
                  />
                  Usuario activo
                </label>
              </div>
            </div>
            <div className="modal-actions">
              <button 
                onClick={editingUser ? handleUpdateUser : handleAddUser}
                className="btn btn-primary"
              >
                {editingUser ? 'Actualizar' : 'Agregar'} Usuario
              </button>
              <button 
                onClick={() => {
                  setShowUserModal(false);
                  setEditingUser(null);
                }}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .settings-page {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .settings-header h1 {
          color: #1f2937;
          font-size: 2rem;
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 1rem;
        }

        .settings-tabs {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 2rem;
          overflow-x: auto;
        }

        .tab {
          padding: 1rem 1.5rem;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 1rem;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .tab:hover {
          background: #f9fafb;
        }

        .tab.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }

        .settings-content {
          background: white;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          padding: 2rem;
        }

        .tab-content h2 {
          margin: 0 0 1.5rem 0;
          color: #1f2937;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #374151;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 1rem;
        }

        .checkbox-group {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .checkbox-label input[type="checkbox"] {
          width: auto;
        }

        .users-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .users-table {
          border-radius: 0.5rem;
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }

        .table-header {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
          gap: 1rem;
          padding: 1rem;
          background: #f9fafb;
          font-weight: 600;
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
        }

        .table-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
          gap: 1rem;
          padding: 1rem;
          border-bottom: 1px solid #f3f4f6;
          align-items: center;
        }

        .table-row:last-child {
          border-bottom: none;
        }

        .table-row:hover {
          background: #f9fafb;
        }

        .role {
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .role.admin {
          background: #fef2f2;
          color: #dc2626;
        }

        .role.cashier {
          background: #f0f9ff;
          color: #0369a1;
        }

        .role.inventory {
          background: #f0fdf4;
          color: #166534;
        }

        .status.active {
          color: #059669;
          font-weight: 500;
        }

        .status.inactive {
          color: #dc2626;
          font-weight: 500;
        }

        .actions {
          display: flex;
          gap: 0.5rem;
        }

        .system-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .info-card,
        .action-card,
        .logs-card {
          padding: 1.5rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          background: #f9fafb;
        }

        .info-card h3,
        .action-card h3,
        .logs-card h3 {
          margin: 0 0 1rem 0;
          color: #1f2937;
        }

        .info-grid {
          display: grid;
          gap: 0.5rem;
        }

        .maintenance-actions {
          display: grid;
          gap: 0.5rem;
        }

        .logs {
          max-height: 200px;
          overflow-y: auto;
        }

        .log-entry {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid #e5e7eb;
          font-size: 0.9rem;
        }

        .log-entry:last-child {
          border-bottom: none;
        }

        .timestamp {
          color: #6b7280;
          font-family: 'Courier New', monospace;
        }

        .action {
          color: #374151;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          background: white;
          border-radius: 0.5rem;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h2 {
          margin: 0;
          color: #1f2937;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6b7280;
        }

        .modal-content {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .modal-actions {
          padding: 1.5rem;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        @media (max-width: 768px) {
          .settings-page {
            padding: 1rem;
          }
          
          .form-grid {
            grid-template-columns: 1fr;
          }
          
          .table-header,
          .table-row {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }
          
          .header-actions {
            flex-direction: column;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Settings;
