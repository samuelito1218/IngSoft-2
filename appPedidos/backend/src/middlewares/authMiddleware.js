const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
//
const prisma = new PrismaClient();

exports.authenticate = async (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No autorizado' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuario en base de datos - cambiado a usuarios (plural)
    const user = await prisma.usuarios.findUnique({
      where: { id: decoded.userId },
    });
    
    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }
    
    // Añadir usuario a objeto request
    req.user = {
      id: user.id,
      email: user.email,
      rol: user.rol
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Sesión expirada' });
    }
    
    console.error('Error de autenticación:', error);
    res.status(401).json({ message: 'No autorizado' });
  }
};

// Middleware para verificar roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    console.log(' authorize permite:', roles);
    console.log(' req.user.rol ===', req.user?.rol);
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ message: 'No tienes permiso para acceder a este recurso' });
    }
    next();
  };
};
