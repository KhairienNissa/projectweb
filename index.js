const express = require("express");

const app = express();
const port = 7000;


const bcrypt = require('bcrypt')
const flash = require('express-flash')
const session = require('express-session')
const upload = require('./middlewares/fileUpload')
const db = require('./connection/db');
// const { user } = require("pg/lib/defaults");

app.set('view engine', 'hbs')

app.use('/public', express.static(__dirname + '/public'))
app.use('/uploads', express.static(__dirname + '/uploads'))
app.use(express.urlencoded({extended: false}))

app.get("/", function (req, res) {
  res.send("Hello caca!");
});

app.use(flash())

app.use(
    session({
        store: new session.MemoryStore(),
        saveUninitialized: true,
        resave: false,
        secret: 'asalaja',
        cookie: {
            maxAge: 3 * 60 * 60 * 1000,
            secure: false,
            httpOnly: true
        },
    })
)

app.get('/register', function(req, res) {
  res.render('register')
})

app.post ('/register', (req, res) => {
  const {inputName, inputEmail, inputPassword} = req.body
  const hashedPassword = bcrypt.hashSync(inputPassword, 10)
  let query = `INSERT INTO tb_user(name, email, password) VALUES ('${inputName}', '${inputEmail}', '${hashedPassword}')`
  let query1 = `SELECT * FROM tb_user WHERE email = '${inputEmail}'`

  db.connect((err, client, done) => {
    if (err) throw err
    client.query(query1, (err, result) => {
        if (err) throw err
        // console.log(result);            
        if (result.rows.length != 0 ) {
            req.flash('danger', 'Email telah diguanakan')
            return res.redirect('/register')
        } else {
            client.query(query, (err, result) => {
                req.flash('success', 'berhasil, silahkan login terlebih dahulu!')
                return res.redirect('/login')
              })
          }
      })
   })
})
  
app.get('/login', function(request, response) {
  response.render('login')
})

app.post('/login', function(request, response) {

  const {inputEmail, inputPassword} = request.body

  const query = `SELECT * FROM tb_user WHERE email = '${inputEmail}'`

  db.connect(function (err, client, done) {
      if (err) throw err

      client.query(query, function(err, result) {
          if (err) throw err

          // console.log(result.rows.length);

          if(result.rows.length == 0){

              request.flash('danger', 'Email belum terdaftar!')

              return response.redirect('/login')
          } 

          const isMatch = bcrypt.compareSync(inputPassword, result.rows[0].password)
          // console.log(isMatch);

          if(isMatch){

              request.session.isLogin = true
              request.session.user = {
                  id: result.rows[0].id,
                  name: result.rows[0].name,
                  email: result.rows[0].email
              }

              request.flash('success', 'Login success')
              response.redirect('/home')

          } else {
              request.flash('danger', 'Password tidak cocok!')
              response.redirect('/login')
          }

      })
  })
})

app.get("/my-contact", function (req, res) {
    res.render('contact');
});

app.get('/home', function(req, res){

  let userId;
  let query;
  
  if(req.session.isLogin){
      userId = req.session.user.id
      query = `SELECT tb_projects.id, tb_user.name as author, tb_user.email, tb_projects.name, tb_projects.start_date,
      tb_projects.end_date, tb_projects.deskripsi, 
      tb_projects.teknologi, tb_projects.image
      FROM tb_projects LEFT JOIN tb_user ON tb_projects.author_id = tb_user.id WHERE author_id =${userId}`
   } else {
      query =  `SELECT tb_projects.id, tb_projects.name, tb_projects.deskripsi, tb_projects.image, tb_projects.teknologi, tb_user.name AS author, tb_projects.author_id, tb_projects.start_date, tb_projects.end_date
      FROM tb_projects LEFT JOIN tb_user ON tb_projects.author_id = tb_user.id` }

 
  db.connect(function(err, client, done) {
    if (err) throw err

    client.query(query, function(err, result) {
    if (err) throw err 
    done()
      // console.log(result.rows);
      let data = result.rows
      console.log(data);
      data = data.map(function(home) {
       return {
              ...home,
              duration : durationblog(home.start_date, home.end_date),
              isLogin : req.session.isLogin,
              name : home.name.slice(0, 20) + '..',
              deskripsi : home.deskripsi.slice(0, 120)+ '..',
              image : home.image
              }
       })
          res.render('home', {isLogin: req.session.isLogin, user: req.session.user, blogs: data})
    })
  })
})

