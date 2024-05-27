const express=require('express');
const { check, validationResult } = require('express-validator');
const router=express.Router();
const {ensureAuthenticated}= require('../auth/isAuthenticated')


const validatePersonalInformation = require('../middleware/validatePersonalInformation')

const axios = require('axios');

const User=require('../models/User');
const UserModel = require('../models/UserModels');
const MealPlan = require('../models/Mealplan');


const DIETS = require('../helpers/diets');
const INTOLERANCES=require('../helpers/intolerances');
const CUISINES = require('../helpers/cuisine');
const BREAKFASTINGREDIENTS = require('../helpers/breakfastIngredients');
const LUNCHINGREDIENTS = require('../helpers/lunchIngredients');
const DINNERINGREDIENTS = require('../helpers/dinnerIngredients');
const getActivityFactor = require('../helpers/activitylevel');
const UserModels = require('../models/UserModels');
const BASE_URL = 'https://api.spoonacular.com/recipes/complexSearch?';
const BASE_URL_BULK=`https://api.spoonacular.com/recipes/informationBulk`;
const API_KEY=process.env.API_KEY_SPOONACULAR;



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
    const UserModel=await UserModels.findById(userId);

    if (!user) {
        return res.status(404).send('User not found');
    }

    res.render('personalInformation' , {user: UserModel});
});

//function to calculate BMI
function calculateBMI(weight, height) {
    return (weight / (Math.pow((height / 100), 2))).toFixed(2);
}

//function to calculate BMR
function calculateBMR( height, weight, age, gender, activityLevel ) {
    const factor = getActivityFactor(activityLevel);
    gender=gender.toLowerCase()
    if (gender=="male"){
        return Math.ceil(factor * ((9.99 * weight) + (6.25 * height) - (4.92 * age) + 5));

    }else if(gender=="female")
    {
        return Math.ceil(factor * ((9.99 * weight) + (6.25 * height) - (4.92 * age) -161));


    }else{
        return null;
    }
    
}

/**
 * PUT /
 * User-Profile-Personal information
*/
router.put('/personalInformation', ensureAuthenticated, validatePersonalInformation, async (req, res) => {
    const userId = req.user._id;
    const user = await User.findById(userId);

    let {height, gender, weight, age, activityLevel } = req.body;
    height =parseFloat(height);
    weight = parseFloat(weight);
    age = parseInt(age);
    const weightKG = weight * 0.45359237;
    const heightCM = height * 2.54;

    const BMR = calculateBMR( heightCM, weightKG, age, gender, activityLevel );
    console.log(BMR);
    const calories = BMR - 500;
    const BMI = calculateBMI(weightKG, heightCM);
    var sodium;
    if (BMI >=30){
        sodium = 1500;
    }else{
        sodium = 2300;
    }

    try {
        const update = {
            height,
            gender,
            weight,
            age,
            BMR,
            BMI,
            calories,
            activityLevel,
            sodium: sodium
        };

        const userModel = await UserModel.findOneAndUpdate({ _id: userId }, { $set: update }, { new: true, upsert: true });
        userModel.save();
        if (!user.bmrCompleted){
            user.bmrCompleted=true;
            await user.save();

        }
        if (!user.questionnaireCompleted) {
            res.redirect('/profileSettings/mealPreferences');
        } else {
            res.redirect('/profileSettings/personalInformation');
        }

    } catch (error) {
        console.error("Error updating settings:", error);
        req.flash('error', 'Error updating settings. Please try again.');
        res.redirect('/profileSettings/personalInformation');
    }
});


//Gets the total amount of recipes for these specific criterias
async function getTotalResults(ingredients, diet, mealType, caloriesAndSodium, cuisine, intolerances){
    console.log(ingredients);
    const params = {
        apiKey: API_KEY,
        includeIngredients: ingredients.join(","),
        type: mealType,
        addRecipeNutrition: true,
        number: 1, 
        minCalories: Math.ceil(caloriesAndSodium.calories * 0.9),
        maxCalories: Math.ceil(caloriesAndSodium.calories * 1.1),
        maxSodium: caloriesAndSodium.sodium,
        sort: "max-used-ingredients",
        addRecipeInformation: true
    };
    if (diet) params.diet = diet.join(',');
    if (cuisine) params.cuisine=cuisine.join(',');
    if (intolerances) params.intolerances=intolerances.join(',');

    try {
        const response = await axios.get(BASE_URL, { params });
        const totalResults = response.data.totalResults; 
        return totalResults;
    } catch (error) {
        console.error(`Error fetching ${mealType}:`, error);
        req.flash("error", `Could not find any recipes for: ${mealType}. Please add or change the ingredient list`)
        return null; 
    }
}   

