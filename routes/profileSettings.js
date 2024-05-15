const express=require('express');
const router=express.Router();
const  {ensureAuthenticated,redirectToDashboardIfAuthenticated }= require('../auth/isAuthenticated')
const axios = require('axios');

const User=require('../models/User');
const UserModel = require('../models/UserModels');
const MealPlan = require('../models/Mealplan');


const HEALTH = require('../helpers/diets');
const CUISINES = require('../helpers/cuisine');
const BREAKFASTINGREDIENTS = require('../helpers/breakfastIngredients');
const LUNCHINGREDIENTS = require('../helpers/lunchIngredients');
const DINNERINGREDIENTS = require('../helpers/dinnerIngredients');
const getActivityFactor = require('../helpers/activitylevel');
const APP_ID = process.env.APP_ID;
const APP_KEY = process.env.APP_KEY;
const BASE_URL = 'https://api.edamam.com/search';

/**
 * GET /
 * User-Profile
*/
router.get('/profile',ensureAuthenticated,(req, res)=>{
    res.render('profileSettings/profile');
});


/**
 * GET /
 * User-Profile-Personal information
*/
router.get('/personalInformation',ensureAuthenticated,async (req, res)=>{

    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
        return res.status(404).send('User not found');
    }

    res.render('profileSettings/personalInformation');
});

router.put('/personalInformation', ensureAuthenticated, async (req, res) => {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
        return res.status(404).send('User not founddddd');
    }

    let {height, gender, weight, age, activityLevel } = req.body;
    console.log(activityLevel);
    // Data validation (example for gender and age)
    if (!['male', 'female'].includes(gender.toLowerCase())) {
        return res.status(400).send("Invalid gender specified.");
    }
    age = parseInt(age);
    if (isNaN(age)) {
        return res.status(400).send("Invalid age provided.");
    }

    const factor = getActivityFactor(activityLevel);
    weight = parseFloat(weight) * 0.45359237;
    if (isNaN(weight)) {
        return res.status(400).send("Invalid weight provided.");
    }

    height = parseInt(height) * 2.54;
    if (isNaN(height)) {
        return res.status(400).send("Invalid height provided.");
    }

    let BMR;
    if (gender.toLowerCase() === "male") {
        BMR = Math.ceil((factor * ((9.99 * weight) + (6.25 * height) - (4.92 * age) + 5)));
    } else {
        BMR = Math.ceil((factor * ((9.99 * weight) + (6.25 * height) - (4.92 * age) -161 )));
    }

    let calories = parseFloat(BMR - 500);

    if (isNaN(calories)) {
        return res.status(400).send("Failed to calculate calories.");
    }
    console.log(height);

    let BMI = (weight/(Math.pow((height/100), 2))).toFixed(2);
    console.log(BMI);

    try {
        const update = {
            height,
            gender,
            weight,
            age,
            BMR,
            BMI,
            calories,
            protein:{min: ((calories*0.1)/4), max:((calories*0.35)/4) },
            fat:{min: ((calories*0.2)/4), max:((calories*0.35)/9) },
            carbohydrates:{min: ((calories*0.45)/4), max:((calories*0.65)/4) },
        };

        const userModel = await UserModel.findOneAndUpdate({ _id: userId }, { $set: update }, { new: true, upsert: true });
        if (!user.bmrCompleted){
            user.bmrCompleted=true;
            await user.save();

        }

        console.log("Updated or created user:", userModel);

        
        if (!user.questionnaireCompleted) {
            res.redirect('/profileSettings/mealPreferences');
        } else {
            res.redirect('/profileSettings/profile');
        }

    } catch (error) {
        console.error("Error updating settings:", error);
        res.status(500).send("Failed to update settings");
    }
});


const fetchMealsForMealType = async (ingredients, health, mealType, mealCalories, diet, cuisine) => {
    const params = {
        app_id: APP_ID,
        app_key: APP_KEY,
        // type: 'public',
        q: ingredients.join(" "),
        Health: health.join(" "),
        mealType: mealType,
        calories: `${Math.ceil(mealCalories.calories * 0.9)}-${Math.ceil(mealCalories.calories * 1.1)}`,
    };

    try {
        const response = await axios.get(BASE_URL, { params });
        console.log(response.data); // Debugging the response
        if (!response.data.hits || response.data.hits.length === 0) {
            console.log("No results returned from API.");
            return [];
        }
        const firstRecipe = response.data.hits[0].recipe; // Grabbing the first recipe
        return {
            id: firstRecipe.uri.split("#")[1],
            name: firstRecipe.label,
            image: firstRecipe.image,
            url: firstRecipe.url,
            nutrition: {
                calorie: (firstRecipe.totalNutrients.ENERC_KCAL?.quantity)/firstRecipe.yield || 0,
                protein: (firstRecipe.totalNutrients.PROCNT?.quantity)/firstRecipe.yield|| 0,
                carb: (Number(firstRecipe.totalNutrients["CHOCDF.net"].quantity)) / firstRecipe.yield || 0,
                fat: (firstRecipe.totalNutrients.FAT?.quantity)/firstRecipe.yield || 0
            }
        };
        
    } catch (error) {
        console.error(`Error fetching ${mealType}:`, error);
        return [];
    }
};
const calculateMealCalories = (dailyCalories, dailyFats, dailyCarbs, dailyProtein, mealPreference) => {
    const factors = {
        light: 0.2,
        normal: 0.33,
        heavy: 0.47
    }[mealPreference] || 0.333; // Default to 'normal' if undefined

    return {
        calories: dailyCalories * factors,
        protein: dailyProtein * factors,
        carbs: dailyCarbs * factors,
        fats: dailyFats * factors
    };
};

