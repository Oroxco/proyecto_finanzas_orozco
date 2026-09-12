const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Conexión a base de datos MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',     
    password: '',     
    database: 'finanzas_db'
});

db.connect((err) => {
    if (err) {
        console.error('Error al conectar con MySQL:', err.message);
        return;
    }
    console.log('Conexión exitosa a MySQL');
});

// Endpoint GET para obtener las transacciones
app.get('/api/transacciones', (req, res) => {
    const sql = "SELECT * FROM transacciones";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Iniciar servidor en el puerto 3000
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor API corriendo en http://localhost:${PORT}`);
});