const router = require("express").Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken"); 
const pn = require('../conexionBD');




const { OAuth2Client } = require('google-auth-library'); // autenticacion google
const client = new OAuth2Client(process.env.CLIENT_ID); // autenticacion google

async function hashPassword(password) {
	const passwordHash = await bcrypt.hash(password, process.env.PASSWORD_SALT);
	return passwordHash
}


const sqlUsuario = 'INSERT INTO usuario (nombre, correo, password, origen_cuenta) VALUES ($1, $2, $3, $4) RETURNING id'
const sqlRol = 'INSERT INTO r_rol_usuario (id_rol, id_usuario) VALUES ($1, $2)'
const sqlcliente = `INSERT INTO cliente ("id_usuario") VALUES ($1)`
const sqlveterinario = `INSERT INTO veterinario (id_usuario, nombre_veterinaria) VALUES ($1, $2)`
const sqllistacorreos = `SELECT correo FROM usuario where correo = $1`



router.post("/registro", async (req, res) => {

	try {

		let { nombre, correo, password, passwordCheck, rol } = req.body;
		
		console.log(typeof (rol))

		if (!nombre || !correo || !password || !passwordCheck || !rol)
			return res.status(400).json({ mensaje: "No ha ingresado todos los campos necesarios." });

		if (password.length < 5)
			return res.json({ msg: "La contraseña debe tener al menos 5 caracteres." }, 400);
		if (password !== passwordCheck)
			return res.json({ msg: "Ingrese la misma contraseña dos veces para verificación." }, 400);

		console.log(rol)

		if (rol != "cliente" && rol != "veterinario") {

			return res.status(400).json({ msg: "ingresee uno de los siguientes roles: cliente o veterinario" })
		}

		const passwordHash = await hashPassword(password)
		const newUser = { nombre, correo, password: passwordHash, roles: [rol] };
		console.log(newUser);


		const listacorreos = await pn.query(sqllistacorreos, [correo]);

		if (listacorreos.length > 0) {
			return res.status(400).json({ msg: "correo ya registrado en la base de datos, ingrese con su usuario y contraseña" })
		}

		const { id } = await pn.one(sqlUsuario, [nombre, correo, passwordHash, 'registro_login']);

		await registrotablasusuario(rol, id, "nombre veterinaria postman")



		res.status(201).json(newUser);


	} catch (err) {
		console.log(err)
		res.status(500).json({ error: err.message });
	}
});

//-----------------------------------------------------------------------

router.post("/login", async (req, res) => {
	try {
		const { correo, password, token } = req.body;

		
		if (!correo)
		return res.status(400).json({ msg: "Ingrese el correo con el que se registro." });
		
		//const dbUser = await pn.oneOrNone(`SELECT * FROM usuario WHERE correo = $1`, [correo]);
		
		const sql = 'select  usuario.id, usuario.password, rol.nombre as rol , usuario.nombre, correo, origen_cuenta ' +
		'FROM usuario inner join r_rol_usuario rru on usuario.id = rru.id_usuario inner join rol on rru.id_rol = rol.id' +
		' WHERE correo = ${correo}'
		const dbUser = await pn.one(sql, { correo })
		dbUser.roles = [dbUser.rol]
		
			
			if (dbUser == null)
			return res.status(400).json({ msg: "Aun no se ha registrado, correo no encontrado" })
			console.log(dbUser);
			
			if (dbUser.activo == false)
			return res.status(400).json({ msg: "usuario inactivo." });
			
			if (password != null) {
				const hashLogin = await hashPassword(password)
				console.log(hashLogin)
				// compara el password
				let comparacion = hashLogin === dbUser.password
				if (!comparacion) return res.status(400).json({ mensaje: "Password incorrecto" });
				
				console.log(dbUser)
			}
			
			
			
		const tokenGenerado = jwt.sign({ //creando el token de ingreso
			nombre: dbUser.nombre,
			correo: dbUser.correo,
			id: dbUser.id,
			roles: dbUser.roles
		},
			process.env.JWT_SECRET);// firma el token genera_

		res.json({ tokenGenerado, menssage: "Ingreso existoso" });//Se retorna Objeto usuario
	} catch (err) {
		console.log(err)
		res.status(500).json({ error: err.message });
	}
});



