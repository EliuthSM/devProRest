const express = require('express');
const multer = require('multer');
const fs = require('fs'); // Importa el módulo 'fs'
const mysql = require('mysql');
const cors = require('cors'); // Importa el módulo cors
const path = require('path')
const fsx = require('fs-extra')



const app = express();
app.use(express.json());
app.use('/general/banner', express.static('general/banner'));
app.use('/general/team', express.static('general/team'));


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
  host: 'localhost',
  user: 'cpses_inp18otk5g',
  password: 'Macazana23@',
  database: 'investig_devpro'
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
    const rutaArchivo = nombreArchivo.replace(/-/g,'/')
    console.log(rutaArchivo)
    
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
    console.log(req.body)
    const category_alias = req.body.category_alias ?? null
    const page = req.body.page ?? null
    const size_rows = req.body.size_rows ?? null
    const query = 'CALL content_list(?,?,?)';
    
    db.query(query, [category_alias,page,size_rows], (err, result) => {
      if (err) {
        res.status(500).send('Error al obtener datos de la base de datos');
      } else {
        try{
          if (result.length === 0) {
            res.status(404).send('Registro no encontrado');
          } else {
            const results = result[0].map(objeto =>{
              objeto.content_description = objeto.content_description.split(' ').splice(0,40).join(' ')
              if(objeto.has_img){
                objeto.route_img = `multimedia-${objeto.route_img}`
              }else{
                 objeto.route_img = null
              }
              return ({...objeto})
            })
  
            res.status(200).json(results);
          }
        }catch(error){
          res.status(502).send('Hubo un problema al acceder a esa acción: error');
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
          try {
            console.log(result[0][0])
            const results = result[0][0]
            if(result[0][0].route_img)results.route_img = `multimedia-${results.route_img}`
            if(result[0][0].route_pdf)results.route_pdf = `multimedia-${results.route_pdf}`
  
  
            res.status(200).json([
              results,
              result[1]
            ]);
          } catch (error) {
            
          }
         
        }
      }
    });
  });


  app.get('/img/:route', (req, res) => {
    const route = req.params.route;
    
    const newRoute = route.replace(/-/g,'/')
    const pathImage = path.resolve( __dirname, newRoute);

    if (fs.existsSync(pathImage)) {
      // El archivo existe, enviarlo
      res.sendFile(pathImage);
    } else {
      // El archivo no existe, enviar una imagen por defecto o una respuesta de error
      res.sendFile(path.resolve(__dirname, 'defectoImg.png'));
    }

    
  });




  // const folderPath = './general/team'; // Reemplaza esto con la ruta de la carpeta que deseas explorar


  app.get('/banner', (req, res) => {

    const newRoute = route.replace(/-/g,'/')
    console.log(newRoute)
    const pathImage = path.resolve( __dirname, newRoute);

    res.sendFile(pathImage)
  });




  // fs.readdir(folderPath, (err, files) => {
  //   if (err) {
  //     console.error('Error al leer la carpeta:', err);
  //     return;
  //   }

  //   // 'files' es un arreglo que contiene los nombres de los archivos en la carpeta
  //   console.log('Nombres de archivos en la carpeta:', files);
  // });
  



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
