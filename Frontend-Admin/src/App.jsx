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

  // Si ya inició sesión, mostramos la vista temporal para preparar el Navbar y Sidebar
  if (adminSession) {
    return (
      <div className="admin-dashboard-temp">
        <header className="temp-header">
          <div className="temp-brand">
            <span className="temp-icon">🛡️</span>
            <h2>Panel Electoral</h2>
          </div>
          <div className="temp-user-info">
            <span className="temp-badge">{adminSession.rol}</span>
            <span className="temp-name">{adminSession.nombre}</span>
            <button className="btn-logout" onClick={handleLogout}>Cerrar Sesión</button>
          </div>
        </header>

        <main className="temp-main">
          <div className="temp-card">
            <div className="temp-success-badge">✅ Sesión iniciada con éxito</div>
            <h3>¡Bienvenido, {adminSession.nombre}!</h3>
            <p>Ya tenemos la autenticación y la sesión conectada con el Backend.</p>
            <div className="next-step-hint">
              <strong>Siguiente paso:</strong> Construir el <strong>Navbar</strong> y el <strong>Sidebar desplegable</strong> para gestionar elecciones, candidatos y mesas.
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