//CONFIG  de google


function obtenerToken(req) {

	return req.body.idtoken
}

/**
 * Decodifica  el token dado y  retorna un objeto con los
 * datos del usuario
 * @param {string} token  el token de google
 * @return {object} usuario
 */
async function decodificarToken(token) { // decodifica y google valida el token

	const ticket = await client.verifyIdToken({
		idToken: token,
		audience: process.env.CLIENT_ID,

		// Specify the CLIENT_ID of the app that accesses the backend
		// Or, if multiple clients access the backend:
		//[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
	});
	const payload = ticket.getPayload(); // carga los datos 
	return payload   //retorna la carga de los datos
}

async function buscarUsuario(usuarioToken) {
	try {
		const sql = 'select  usuario.id, rol.nombre as rol , usuario.nombre, correo, origen_cuenta ' +
			'FROM usuario inner join r_rol_usuario rru on usuario.id = rru.id_usuario inner join rol on rru.id_rol = rol.id' +
			' WHERE correo = ${correo}'
		const resultado = await pn.one(sql, { correo: usuarioToken.email })
		return { ...resultado, roles: [resultado.rol] } // creo un objecto, con todas las propiedades que viene de resultado co el adicional
	} catch (e) {
		if (e.code === 0) return null
		else throw e
	}
}

async function registrotablasusuario(rolestabla, id, nombreVeterinaria) {

	let id_rol = 1

	if (rolestabla == "cliente") {
		const responscliente = await pn.query(sqlcliente, [id])
		id_rol = 1
	}

	if (rolestabla == "veterinario") {
		const responsveterinario = await pn.query(sqlveterinario, [id, nombreVeterinaria])
		id_rol = 2
	}

	const responsrol = await pn.query(sqlRol, [id_rol, id]);
}

/**
 * Crea un usuario en la base de datos, inserta en las tablas usuario, usuario_rol y en la
 * tabla veterinario o cliente de acuerdo al valor del rol.
* @param {object} usuarioToken Payload del token.
 * @param {string} rol El rol con el cual se creará el usuario
 * @returns {object} la información del usuario creado 
 */
async function crearUsuario(usuarioToken, rol) {
	const { id } = await pn.one(sqlUsuario, [usuarioToken.name, usuarioToken.email, 'constrasenaconstante', 'google']);
	await registrotablasusuario(rol, id, "nombre veterinarias google")
	return { nombre: usuarioToken.name, correo: usuarioToken.email, id: usuarioToken.id, roles: [rol] } // crea el usuario y me retorna los datos que necesito para incluirlos en el token
}


async function generarToken(usuarioDb) {
	const tokenGoogle = jwt.sign({
		id: usuarioDb.id,
		nombre: usuarioDb.nombre,
		roles: usuarioDb.roles
	}, process.env.JWT_SECRET)
	return tokenGoogle
}



router.post("/registrogoogle", async (req, res) => {
	const rol = req.body.rol
	const googleToken = obtenerToken(req) // viene del body

	const usuarioToken = await decodificarToken(googleToken) // retorna el payloy 

	let usuarioDb = await buscarUsuario(usuarioToken)  //

	if (usuarioDb != null && !usuarioDb.origen_cuenta == "google") {
		//La cuenta fue creada usando usuario y contraseña
		console.log({
			status: 400,
			msg: "usuario ya registrado autenticar con contraseña"
		})
		return res.status(400).json({ mensaje: 'El usuario se debe autenticar con contraseña' })
	}

	if (usuarioDb == null) {
		//El usuario no existe
		usuarioDb = await crearUsuario(usuarioToken, rol)
	}

	const token = await generarToken(usuarioDb)
	console.log("finalizado google", token)
	return res.json({ token })
})



module.exports = { router };

