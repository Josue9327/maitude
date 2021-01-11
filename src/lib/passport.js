const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const pool = require('../database');
const helpers = require('../lib/helpers');
var FacebookStrategy = require('passport-facebook').Strategy;
const config = require('../lib/facebook');
const rsa = require('node-rsa');

passport.use('local.login', new localStrategy ({
  usernameField: 'correo_usuario',
  passwordField: 'contraseña_usuario',
  passReqToCallback: true
}, async(req, username, password, done) => {
    var expc = /^[_a-z0-9-]+(.[_a-z0-9-]+)*@[a-z0-9-]+(.[a-z0-9-]+)*(.[a-z]{2,4})$/;
    var expp = /^(?=\w*\d)(?=\w*[A-Z])(?=\w*[a-z])\S{8,16}$/;
    if(expc.test(username) && expp.test(password)){
    const rows = await pool.query('SELECT * FROM usuario WHERE correo_usuario = ?', [username]);
    if (rows.length > 0 ){
      const user = rows[0];
      const validPassword = await helpers.matchPasword(password, user.contraseña_usuario);
      if (validPassword){
          done(null, user, req.flash('success','Welcome' + user.nombre_usuario));
      } else{
        done(null, false, req.flash('message','<center><p style="color:white";>Contraseña incorrecta</p></center>'));
      }
    } else{
      return done(null, false, req.flash('message','<center><p style="color:white";>El usuario no existe</p></center>'));
    }
  }else{
    return done(null, false, req.flash('message','<center><p style="color:white";>Los datos son invalidos</p></center>'));
  }
  }));


passport.use('local.registro', new localStrategy({
    usernameField: 'correo_usuario',
    passwordField: 'contraseña_usuario',
    passReqToCallback: true
}, async (req, username, password, done) => {
  const rows = await pool.query('SELECT * FROM usuario WHERE correo_usuario = ?', [username]);
  var expc = /^[_a-z0-9-]+(.[_a-z0-9-]+)*@[a-z0-9-]+(.[a-z0-9-]+)*(.[a-z]{2,4})$/;
  var expp = /^(?=\w*\d)(?=\w*[A-Z])(?=\w*[a-z])\S{8,16}$/;
  if(expc.test(username) && expp.test(password)){
  if(rows.length > 0){
    done(null, false, req.flash('message','<center><p style="color:white";>Usuario en uso</p></center>'));
  }else{

   const { nombre_usuario } = req.body;
   const { apellidos_usuario } = req.body;
   const { fecha_usuario } = req.body;
  const key = new rsa({b:512});
 key.setOptions({encryptionScheme: 'pkcs1'});
 var publicKey = key.exportKey('pkcs8-public-pem');
 var privateKey = key.exportKey('pkcs8-private-pem');
   let newuser = {    
    nombre_usuario,
    apellidos_usuario,
    fecha_usuario,
    contraseña_usuario: password,
    correo_usuario: username,
    publika: publicKey,
    privaka: privateKey,
   };
   newuser.contraseña_usuario = await helpers.encrypyPassword(password);
   const result = await pool.query('INSERT INTO usuario SET ?', [newuser]);
   newuser.id_usuario = result.insertId;
   return done(null, newuser);
  }}else{
    done(null, false, req.flash('message','<center><p style="color:white";>Datos invalidos</p></center>'));
  }
  

}));

passport.use(new FacebookStrategy({
  clientID			: config.key,
  clientSecret	: config.secret,
  callbackURL	 : '/auth/facebook/callback',
  profileFields : ['id', 'displayName', /*'provider',*/ 'photos']
},async function(accessToken, refreshToken, profile, done) {
  const rows = await pool.query('SELECT * FROM usuario WHERE facebook = 1 and id_facebook = ?', [profile.id])
    if(rows.length > 0){
      const user = rows[0];
      user.foto = profile.photos.value;
      return done(null, user);
      
    }else{
      const nombre_usuario = profile.displayName;
      const apellidos_usuario = '';
      const fecha_usuario  = null;
      const correo_usuario = null;
      const contraseña_usuario = null;
      const id_facebook = profile.id;
      const facebook = 1;
      const key = new rsa({b:512});
      const foto = profile.photos[0].value;
      console.log('hola', foto);
      key.setOptions({encryptionScheme: 'pkcs1'});
      var publicKey = key.exportKey('pkcs8-public-pem');
      var privateKey = key.exportKey('pkcs8-private-pem');

      let newuser = {   
       nombre_usuario,
       apellidos_usuario,
       fecha_usuario,
       contraseña_usuario,
       correo_usuario,
       id_facebook,
       facebook,
       publika: publicKey,
       privaka: privateKey,
       foto
      };
      const result = await pool.query('INSERT INTO usuario SET ?', [newuser]);
      newuser.id_usuario = result.insertId;
      newuser.foto = profile.photos;
      return done(null, newuser);
    }
}));


passport.serializeUser((user, done) => {
    done(null, user.id_usuario);
  });
  
  passport.deserializeUser(async (id, done) => {
    const rows = await pool.query("SELECT * FROM usuario WHERE id_usuario = ?", [id]);
    
    
    done(null, rows[0]);
  });
  