//Finds all the different recipes
const fetchMealsForMealType = async (ingredients, diet, mealType, caloriesAndSodium, cuisine, totalResults, intolerances) => {
  console.log(ingredients);
    const params = {
            apiKey: API_KEY,
            includeIngredients: ingredients.join(","),
            type: mealType,
            addRecipeNutrition: true,
            number: totalResults, 
            minCalories: Math.ceil(caloriesAndSodium.calories * 0.9),
            maxCalories: Math.ceil(caloriesAndSodium.calories * 1.1),
            maxSodium: caloriesAndSodium.sodium,
            sort: "max-used-ingredients",
            addRecipeInformation: true
        };

    if (diet) params.diet = diet.join(',');
    if (cuisine) params.cuisine=cuisine.join(',');
    if (intolerances) params.intolerances=intolerances.join(',');

    try {
        const response = await axios.get(BASE_URL, { params });
        const meals = response.data.results;
        if (!meals || meals.length === 0) {
            return null;
        }
        const myRecipes = meals.map(recipe => {
            const listOfIngredients = recipe.nutrition.ingredients.map(ingredient => ingredient.name);
            return {
                id: recipe.id,
                listOfIngredients: listOfIngredients
            };
        });
        return myRecipes;
    } catch (error) {
        console.error(`Error fetching ${mealType}:`, error);
        return [];
    }
};

//Finds the information of each recipe from their id
async function findRecipeByIdBulk(ids){
    const params = {
        apiKey: API_KEY,
        ids: ids.join(','), 
        includeNutrition: true,
    };

    try {
        const response = await axios.get(BASE_URL_BULK, { params });
        const recipes = response.data;

        if (!recipes || recipes.length === 0) {
            return [];
        }

        return recipes.map(recipe => ({
            id: recipe.id,
            name: recipe.title,
            image: recipe.image || "https://media.istockphoto.com/id/1055079680/vector/black-linear-photo-camera-like-no-image-available.jpg?s=612x612&w=0&k=20&c=P1DebpeMIAtXj_ZbVsKVvg-duuL0v9DlrOZUvPG6UJk=",
            url: recipe.sourceUrl,
            nutrition: {
                calorie: recipe.nutrition?.nutrients.find(n => n.name === "Calories")?.amount || 0,
                protein: recipe.nutrition?.nutrients.find(n => n.name === "Protein")?.amount || 0,
                carb: recipe.nutrition?.nutrients.find(n => n.name === "Carbohydrates")?.amount || 0,
                fat: recipe.nutrition?.nutrients.find(n => n.name === "Fat")?.amount || 0
            }
        }));
    } catch (error) {
        console.error(`Error fetching recipes for IDs ${ids.join(', ')}:`, error);
        return [];
    }
};

//Creates the daily meal plan
const createFinalMealPlan = (sortedMealPlans) => {
    const finalMealPlan = [];
    const mealTypes = ['breakfast', 'lunch', 'dinner'];
    let index = 0;

    while (finalMealPlan.length < 7) {
        const mealPlan = {};
        for (const mealType of mealTypes) {
            const sortedList = sortedMealPlans[mealType];
            const elementIndex = index % sortedList.length;
            mealPlan[`${mealType}Id`] = sortedList[elementIndex].id;
        }
        finalMealPlan.push(mealPlan);
        index++;
    }

    return finalMealPlan;
};

//calculates the amount of calories and sodium for each user
function calculateMealCaloriesAndSodium(dailyCalories, dailySodium, mealPreference) {
    const factors = {
        light: 0.2,
        normal: 0.333,
        heavy: 0.47
    }[mealPreference] || 0.333; // Default to 'normal' if undefined

    return {
        calories: dailyCalories * factors,
        sodium: dailySodium * factors
    };
};


