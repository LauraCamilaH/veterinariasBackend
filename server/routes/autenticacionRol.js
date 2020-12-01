
const jwt = require("jsonwebtoken");



const autenticacionRolMiddleware = async (req, res, next) => {
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



module.exports =  {autenticacionRolMiddleware };

