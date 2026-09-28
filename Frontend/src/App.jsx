import { useState, useEffect } from "react";
import './App.css'; // Importación del archivo de estilos

const NUMERO_MESA_KIOSCO = 1;

function App() {
  const [fase, setFase] = useState(1);
  const [dni, setDni] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [votante, setVotante] = useState(null);
  const [votaciones, setVotaciones] = useState([]);

  // Limpieza segura del temporizador de reinicio en Fase 3
  useEffect(() => {
    if (fase === 3) {
      const timer = setTimeout(() => {
        setFase(1);
        setDni('');
        setVotante(null);
        setError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [fase]);

  // Helper para procesar respuestas del servidor de forma segura
  const parsearRespuesta = async (res) => {
    try {
      return await res.json();
    } catch {
      return { error: `Respuesta inesperada del servidor (HTTP ${res.status})` };
    }
  };

  const verificarVotante = async (e) => {
    e.preventDefault();
    if (cargando) return;
    setError('');
    setCargando(true);

    try {
      const res = await fetch('http://localhost:5000/api/kiosco/verificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni: dni.trim(), numero_mesa: NUMERO_MESA_KIOSCO })
      });

      const data = await parsearRespuesta(res);

      if (res.ok) {
        setVotante({
          usuario_id: data.usuario_id,
          nombre: data.nombre
        });
        await cargarTarjeton();
        setFase(2);
      } else {
        setError(data.error || "No se pudo verificar el elector");
      }
    } catch (err) {
      console.error(err);
      setError("No se pudo conectar con el servidor. Verifique que el backend esté en ejecución.");
    } finally {
      setCargando(false);
    }
  };

  const cargarTarjeton = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/votaciones');
      const data = await parsearRespuesta(res);
      if (res.ok && Array.isArray(data)) {
        setVotaciones(data);
      } else {
        setError("Error al cargar las elecciones disponibles");
      }
    } catch (err) {
      console.error("Error cargando votaciones", err);
      setError("Error al consultar el tarjetón de votaciones");
    }
  };

  const emitirVoto = async (opcionId) => {
    if (cargando) return;
    setCargando(true);
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/votar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: votante.usuario_id,
          opcion_id: opcionId,
          numero_mesa: NUMERO_MESA_KIOSCO
        })
      });

      const data = await parsearRespuesta(res);

      if (res.ok) {
        setFase(3);
      } else {
        setError(data.error || "Error al registrar el voto");
      }
    } catch (err) {
      console.error(err);
      setError("Error de comunicación al procesar el voto");
    } finally {
      setCargando(false);
    }
  };

  const cancelarVotacion = () => {
    setFase(1);
    setDni('');
    setVotante(null);
    setError('');
  };

  return (
    <div className="kiosco-container">
      <h1>Sistema de Votación Rápida</h1>
      <h3>Mesa #{NUMERO_MESA_KIOSCO}</h3>

      {error && <div className="error-alerta">{error}</div>}

      {fase === 1 && (
        <form onSubmit={verificarVotante} className="formulario-dni">
          <h2>Ingrese su Documento</h2>
          <input
            type="text"
            placeholder="Número de DNI"
            value={dni}
            onChange={(e) => {
              setDni(e.target.value);
              if (error) setError('');
            }}
            className="input-dni"
            disabled={cargando}
            required
            autoFocus
          />
          <button type="submit" className="btn-continuar" disabled={cargando}>
            {cargando ? "Verificando..." : "Continuar"}
          </button>
        </form>
      )}

      {fase === 2 && votante && (
        <div>
          <h2>Bienvenido/a, {votante.nombre}</h2>
          <p>Seleccione su candidato:</p>

          {votaciones.length === 0 ? (
            <div style={{ marginTop: '20px' }}>
              <p>No hay elecciones o tarjetones disponibles en este momento.</p>
              <button onClick={cancelarVotacion} className="btn-cancelar">
                Volver al inicio
              </button>
            </div>
          ) : (
            votaciones.map((eleccion) => (
              <div key={eleccion.id} className="tarjeta-eleccion">
                <h3>{eleccion.titulo}</h3>
                <p>{eleccion.descripcion}</p>

                <div className="contenedor-opciones">
                  {eleccion.opciones.map((opcion) => (
                    <button
                      key={opcion.id}
                      onClick={() => emitirVoto(opcion.id)}
                      className="btn-votar"
                      disabled={cargando}
                    >
                      {cargando ? "Procesando..." : `Votar por: ${opcion.texto}`}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}

          <div style={{ marginTop: '25px' }}>
            <button
              onClick={cancelarVotacion}
              className="btn-cancelar"
              disabled={cargando}
            >
              Cancelar y salir
            </button>
          </div>
        </div>
      )}

      {fase === 3 && (
        <div className="mensaje-exito">
          <h2>¡Voto registrado exitosamente!</h2>
          <p>Gracias por participar.</p>
          <p className="texto-reinicio">Preparando sistema para el siguiente elector...</p>
        </div>
      )}
    </div>
  );
}

export default App;