//creates the mealplan
async function createMealplan(userId, user){
    console.log(user);
    const today = new Date();
    today.setHours(0, 0, 0, 0);  
    const dailyCalories = user.calories;
    console.log(dailyCalories);

    // Check for existing meal plan and remove it if it's under 7 days old
    let mealPlan = await MealPlan.findOne({
        userId: userId,
        startDate: { $lte: today, $gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) }
    });

    if (mealPlan) {
        await MealPlan.deleteOne({ _id: mealPlan._id });
    }

    // Create a new meal plan
    mealPlan = new MealPlan({
        userId: userId,
        startDate: today,
        dailyPlans: []
    });

    // Define an object to store sorted lists for each meal type
    const sortedMealPlans = {
        breakfast: [],
        lunch: [],
        dinner: []
    };


    try{
        // Populate each meal type into the day plan
        for (const mealType of ['breakfast', 'lunch', 'dinner']) {
            const mealPreferences = user.mealPreferences[mealType];
            const caloriesAndSodium = calculateMealCaloriesAndSodium(user.calories, user.sodium, mealPreferences);
            console.log(mealType);
            const ingredients = user[`${mealType}Ingredients`];
            const diets = user.diets;
            const cuisines = user.cuisine;
            const intolerances = user.intolerances;
            const totalResults = await getTotalResults(ingredients, diets, mealType, caloriesAndSodium, cuisines, intolerances);
            if (totalResults==null || totalResults==0){
                req.flash('error', `Could not find any matching recipes for ${mealType}`);
                res.redirect('/profileSettings/mealPreferences');
                return; 
            }
            const recipes = await fetchMealsForMealType(ingredients, diets, mealType, caloriesAndSodium, cuisines, totalResults, intolerances);


            let allRecipeIngredients = recipes.flatMap(recipe => recipe.listOfIngredients);
            const clearedIngredients = [...new Set(allRecipeIngredients)];

            let userVector = ingredients;
            userVector = clearedIngredients.map(ingredient => userVector.includes(ingredient) ? 1 : 0);

            const matrixVectors = matrix(recipes, clearedIngredients);
            const dotProducts = dotProduct(userVector, matrixVectors);
            const magnitudes = magnitude(userVector, matrixVectors);
            const cosineSimilaritys = cosineSimilarity(magnitudes, dotProducts, recipes);

            let sortedList;
            if (cosineSimilaritys.length > 7) {
                sortedList = getTopElements(cosineSimilaritys, recipes, 7);
            } else {
                sortedList = getTopElements(cosineSimilaritys, recipes, cosineSimilaritys.length);
            }

            sortedMealPlans[mealType] = sortedList;
        }
    }catch (error){
        console.error("Error recipes: ", error);
        req.flash('error', 'Error getting the recipes. Please try again.');
        res.redirect('/profileSettings/mealPreferences');

    }

    //search the recipes 
    const finalMealPlanId=createFinalMealPlan(sortedMealPlans);
    let i=0;
    for (const mealPlans of finalMealPlanId) {
        let dayDate = new Date(today);
        dayDate.setDate(today.getDate() + i); // Increment the date by i days

        const dayPlan = {
            date: dayDate,
            meals: { breakfast: null, lunch: null, dinner: null },
            calorie: 0,
            protein: 0,
            carb: 0,
            fat: 0
        };
        const ids = [mealPlans.breakfastId, mealPlans.lunchId, mealPlans.dinnerId];
        const recipes = await findRecipeByIdBulk(ids);

        // Assign recipes to meal types
        recipes.forEach(recipe => {
            if (recipe.id === mealPlans.breakfastId) {
                dayPlan.meals.breakfast = recipe;
            }
            if (recipe.id === mealPlans.lunchId) {
                dayPlan.meals.lunch = recipe;
            }
            if (recipe.id === mealPlans.dinnerId) {
                dayPlan.meals.dinner = recipe;
            }
        });

        // Add the new day plan to the meal plan's daily plans array
        mealPlan.dailyPlans.push(dayPlan);
        i++;
    }

    // Attempt to save the new meal plan
    try {
        await mealPlan.save();
        console.log('Meal plan saved successfully');
    } catch (error) {
        console.error('Failed to save meal plan:', error);
    }
}