async function createMealplan(userId, user){
    console.log(user);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyCalories = user.calories;
    console.log(dailyCalories);
    const dailyProtein= user.protein;
    const dailyCarbs=user.carbohydrates;
    const dailyFats=user.fat;
    console.log(dailyFats);
    
    let mealPlan = await MealPlan.findOne({
        userId: userId,
        startDate: { $lte: today, $gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) }
    });

     // If a meal plan exists and it's under 7 days old, delete it
     if (mealPlan) {
        await MealPlan.deleteOne({ _id: mealPlan._id });
    }

    // Create a new meal plan regardless of the old one
    mealPlan = new MealPlan({
        userId: userId,
        startDate: today,
        weeklyPlans: [] // initialize weekly plans
    });


  // Initialize an empty day plan with all meals
  const dayPlan = {
    date: today,
    meals: {
        breakfast: null,
        lunch: null,
        dinner: null
    },
    calorie: 0,
    protein: 0,
    carb: 0,
    fat: 0
    };

    // Populate each meal type into the day plan
    for (const mealType of ['breakfast', 'lunch', 'dinner']) {
        const mealPreferences = user.mealPreferences[mealType];
        const mealCalories = calculateMealCalories(user.calories, user.fat, user.carbohydrates, user.protein, mealPreferences);
        console.log(mealType);
        const ingredients = user[`${mealType}Ingredients`];
        const health= user.diets;
        const meal = await fetchMealsForMealType(ingredients, health, mealType, mealCalories);

        if (meal) {
            dayPlan.meals[mealType] = meal;

        } else {
            console.log(`No meal data retrieved for ${mealType}`);
        }
    }

    // Add the new day plan to the meal plan's daily plans array
    mealPlan.dailyPlans.push(dayPlan);

    try {
        await mealPlan.save();
        console.log('Meal plan saved successfully');
    } catch (error) {
        console.error('Failed to save meal plan:', error);
    }
}

/**
 * GET /
 * User-Profile-Mealplan settings
*/
router.get('/mealPreferences',ensureAuthenticated,async (req, res)=>{
    const userId = req.user._id; 
    console.log(userId);
    const userModel = await UserModel.findById(userId);
    const user=await User.findById(userId);
    if (!user) {
        return res.status(404).send('User not found');
    }

    if (!user.bmrCompleted){
        res.redirect('/profileSettings/personalInformation');
    }

    try {
        const typeEnums = UserModel.schema.path('mealPreferences.breakfast').enumValues;


        res.render('profileSettings/mealPreferences', {
            diets: HEALTH,
            cuisines: CUISINES,
            breakfastIngredients: BREAKFASTINGREDIENTS,
            lunchIngredients: LUNCHINGREDIENTS,
            dinnerIngredients: DINNERINGREDIENTS,
            selectedCuisines: userModel.cuisines,
            selectedDiets: userModel.diets,
            selectedBreakfastIngredients: userModel.breakfastIngredients,
            selectedLunchIngredients: userModel.lunchIngredients,
            selectedDinnerIngredients: userModel.dinnerIngredients,
            enums: typeEnums,
            user: userModel
        });
    } catch (error) {
        console.error("Error loading meal plan settings:", error);
        res.status(500).send("Failed to load settings");
    }
});


router.put('/mealPreferences',ensureAuthenticated, async (req, res) => {
    const userId = req.user._id; 
    console.log(userId);
    const user = await User.findById(userId);
    const userModel = await UserModel.findById(userId);
    if (!user) {
        return res.status(404).send('User not found');
    }
    let selectedCuisines = req.body.cuisines || [];
    let selectedDiets = req.body.diets || [];
    let selectedBreakfastIngredients = req.body.breakfastIngredients || [];
    let selectedLunchIngredients = req.body.lunchIngredients || [];
    let selectedDinnerIngredients = req.body.dinnerIngredients || [];
    let breakfastType=req.body.breakfastType;
    let lunchType=req.body.lunchType;
    let dinnerType=req.body.dinnerType;

    try {
        await UserModel.findByIdAndUpdate(userId, {
            $set: {
                cuisines: selectedCuisines,
                diets: selectedDiets,
                breakfastIngredients: selectedBreakfastIngredients,
                lunchIngredients: selectedLunchIngredients,
                dinnerIngredients: selectedDinnerIngredients,
                "mealPreferences.breakfast":breakfastType,
                "mealPreferences.lunch":lunchType,
                "mealPreferences.dinner":dinnerType

            }
        });
        console.log("Updated user:", userId);



    } catch (error) {
        console.error("Error updating settings:", error);
        res.status(500).send("Failed to update settings");
    }


    try {
        await createMealplan(userId, userModel); 
        if (!user.questionnaireCompleted){
            user.questionnaireCompleted=true;
            await user.save();
            res.redirect('/index/dashboard');
        }else{
            res.redirect('/index/dashboard');
        }  
    } catch (error) {
        console.error("Error updating settings or generating meal plan:", error);
        res.status(500).send("Failed to update settings or generate meal plan");
    }
});




module.exports=router;