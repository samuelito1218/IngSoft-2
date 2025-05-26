const jwt = require('jsonwebtoken');
const {PrismaClient} = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
//const { sendEmail } = require('../services/emailService');

const prisma = new PrismaClient();
const saltRounds = 10;

// Configuración del servicio de correo
const mailConfig = {
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'fastfood.notificaciones@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'app_password_here'
  }
};

// Función para enviar correo (mejorada con mejor manejo de errores)
const sendEmail = async (to, subject, htmlContent) => {
  // En un entorno de desarrollo/pruebas, sólo logueamos en consola
  console.log('\n========== CORREO ELECTRÓNICO ==========');
  console.log(`PARA: ${to}`);
  console.log(`ASUNTO: ${subject}`);
  console.log(`CONTENIDO HTML: ${htmlContent}`);
  console.log('=========================================\n');
  
  // Si estamos en producción, enviar realmente el correo
  if (process.env.NODE_ENV === 'production') {
    try {
      // Verificar configuración
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.error('ADVERTENCIA: Credenciales de correo no configuradas en .env');
        return false;
      }
      
      const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER || 'fastfood.notificaciones@gmail.com',
          pass: process.env.EMAIL_PASSWORD || 'app_password_here'
        }
      });
      
      const info = await transporter.sendMail({
        from: '"FastFood App" <fastfood.notificaciones@gmail.com>',
        to,
        subject,
        html: htmlContent
      });
      
      console.log('Correo enviado correctamente:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error al enviar correo:', error);
      return false;
    }
  }
  
  return true; // Simular éxito en desarrollo
};

