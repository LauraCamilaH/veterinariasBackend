const router = require("express").Router();

const conexionDB = require('../conexionBD');

const { autenticacionRolMiddleware } = require('./autenticacionRol') // utilizamos el middleware para hacer la autenticacion




const sqlClientes = 'SELECT  usuario.id , nombre, correo, origen_cuenta, activo'+
' FROM usuario INNER JOIN cliente ON usuario.id  = cliente.id_usuario WHERE activo=true'
 

const listar = async (req, res) => {
    const data = await conexionDB.query(sqlClientes)
    res.json(data)
}

const inactivar = async (req, res) => {
    // use of value transformation
    // deleting rows and returning the number of rows deleted
    const { id } = req.params // se puede hacer destructuring por si necitamos mas query paramets
    // insertarTrazabilidad (id, req.user.idUsuario, evento )
    const sql = 'UPDATE usuario SET activo=false where id=$1' // inactivar
    const resul = await conexionDB.query(sql, id ) //r => r.rowCount
    
    console.log(resul)
    //res.json(resul)
    res.status(201).json({ resul: `usuario eliminado id: ${id}` })
}

const modificar = async (req, res) => {
    const { id } = req.params
    const sqlModificar = 'UPDATE usuario SET nombre=$1, correo=$2, activo=$3 where id=$4'
    const data = req.body

    const result = await conexionDB.result(sqlModificar, [req.body.nombre, req.body.correo,  req.body.activo, id]
        , r => r.rowCount)
    if (result == 0) { 
        res.json({ mensaje: 'No se encuentra el registro' }, 404) 
    }
    else {

        res.json({ status: 'Usuario actualizado', message: 'usuario actualizado', data })
    }
}

router.get('/clientes', autenticacionRolMiddleware,async (req, res) => {

    try {
        await listar(req, res)
    } catch (e) {
        console.log(e)
        res.status(500).json({ mensaje: e.menssage })
    }
})

router.get('/clientes/:id', autenticacionRolMiddleware,async (req, res) => {
    try {
       const { id } = req.params
    const sql = 'SELECT  usuario.id , nombre, correo, origen_cuenta, activo'+
' FROM usuario INNER JOIN cliente ON usuario.id  = cliente.id_usuario WHERE usuario.id = $1'
       const data = await conexionDB.oneOrNone(sql, [id])
       if (data == null) res.status(404).json({ menssage: 'No se encuentra el registro' })
       res.status(200).json({ status: 'encontrado', data })
    } catch (e) {
        console.log(e)
        res.status(500).json({ mensaje: e.menssage, data: "no encontrado"})
    }
})


// eliminar registro
router.delete('/clientes/:id', autenticacionRolMiddleware, async (req, res) => { // eliminar registro se utiliza el cambio de registro

    try {
        await inactivar(req, res)
        res.status(200).json({ mensaje: 'cliente eliminado' })
    } catch (e) {
        console.log(e)
        res.status(200).json({ mensaje: e.mensaje })
    }
})

router.put('/clientes/:id', autenticacionRolMiddleware, async (req, res) => { // actualizar registros

    try {
        await modificar(req, res)
    } catch (error) {
        console.log(error)
        res.status(500).json({ mensaje: error.mensaje })
    }
})

module.exports = { router }

