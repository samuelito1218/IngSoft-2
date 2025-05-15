const jwt = require('jsonwebtoken');
const {PrismaClient} = require('@prisma/client');
const bcrypt = require('bcrypt');  // Añadida la importación de bcrypt
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();
const saltRounds = 10;

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
            {expiresIn: '1h'}
        );

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
                vehiculo: newUser.vehiculo
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
                vehiculo: user.vehiculo
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

        // En una aplicación real, enviaríamos un correo
        console.log(`Se enviaría un correo a ${email} con la URL: ${resetUrl}`);

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

//Nuevo método para mantener la persistencia de los usuarios en sus respectivos perfiles:
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