// Registro de usuario
exports.register = async(req, res) => {
    try {
        const { nombreCompleto, email, password, telefono, cedula, direccion, comuna, rol, vehiculo } = req.body;

        console.log('Datos recibidos:', { nombreCompleto, email, telefono, cedula, direccion, comuna, rol, vehiculo });

        // Verificar si el usuario ya existe
        console.log('Verificando si el usuario existe...');
        const existingUser = await prisma.Usuarios.findUnique({
            where: {
                email: email,
            },
        });
        if (existingUser) {
            return res.status(400).json({message: 'El correo ya se encuentra registrado'});
        }
        console.log('Email disponible, continuando...');

        // Validar el rol
        const rolesValidos = ['Cliente', 'Repartidor', 'Admin'];
        if (!rolesValidos.includes(rol)) {
            return res.status(400).json({
                message: 'Rol no válido. Los roles permitidos son: Cliente, Repartidor, Admin'
            });
        }

        // Validar vehículo para repartidores
        if (rol === 'Repartidor' && (!vehiculo || !['Moto', 'Bicicleta'].includes(vehiculo))) {
            return res.status(400).json({
                message: 'Vehículo no válido. Las opciones son: Moto, Bicicleta'
            });
        }

        // Encriptar la contraseña
        console.log('Encriptando contraseña...');
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log('Contraseña encriptada correctamente');
        
        // Convertir telefono, cedula y comuna a números
        const telefonoNum = parseInt(telefono);
        const cedulaNum = parseInt(cedula);
        const comunaNum = parseInt(comuna);
        
        if (isNaN(telefonoNum) || isNaN(cedulaNum) || isNaN(comunaNum)) {
            return res.status(400).json({
                message: 'Teléfono, cédula y comuna deben ser valores numéricos'
            });
        }
        
        // Para administradores, establecer estado de verificación
        const verificado = true; // Todos los usuarios verificados automáticamente

        // Datos para crear el usuario - adaptado para MongoDB
        console.log('Preparando datos de usuario...');
        const userData = {
            nombreCompleto,
            email,
            contrase_a: hashedPassword,
            telefono: telefonoNum,
            cedula: cedulaNum,
            direccion,
            rol,
            vehiculo: rol === 'Repartidor' ? vehiculo : null,
            verificado, // Ahora siempre es true
            historialDirecciones: [  // Formato MongoDB
                {
                    comuna: comunaNum,
                    barrio: direccion,
                    direccionEspecifica: direccion
                }
            ]
        };
        
        console.log('Intentando crear usuario con datos:', JSON.stringify(userData, null, 2));
        
        // Crear el usuario en la base de datos
        console.log('Creando usuario en la base de datos...');
        const newUser = await prisma.Usuarios.create({
            data: userData
        });

        console.log('Usuario creado exitosamente:', newUser.id);

        // Generar token de verificación
        const token = jwt.sign(
            {userId: newUser.id, email: newUser.email, rol: newUser.rol},
            process.env.JWT_SECRET,
            {expiresIn: '24h'}
        );

        // ==== NUEVO CÓDIGO PARA ENVIAR CORREO ====
        
        // Crear el contenido del correo según el rol
        let htmlCorreo = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #ff4b2b;">FastFood</h1>
            </div>
            <h2>¡Bienvenido/a a FastFood!</h2>
            <p>Estimado/a ${nombreCompleto},</p>
            <p>Tu cuenta ha sido creada exitosamente. Ahora puedes disfrutar de todas las funcionalidades de nuestra plataforma.</p>
        `;
        
        // Personalizar mensaje según el rol
        if (rol === 'Admin') {
            htmlCorreo += `
            <p>Como administrador, ahora puedes comenzar a configurar tu restaurante y ofrecer tus productos en la plataforma.</p>
            `;
        } else if (rol === 'Repartidor') {
            htmlCorreo += `
            <p>Como repartidor, ahora puedes comenzar a aceptar entregas y formar parte de nuestro equipo de distribución.</p>
            `;
        } else { // Cliente
            htmlCorreo += `
            <p>Como cliente, ahora puedes comenzar a ordenar comida de tus restaurantes favoritos.</p>
            `;
        }
        
        htmlCorreo += `
            <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.</p>
            <p>¡Esperamos que disfrutes de FastFood!</p>
        </div>
        `;

        // Intentar enviar el correo (no detiene el registro si falla)
        try {
            console.log('Intentando enviar correo de bienvenida a:', email);
            await sendEmail(email, 'Bienvenido a FastFood', htmlCorreo);
            console.log('Correo de bienvenida enviado');
        } catch (emailError) {
            console.error('Error al enviar correo de bienvenida:', emailError);
        }
        
        // ==== FIN DEL NUEVO CÓDIGO ====

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            token: token,
            user: {
                id: newUser.id,
                nombreCompleto: newUser.nombreCompleto,
                email: newUser.email,
                telefono: newUser.telefono,
                cedula: newUser.cedula,
                direccion: newUser.direccion,
                rol: newUser.rol,
                vehiculo: newUser.vehiculo,
                verificado: newUser.verificado
            },
        });
    } catch (error) {
        console.error('Error al registrar el usuario:', error);
        console.error('Detalles adicionales del error:', JSON.stringify(error, null, 2));
        
        // Proporcionar detalles del error para facilitar la depuración
        res.status(500).json({
            message: 'Error al registrar el usuario', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            prismaError: error.code ? {
                code: error.code,
                meta: error.meta
            } : undefined
        });
    }
};

// Login de usuario
exports.login = async(req, res) => {
    try {
        const {email, password} = req.body;

        // Buscar el usuario en la base de datos
        const user = await prisma.Usuarios.findUnique({
            where: {
                email: email,
            },
        });
        if (!user) {
            return res.status(401).json({message: 'Credenciales inválidas'});
        }

        // Verificar la contraseña
        const isPasswordValid = await bcrypt.compare(password, user.contrase_a);
        if (!isPasswordValid) {
            return res.status(401).json({message: 'Credenciales inválidas'});
        }

        // Verificar si el usuario está verificado en caso de Admin
        if (user.rol === 'Admin' && !user.verificado) {
            return res.status(403).json({
                message: 'Tu cuenta está pendiente de verificación. Por favor, revisa tu correo electrónico.'
            });
        }

        // Generar token de acceso
        const token = jwt.sign(
            {userId: user.id, email: user.email, rol: user.rol},
            process.env.JWT_SECRET,
            {expiresIn: '24h'}
        );

        res.status(200).json({
            message: 'Inicio de sesión exitoso',
            token: token,
            user: {
                id: user.id,
                nombreCompleto: user.nombreCompleto,
                email: user.email,
                telefono: user.telefono,
                cedula: user.cedula,
                direccion: user.direccion,
                rol: user.rol,
                vehiculo: user.vehiculo,
                verificado: user.verificado
            },
        });
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({message: 'Error al iniciar sesión', error: error.message});
    }
};

// Solicitud para recuperar contraseña
exports.requestPasswordReset = async(req, res) => {
    try {
        const {email} = req.body;

        // Buscar el usuario en la base de datos
        const user = await prisma.Usuarios.findUnique({
            where: {
                email: email,
            },
        });
        if (!user) {
            // Por seguridad, no informamos si el email existe o no
            return res.status(200).json({ message: 'Si el correo existe, recibirás instrucciones para recuperar tu contraseña' });
        }

        // Generar token de recuperación
        const token = crypto.randomBytes(32).toString('hex');
        const expirationDate = new Date(Date.now() + 3600000); // 1 hora de validez

        // Guardar token en bd
        await prisma.Usuarios.update({
            where: {id: user.id},
            data: {
                resetToken: token,
                resetTokenExpiry: expirationDate.toISOString(), // Guardar como string en formato ISO   
            }
        });

        // URL para restablecer contraseña (frontend)
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${token}`;

        // Enviar correo real
        await sendEmail(
            email,
            'Recuperación de contraseña - FastFood',
            `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #ff4b2b;">FastFood</h1>
                </div>
                <h2>Recuperación de contraseña</h2>
                <p>Estimado/a ${user.nombreCompleto},</p>
                <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. Si no has sido tú quien ha realizado esta solicitud, puedes ignorar este correo.</p>
                <p>Para restablecer tu contraseña, haz clic en el siguiente enlace:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="background-color: #ff4b2b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Restablecer contraseña</a>
                </div>
                <p>Este enlace expirará en 1 hora.</p>
                <p>Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:</p>
                <p style="word-break: break-all;">${resetUrl}</p>
            </div>
            `
        );

        res.status(200).json({message: 'Si el correo existe, recibirás instrucciones para recuperar tu contraseña'});
    } catch (error) {
        console.error('Error al recuperar la contraseña:', error);
        res.status(500).json({message: 'Error al procesar la solicitud', error: error.message});
    }
};

