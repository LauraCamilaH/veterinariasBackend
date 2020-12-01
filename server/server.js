
const express = require('express') // utilizamos express peticiones http GET, POST DELETE
const app = express() // crea un objecto del modulo express
const path = require('path'); //correlaciona las vias de acceso y manipulamos rutas


const bodyParser = require('body-parser') // se hace parse del body para pasarlo a JSON si no queda como un texto plano

app.use(bodyParser.urlencoded({ extended: false })) // analiza objecto JSON, haciendo parse desde la url

app.use(bodyParser.json()) //middleware funciones que se disparan cada vez que pasa por estas lineas 

const config = require('./config/config') // como es el primer archivo configura las variables de entorno que requiere mi aplicaion

app.use(require('./routes/login').router); // hacemos uso del archivo de autenticacion 
app.use(require('./routes/clientes').router);
app.use(require('./routes/mascotas').router);
app.use(require('./routes/archivos').router);
app.use(require('./routes/eventos').router);

//habilitar la carpeta public
app.use( express.static( path.resolve(__dirname, '../public'))); 


app.listen(process.env.PORT,
    () => {
        console.log(`escuchando en el puerto ${process.env.PORT}`)
    })
