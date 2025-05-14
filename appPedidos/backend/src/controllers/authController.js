const jwt = require('jsonwebtoken');
const {PrismaClient} = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const saltRounds = 10;

// Configuración del servicio de correo
// Note: En un ambiente real, esto debería estar en un archivo de configuración 
// y usar credenciales reales de un servicio como Sendgrid, Mailgun, etc.
const mailConfig = {
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'fastfood.notificaciones@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'app_password_here'
  }
};

// Función para enviar correo (simulada para este ejemplo)
const sendEmail = async (to, subject, htmlContent) => {
  // En un entorno de desarrollo/pruebas, sólo logueamos en consola
  console.log(`Correo enviado a: ${to}`);
  console.log(`Asunto: ${subject}`);
  console.log(`Contenido HTML: ${htmlContent}`);
  
  // Si estamos en producción, enviar realmente el correo
  if (process.env.NODE_ENV === 'production') {
    try {
      const transporter = nodemailer.createTransport(mailConfig);
      await transporter.sendMail({
        from: '"FastFood App" <fastfood.notificaciones@gmail.com>',
        to,
        subject,
        html: htmlContent
      });
      console.log('Correo enviado correctamente');
    } catch (error) {
      console.error('Error al enviar correo:', error);
    }
  }
  
  return true;
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
        const verificado = rol !== 'Admin';

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
            verificado, // nuevo campo para controlar si el usuario está verificado
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

        // Si es admin, enviar correo de verificación pendiente
        if (rol === 'Admin') {
            await sendEmail(
                email,
                'Verificación de cuenta de Administrador - FastFood',
                `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #ff4b2b;">FastFood</h1>
                    </div>
                    <h2>Solicitud de registro recibida</h2>
                    <p>Estimado/a ${nombreCompleto},</p>
                    <p>Hemos recibido tu solicitud para registrarte como administrador de un restaurante en nuestra plataforma FastFood.</p>
                    <p>En estos momentos, nuestro equipo está revisando la documentación proporcionada. Este proceso puede tomar entre 24 y 48 horas hábiles.</p>
                    <p>Te notificaremos por este medio cuando la verificación haya sido completada.</p>
                    <p>Si tienes alguna pregunta, no dudes en contactarnos respondiendo a este correo.</p>
                    <p>Gracias por elegir FastFood para tu negocio.</p>
                    <p style="margin-top: 30px; font-size: 12px; color: #666;">Este es un mensaje automático, por favor no respondas directamente a este correo.</p>
                </div>
                `
            );
        } else {
            // Para clientes y repartidores, enviar correo de bienvenida
            await sendEmail(
                email,
                'Bienvenido a FastFood',
                `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #ff4b2b;">FastFood</h1>
                    </div>
                    <h2>¡Bienvenido/a a FastFood!</h2>
                    <p>Estimado/a ${nombreCompleto},</p>
                    <p>Tu cuenta ha sido creada exitosamente. Ahora puedes disfrutar de todas las funcionalidades de nuestra plataforma.</p>
                    <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.</p>
                    <p>¡Esperamos que disfrutes de FastFood!</p>
                </div>
                `
            );
        }

        res.status(201).json({
            message: rol === 'Admin' ? 
                'Usuario registrado. Pendiente de verificación de documentos.' : 
                'Usuario registrado exitosamente',
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

        // Buscar el usuario en la base de datos - cambiado a usuarios (plural)
        const user = await prisma.Usuarios.findUnique({
            where: {
                email: email,
            },
        });
        if (!user) {
            return res.status(401).json({message: 'Credenciales inválidas'});
        }

        // Verificar la contraseña - cambiado de contraseña a contrase_a
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
            {expiresIn: '1h'}
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

// Aprobar verificación de restaurante (para uso administrativo)
exports.aprobarVerificacion = async(req, res) => {
    try {
        const { usuarioId } = req.params;

        // Verificar privilegios de administración
        if (req.user.rol !== 'SuperAdmin') {
            return res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
        }

        // Buscar el usuario en la base de datos
        const user = await prisma.Usuarios.findUnique({
            where: { id: usuarioId },
        });

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        if (user.rol !== 'Admin') {
            return res.status(400).json({ message: 'Este usuario no es administrador de restaurante' });
        }

        if (user.verificado) {
            return res.status(400).json({ message: 'Este usuario ya está verificado' });
        }

        // Actualizar estado de verificación
        await prisma.Usuarios.update({
            where: { id: usuarioId },
            data: { verificado: true }
        });

        // Enviar correo de confirmación
        await sendEmail(
            user.email,
            '¡Tu cuenta ha sido verificada! - FastFood',
            `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #ff4b2b;">FastFood</h1>
                </div>
                <h2>¡Verificación completada!</h2>
                <p>Estimado/a ${user.nombreCompleto},</p>
                <p>Nos complace informarte que hemos verificado y aprobado tu documentación.</p>
                <p>Ya puedes acceder a tu cuenta de administrador en nuestra plataforma FastFood y comenzar a gestionar tu restaurante.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="background-color: #ff4b2b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Iniciar sesión ahora</a>
                </div>
                <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.</p>
                <p>¡Gracias por unirte a FastFood!</p>
            </div>
            `
        );

        res.status(200).json({ 
            message: 'Usuario verificado exitosamente',
            usuarioId
        });
    } catch (error) {
        console.error('Error al aprobar verificación:', error);
        res.status(500).json({ message: 'Error al aprobar verificación', error: error.message });
    }
};

// Rechazar verificación de restaurante (para uso administrativo)
exports.rechazarVerificacion = async(req, res) => {
    try {
        const { usuarioId } = req.params;
        const { motivo } = req.body;

        // Verificar privilegios de administración
        if (req.user.rol !== 'SuperAdmin') {
            return res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
        }

        if (!motivo) {
            return res.status(400).json({ message: 'Se requiere un motivo para el rechazo' });
        }

        // Buscar el usuario en la base de datos
        const user = await prisma.Usuarios.findUnique({
            where: { id: usuarioId },
        });

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        if (user.rol !== 'Admin') {
            return res.status(400).json({ message: 'Este usuario no es administrador de restaurante' });
        }

        // Enviar correo de rechazo
        await sendEmail(
            user.email,
            'Resultado de verificación - FastFood',
            `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #ff4b2b;">FastFood</h1>
                </div>
                <h2>Verificación no aprobada</h2>
                <p>Estimado/a ${user.nombreCompleto},</p>
                <p>Lamentamos informarte que no hemos podido aprobar tu solicitud de registro como administrador de restaurante en nuestra plataforma.</p>
                <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #ff4b2b; margin: 20px 0; border-radius: 4px;">
                    <p><strong>Motivo:</strong> ${motivo}</p>
                </div>
                <p>Puedes corregir el problema y volver a intentarlo o contactarnos para más información.</p>
                <p>Gracias por tu interés en FastFood.</p>
            </div>
            `
        );

        // Opcionalmente, eliminar el usuario o marcarlo como rechazado
        await prisma.Usuarios.delete({
            where: { id: usuarioId }
        });

        res.status(200).json({ 
            message: 'Verificación rechazada y notificación enviada',
            usuarioId
        });
    } catch (error) {
        console.error('Error al rechazar verificación:', error);
        res.status(500).json({ message: 'Error al rechazar verificación', error: error.message });
    }
};

// Solicitud para recuperar contraseña
exports.requestPasswordReset = async(req, res) => {
    try {
        const {email} = req.body;

        // Buscar el usuario en la base de datos - cambiado a usuarios (plural)
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

        // Nota: Necesitas añadir los campos resetToken y resetTokenExpiry en tu esquema de Prisma
        // Guardar token en bd - cambiado a usuarios (plural)
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
  
        // Buscar usuario por token - cambiado a usuarios (plural)
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
  
        // Actualizar contraseña y eliminar token - cambiado de contraseña a contrase_a
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