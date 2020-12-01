
const fileUpload = require('express-fileupload');
const conexionDB = require('../conexionBD');
const path = require('path')
const fs = require('fs')



const router = require("express").Router();

// default options
router.use(fileUpload());

router.post('/mascotas/archivos/:id', async (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) { // valida si el archivo existe
        return res.status(400).json({ ok: false, err: { msg: "no se ha selecionado ningun archivo" } });
    }
    const { id } = req.params
    let archivoFactura = req.files.archivo; // se pude confirgurar en postman con el nombre de archivo

    // valida la extenciones validas 
    let nombreArhivo = archivoFactura.name.split('.');
    let extension = nombreArhivo[nombreArhivo.length - 1]

    let extensionesValidas = ['pdf', 'exe', 'docx', 'png'];
    console.log(extension)
    if (extensionesValidas.indexOf(extension) < 0) {
        return res.status(400).json({
            ok: false,
            err: {
                mgs: 'las exenciones permitidas son: ' + extensionesValidas.join(', '),
                ext: extension
            }
        })
    }

    // Use the mv() method to place the file somewhere on your server
    archivoFactura.mv(`archivos/${archivoFactura.name} `, async (err) => { // mover el archivo a la carpeta

        if (err) {
            return res.status(500).json({ ok: false, err }); // mmuestra error 
        }

        //ingresar el a la base de datos
        const guardado = await archivoMascota(id, req.files.archivo)
        if (!guardado) {
            return res.status(500).json({ mensaje: "archivo no guardado" })
        }


        res.json('archivo subido correctamente'); // camino bn
    });
});


const archivoMascota = async (id, archivo) => {
    const sql = 'UPDATE mascota SET factura=$1 where id=$2'
    const result = await conexionDB.result(sql, [archivo, id]
        , r => r.rowCount)
    return result == 1
}






module.exports = { router };