app.get("/add-project", function (req, res) {
  if(req.session.isLogin != true) {
    res.redirect('/login')
  } else {
  res.render('myproject'); }
});

app.post("/add-project", upload.single('image'), function (req, res) {

  let data = req.body

 const userId = req.session.user.id
 const image = req.file.filename

  let query = `INSERT INTO tb_projects(name, start_date, end_date, deskripsi, teknologi, image, author_id) VALUES ('${data.projectname}', '${data.startdate}','${data.enddate}', '${data.deskripsi}','{"${data.nodeJs}","${data.reactJs}","${data.nextJs}","${data.javascript}"}','${image}','${userId}')`
   
 db.connect(function (err, client, done) {
    if (err) throw err

    client.query(query, function(err, result) {
      if (err) throw err
        done()

          res.redirect('/home')
      })
   })
})

app.get('/detail-project/:id', function(req, res){
      let id = req.params.id

    db.connect(function (err, client, done) {
        if (err) throw err

      client.query(`SELECT * FROM tb_projects WHERE id = ${id}`, function(err, result) {
        if (err) throw err
        done()

        let data = result.rows
        let blog = data.map(function(home) {
          return {
              ...home,
              duration : durationblog(home.start_date, home.end_date),
              start_date : getFullTime(home.start_date),
              end_date : getFullTime(home.end_date),
              nodeJs : home.teknologi[0],
              reactJs : home.teknologi[1],
              nextJs : home.teknologi[2],
              javascript : home.teknologi[3],
              namanodeJs: namaIcon(home.teknologi[0])[0],
              namareactJs: namaIcon(home.teknologi[1])[1],
              namanextJs: namaIcon(home.teknologi[2])[2],
              namajavascript: namaIcon(home.teknologi[3])[3],
              isLogin : req.session.isLogin
          }
        }) 
        blog = blog[0]
        res.render('detailproject', {isLogin: req.session.isLogin, user: req.session.user, blog : blog}) 
        }) 
    })
})

  app.get('/delete-project/:id', function(req, res){

    let id = req.params.id;

    let query = `DELETE FROM tb_projects WHERE id = ${id}`

    db.connect(function (err, client, done) {
        if (err) throw err

        client.query(query, function(err, result) {
            if (err) throw err
            done()
          res.redirect('/home')
        })
    })
  })

app.get('/edit-project/:id', function(req, res){
  let id = req.params.id

  db.connect(function (err, client, done) {
    if (err) throw err

    client.query(`SELECT * FROM tb_projects WHERE id = ${id}`, function(err, result) {
      if (err) throw err
      done()

    let data = result.rows[0]

    data = {
      ...data,
      image :
          data.image == 'null'
          ? '/public/image/image1.jpg'
          : '/uploads/' + data.image,
    };

    data.start_date = getFullTimeEdit(data.start_date)
    data.end_date = getFullTimeEdit(data.end_date)

    let nodeJs = data.teknologi[0]
    let reactJs = data.teknologi[1]
    let nextJs = data.teknologi[2]
    let javascript = data.teknologi[3]

    if(nodeJs != 'undefined'){
      nodeJs =  true
    } else{
      nodeJs = false
    }
    if(reactJs != 'undefined'){
      reactJs = true
    } else{
      reactJs = false
    }
    if(nextJs  != 'undefined'){
      nextJs = true
    } else{
      nextJs = false
    }
    if(javascript  != 'undefined'){
      javascript = true
    } else{
      javascript = false
    }
  
    console.log(data);
    
    res.render('editproject', {blog: data, id, nodeJs, reactJs, nextJs, javascript})
    })
  })
})

