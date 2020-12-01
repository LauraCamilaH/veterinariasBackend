var PdfPrinter = require('pdfmake');
var fonts = {
    Roboto: {
        normal: 'fonts/Roboto-Regular.ttf',
        bold: 'fonts/Roboto-Medium.ttf',
        italics: 'fonts/Roboto-Italic.ttf',
        bolditalics: 'fonts/Roboto-MediumItalic.ttf'
    }
};
var printer = new PdfPrinter(fonts); // config de la libreria
var fs = require('fs'); //Escribir archivo

const readline = require('readline').createInterface({ //Confiracion de readline
    input: process.stdin,
    output: process.stdout
})

/**
 * Convierte el método readline.question a una promesa para poderlo usar con await.
 * @param {string} texto El texto a consultar al usuario 
 */
async function leerLinea(texto) {
    const callback = (resolve, reject) => readline.question(`\n${texto}\n\n>`, e => resolve(e))
    return new Promise(callback)
}

async function generarPDF(nombreMascota, descripcionProcedimiento) {
    var fecha = new Date().toISOString().slice(0, 10); //Fecha actual
    var dd = {
        content: [
            { text: 'Veterinaria My Pet', style: 'titulo1' },
            { text: 'Cirugía', style: 'titulo2' },
            { text: ["Fecha: ", fecha] },
            { text: ["Mascota: ", nombreMascota] },
            { text: "Descripcion del procedimiento:", style: "titulo3" },
            { text: descripcionProcedimiento, style: "descripcion" }
        ],
        styles: {
            defaultStyle: { font: 'Helvetica' },
            titulo1: { fontSize: 18, bold: true, alignment: 'center', margin: [0, 30, 0, 40] },
            titulo2: { fontSize: 15, bold: true, margin: [0, 10, 0, 20] },
            titulo3: { fontSize: 13, bold: true, margin: [0, 20, 0, 10] }
        }
    }
    const nombreArchivo = `${nombreMascota}-${fecha}.pdf`

    // Guardar en archivo
    var pdfDoc = printer.createPdfKitDocument(dd);
    pdfDoc.pipe(fs.createWriteStream(nombreArchivo));
    pdfDoc.end(); //Guardar en archivo
    return nombreArchivo
}


async function main() {
    const nombre = await leerLinea("Ingrese el nombre de la mascota")
    const descripcion = await leerLinea("Ingrese la descripción del prcedimiento")
    const nombreArchivo = await generarPDF(nombre, descripcion)
    console.log(`Archivo generado: ${nombreArchivo}`)
    readline.close()
}

main()
