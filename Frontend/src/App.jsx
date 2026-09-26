import { useState } from "react";
import './App.css'; // Importación del archivo de estilos

const NUMERO_MESA_KIOSCO = 1;

function App() {
  const [fase, setFase] = useState(1);
  const [dni, setDni] = useState('');
  const [error, setError] = useState('');
  const [votante, setVotante] = useState(null);
  const [votaciones, setVotaciones] = useState([]);

  const verificarVotante = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/kiosco/verificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni: dni, numero_mesa: NUMERO_MESA_KIOSCO })
      });

      const data = await res.json();

      if (res.ok) {
        setVotante({
            usuario_id: data.usuario_id,
            nombre: data.nombre
        });
        cargarTarjeton();
        setFase(2);
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error(err);
      setError("Error de conexión con el servidor");
    }
  };

  const cargarTarjeton = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/votaciones');
      const data = await res.json();
      setVotaciones(data);
    } catch (err) {
      console.error("Error cargando votaciones", err);
    }
  };

  const emitirVoto = async (opcionId) => {
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

      if (res.ok) {
        setFase(3);
        setTimeout(() => {
          setFase(1);
          setDni('');
          setVotante(null);
          setError('');
        }, 3000);
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch (err) {
      console.error(err);
      setError("Error al procesar el voto");
    }
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
            onChange={(e) => setDni(e.target.value)}
            className="input-dni"
            required
          />
          <button type="submit" className="btn-continuar">
            Continuar
          </button>
        </form>
      )}

      {fase === 2 && votante && (
        <div>
          <h2>Bienvenido/a, {votante.nombre}</h2>
          <p>Seleccione su candidato:</p>

          {votaciones.map((eleccion) => (
            <div key={eleccion.id} className="tarjeta-eleccion">
              <h3>{eleccion.titulo}</h3>
              <p>{eleccion.descripcion}</p>

              <div className="contenedor-opciones">
                {eleccion.opciones.map((opcion) => (
                  <button
                    key={opcion.id}
                    onClick={() => emitirVoto(opcion.id)}
                    className="btn-votar"
                  >
                    Votar por: {opcion.texto}
                  </button>
                ))}
              </div>
            </div>
          ))}
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
  )
}

export default App;