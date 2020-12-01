const router = require("express").Router();
const conexionDB = require('../conexionBD');



router.post("/mascotas", async (req, res) => {
    try {

        let { id_cliente, nombre, tipo_mascota } = req.body;
        if (!nombre)
            return res.status(400).json({ mensaje: "ingrese el nombre de la mascota." });
        const sql = 'INSERT INTO mascota (id_cliente, nombre, tipo_mascota) VALUES ($1, $2, $3) RETURNING id'
        const { id } = await conexionDB.one(sql, [id_cliente, nombre, tipo_mascota]);
        res.status(201).json({ mensaje: "ingreso exitoso mascota ", id });

    } catch (err) {
        console.log(err)
        res.status(500).json({ error: err.message });
    }
});

router.get('/mascotas', async (req, res) => {

    try {

        const sql = 'SELECT * from mascota'
        const data = await conexionDB.query(sql)
        res.json({ data })

    } catch (e) {
        console.log(e)
        res.status(500).json({ mensaje: e.menssage })
    }
})

router.get('/mascotas/:id', async (req, res) => {
    try {
        const { id } = req.params
        const sql = 'SELECT  mascota.id, usuario.nombre as cuidador, mascota.nombre, tipo_mascota' +
            ' FROM mascota INNER JOIN cliente ON mascota.id_cliente = cliente.id ' +
            'INNER JOIN usuario ON cliente.id_usuario = usuario.id WHERE mascota.id = $1'
        const data = await conexionDB.oneOrNone(sql, [id])
        if (data == null) return res.status(404).json({ menssage: 'No se encuentra el registro' })
        res.status(200).json({ status: 'encontrado', data })
    } catch (e) {
        console.log(e)
        res.status(500).json({ mensaje: e.menssage, data: "no encontrado" })
    }
})



router.delete('/mascotas/:id', async (req, res) => { // 

    try {
        const { id } = req.params
        const resul = conexionDB.result('DELETE FROM mascota WHERE id = ${id}', { idFactura: id }, r => r.rowCount)
        res.status(201).json({ resul: `mascota eliminada: ${id}` })
    } catch (e) {
        console.log(e)
        res.status(200).json({ mensaje: e.mensaje })
    }
})


module.exports = { router }