app.post('/edit-project/:id', upload.single('image'), function(req, res){
       let id = req.params.id;
       let data = req.body
       console.log(req.file);
       const userId = req.session.user.id
       let query;
if (req.file) {
      query = `UPDATE tb_projects
      SET name='${data.projectname}', start_date='${data.startdate}', end_date='${data.enddate}', deskripsi='${data.deskripsi}', teknologi='{"${data.nodeJs}","${data.reactJs}","${data.nextJs}","${data.javascript}"}', image ='${req.file.filename}', author_id = '${userId}' WHERE id= ${id};`
} else {
      query = `UPDATE tb_projects
      SET name='${data.projectname}', start_date='${data.startdate}', end_date='${data.enddate}', deskripsi='${data.deskripsi}', teknologi='{"${data.nodeJs}","${data.reactJs}","${data.nextJs}","${data.javascript}"}', author_id = '${userId}' WHERE id= ${id};`
    }
         db.connect(function (err, client, done) {
          if (err) throw err
          
          client.query(query, function(err, result) {
            if (err) throw err
            done()
      
          res.redirect('/home')
      })
    })
  })

function durationblog (stdate, endate) {
    let start = new Date(stdate);
    let end = new Date(endate);
  
    let duration = end.getTime() - start.getTime();
  
      let miliseconds = 1000 // 1000 miliseconds dalam 1 detik
      let secondInHours = 3600 // 1 jam sama dengan 3600 detik
      let hoursInDay = 24 // 24 jam dalam 1 hari
      let daysInMonth = 30
      let monthsInYears = 12
  
      let year = Math.floor(duration/ (miliseconds * secondInHours * hoursInDay * daysInMonth *monthsInYears))
      let month = Math.floor (duration/ (miliseconds * secondInHours * hoursInDay* daysInMonth))
      let day = duration / (miliseconds * secondInHours * hoursInDay)
     
      if (day < 30) {
        return day + ' hari';
      } else if (month < 12) {
        return month + ' bulan';
      } else {
        return year + ' tahun';
      }
}

function getFullTime(waktu) {
      // console.log(waktu);
      
      let month = ['Januari', 'Febuari', 'March', 'April', 'May', 'June', 'July', 'August', 'Sept', 'October','Nopember','December']
      
      let date = waktu.getDate()   // console.log(date);
  
      let monthIndex = waktu.getMonth() 
      // console.log(month[monthIndex]);
  
      let year = waktu.getFullYear()
      // console.log(year);

  
      let fullTime = `${date} ${month[monthIndex]} ${year}`
      // console.log(fullTime);
  
      return fullTime
}
function getFullTimeEdit(waktu) {
    
    let date = waktu.getDate().toString().padStart(2, "0");

    // console.log(date);
    let month = (waktu.getMonth() + 1).toString().padStart(2, "0")

    // console.log(month[monthIndex]);

    let tahun = waktu.getFullYear()
    // console.log(year);

    let fullTime = `${tahun}-${month}-${date}`
    return fullTime
}
function namaIcon(nama) {
  let nodejs = "";
  let reactjs = "";
  let python = "";
  let javascript = "";
  if (nama == "fa-brands fa-node-js") {
    nodejs = "node js";
  } else {
    nodejs = "";
  }
  if (nama == "fa-brands fa-react") {
    reactjs = "react js";
  } else {
    reactjs = "";
  }
  if (nama == "fa-brands fa-python") {
    python = "python";
  } else {
    python = "";
  }
  if (nama == "fa-brands fa-js") {
    javascript = "javascript";
  } else {
    javascript = "";
  }
  return [nodejs, reactjs, python, javascript];
}

app.get('/logout', function(request, response){
  request.session.destroy()
  response.redirect('/home')
})

app.listen(port, function () {
  console.log(`Listening server on port ${port}`);
});
