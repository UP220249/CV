const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const xml2js = require('xml2js');
const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static(__dirname)); // Sirve archivos estáticos (index.html, productos.xml, etc.)

// Ruta para guardar productos en productos.xml
app.post('/guardar-productos', (req, res) => {
    const productos = req.body; // Array de productos

    // Construir el objeto para xml2js
    const obj = { productos: { producto: productos } };
    const builder = new xml2js.Builder();
    const xml = builder.buildObject(obj);

    fs.writeFile('productos.xml', xml, (err) => {
        if (err) {
            console.error('Error al guardar:', err);
            return res.status(500).send('Error al guardar el archivo XML.');
        }
        res.send('Archivo XML guardado correctamente.');
    });
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});