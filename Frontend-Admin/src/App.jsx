import { useState } from 'react'
import './App.css'

function App() {
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false)
  const [modalCuentaAbierto, setModalCuentaAbierto] = useState(false)
  
  // Cargar sesión guardada directamente en el estado inicial
  const [adminSession, setAdminSession] = useState(() => {
    try {
      const sesionGuardada = localStorage.getItem('admin_session')
      return sesionGuardada ? JSON.parse(sesionGuardada) : null
    } catch {
      localStorage.removeItem('admin_session')
      return null
    }
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!usuario.trim() || !password) {
      setError('Por favor completa todos los campos')
      return
    }

    setCargando(true)
    try {
      const resp = await fetch('http://localhost:5000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: usuario.trim(), password })
      })

      const data = await resp.json()

      if (!resp.ok) {
        throw new Error(data.error || 'Credenciales incorrectas')
      }

      // Guardar sesión en estado y localStorage
      setAdminSession(data.admin)
      localStorage.setItem('admin_session', JSON.stringify(data.admin))
    } catch (err) {
      setError(err.message || 'Error al conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }

  const handleLogout = () => {
    setAdminSession(null)
    localStorage.removeItem('admin_session')
    setUsuario('')
    setPassword('')
  }

    // Si ya inició sesión, mostramos el Panel con el Navbar
  if (adminSession) {
    return (
      <div className="admin-layout">
        {/* Navbar Superior */}
        <header className="admin-navbar">
          <div className="navbar-left">
            <span className="navbar-logo-icon">🛡️</span>
            <div className="navbar-brand-text">
              <span className="navbar-title">Sistema Electoral</span>
              <span className="navbar-subtitle">Panel de Control</span>
            </div>
          </div>

          <div className="navbar-right">
            {/* Menú de Usuario a la derecha */}
            <div className="user-menu-container">
              <button
                className={`user-profile-btn ${menuUsuarioAbierto ? 'active' : ''}`}
                onClick={() => setMenuUsuarioAbierto(!menuUsuarioAbierto)}
                aria-expanded={menuUsuarioAbierto}
              >
                <div className="user-avatar-circle">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div className="user-profile-meta">
                  <span className="user-profile-name">{adminSession.nombre}</span>
                  <span className="user-profile-role">{adminSession.rol}</span>
                </div>
                <svg
                  className={`chevron-icon ${menuUsuarioAbierto ? 'rotated' : ''}`}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Fondo invisible para cerrar el menú si hace clic afuera */}
              {menuUsuarioAbierto && (
                <div
                  className="dropdown-backdrop"
                  onClick={() => setMenuUsuarioAbierto(false)}
                />
              )}

              {/* Menú Desplegable */}
              {menuUsuarioAbierto && (
                <div className="user-dropdown-menu">
                  <div className="dropdown-user-header">
                    <p className="dropdown-name">{adminSession.nombre}</p>
                    <p className="dropdown-username">@{adminSession.usuario}</p>
                    <span className="dropdown-role-pill">{adminSession.rol}</span>
                  </div>

                  <div className="dropdown-divider" />

                  {/* Opción 1: Mi Cuenta */}
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setMenuUsuarioAbierto(false)
                      setModalCuentaAbierto(true)
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>Mi Cuenta</span>
                  </button>

                  {/* Opción 2: Cerrar Sesión */}
                  <button
                    className="dropdown-item item-logout"
                    onClick={() => {
                      setMenuUsuarioAbierto(false)
                      handleLogout()
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Modal "Mi Cuenta" */}
        {modalCuentaAbierto && (
          <div className="modal-overlay" onClick={() => setModalCuentaAbierto(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title-wrap">
                  <span className="modal-icon-badge">👤</span>
                  <h3>Mi Cuenta</h3>
                </div>
                <button
                  className="modal-close-btn"
                  onClick={() => setModalCuentaAbierto(false)}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div className="account-avatar-large">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>

                <div className="account-details-grid">
                  <div className="account-detail-item">
                    <span className="detail-label">Nombre</span>
                    <span className="detail-value">{adminSession.nombre}</span>
                  </div>

                  <div className="account-detail-item">
                    <span className="detail-label">Usuario</span>
                    <span className="detail-value">{adminSession.usuario}</span>
                  </div>

                  <div className="account-detail-item">
                    <span className="detail-label">Rol del Sistema</span>
                    <span className="detail-badge-role">{adminSession.rol}</span>
                  </div>

                  <div className="account-detail-item">
                    <span className="detail-label">Estado</span>
                    <span className="detail-badge-active">● Conectado</span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn-modal-close"
                  onClick={() => setModalCuentaAbierto(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Área central donde luego pondremos el Sidebar y las Vistas */}
        <main className="admin-content">
          <div className="content-welcome-card">
            <div className="welcome-tag">✅ Navbar Activo</div>
            <h2>Bienvenido, {adminSession.nombre}</h2>
            <p>
              Prueba hacer clic en tu foto/usuario arriba a la derecha para ver el menú desplegable con <strong>"Mi Cuenta"</strong> y <strong>"Cerrar Sesión"</strong>.
            </p>
            <div className="sidebar-hint">
              <strong>Siguiente paso:</strong> Construir el <strong>Sidebar lateral desplegable</strong> para navegar entre Elecciones, Candidatos y Mesas.
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Pantalla de Login de Administrador
  return (
    <div className="login-wrapper">
      <div className="login-card">
        {/* Cabecera / Escudo */}
        <div className="login-header">
          <div className="login-icon-badge">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h1>Administración Electoral</h1>
          <p className="login-subtitle">Ingresa tus credenciales para acceder al panel de control</p>
        </div>

        {/* Alerta de Error si falla el login */}
        {error && (
          <div className="login-error-alert">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="usuario">Usuario o DNI</label>
            <div className="input-icon-wrapper">
              <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                id="usuario"
                type="text"
                placeholder="Ej. admin"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                disabled={cargando}
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="input-icon-wrapper">
              <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="password"
                type={verPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={cargando}
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setVerPassword(!verPassword)}
                tabIndex="-1"
              >
                {verPassword ? 'Ocultar' : 'Ver'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-login-submit" disabled={cargando}>
            {cargando ? 'Verificando...' : 'Acceder al Panel'}
          </button>
        </form>

        
      </div>
    </div>
  )
}

export default App