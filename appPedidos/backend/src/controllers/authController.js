

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {PrismaClient} = require('@prisma/client');
const crypto = require ('crypto');
const nodemailer = require ('nodemailer');

const prisma = new PrismaClient();
const saltRounds = 10; //Determina complejidad del proceso de encriptación, realizara 1.024 calculos internos para generar o verificar un hash

//Registro de usuario
exports.register = async(req,res)=>{
    try{
        const{nombreCompleto, email, password, telefono, cedula, direccion} = req.body;

        //verificar si el usuario ya existe
        const existingUser = await prisma.usuario.findUnique({
            where:{
                email: email,
            },
        });
        if(existingUser){
            return res.status(400).json({message: 'El correo ya se encuentra registrado'});
        }

        //Encriptar la contraseña
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        //Crear el usuario en la base de datos
        const newUser = await prisma.usuario.create({
            data:{
                nombreCompleto: nombreCompleto,
                email: email,
                password: hashedPassword,
                telefono: telefono,
                cedula: cedula,
                direccion: direccion,
                rol: 'cliente', // Asignar rol por defecto
                historialDirecciones:[
                    {
                        direccion: direccion,
                        fechaCreacion: new Date(),
                    },
                ]
            },
        });

        //Generar token de verificación
        const token = jwt.sign(
            {userId: newUser.id, email: newUser.email, rol: newUser.rol},
            process.env.JWT_SECRET,
            {expiresIn: '1h'}
        );

        //Enviar correo de verificación

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
            },
        });
    } catch (error) {
        console.error('Error al registrar el usuario:', error);
        res.status(500).json({message: 'Error al registrar el usuario'});
    }
};


//Login de usuario

exports.login = async(req,res)=>{
    try{
        const {email, password} = req.body;

        //Buscar el usuario en la base de datos
        const user = await prisma.usuario.findUnique({
            where:{
                email: email,
            },
        });
        if(!user){
            return res.status(401).json({message: 'Credenciales inválidas'});
        }

        //Verificar la contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if(!isPasswordValid){
            return res.status(400).json({message: 'Credenciales inválidas'});
        }

        //Generar token de acceso
        const token = jwt.sign(
            {userId: user.id, email: user.email, rol: user.rol},
            process.env.JWT_SECRET,
            {expiresIn: '1h'}
        );

        res.status(200).json({
            message: 'Inicio de sesión exitoso',
            token: token,
            user:{
                id: user.id,
                nombreCompleto: user.nombreCompleto,
                email: user.email,
                telefono: user.telefono,
                cedula: user.cedula,
                direccion: user.direccion,
                rol: user.rol,
            },
        });
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({message: 'Error al iniciar sesión'});
    }
};

//Recuperación de contraseña
exports.recoverPassword = async(req,res)=>{
    try{
        const {email} = req.body;

        //Buscar el usuario en la base de datos
        const user = await prisma.usuario.findUnique({
            where:{
                email: email,
            },
        });
        if (!user) {
            // Por seguridad, no informamos si el email existe o no
            return res.status(200).json({ message: 'Si el correo existe, recibirás instrucciones para recuperar tu contraseña' });
          }

        //Generar token de recuperación
        const token = crypto.randomBytes(32).toString('hex');
        const expirationDate = new Date(Date.now() + 3600000); // 1 hora de validez

        //GUardar token en bd
        await prisma.usuario.update({
            where:{id: user.id},
            data:{
                resetToken: token,
                resetTokenExpiration: expirationDate.toISOString(), // Guardar como string en formato ISO   
            }
        });

        //Enviar correo de recuperación
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth:{
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Recuperación de contraseña',
            text:`Hola ${user.nombreCompleto},\n\nPara recuperar tu contraseña, haz clic en el siguiente enlace:\n\nhttp://localhost:3000/reset-password/${token}\n\nSi no solicitaste esta recuperación, ignora este correo.\n\nSaludos,\nEl equipo de FastFood`,
        };

        await transporter.sendMail(mailOptions);

        // URL para restablecer contraseña (frontend)
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        res.status(200).json({message: 'Correo de recuperación enviado'});
    } catch (error) {
        console.error('Error al recuperar la contraseña:', error);
        res.status(500).json({message: 'Error al recuperar la contraseña'});
    }
};
// Resetear contraseña
exports.resetPassword = async (req, res) => {
    try {
      const { token, newPassword } = req.body;
  
      // Buscar usuario por token
      const user = await prisma.usuario.findFirst({
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
      await prisma.usuario.update({
        where: { id: user.id },
        data: {
          contraseña: hashedPassword,
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