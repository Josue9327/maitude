const express = require('express');
const { query } = require('../database');
const router = express.Router();
const pool = require('../database')
const { isLoggedIn, isLoggedOut } = require('../lib/auth');
router.get('/chat', isLoggedOut,(req, res) =>{
    res.render('chat/principal', { username: req.user });
});
router.get('/elegirchat', isLoggedOut, async(req, res) =>{
    const amigos = await pool.query('SELECT * FROM AMIGOS WHERE correo_usuario = ?', [req.user.correo_usuario]);
    const obj = {};
    for (let i = 0; i < amigos.length; i++) {
        obj[i] = amigos[i];        
    }
    res.render('chat/menu', {obj});
});

router.post('/elegirchat', async(req, res) => {
    usuario_chat = req.body.chat_usuario;
    const rows = await pool.query('SELECT * FROM usuario WHERE correo_usuario = ?', [usuario_chat]);
    if (rows.length > 0 ){
        
        const usuarios = {
            micorreo: req.user.correo_usuario,
            sucorreo: rows[0].correo_usuario,
            sunombre: rows[0].nombre_usuario,
            minombre: req.user.nombre_usuario
        }
      res.render('chat/principal', {usuarios});
    } else{
        req.flash('message','<center><p style="color:white";>Usuario no encontrado</p></center>');
        res.redirect('/elegirchat');
    }
});


router.post('/agregaramigo', async(req, res) =>{
    correo_usuario = req.user.correo_usuario;
    correo_amigo = req.body.nuevo_amigo;
    const rows = await pool.query('SELECT * FROM AMIGOS WHERE CORREO_USUARIO = ? AND CORREO_AMIGO = ?', [correo_usuario, correo_amigo]);
    if(rows.length > 0){
        req.flash('message','<center><p style="color:white";>Parece que ya tienes este amigo agregado</p></center>');
        res.redirect('/elegirchat');
    }else if(correo_amigo == correo_usuario){
        req.flash('message','<center><p style="color:white";>No te puedes agregar a ti mismo</p></center>');
        res.redirect('/elegirchat');
    
    }else{
        newamigo = {
            correo_usuario,
            correo_amigo
        }

        const veri = await pool.query('SELECT * FROM USUARIO WHERE CORREO_USUARIO = ?', [correo_amigo]);
        if(veri.length > 0){
            await pool.query('INSERT INTO AMIGOS SET ?', [newamigo]);
            req.flash('message','<center><p style="color:white";>Amigo Agregado</p></center>');
            res.redirect('/elegirchat');
        }else{
            req.flash('message','<center><p style="color:white";>Usuario no encontrado</p></center>');
            res.redirect('/elegirchat');
        }

        
    }

});

module.exports = router;
