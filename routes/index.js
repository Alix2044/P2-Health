const express = require('express');
const  {ensureAuthenticated,redirectToDashboardIfAuthenticated }= require('../auth/isAuthenticated')
const Post = require('../models/Post');





const router = express.Router();

router.get('/dashboard',ensureAuthenticated,(req, res) => {
    // Render the dashboard view when user navigates to /dashboard
    res.render('dashboard');
});


router.get('/', redirectToDashboardIfAuthenticated,(req,res)=>{
    res.render('index')
})



module.exports=router;