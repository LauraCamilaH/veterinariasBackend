const fs = require('fs');
const conexionBD = require ('./conexionBD')


class Mascota {
   
    
    /**
     * 
     * @param {string} tipoEvento tipo evento 
     * @returns {number} el precio del evento 
     */
    getPrecioEvento(tipoEvento, callback) {
    }
}

//consulta, cita, peluqueria, cirugia
class Perro extends Mascota {
    getPrecioEvento(tipoEvento, callback) {
        switch (tipoEvento) {
            case "consulta": callback(null, 35_000); break;
            case "cita": callback(null, 25_000); break;
            case "peluqueria": callback(null, 40_000); break;
            case "cirugia": callback(null, 200_000); break;
        }
        callback("Tipo de evento desconocido", null)
    }
}

class Gato extends Mascota {
    getPrecioEvento(tipoEvento, callback) {
        fs.readFile("./precios.json", "utf-8", (error, datos) => {
            if (error) {
                callback(error, null)
                return
            }
            try {
                const precios = JSON.parse(datos)
                const precio = precios[tipoEvento]
                if (precio == null) {
                    callback("Tipo de evento desconocido", null)
                } else {
                    callback(null, precio)
                }
            } catch (e) {
                callback(e, null)
            }

        });
    }
}

function crearMascota(tipo) {
    tipo = tipo.toLowerCase()
    switch (tipo) {
        case "gato": return new Gato()
        case "perro": return new Perro()
    }
    throw new Error("Tipo de mascota desconocido")
}


// crearMascota("gato").getPrecioEvento("consulta", (error, precio) => {
//     if (error) {
//         console.error(error)
//     } else {
//         console.log(precio)
//     }
// })

module.exports = { 

    Mascota,
    Gato,
    Perro,
    crearMascota, 


}