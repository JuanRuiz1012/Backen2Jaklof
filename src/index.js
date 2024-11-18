const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const database = require('./database');

// Inicialización del servidor
const app = express();
app.set("port", 4000);

// Configuración de CORS
app.use(cors({
    origin: 'http://localhost:5173', // Asegúrate de que sea el puerto del frontend
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
}));

// Middlewares
app.use(morgan("dev"));
app.use(express.json()); // Para parsear JSON en las solicitudes POST

// Ruta para obtener productos
app.get("/products", async (req, res) => {
    try {
        const connection = await database.getConnection();
        const result = await connection.query("SELECT * FROM producto");
        console.log("Productos obtenidos:", result);
        res.json(result);
    } catch (error) {
        console.error("Error al obtener productos:", error);
        res.status(500).json({ error: "Error al obtener productos" });
    }
});

app.post("/check-stock", async (req, res) => {
    const { productIds } = req.body;

    try {
        const connection = await database.getConnection();
        let errorMessage = "";

        for (const productId of productIds) {
            const [rows] = await connection.query("SELECT stock FROM producto WHERE id = ?", [productId]);

            // Verificar si no se encontraron productos
            if (rows.length === 0) {
                errorMessage = 'Producto con ID ${productId} no encontrado.';
                break;
            }

            const currentStock = rows[0]?.stock; // Uso de optional chaining (?.)

            // Verificar si el stock es 0 o menos
            if (currentStock <= 0) {
                errorMessage = 'El producto con ID ${productId} no tiene stock disponible';
                break;
            }
        }

        if (errorMessage) {
            return res.status(400).json({ error: errorMessage });
        }

        res.status(200).json({ message: "Stock verificado correctamente, todo está bien." });
    } catch (error) {
        console.error("Error al verificar el stock:", error);
        res.status(500).json({ error: "Error al verificar el stock" });
    }
});

// Ruta para actualizar el stock
app.post("/update-stock", async (req, res) => {
    const products = req.body;
    console.log("Productos recibidos:", products);

    try {
        const connection = await database.getConnection();
        const queries = products.map((product) => 
            connection.query("UPDATE producto SET stock = stock - ? WHERE id = ? AND stock >= ?", 
                [product.quantity, product.id, product.quantity])
        );
        await Promise.all(queries);

        res.status(200).json({ message: "Stock actualizado exitosamente" });
    } catch (error) {
        console.error("Error al actualizar el stock:", error);
        res.status(500).json({ error: "Error al actualizar el stock" });
    }
});

// Inicio del servidor
app.listen(app.get("port"), () => {
    console.log("Servidor corriendo en el puerto", app.get("port"));
});