/**
 * GET /
 * User-Profile-mealpreferences
*/
router.get('/mealPreferences', ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.user._id; 
        const userModel = await UserModel.findById(userId);
        const user = await User.findById(userId);

        if (!user.bmrCompleted){
            res.redirect('/profileSettings/personalInformation');
        }

        // Ensure breakfastIngredients is an array
        const breakfastIngredients = BREAKFASTINGREDIENTS instanceof Array ? BREAKFASTINGREDIENTS : [];

        res.render('mealPreferences', {
            diets: DIETS,
            intolerance: INTOLERANCES,
            cuisines: CUISINES,
            breakfastIngredients: breakfastIngredients,
            lunchIngredients: LUNCHINGREDIENTS,
            dinnerIngredients: DINNERINGREDIENTS,
            selectedCuisines: userModel ? userModel.cuisines : [],
            selectedDiets: userModel ? userModel.diets : [],
            selectedIntolerance: userModel ? userModel.intolerance : [],
            selectedBreakfastIngredients: userModel ? userModel.breakfastIngredients.map(ingredient => capitalizeFirstLetter(ingredient)): [],
            selectedLunchIngredients: userModel ? userModel.lunchIngredients.map(ingredient => capitalizeFirstLetter(ingredient)): [],
            selectedDinnerIngredients: userModel ? userModel.dinnerIngredients.map(ingredient => capitalizeFirstLetter(ingredient)): [],
            enums: UserModel.schema.path('mealPreferences.breakfast').enumValues,
            user: userModel ? userModel: null,
        });

    } catch (error) {
        console.error("Error loading meal plan settings:", error);
        res.status(500).send("Failed to load settings");
    }
});

/**
 * PUT /
 * User-Profile-mealpreferences
*/
router.put('/mealPreferences',ensureAuthenticated, async (req, res) => {
    const userId = req.user._id; 
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).send('User not found');
    }
    let selectedCuisines = req.body.cuisines || [];
    let selectedDiets = req.body.diets || [];
    let selectedBreakfastIngredients = (req.body.breakfastIngredients || []).map(ingredient => ingredient.trim().toLowerCase());
    let selectedLunchIngredients = (req.body.lunchIngredients || []).map(ingredient => ingredient.trim().toLowerCase());
    let selectedDinnerIngredients = (req.body.dinnerIngredients || []).map(ingredient => ingredient.trim().toLowerCase());
    let breakfastType=req.body.breakfastType;
    let lunchType=req.body.lunchType;
    let dinnerType=req.body.dinnerType;

    // Check the number of ingredients selected for each meal
    if ((selectedBreakfastIngredients.length <= 1) || (selectedLunchIngredients.length <= 1) ||(selectedDinnerIngredients.length <= 1) ){
        req.flash('error', 'Please select more than one ingredient for the different meals');
    }

    // Redirect back if any condition is not met
    if (selectedBreakfastIngredients.length <= 1 || selectedLunchIngredients.length <= 1 || selectedDinnerIngredients.length <= 1) {
        res.redirect('/profileSettings/mealPreferences'); 
        return;
    }

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
        console.error("Error updating settings: ", error);
        req.flash('error', 'Error updating preferences. Please try again.');
        res.redirect('/profileSettings/mealPreferences');
    }
    const updatedUserModel = await UserModel.findById(userId);

    try {
        await createMealplan(userId, updatedUserModel); 
        if (!user.questionnaireCompleted){
            user.questionnaireCompleted=true;
            await user.save();
            res.redirect('/dashboard');
        }else{
            console.log("After");
            res.redirect('/profileSettings/mealPreferences');
        }  
    } catch (error) {
        console.error("Error generating meal plan: ", error);
        req.flash('error', 'Error generating meal plan. Please try again.');
        res.redirect('/profileSettings/mealPreferences');
    }
});


