const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();

// Configuración para guardar documentos
const documentosStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/documentos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueFileName = `${crypto.randomBytes(8).toString('hex')}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueFileName);
  }
});

// Filtro para aceptar solo PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PDF'), false);
  }
};

// Configuración de multer
exports.upload = multer({
  storage: documentosStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  },
  fileFilter: fileFilter
}).single('documento');

// Configuración del servicio de correo
const sendEmail = async (to, subject, htmlContent) => {
  try {
    console.log(`Correo enviado a: ${to}`);
    console.log(`Asunto: ${subject}`);
    console.log(`Contenido HTML: ${htmlContent}`);

    if (process.env.NODE_ENV === 'production') {
      const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER || 'fastfood.notificaciones@gmail.com',
          pass: process.env.EMAIL_PASSWORD || 'app_password_here'
        }
      });

      await transporter.sendMail({
        from: '"FastFood App" <fastfood.notificaciones@gmail.com>',
        to,
        subject,
        html: htmlContent
      });

      console.log('Correo enviado correctamente');
    }
    return true;
  } catch (error) {
    console.error('Error al enviar correo:', error);
    return false;
  }
};

// Método para crear un restaurante pendiente de verificación
exports.crearRestauranteVerificacion = async (req, res) => {
  try {
    if (req.user.rol !== 'Admin') {
      return res.status(403).json({ message: 'Acceso denegado. Solo los administradores pueden crear restaurantes' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Se requiere documentación legal (archivo PDF)' });
    }

    const { nombre } = req.body;

    if (!nombre) {
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: 'Faltan datos obligatorios: nombre' });
    }

    let ubicaciones = [];
    try {
      ubicaciones = JSON.parse(req.body.ubicaciones || '[]');
      if (!Array.isArray(ubicaciones) || ubicaciones.length === 0) {
        throw new Error('Se requiere al menos una ubicación');
      }
    } catch (error) {
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: 'Error en formato de ubicaciones: ' + error.message });
    }

    let direccionesDetalladas = [];
    try {
      direccionesDetalladas = JSON.parse(req.body.direccionesDetalladas || '[]');
    } catch (error) {
      console.warn('No se proporcionaron direcciones detalladas válidas');
    }

    const verificacionData = {
      usuarioId: req.user.id,
      nombre,
      documentoPath: req.file.path,
      ubicaciones,
      direccionesDetalladas,
      fechaSolicitud: new Date(),
      estado: 'pendiente'
    };

    const nuevaVerificacion = await prisma.RestaurantesVerificaciones.create({
      data: verificacionData
    });

    await sendEmail(
      'admin@fastfood.com',
      'Nueva solicitud de verificación de restaurante',
      `
      <div>
        <h1>Nueva solicitud de verificación</h1>
        <ul>
          <li><strong>Restaurante:</strong> ${nombre}</li>
          <li><strong>Usuario:</strong> ${req.user.nombreCompleto} (${req.user.email})</li>
          <li><strong>Fecha:</strong> ${new Date().toLocaleString()}</li>
        </ul>
        <p>Por favor, revisa la documentación y procesa esta solicitud lo antes posible.</p>
      </div>
      `
    );

    res.status(201).json({
      message: 'Solicitud de verificación enviada correctamente. Recibirás un correo cuando sea aprobada.',
      verificacionId: nuevaVerificacion.id
    });
  } catch (error) {
    console.error('Error al crear solicitud de verificación:', error);
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Error al eliminar archivo:', err);
      }
    }

    res.status(500).json({ message: 'Error al crear la solicitud de verificación', error: error.message });
  }
};

// Método para aprobar verificación (solo SuperAdmin)
exports.aprobarVerificacion = async (req, res) => {
  try {
    const { verificacionId } = req.params;

    if (req.user.rol !== 'SuperAdmin') {
      return res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
    }

    const verificacion = await prisma.RestaurantesVerificaciones.findUnique({
      where: { id: verificacionId }
    });

    if (!verificacion) {
      return res.status(404).json({ message: 'Solicitud de verificación no encontrada' });
    }

    if (verificacion.estado !== 'pendiente') {
      return res.status(400).json({ message: 'Esta solicitud ya ha sido procesada' });
    }

    const usuario = await prisma.Usuarios.findUnique({
      where: { id: verificacion.usuarioId }
    });

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const resultado = await prisma.$transaction(async (prisma) => {
      const usuarioActualizado = await prisma.Usuarios.update({
        where: { id: verificacion.usuarioId },
        data: { verificado: true }
      });

      const nuevoRestaurante = await prisma.Restaurantes.create({
        data: {
          nombre: verificacion.nombre,
          ubicaciones: verificacion.ubicaciones,
          usuariosIds: [verificacion.usuarioId]
        }
      });

      await prisma.Usuarios.update({
        where: { id: verificacion.usuarioId },
        data: { restaurantesIds: { push: nuevoRestaurante.id } }
      });

      await prisma.RestaurantesVerificaciones.update({
        where: { id: verificacionId },
        data: {
          estado: 'aprobado',
          fechaAprobacion: new Date(),
          restauranteId: nuevoRestaurante.id
        }
      });

      return { usuario: usuarioActualizado, restaurante: nuevoRestaurante };
    });

    await sendEmail(
      usuario.email,
      '¡Tu restaurante ha sido verificado! - FastFood',
      `
      <div>
        <h1>FastFood</h1>
        <h2>¡Verificación completada!</h2>
        <p>Estimado/a ${usuario.nombreCompleto},</p>
        <p>Nos complace informarte que hemos verificado y aprobado tu restaurante <strong>${verificacion.nombre}</strong>.</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}">Iniciar sesión ahora</a>
      </div>
      `
    );

    res.status(200).json({
      message: 'Verificación aprobada y restaurante creado exitosamente',
      restauranteId: resultado.restaurante.id,
      usuarioId: resultado.usuario.id
    });
  } catch (error) {
    console.error('Error al aprobar verificación:', error);
    res.status(500).json
    ({ message: 'Error al aprobar la verificación', error: error.message });
}
};
