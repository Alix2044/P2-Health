const express=require('express');
const router=express.Router();
const  {ensureAuthenticated,redirectToDashboardIfAuthenticated }= require('../auth/isAuthenticated')
const User= require('../models/UserModels');
const MealPlan = require('../models/Mealplan');

/**
 * GET /
 * User-mealplan
*/
router.get('/mealplan',ensureAuthenticated,async (req, res)=>{
    const userId = req.user._id;  
    const today = new Date();
    const oneWeekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);

    try {
        const mealPlans = await MealPlan.findOne({
            userId: userId,
            startDate: { $gte: oneWeekAgo, $lte: today }  
        }).sort({ startDate: -1 });  
        console.log(mealPlans); 
        if (mealPlans.length === 0) {
            return res.status(404).send('No current meal plans found');
        }

        res.render('mealplan/mealplan', { meals:mealPlans });
    } catch (error) {
        console.error('Failed to retrieve meal plans:', error);
        res.status(500).send('Internal Server Error');
    }
});
module.exports=router;