function matrix(myRecipes, clearedIngredients) {

    // Initialize the matrix with zeros everywhere, and it needs to be a length of myRecipes x numberofIngredients
    const matrix = Array.from({ length: myRecipes.length }, () => Array.from({ length: clearedIngredients.length }, () => 0));

    // Populate the matrix with 1s where an ingredient is used in a recipe
    for (let recipeIndex = 0; recipeIndex < myRecipes.length; recipeIndex++) {
        const recipeIngredients = myRecipes[recipeIndex].listOfIngredients;
        for (let ingredientIndex = 0; ingredientIndex < clearedIngredients.length; ingredientIndex++) {
            if (recipeIngredients.includes(clearedIngredients[ingredientIndex])) {
                matrix[recipeIndex][ingredientIndex] = 1;
            }
        }
    }

    // Return the populated matrix
    return matrix;

}

//Initialize and empty string for the dot products of the first vector (user vector) and all other vectors
function dotProduct(user_vector, matrix_vectors) { 
    //only uservector * every other vector

    let dotProducts = [];

    for (let i = 0; i < matrix_vectors.length; i++) {

        let dotResult = 0;

        for (let j = 0; j < matrix_vectors[i].length; j++) {
            dotResult += user_vector[j] * matrix_vectors[i][j];
        }
        dotProducts.push(dotResult);
    }

    return dotProducts;
}



//function to calculate len of vectors
function magnitude(user_vector, matrix_vectors) { 
    //uservector should be the first column of the matrix
    let magnitudes = [];
    const initial = 0;

    const user_vector_magnitude = Math.sqrt(user_vector.reduce((acc, val) => acc + val ** 2, 0));

    let squareOfVectors = 0;
    let magnitudeOfVector = 0;

    for (let n = 0; n < matrix_vectors.length; n++) {
        let magnitudeOfVector = Math.sqrt(matrix_vectors[n].reduce((acc, val) => acc + val ** 2, 0));
        let final = magnitudeOfVector * user_vector_magnitude;

        magnitudes.push(final);
    }
    return magnitudes;

}

//function for cos similarity
function cosineSimilarity(magnitudes, dotProducts, myRecipes) {

    let cosine_results = [];

    let cosValue = 0;

    for (let i = 0; i < dotProducts.length; i++) {
        cosValue = ((dotProducts[i] / magnitudes[i]) + 1) / 2
        if (cosValue>0){
            cosine_results.push({ index: i, score: cosValue });
        }
    }

    return cosine_results;

}


//Sorting functions
function getTopElements(arr, myRecipes, k) {
    if (arr.length === 0) {
        return []; // Return empty if no elements to process
    }
    
    if (arr.length <= k) {
        buildMinHeap(arr);
        return extractTopElements(arr, myRecipes);
    }

    let heap = arr.slice(0, k);
    buildMinHeap(heap);

    for (let i = k; i < arr.length; i++) {
        if (arr[i].score > heap[0].score) {
            heap[0] = arr[i];
            heapify(heap, 0);
        }
    }

    const result = extractTopElements(heap, myRecipes);
    return result;
}

function buildMinHeap(arr) {
    const n = arr.length;
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        heapify(arr, i);
    }
}

function heapify(arr, i) {
    const n = arr.length;
    let smallest = i;
    const left = 2 * i + 1;
    const right = 2 * i + 2;

    if (left < n && arr[left].score < arr[smallest].score) {
        smallest = left;
    }
    if (right < n && arr[right].score < arr[smallest].score) {
        smallest = right;
    }
    if (smallest !== i) {
        [arr[i], arr[smallest]] = [arr[smallest], arr[i]];
        heapify(arr, smallest);
    }
}

function extractTopElements(heap, myRecipes) {
    const sortedResults = [];
    while (heap.length > 1) {
        sortedResults.push(heap[0]);
        heap[0] = heap.pop();
        heapify(heap, 0);
    }
    if (heap.length > 0) {
        sortedResults.push(heap.pop());
    }
    
    sortedResults.reverse();
    return sortedResults.map(x => ({
        id: myRecipes[x.index].id,
    }));
}

//Capitalize the first letter
function capitalizeFirstLetter(string) {
    if (!string) return string; 
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

module.exports= router;