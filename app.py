from flask import Flask, jsonify
from flask_mysqldb import MySQL
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from flask import Flask, jsonify, request

app = Flask(__name__)
CORS(app) #permite peticiones desde react

# Configuración de conexión a MySQL
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'angel'       #
app.config['MYSQL_PASSWORD'] = 'Ar1081811844' 
app.config['MYSQL_DB'] = 'appvotacione_db'          

mysql = MySQL(app)


@app.route('/api/test', methods=['GET'])
def test():
    try:
        cur = mysql.connection.cursor()
        cur.execute("SELECT 1")
        cur.close()
        return jsonify({"status": "ok", "message": "Conectado a MySQL"}), 200
    except Exception as e:
        return jsonify({"status": "error", "detail": str(e)}), 500

# ----------------- AUTENTICACIÓN -----------------
@app.route('/api/registro', methods=['POST'])
def registro():
    data = request.json or {}
    dni = data.get('dni')
    nombre = data.get('nombre')
    password = data.get('password')

    if not dni or not nombre or not password:
        return jsonify({"error": "Faltan datos requeridos"}), 400

    hashed_pw = generate_password_hash(password)

    try:
        cur = mysql.connection.cursor()
        cur.execute(
            "INSERT INTO usuarios (dni, nombre, password) VALUES (%s, %s, %s)",
            (dni, nombre, hashed_pw)
        )
        mysql.connection.commit()
        user_id = cur.lastrowid
        cur.close()
        return jsonify({"mensaje": "Usuario registrado", "usuario_id": user_id}), 201
    except Exception as e:
        return jsonify({"error": "DNI ya registrado o error de BD", "detalle": str(e)}), 400

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json or {}
    dni = data.get('dni')
    password = data.get('password')

    cur = mysql.connection.cursor()
    cur.execute("SELECT id, dni, nombre, password FROM usuarios WHERE dni = %s", (dni,))
    user = cur.fetchone()
    cur.close()

    if user and check_password_hash(user['password'], password):
        return jsonify({
            "mensaje": "Login exitoso",
            "usuario": {"id": user['id'], "dni": user['dni'], "nombre": user['nombre']}
        }), 200
    return jsonify({"error": "Credenciales inválidas"}), 401

# ----------------- VOTACIONES Y CANDIDATOS -----------------
@app.route('/api/votaciones', methods=['GET'])
def listar_votaciones():
    cur = mysql.connection.cursor()
    cur.execute("""
        SELECT v.id AS votacion_id, v.titulo, v.descripcion, v.fecha_inicio, v.fecha_fin,
               o.id AS opcion_id, o.texto, o.votos
        FROM votaciones v
        LEFT JOIN opciones o ON v.id = o.votacion_id
    """)
    rows = cur.fetchall()
    cur.close()

    # Agrupar opciones dentro de su votación correspondiente
    votaciones = {}
    for r in rows:
        vid = r['votacion_id']
        if vid not in votaciones:
            votaciones[vid] = {
                "id": vid,
                "titulo": r['titulo'],
                "descripcion": r['descripcion'],
                "fecha_inicio": r['fecha_inicio'],
                "fecha_fin": r['fecha_fin'],
                "opciones": []
            }
        if r['opcion_id']:
            votaciones[vid]['opciones'].append({
                "id": r['opcion_id'],
                "texto": r['texto'],
                "votos": r['votos']
            })

    return jsonify(list(votaciones.values())), 200

# ----------------- EMITIR VOTO -----------------
@app.route('/api/votar', methods=['POST'])
def registrar_voto():
    data = request.json or {}
    usuario_id = data.get('usuario_id')
    opcion_id = data.get('opcion_id')
    numero_mesa = data.get('numero_mesa', 1)

    if not usuario_id or not opcion_id:
        return jsonify({"error": "usuario_id y opcion_id son obligatorios"}), 400

    cur = mysql.connection.cursor()
    try:
        # 1. Registrar el voto en la tabla votos
        cur.execute(
            "INSERT INTO votos (usuario_id, opcion_id, numero_mesa) VALUES (%s, %s, %s)",
            (usuario_id, opcion_id, numero_mesa)
        )
        # 2. Incrementar el contador en la tabla opciones
        cur.execute(
            "UPDATE opciones SET votos = votos + 1 WHERE id = %s",
            (opcion_id,)
        )
        mysql.connection.commit()
        cur.close()
        return jsonify({"mensaje": "Voto registrado exitosamente"}), 201
    except Exception as e:
        mysql.connection.rollback()
        cur.close()
        return jsonify({"error": "El usuario ya votó en esta mesa o hubo un error", "detalle": str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)