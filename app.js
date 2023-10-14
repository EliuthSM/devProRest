const express = require('express');
const multer = require('multer');
const fs = require('fs'); // Importa el módulo 'fs'
const mysql = require('mysql');
const cors = require('cors'); // Importa el módulo cors
const path = require('path')
const fsx = require('fs-extra')



const app = express();
app.use(express.json());
// Configura el middleware de Multer para gestionar las subidas de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Define la carpeta de destino donde se guardarán los archivos
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Define el nombre del archivo
  },
});


app.use(cors()); 

const db = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  port: 3306,
  database: 'devPro'
})

db.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
  } else {
    
    console.log('Conexión exitosa a la base de datos');
  }
});




/*---------------------------------------------------------------------------*/

const upload = multer({ storage: storage });

// // Configura una ruta para recibir archivos PDF
// app.post('/content', upload.single('pdf'), (req, res) => {
//     try {
//         // Verifica si se subió un archivo
//         if (!req.file) {
//           return res.status(400).json({ message: 'Por favor, sube un archivo PDF.' });
//         }
    
//         // Verifica si el archivo es un PDF (puedes agregar más validaciones si es necesario)
//         if (req.file.mimetype !== 'application/pdf') {
//           return res.status(400).json({ message: 'El archivo debe ser un PDF.' });
//         }
    
//         // El archivo PDF se ha subido correctamente
//         res.json({ message: 'Archivo PDF subido con éxito.' });
//       } catch (error) {
//         // Manejo de errores en caso de cualquier problema durante la subida
//         console.error(error);
//         res.status(500).json({ message: 'Error en la subida del archivo.' });
//       }
// });


// Ruta para descargar un archivo PDF por su nombre
app.get('/download/:nombreArchivo', (req, res) => {
    const nombreArchivo = req.params.nombreArchivo;
    const rutaArchivo = `uploads/${nombreArchivo}`;
  
    // Verifica si el archivo existe
    if (fs.existsSync(rutaArchivo)) {
      // Configura las cabeceras de la respuesta para la descarga
      res.setHeader('Content-Disposition', `attachment; filename=${nombreArchivo}`);
      res.setHeader('Content-Type', 'application/pdf');
  
      // Lee el archivo y lo envía como respuesta
      const archivoStream = fs.createReadStream(rutaArchivo);
      archivoStream.pipe(res);
    } else {
      // El archivo no existe
      res.status(404).json({ message: 'Archivo no encontrado' });
    }
  });


//   // GET CONTENIDOS
// app.get('/content', (req, res) => {
//   // Lee la lista de archivos en la carpeta 'uploads'
//   fs.readdir('uploads', (err, files) => {
//     if (err) {
//       console.error(err);
//       return res.status(500).json({ message: 'Error al leer los archivos.' });
//     }
//     // Filtra los archivos PDF
//     const pdfFiles = files.filter(file => file.endsWith('.pdf'));

//     // Devuelve la lista de archivos PDF
//     res.json({ pdfFiles });
//   });
// });


  // GET CONTENIDOS
  app.post('/content', (req, res) => {
    const category_id = req.body.category_id ?? null
    const query = 'CALL content_list(?)';
    db.query(query, [category_id], (err, result) => {
      if (err) {
        res.status(500).send('Error al obtener datos de la base de datos');
      } else {
        if (result.length === 0) {
          res.status(404).send('Registro no encontrado');
        } else {
          const results = result[0].map(objeto =>{
            if(objeto.has_img){
              objeto.route_img = `multimedia-${objeto.route_img}`
            }else{
               objeto.route_img = null
            }
            

            return ({...objeto})
          })

          res.status(200).json(results);
        }
      }
    });
  });


  // GET UN SOLO CONTENIDO
  app.get('/content/:id', (req, res) => {
    const id = req.params.id;
    const query = 'CALL content_get(?)';

    db.query(query, [id], (err, result) => {
      if (err) {
        res.status(500).send('Error al obtener datos de la base de datos');
      } else {
        if (result.length === 0) {
          res.status(404).send('Registro no encontrado');
        } else {
          const pathImage = path.resolve( __dirname, 
            `uploads/${result[0][0].img_route+
              result[0][0].category_name+
              's/'+
              result[0][0].img_name+
              result[0][0].img_extend}`);

          res.status(200).json({
            img: pathImage,
            contents: result[0][0],
            authors: result[1]
          });
        }
      }
    });
  });


  app.get('/img/:route', (req, res) => {
    const route = req.params.route;
    
    const newRoute = route.replace(/-/g,'/')
    console.log(newRoute)
    const pathImage = path.resolve( __dirname, newRoute);

    res.sendFile(pathImage)
  });
  



//   // GES UN SOLO CONTENIDO
//   app.get('/content/:id', (req, res) => {
//     const id = req.params.id;
    
//   // Lee la lista de archivos en la carpeta 'uploads'
//   fs.readdir('uploads', (err, files) => {
//     if (err) {
//       console.error(err);
//       return res.status(500).json({ message: 'Error al leer los archivos.' });
//     }

//     // Filtra los archivos PDF
//     const pdfFiles = files.filter(file => file.endsWith('.pdf'));

//     // Devuelve la lista de archivos PDF
//     res.json({ pdfFiles });
//   });
// });


// // Ruta para descargar un archivo PDF por su nombre
// app.get('/descargar/:nombreArchivo', (req, res) => {
//   const nombreArchivo = req.params.nombreArchivo;
//   const rutaArchivo = `${__dirname}/uploads/${nombreArchivo}`;

//   // Verifica si el archivo existe
//   if (fs.existsSync(rutaArchivo)) {
//     // Configura las cabeceras de la respuesta para la descarga
//     res.setHeader('Content-Disposition', `attachment; filename=${nombreArchivo}`);
//     res.setHeader('Content-Type', 'application/pdf');

//     // Lee el archivo y lo envía como respuesta
//     const archivoStream = fs.createReadStream(rutaArchivo);
//     archivoStream.pipe(res);
//   } else {
//     // El archivo no existe
//     res.status(404).json({ message: 'Archivo no encontrado' });
//   }
// });


// Inicia el servidor en el puerto 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor Node.js en funcionamiento en el puerto ${PORT}`);
});
