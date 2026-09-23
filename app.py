from flask import Flask, jsonify
from flask_mysqldb import MySQL

app = Flask(__name__)

# Configuración de conexión a MySQL
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'devuser'       # El usuario que creaste o el que tengas en Workbench
app.config['MYSQL_PASSWORD'] = 'password123' # Tu contraseña configurada
app.config['MYSQL_DB'] = 'app_db'          # El nombre del schema/base de datos

mysql = MySQL(app)

@app.route('/api/test', methods=['GET'])
def test():
    # Retorna el estado del backend y verifica la conexión a MySQL
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT 1")
        cursor.close()
        return jsonify({
            "resultado": "ok",
            "mensaje": "Backend OK",
            "database": "Conectado a MySQL exitosamente"
        }), 200
    except Exception as e:
        return jsonify({
            "resultado": "error",
            "mensaje": "Backend OK pero falló la base de datos",
            "detalle": str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)