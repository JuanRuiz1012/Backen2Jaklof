const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const database = require("./database");
const transporter = require("./sendMail");

// Inicialización del servidor
const app = express();
app.set("port", 4000);

// Configuración de CORS
app.use(
  cors({
    origin: "http://localhost:5173", // Asegúrate de que sea el puerto del frontend
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

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
      const [rows] = await connection.query(
        "SELECT stock FROM producto WHERE id = ?",
        [productId]
      );

      // Verificar si no se encontraron productos
      if (rows.length === 0) {
        errorMessage = "Producto con ID ${productId} no encontrado.";
        break;
      }

      const currentStock = rows[0]?.stock; // Uso de optional chaining (?.)

      // Verificar si el stock es 0 o menos
      if (currentStock <= 0) {
        errorMessage =
          "El producto con ID ${productId} no tiene stock disponible";
        break;
      }
    }

    if (errorMessage) {
      return res.status(400).json({ error: errorMessage });
    }

    res
      .status(200)
      .json({ message: "Stock verificado correctamente, todo está bien." });
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
      connection.query(
        "UPDATE producto SET stock = stock - ? WHERE id = ? AND stock >= ?",
        [product.quantity, product.id, product.quantity]
      )
    );
    await Promise.all(queries);

    res.status(200).json({ message: "Stock actualizado exitosamente" });
  } catch (error) {
    console.error("Error al actualizar el stock:", error);
    res.status(500).json({ error: "Error al actualizar el stock" });
  }
});

// SEND MAIL
app.post("/send-mail", async (req, res) => {
  const { to, subject, text } = req.body;

  if (!to || !subject || !text) {
    return res
      .status(400)
      .json({ error: "Faltan campos obligatorios (to, subject, text)" });
  }

  try {
    await transporter.sendMail({
      from: '"JAKLOF " <juan.ruiz.lopez@correounivalle.edu.co>',
      to,
      subject, 
      text, 
    });

    console.log(`Correo enviado a: ${to}`);
    res.status(200).json({ message: "Correo enviado correctamente" });
  } catch (error) {
    console.error("Error al enviar correo:", error);

    res.status(69).json({
      error: "Error al enviar correo",
      details: error.message, 
    });
  }
});
app.get("/sales", async (req, res) => {
    try {
      const connection = await database.getConnection();
      // Supón que tienes una tabla de ventas o una consulta que te da las ventas por producto
      const result = await connection.query(
        'SELECT producto.title AS product_name, SUM(venta.cantidad) AS total_sales FROM venta JOIN producto ON venta.producto_id = producto.id GROUP BY producto.title'
      );
      console.log("Ventas obtenidas:", result);
      res.json(result);
    } catch (error) {
      console.error("Error al obtener ventas:", error);
      res.status(500).json({ error: "Error al obtener ventas" });
    }
  });

// Inicio del servidor
app.listen(app.get("port"), () => {
  console.log("Servidor corriendo en el puerto", app.get("port"));
});
