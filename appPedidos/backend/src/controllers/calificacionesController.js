const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();

exports.calificarPedido = async (req,res) =>{
    try{
        const { pedidoId } = req.params;
        const { calificacionRepartidor, calificacionPedido, comentarios } = req.body;
        const clienteId = req.user.id; //ID del cliente autenticado
    //Buscar pedido

    const pedido = await prisma.pedidos.findUnique({
        where: {id:pedidoId}
    });

    if (!pedido){
        return res.status(404).json({message: "Pedido no encontrado"});

    }
    //Verificar que ese pedido pertenece a un cliente autenticado

    if (pedido.usuario_id !==clienteId){
        return res.status(403).json({message: "No tienes permiso para calificar este pedido"});
    }

    //Verificar que el pedido esté en estado Entregado

    if (pedido.estado !== "Entregado"){
        return res.status(400).json({message:"Solo puedes calificar pedidos entregados"});
    }

    //Validar rangos de calificación
    if(
        typeof calificacionRepartidor !== "number" ||
        typeof calificacionPedido !== "number" ||
        calificacionRepartidor < 1 || calificacionRepartidor > 5 ||
        calificacionPedido <1 || calificacionPedido > 5
    ) {
        return res.status(400).json({
            message: "Las calificaciones deben ser números entre 1 y 5"
        });
    }

    //Verificar que aún no exista una calificacion para este pedido

    const yaCalificado = await prisma.calificaciones.findFirst({
        where: {pedidoId}
    });
    if (yaCalificado){
        return res.status(400).json({message: "Este pedido ya ha sido calificado"});
    }

    //Crear la calificación
    const nuevaCalificacion = await prisma.calificaciones.create({
        data: {
            calificacionRepartidor,
            calificacionPedido,
            comentarios,
            pedidoId
        }
    });

    res.status(201).json({
        message: "Calificación registrada exitosamente",
        calificacion: nuevaCalificacion
    });
    
    
    } catch (error){
        console.error("Error al calificar pedido:", error);
        res.status(500).json({
            message: "Error interno al calificar el pedido",
            error: error.message
        });
    }

};