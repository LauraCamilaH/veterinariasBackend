const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pn = require('../conexionBD');




const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.CLIENT_ID);

async function hashPassword(password) {
    const passwordHash = await bcrypt.hash(password, process.env.PASSWORD_SALT);
    return passwordHash
}

router.post("/registro", async (req, res) => {
    try {

        let { nombreUsuario, correo, password, passwordCheck } = req.body;

        if (!nombreUsuario || !correo || !password || !passwordCheck)
            return res.status(400).json({ mensaje: "No ha ingresado todos los campos necesarios." });
        if (password.length < 5)
            return res.json({ msg: "La contraseña debe tener al menos 5 caracteres." }, 400);
        if (password !== passwordCheck)
            return res.json({ msg: "Ingrese la misma contraseña dos veces para verificación." }, 400);

        const passwordHash = await hashPassword(password)

        const newUser = { nombreUsuario, correo, password: passwordHash };
        console.log(newUser);

        const response = await pn.query('INSERT INTO usuarios ("nombreUsuario", correo, password) VALUES ($1, $2, $3)',
            [nombreUsuario, correo, passwordHash, 'false']);
        console.log(response);
        res.json(newUser);
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: err.message });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { correo, password } = req.body;

        if (!correo || !password)
            return res.status(400).json({ msg: "No ha ingresado todos los campos necesarios." });

        const dbUser = await pn.one(`SELECT * FROM usuarios WHERE correo = $1`, [correo]);
        console.log(dbUser);

        const hashLogin = await hashPassword(password)
        console.log(hashLogin)

        const isMatch = hashLogin === dbUser.password;

        if (!isMatch) return res.json({ mensaje: "Credenciales inválidas" }, 400);
        //console.log(process.env.JWT_SECRET);
        console.log(dbUser)

        const token = jwt.sign({
            nombreUsuario: dbUser.nombreUsuario,
            correo: dbUser.correo, idUser: dbUser.idusuario
        },
            process.env.JWT_SECRET);// firma el token genera_

        res.json({ token });//Se retorna Objeto usuario
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: err.message });
    }
});

const autenticacionMiddleware = async (req, res, next) => {
    const header = req.headers['authorization'] //Authorization : Bearer <token>
    if (typeof header === 'undefined') {
        console.log(`No se encontró el header de autenticación`)
        return res.sendStatus(403); // codigo no permitido
    }
    // console.log(`Header de autenticación -> ${header}`)
    const bearer = header.split(" "); // partidos en dos los headers
    const bearerToken = bearer[1]; // y cogemos la ultima parte
    req.token = bearerToken; // la que guardamos en la variable
    try {
        await jwt.verify(req.token, process.env.JWT_SECRET)
    } catch (e) {
        console.log(`Error de verificación de token ${e.message}`)
        return res.sendStatus(403)
    }
    const usuario = jwt.decode(bearerToken)
    req.user = usuario
    next();
}

//CONFIG  de google

async function verify(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    const payload = ticket.getPayload();

    console.log(payload.name);
    console.log(payload.email);
    //const userid = payload['sub'];
    // If request specified a G Suite domain:
    // const domain = payload['hd'];

    return {
        nombre: payload.name,
        email: payload.email,
        //img: payload.picture,
        google: true
    }
}
//verify().catch(console.error);

//

function obtenerToken(req) {
    return req.body.idtoken
}
/**
 * Decodifica  el token dado y  retorna un objeto con los
 * datos del usuario
 * @param {string} token  el token de google
 * @return {object} usuario
 */
async function decodificarToken(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    return payload
}

async function buscarUsuario(usuarioToken) {
    try {
        const sql = "SELECT * FROM usuarios WHERE correo = ${correo}"
        return await pn.one(sql, { correo: usuarioToken.email })
    } catch (e) {
        if (e.code === 0) return null
        else throw e
    }
}

async function crearUsuario(usuarioToken) {
    const sql = `INSERT INTO usuarios ("nombreUsuario", correo, password, google) VALUES ($1, $2, $3, $4) RETURNING idUsuario`
    const { idusuario } = await pn.one(sql, [usuarioToken.name, usuarioToken.email, 'constrasenaconstante', usuarioToken.google]);
    return { idusuario, nombreUsuario: usuarioToken.name, correo: usuarioToken.email, google: usuarioToken.google }
}

async function generarToken(usuarioDb) {
    const tokenGoogle = jwt.sign({
        nombreUsuario: usuarioDb.nombreUsuario,
        correo: usuarioDb.correo, idUser: usuarioDb.idusuario
    }, process.env.JWT_SECRET)
    return tokenGoogle
}

router.post("/google", async (req, res) => {
    const googleToken = obtenerToken(req)
    const usuarioToken = await decodificarToken(googleToken)
    let usuarioDb = await buscarUsuario(usuarioToken)
    if (usuarioDb != null && !usuarioDb.google) {
        return res.status(400).json({ mensaje: 'El usuario se debe autenticar con contraseña' })
    }
    if (usuarioDb == null) {
        usuarioDb = await crearUsuario({ ...usuarioToken, google: true })
    }
    const token = await generarToken(usuarioDb)
    return res.json({ token })
})



module.exports = { router, autenticacionMiddleware };

