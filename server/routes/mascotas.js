const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pn = require('../conexionBD');



const sqlClientes = 'SELECT  cliente .id, nombre, correo, origen_cuenta, activo'+
'FROM usuario INNER JOIN cliente ON usuario.id  = cliente.id_usuario WHERE activo'
const sqlCliente = 'SELECT * FROM usuario where "id" = $1'
const sqlInactivar = 'UPDATE usuario SET activo=$1 where id=$1' // inactivar 
const sqlModificar = 'UPDATE usuario SET nombre=$1, correo=$2, origen_cuenta=$3, activo=$4 where id=$5'
 



const listar = async (req, res) => {
    const data = await db.any(sqlClientes)
    res.json(data)
}

const consultarCliente = async (req, res) => {
    const { id } = req.params
    const data = await db.one(sqlCliente, [id])
   
    if (data == 0) res.json({ menssage: 'No se encuentra el registro' }, 404)
    else res.status(200).json({ status: 'encontrado', message: 'Factura encontrada', data })
}

const insertar = async (req, res) => {
    const data = req.body
    console.log(data)

    const resultado = await db.one('INSERT INTO factura ("numeroFactura", "conceptoFactura", "totalFactura", "fechaCreacion") ' +
        'VALUES(${numeroFactura}, ${conceptoFactura}, ${totalFactura}, ${fechaCreacion}) RETURNING "idFactura"', data)
    console.log(req.user)
    await insertarTrazabilidad(resultado.idFactura, req.user.idUser, "ingresando factura")
    // VALUES(${name.first}, $<name.last>, $/age/)', {
    //     name: {first: 'John', last: 'Dow'},
    //     age: 30
    console.log(resultado)
    res.json(resultado)
}

const inactivar = async (req, res) => {
    // use of value transformation
    // deleting rows and returning the number of rows deleted
    const { id } = req.params // se puede hacer destructuring por si necitamos mas query paramets
    // insertarTrazabilidad (id, req.user.idUsuario, evento )
    const resul = await db.result(sqlInactivar, { id }, r => r.rowCount)
    
    console.log(resul)
    //res.json(resul)
    res.status(201).json({ resul: `usuario eliminado id: ${id}` })
}

const modificar = async (req, res) => {
    const { id } = req.params
    const data = req.body
    const result = await db.result(sqlModificar, [req.body.nombre, req.body.correo, req.body.origen_cuenta, req.body.activo, id]
        , r => r.rowCount)
    if (result == 0) { 
        res.json({ mensaje: 'No se encuentra el registro' }, 404) 
    }
    else {

        res.json({ status: 'Usuario actualizado', message: 'usuario actualizado', data })
    }
}

router.get('/mascotas', autenticacionMiddleware, async (req, res) => {
    try {
        await listar(req, res)
    } catch (e) {
        console.log(e)
        res.status(500).json({ mensaje: e.menssage })
    }
})

router.get('/mascotas/:id', autenticacionMiddleware, async (req, res) => {
    try {
        await consultarCliente(req, res)

    } catch (e) {
        console.log(e)
        res.status(500).json({ mensaje: e.menssage })
    }
})

app.post('/mascotas', autenticacionMiddleware, async (req, res) => { // nuevos registros enviamos informacion 
    //let body = req.body;// aparece cuando el body parse proceso cualquier payload ( la data o la carga que llevo cuanaod se realiza la peticion )
    console.log(req.user)
    try {
        await insertar(req, res)
    } catch (e) {
        console.log(e)
        res.json({ mensaje: e.message }, 500)

    }

})


// eliminar registro
router.put('/mascotas/:id', autenticacionMiddleware, async (req, res) => { // eliminar registro se utiliza el cambio de registro

    try {
        await inactivar(req, res)
        res.json({ mensaje: 'cliente eliminado' }, 200)
    } catch (e) {
        console.log(e)
        res.status(200).json({ mensaje: e.mensaje })
    }
})

router.put('/mascotas/:id', autenticacionMiddleware, async (req, res) => { // actualizar registros

    try {
        await modificar(req, res)
    } catch (error) {
        console.log(error)
        res.status(500).json({ mensaje: error.mensaje })
    }
})





module.exports = { router }

