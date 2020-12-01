const router = require("express").Router();
const conexionDB = require('../conexionBD');
const { crearMascota } = require('../pooMascotas')


const insertarEvento = async (costoEvento, fecha, idTipoEvento) => {
    const sql = 'INSERT INTO evento_veterinario (costo, fecha, asignacion_evento, id_tipo_evento_veterinario) ' +
        'VALUES ($1, $2, $3, $4) RETURNING id'
    const { id } = await conexionDB.one(sql, [costoEvento, fecha, "evento asignado", idTipoEvento]);
    return id
}

router.post('/eventos', async (req, res) => {
    const fecha = new Date();
    const { idMascota, idTipoEvento } = req.body

    const sql = 'SELECT * FROM mascota WHERE mascota.id = $1'
    const infoMascota = await conexionDB.oneOrNone(sql, [idMascota]) // cargo la informacion de la mascota
    const tipoEvento = await conexionDB.oneOrNone('SELECT * from tipo_evento_veterinario WHERE id=$1', [idTipoEvento])// cargamos nombre del tipo de la mascota

    const mascota = crearMascota(infoMascota.tipo_mascota)

    mascota.getPrecioEvento(tipoEvento.nombre_evento, (error, precio) => {
        if (error) return res.status(500)
        insertarEvento(precio, fecha, idTipoEvento)
            .then(idEvento => res.status(200).json({ idEvento }))
            .error(e => res.status(500).json({ mensaje: "Error interno del servidor" }))
    })

})


module.exports = { router }