// Resetear contraseña
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
  
        // Buscar usuario por token
        const user = await prisma.Usuarios.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: {
                    gt: new Date().toISOString(), // Token no expirado
                },
            },
        });
  
        if (!user) {
            return res.status(400).json({ message: 'Token inválido o expirado' });
        }
  
        // Encriptar nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
  
        // Actualizar contraseña y eliminar token
        await prisma.Usuarios.update({
            where: { id: user.id },
            data: {
                contrase_a: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });
  
        res.status(200).json({ message: 'Contraseña actualizada correctamente' });
    } catch (error) {
        console.error('Error al restablecer contraseña:', error);
        res.status(500).json({ message: 'Error al restablecer contraseña', error: error.message });
    }
};

// Obtener información del usuario actual
exports.getCurrentUser = async (req, res) => {
  try {
    // req.user.id está disponible gracias al middleware de autenticación
    const userId = req.user.id;
    
    // Buscar el usuario en la base de datos
    const user = await prisma.Usuarios.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Devolver la información del usuario (sin la contraseña)
    res.status(200).json({
      id: user.id,
      nombreCompleto: user.nombreCompleto,
      email: user.email,
      telefono: user.telefono,
      cedula: user.cedula,
      direccion: user.direccion,
      rol: user.rol,
      vehiculo: user.vehiculo,
      imageUrl: user.imageUrl || null
    });
  } catch (error) {
    console.error('Error al obtener información del usuario:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

// Validar cédula (verificar disponibilidad)
exports.validateCedula = async (req, res) => {
  try {
    const { cedula } = req.params;
    
    // Validar formato de cédula si es necesario
    if (!cedula || cedula.length < 5) {
      return res.status(400).json({ message: 'Formato de cédula inválido' });
    }
    
    // CORREGIDO: Usar 'Usuarios' con mayúscula, no 'usuarios'
    // También, convertir la cédula a número entero (parseInt)
    const existingUser = await prisma.Usuarios.findFirst({
      where: { cedula: parseInt(cedula) }
    });
    
    if (existingUser) {
      // Si existe, retornar conflicto
      return res.status(409).json({ 
        message: 'Esta cédula ya está registrada en el sistema',
        field: 'cedula'
      });
    }
    
    // Si no existe, retornar éxito
    return res.status(200).json({ 
      message: 'Cédula disponible',
      valid: true
    });
    
  } catch (error) {
    console.error('Error al validar cédula:', error);
    res.status(500).json({ message: 'Error al validar cédula' });
  }
};

// Validar teléfono (verificar disponibilidad)
exports.validateTelefono = async (req, res) => {
  try {
    const { telefono } = req.params;
    
    // Validar formato de teléfono si es necesario
    if (!telefono || telefono.length < 6) {
      return res.status(400).json({ message: 'Formato de teléfono inválido' });
    }
    
    // CORREGIDO: Usar 'Usuarios' con mayúscula, no 'usuarios'
    // También, convertir el teléfono a número entero (parseInt)
    const existingUser = await prisma.Usuarios.findFirst({
      where: { telefono: parseInt(telefono) }
    });
    
    if (existingUser) {
      // Si existe, retornar conflicto
      return res.status(409).json({ 
        message: 'Este número de teléfono ya está registrado',
        field: 'telefono'
      });
    }
    
    // Si no existe, retornar éxito
    return res.status(200).json({ 
      message: 'Teléfono disponible',
      valid: true
    });
    
  } catch (error) {
    console.error('Error al validar teléfono:', error);
    res.status(500).json({ message: 'Error al validar teléfono' });
  }
};

// Solicitar recuperación de contraseña
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'El correo electrónico es requerido' });
    }

    // Verificar si el correo existe en la base de datos
    const usuario = await prisma.Usuarios.findUnique({
      where: { email }
    });

    // Si el usuario no existe, enviar respuesta de error
    if (!usuario) {
      return res.status(404).json({ message: 'No existe una cuenta con este correo electrónico' });
    }

    // Generar token único para recuperación
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora de validez

    // Almacenar token en la base de datos
    await prisma.Usuarios.update({
      where: { id: usuario.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    // Crear URL de recuperación
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password-forgot/${resetToken}`;

    // Contenido del correo
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #f4511e;">FastFood</h1>
        </div>
        <h2 style="color: #333;">Recuperación de contraseña</h2>
        <p>Hola ${usuario.nombreCompleto},</p>
        <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #f4511e; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Restablecer contraseña</a>
        </div>
        <p>Este enlace es válido por 1 hora. Si no solicitaste restablecer tu contraseña, puedes ignorar este correo.</p>
        <p style="margin-top: 30px; font-size: 14px; color: #777;">Saludos,<br>El equipo de FastFood</p>
      </div>
    `;

    // Enviar correo
    const emailSent = await sendEmail(
      email,
      'Recuperación de contraseña - FastFood',
      htmlContent
    );

    if (emailSent) {
      return res.status(200).json({ 
        message: 'Se ha enviado un correo con instrucciones para recuperar tu contraseña' 
      });
    } else {
      return res.status(500).json({ 
        message: 'Error al enviar el correo. Por favor, intenta nuevamente.' 
      });
    }

  } catch (error) {
    console.error('Error en forgotPassword:', error);
    return res.status(500).json({ 
      message: 'Error al procesar la solicitud', 
      error: error.message 
    });
  }
};

// Restablecer contraseña con token
exports.resetPasswordForgot = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token y nueva contraseña son requeridos' });
    }

    // Verificar si existe un usuario con ese token y que no haya expirado
    const usuario = await prisma.Usuarios.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date() // Que el token no haya expirado
        }
      }
    });

    if (!usuario) {
      return res.status(400).json({ 
        message: 'El enlace de recuperación es inválido o ha expirado' 
      });
    }

    // Encriptar la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña y limpiar campos de recuperación
    await prisma.Usuarios.update({
      where: { id: usuario.id },
      data: {
        contrase_a: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    return res.status(200).json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error en resetPassword:', error);
    return res.status(500).json({ 
      message: 'Error al restablecer la contraseña', 
      error: error.message 
    });
  }
};