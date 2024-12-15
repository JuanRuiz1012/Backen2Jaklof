const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, 
  auth: {
    user: "juan.ruiz.lopez@correounivalle.edu.co", 
    pass: "zytjhczzrsnbpiyi", 
  },
});
transporter.verify()
  .then(() => {
    console.log("Conexión a Gmail exitosa y lista para enviar correos.");
  })
  .catch((error) => {
    console.error("Error al verificar la conexión a Gmail:", error);
  });

module.exports = transporter;
