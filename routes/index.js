const express = require('express');
const { ensureAuthenticated, redirectToDashboardIfAuthenticated } = require('../auth/isAuthenticated');
const User = require('../models/User'); // Import the User model
const Post = require('../models/Post');
const MealPlan=require('../models/Mealplan');
const UserModel=require('../models/UserModels');

const router = express.Router();

router.get('/', redirectToDashboardIfAuthenticated,(req,res)=>{
    res.render('index', { layout:false })
})

// Render the dashboard view when user navigates to /dashboard
router.get('/dashboard', ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.user._id;
        const today = new Date();
        const oneWeekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);    
        console.log(today);

        const users = await User.find().sort({ points: -1 });
        const currentUser = req.user; 
        let userPoints = 0;
        let userComPoints = 0;
        if (currentUser) {
            const user = await User.findById(currentUser._id);
            userPoints = user.points;
            userComPoints = user.communityPoints;
        }

        const user = await User.findById(userId);
        const userModel = await UserModel.findById(userId);
        const name = user.fullName;
        

        if (!user) {
            return res.status(404).send('User not found');
        }

        if (!user.bmrCompleted) {
            res.redirect('/profileSettings/personalInformation');
        } else if (!user.questionnaireCompleted) {
            res.redirect('/profileSettings/mealPreferences');
        } else {
            const mealPlan = await MealPlan.findOne({
                userId: userId,
                startDate: { $gte: oneWeekAgo, $lte: today }
            }).sort({ startDate: -1 });

            if (!mealPlan || mealPlan.dailyPlans.length === 0) {
                req.flash('error', 'No current meal plans found. Please create a new meal plan.');
                res.redirect('/profileSettings/mealPreferences');
                return;
            }

            const dailyPlan = mealPlan.dailyPlans.find(plan => formatDate(plan.date).toString() === formatDate(today).toString());
            if (!dailyPlan) {
                req.flash('error', 'Meal plan not found for today. Please check your meal plan settings.');
                res.redirect('/profileSettings/mealPreferences');
                return;
            }

            const totalNutrition = {
                calories: dailyPlan.calorie,
                protein: dailyPlan.protein,
                carbs: dailyPlan.carb,
                fat: dailyPlan.fat
            };

            res.render('dashboard', {
                date: formatDate(today),
                calories: userModel.calories,
                protein: userModel.protein.min,
                carbs: userModel.carbohydrates.min,
                fat: userModel.fat.min,
                totalNutrition: totalNutrition,
                meals: dailyPlan.meals,
                name: name,
                users: users,
                userPoints: userPoints,
                userComPoints: userComPoints,
                
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving data');
    }
});


router.get('/', redirectToDashboardIfAuthenticated, (req, res) => {
    res.render('index');
});






function formatDate() {
    const date = new Date();
    let month = '' + (date.getMonth() + 1), // getMonth() returns a zero-based index
        day = '' + (date.getDate()),
        year = date.getFullYear();

    // Pad the month and day with a leading zero if they are less than 10
    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [month, day, year].join('-'); // Corrected to mm-dd-yyyy
}
router.get('/dashboard',ensureAuthenticated, async (req, res) => {
    // Render the dashboard view when user navigates to /dashboard
    const userId = req.user._id;
    const today = new Date();
    const oneWeekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);    
    console.log(today);
    try {
        const user = await User.findById(userId);
        const userModel = await UserModel.findById(userId);
        const name=user.fullName
        
        if (!user) {
            return res.status(404).send('User not found');
        }

        if(!user.bmrCompleted){
            res.redirect('/profileSettings/personalInformation');
        }else if (!user.questionnaireCompleted){
            res.redirect('/profileSettings/mealPreferences')
        }
        else{
            const mealPlan = await MealPlan.findOne({
                userId: userId,
                startDate: { $gte: oneWeekAgo, $lte: today }
            }).sort({ startDate: -1 }); // This sorts before selecting the first match
        

        
            if (!mealPlan || mealPlan.dailyPlans.length === 0) {
                req.flash('error', 'No current meal plans found. Please create a new meal plan.');
                res.redirect('/profileSettings/mealPreferences'); // Redirect to meal preference to allow user to create plan
                return;
            }

            const dailyPlan = mealPlan.dailyPlans.find(plan => formatDate(plan.date).toString() === formatDate(today).toString());
            if (!dailyPlan) {
                req.flash('error', 'Meal plan not found for today. Please check your meal plan settings.');
                res.redirect('/profileSettings/mealPreferences');
                return;
            }
            // Initialize nutrition totals
            const totalNutrition = {
                calories: dailyPlan.calorie,
                protein: dailyPlan.protein,
                carbs: dailyPlan.carb,
                fat: dailyPlan.fat
            };


            // Render the dashboard page and pass the meal details
            res.render('dashboard', {
                date: formatDate(today),
                calories:userModel.calories,
                protein: userModel.protein.min,
                carbs:userModel.carbohydrates.min,
                fat: userModel.fat.min,
                totalNutrition: totalNutrition,
                meals: dailyPlan.meals,
                name:name
            });

        }


    } catch (error) {
        console.error('Failed to retrieve meal plan:', error);
        req.flash('error', 'Error retrieving meal plan. Please try again.');
        res.redirect('/profileSettings/mealPreferences');
    }

});

router.put('/update-meal/:mealType', ensureAuthenticated, async (req, res) => {
    const { mealType } = req.params;
    const { calories, protein, carbs, fat } = req.body; // Destructure nutrition data

    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize date for consistent comparison
    const oneWeekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);

    try {
        const mealPlan = await MealPlan.findOne({
            userId: userId,
            startDate: { $gte: oneWeekAgo, $lte: today }
        }).sort({ startDate: -1 });

        if (!mealPlan) {
            return res.status(404).send('No current meal plans found');
        }

        // Find the specific meal plan for today
        const formattedToday = formatDate(today);
        const dailyPlan = mealPlan.dailyPlans.find(plan => formatDate(plan.date) === formattedToday);

        if (dailyPlan && dailyPlan.meals[mealType]) {
            dailyPlan.meals[mealType].isChecked = !dailyPlan.meals[mealType].isChecked;

            // Adjust nutrition totals based on check state
            const factor = dailyPlan.meals[mealType].isChecked ? 1 : -1;
            dailyPlan.calorie = (dailyPlan.calorie + factor * Number(calories)).toFixed(2);
            dailyPlan.protein = (dailyPlan.protein + factor * Number(protein)).toFixed(2);
            dailyPlan.carb = (dailyPlan.carb + factor * Number(carbs)).toFixed(2);
            dailyPlan.fat = (dailyPlan.fat + factor * Number(fat)).toFixed(2);

            // Ensure the values are converted back to numbers if they need to be used in further calculations
            dailyPlan.calorie = Number(dailyPlan.calorie);
            dailyPlan.protein = Number(dailyPlan.protein);
            dailyPlan.carb = Number(dailyPlan.carb);
            dailyPlan.fat = Number(dailyPlan.fat);

            await mealPlan.save(); // Save the updated meal plan document
            res.json({
                message: "Meal updated successfully",
                updatedNutrition: {
                    calories: dailyPlan.calorie,
                    protein: dailyPlan.protein,
                    carbs: dailyPlan.carb,
                    fat: dailyPlan.fat
                }
            });
        } else {
            res.status(404).send('Meal plan or meal type not found');
        }
    } catch (error) {
        console.error('Failed to update meal:', error);
        res.status(500).send('Error updating meal');
    }
});







module.exports=router;
