import random
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


@app.route('/api/admin/generar_votantes', methods=['POST'])
def generar_votantes():
    try:
        cur = mysql.connection.cursor()
        usuarios_creados = 0
        
        # Generamos 20 usuarios ficticios
        for i in range(1, 21):
            dni = f"100000{i:02d}"  # Resultado: 10000001, 10000002...
            nombre = f"Votante Ficticio {i}"
            password = generate_password_hash("0000") # Clave genérica encriptada
            mesa_aleatoria = random.randint(1, 5)  # Asigna una mesa del 1 al 5
            
            # INSERT IGNORE evita errores si ejecutas la ruta más de una vez
            cur.execute("""
                INSERT IGNORE INTO usuarios (dni, nombre, password, mesa_asignada) 
                VALUES (%s, %s, %s, %s)
            """, (dni, nombre, password, mesa_aleatoria))
            
            if cur.rowcount > 0:
                usuarios_creados += 1
                
        mysql.connection.commit()
        cur.close()
        
        return jsonify({
            "mensaje": "Votantes generados con éxito",
            "cantidad_nuevos": usuarios_creados
        }), 201
        
    except Exception as e:
        return jsonify({"error": "Fallo al generar votantes", "detalle": str(e)}), 500


@app.route('/api/kiosco/verificar', methods=['POST'])
def verificar_votante():
    data = request.json or {}
    dni = data.get('dni')
    numero_mesa_kiosco = data.get('numero_mesa') # Enviado por el monitor de React

    if not dni or not numero_mesa_kiosco:
        return jsonify({"error": "DNI y número de mesa son requeridos"}), 400

    cur = mysql.connection.cursor()
    
    # 1. Verificar si el DNI existe y obtener su mesa
    cur.execute("SELECT id, nombre, mesa_asignada FROM usuarios WHERE dni = %s", (dni,))
    usuario = cur.fetchone()

    if not usuario:
        cur.close()
        return jsonify({"error": "DNI no registrado en el sistema."}), 404

    # 2. Validar que esté en la mesa que le corresponde
    if usuario['mesa_asignada'] != int(numero_mesa_kiosco):
        cur.close()
        return jsonify({
            "error": f"Mesa incorrecta. Debe dirigirse a la mesa {usuario['mesa_asignada']}."
        }), 403

    # 3. Validar que no haya votado previamente
    cur.execute("SELECT id FROM votos WHERE usuario_id = %s", (usuario['id'],))
    voto_previo = cur.fetchone()
    cur.close()

    if voto_previo:
        return jsonify({"error": "Alerta: Este usuario ya emitió su voto."}), 403

    # Si pasa todas las validaciones, enviamos el OK para mostrar el tarjetón
    return jsonify({
        "mensaje": "Verificación exitosa. Puede proceder a votar.",
        "usuario_id": usuario['id'],
        "nombre": usuario['nombre']
    }), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)