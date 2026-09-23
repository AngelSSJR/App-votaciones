from flask import Flask, jsonify
# Importa la extensión necesaria para MySQL
from flask_mysqldb import MySQL

app = Flask(__name__)

# CONFIGURA TUS DATOS DE CONEXIÓN AQUÍ:
# mysql_host, mysql_user, mysql_password, mysql_db
# ...

mysql = MySQL(app)

# Ruta de prueba que retorne un JSON con mensaje "Backend OK"
@app.route('/api/test', methods=['GET'])
def test():
    # Debes usar jsonify para retornar un diccionario
    # Ej: return jsonify({"resultado": "ok"})
    pass  # <--- ¡Sustituye el pass por tu código!

if __name__ == '__main__':
    app.run(debug=True, port=5000)