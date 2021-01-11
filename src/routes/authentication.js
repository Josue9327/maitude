const express = require('express');
const { route } = require('.');
const router = express.Router();
const helpers = require('../lib/helpers');
const passport = require('passport');
const pool = require('../database');
const { isLoggedIn, isLoggedOut } = require('../lib/auth');
router.get('/registro', isLoggedIn, (req, res) =>{
    res.render('auth/registro');
});
router.post('/registro', passport.authenticate('local.registro', {
    successRedirect: '/principal',
    failureRedirect: '/registro',
    failureFlash: true
}));

router.get('/login', isLoggedIn, (req, res) =>{
    res.render('auth/login');
});

router.post('/login', (req, res, next) =>{
    passport.authenticate('local.login', {
        successRedirect: '/principal',
        failureRedirect: '/login',
        failureFlash: true
    })(req, res, next);
});

router.get('/logout', isLoggedOut, (req, res) =>{
    req.logOut();
    res.redirect('/registro');
});
    

router.get('/principal', isLoggedOut, (req, res) => {
    res.render('maitude/principal');
});

router.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'user_birthday'] }));
router.get('/auth/facebook/callback',
  passport.authenticate('facebook', { successRedirect: '/principal',
                                      failureRedirect: '/login' }));
router.get('/perfil',isLoggedOut, async (req, res) => {
res.render('auth/perfil', { username: req.user });
});

router.get('/editar',isLoggedOut, (req, res)=>{
    
    var user = req.user;

    res.render('auth/editar', {user});
});

router.post('/editar',isLoggedOut, async (req, res)=>{
    const { nombre_usuario } = req.body;
    const { apellidos_usuario } = req.body;
    const { fecha_usuario } = req.body;
    let updateuser = {
        nombre_usuario,
        apellidos_usuario,
        fecha_usuario
    };
    const cor = req.user.id_usuario;
    const rows = await pool.query("UPDATE usuario SET ? WHERE correo_usuario = ?", [updateuser, req.user.correo_usuario]);
    //UPDATE alumnos SET curso='secundaria' WHERE curso='primaria'
    res.redirect('/editar');
});

module.exports = router;