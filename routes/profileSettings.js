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

function calculateBMI(weight, height) {
    return (weight / (Math.pow((height / 100), 2))).toFixed(2);
}



function calculateBMR( height, weight, age, gender, activityLevel ) {
    const factor = getActivityFactor(activityLevel);
    const genderFactor = gender.toLowerCase() === "male" ? 5 : -161;
    return Math.ceil(factor * ((9.99 * weight) + (6.25 * height) - (4.92 * age) + genderFactor));
}

function calculateMacros(calories, type) {
    const ratios = {
        protein: [0.1, 0.35, 4],
        fat: [0.2, 0.35, 9],
        carbs: [0.45, 0.65, 4],
    };
    const [minRatio, maxRatio, divisor] = ratios[type];
    return {
        min: (calories * minRatio) / divisor,
        max: (calories * maxRatio) / divisor,
    };
}

router.put('/personalInformation', ensureAuthenticated, validatePersonalInformation, async (req, res) => {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
        return res.status(404).send('User not found');
    }

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
    const protein = calculateMacros(calories, 'protein');
    const fat = calculateMacros(calories, 'fat');
    const carbohydrates=calculateMacros(calories, 'carbs');

    try {
        const update = {
            height,
            gender,
            weight,
            age,
            BMR,
            BMI,
            calories,
            protein: {min: protein.min, max: protein.max},
            fat:{min: fat.min, max: fat.max},
            carbohydrates:{min: carbohydrates.min, max: carbohydrates.max},
            sodium: sodium,
            activityLevel,
            
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
            res.redirect('/profileSettings/personalInformation');
        }

    } catch (error) {
        console.error("Error updating settings:", error);
        req.flash('error', 'Error updating settings. Please try again.');
        res.redirect('/profileSettings/personalInformation');
    }
});


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
    if (cuisine){
        for (let cuisines in cuisine){
            params.cuisine = cuisines;
        }
    } 
    if (intolerances) params.intolerances=intolerances.join(',');

    try {
        const response = await axios.get(BASE_URL, { params });
        const meals = response.data.results;
        if (!meals || meals.length === 0) {
            console.log("No results returned from API.");
            return null;
        }
        const myRecipes = meals.map(recipe => {
            const listOfIngredients = recipe.nutrition.ingredients.map(ingredient => ingredient.name);
            return {
                id: recipe.id,
                listOfIngredients: listOfIngredients
            };
        });
        console.log("MMMM" + " "+ myRecipes);
        return myRecipes;
    } catch (error) {
        console.error(`Error fetching ${mealType}:`, error);
        return [];
    }
};

const findRecipeByIdBulk = async (ids) => {
    const params = {
        apiKey: API_KEY,
        ids: ids.join(','),  // Convert the array of IDs to a comma-separated string
        includeNutrition: true,
    };

    try {
        const response = await axios.get(`https://api.spoonacular.com/recipes/informationBulk`, { params });
        const recipes = response.data;

        if (!recipes || recipes.length === 0) {
            console.log("No results returned from API.");
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

const calculateMealCaloriesAndSodium = (dailyCalories, dailySodium, mealPreference) => {
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

const createFinalMealPlan = (sortedMealPlans) => {
    const finalMealPlan = [];
    const mealTypes = ['breakfast', 'lunch', 'dinner'];
    let index = 0;
    console.log("KKKK" + JSON.stringify(sortedMealPlans, null, 2));

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

async function createMealplan(userId, user, req, res) {
    console.log(user);
    const today = new Date();
    today.setHours(0, 0, 0, 0);  // Reset the time part to ensure all comparisons are only date-based
    const dailyCalories = user.calories;
    console.log(dailyCalories);

    let mealPlan = await MealPlan.findOne({
        userId: userId,
        startDate: { $lte: today, $gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) }
    });

    if (mealPlan) {
        await MealPlan.deleteOne({ _id: mealPlan._id });
    }

    mealPlan = new MealPlan({
        userId: userId,
        startDate: today,
        dailyPlans: []
    });

    const sortedMealPlans = {
        breakfast: [],
        lunch: [],
        dinner: []
    };

    try {
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
                return; // Exit the loop and redirect
            }
            const recipes = await fetchMealsForMealType(ingredients, diets, mealType, caloriesAndSodium, cuisines, totalResults, intolerances);
            console.log(recipes);


            let allRecipeIngredients = recipes.flatMap(recipe => recipe.listOfIngredients);
            const clearedIngredients = [...new Set(allRecipeIngredients)];

            let userVector = ingredients;
            userVector = clearedIngredients.map(ingredient => userVector.includes(ingredient) ? 1 : 0);

            const matrixVectors = matrix(recipes, clearedIngredients);
            const dotProducts = dotProduct(userVector, matrixVectors);
            const magnitudes = magnitude(userVector, matrixVectors);
            const cosineSimilaritys = cosineSimilarity(magnitudes, dotProducts, recipes);
            console.log(cosineSimilaritys);

            let sortedList;
            if (recipes.length > 7) {
                console.log("More than 7 recipes, sorting...");
                sortedList = sorting(cosineSimilaritys, recipes, recipes.length);
            } else {
                sortedList = sorting(cosineSimilaritys, recipes);
            }

            sortedMealPlans[mealType] = sortedList;
        }
    } catch (error) {
        console.error("Error recipes: ", error);
        req.flash('error', 'Error getting the recipes. Please try again.');
        res.redirect('/profileSettings/mealPreferences');
        return;
    }

    const finalMealPlanId = createFinalMealPlan(sortedMealPlans);
    let i = 0;
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
        console.log(`Recipes for IDs ${ids.join(', ')}:`, recipes);

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

        console.log('Adding day plan:', dayPlan);
        mealPlan.dailyPlans.push(dayPlan);
        i++;
    }

    try {
        await mealPlan.save();
        console.log('Meal plan saved successfully');
    } catch (error) {
        console.error('Failed to save meal plan:', error);
    }
}


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
    console.log("KKKKKKK"+" "+ JSON.stringify(caloriesAndSodium.sodium, null, 2));
    if (diet) params.diet = diet.join(',');
    if (cuisine){
        for (let cuisines in cuisine){
            params.cuisine = cuisines;
        }
    } 
    if (intolerances) params.intolerances=intolerances.join(',');

    try {
        const response = await axios.get(BASE_URL, { params });
        const totalResults = response.data.totalResults; // Corrected line
        console.log("Total results: " + totalResults);
        return totalResults;
    } catch (error) {
        console.error(`Error fetching ${mealType}:`, error);
        req.flash("error", `Could not find any recipes for: ${mealType}. Please add or change the ingredient list`)
        return null; // Changed to null for consistency with no results case
    }
}   



router.get('/mealPreferences', ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.user._id; 
        console.log(userId);
        const userModel = await UserModel.findById(userId);
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).send('User not found');
        }

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
            selectedCuisines: userModel.cuisines,
            selectedDiets: userModel.diets,
            selectedIntolerance: userModel.intolerances,
            selectedBreakfastIngredients: userModel.breakfastIngredients.map(ingredient => capitalizeFirstLetter(ingredient)),
            selectedLunchIngredients: userModel.lunchIngredients.map(ingredient => capitalizeFirstLetter(ingredient)),
            selectedDinnerIngredients: userModel.dinnerIngredients.map(ingredient => capitalizeFirstLetter(ingredient)),
            enums: UserModel.schema.path('mealPreferences.breakfast').enumValues,
            user: userModel
        });

    } catch (error) {
        console.error("Error loading meal plan settings:", error);
        res.status(500).send("Failed to load settings");
    }
});


router.put('/mealPreferences', ensureAuthenticated, async (req, res) => {
    const userId = req.user._id; 
    console.log(userId);
    const user = await User.findById(userId);
    const userModel = await UserModel.findById(userId);
    if (!user) {
        return res.status(404).send('User not found');
    }
    let selectedCuisines = req.body.cuisines || [];
    let selectedDiets = req.body.diets || [];
    let intolorences = req.body.intolerance || [];
    let selectedBreakfastIngredients = (req.body.breakfastIngredients || []).map(ingredient => ingredient.trim().toLowerCase());
    let selectedLunchIngredients = (req.body.lunchIngredients || []).map(ingredient => ingredient.trim().toLowerCase());
    let selectedDinnerIngredients = (req.body.dinnerIngredients || []).map(ingredient => ingredient.trim().toLowerCase());
    let breakfastType = req.body.breakfastType;
    let lunchType = req.body.lunchType;
    let dinnerType = req.body.dinnerType;

    if (selectedBreakfastIngredients.length <= 1) {
        req.flash('error', 'Please select more than one ingredient for breakfast.');
    }
    if (selectedLunchIngredients.length <= 1) {
        req.flash('error', 'Please select more than one ingredient for lunch.');
    }
    if (selectedDinnerIngredients.length <= 1) {
        req.flash('error', 'Please select more than one ingredient for dinner.');
    }

    if (selectedBreakfastIngredients.length <= 1 || selectedLunchIngredients.length <= 1 || selectedDinnerIngredients.length <= 1) {
        res.redirect('/profileSettings/mealPreferences'); 
        return;
    }

    try {
        await UserModel.findByIdAndUpdate(userId, {
            $set: {
                cuisines: selectedCuisines,
                diets: selectedDiets,
                intolerances:intolorences,
                breakfastIngredients: selectedBreakfastIngredients,
                lunchIngredients: selectedLunchIngredients,
                dinnerIngredients: selectedDinnerIngredients,
                "mealPreferences.breakfast": breakfastType,
                "mealPreferences.lunch": lunchType,
                "mealPreferences.dinner": dinnerType
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
        await createMealplan(userId, updatedUserModel, req, res); 
        if (!user.questionnaireCompleted) {
            user.questionnaireCompleted = true;
            await user.save();
            res.redirect('/dashboard');
        } else {
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


function dotProduct(user_vector, matrix_vectors) { //only uservector * every other vector

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
function magnitude(user_vector, matrix_vectors) { //uservector should be the first column of the matrix

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

    //let maxIndex = cosine_results.indexOf(Math.max(...cosine_results)); 
   //console.log(maxIndex);

    //let mostSimilarRecipe = myRecipes[maxIndex].id;

    return cosine_results;

}


// function sorting(cosineResults, myRecipes, topN = 7) {
//     // Maybe use an actual sorting algorithm for report purposes. 
//     cosineResults.sort((a, b) => b.score - a.score);
//     console.log("Sorted Cosine Results: " + JSON.stringify(cosineResults, null, 2));
//     return cosineResults.slice(0, topN).map(x => ({
//         id: myRecipes[x.index].id,
//         score: x.score
//     }));
// }

function randomizedQuicksort(arr, left = 0, right = arr.length - 1) {
    if (left < right) {
        const pivotIndex = randomPartition(arr, left, right);
        randomizedQuicksort(arr, left, pivotIndex - 1);
        randomizedQuicksort(arr, pivotIndex + 1, right);
    }
    return arr;
}

function randomPartition(arr, left, right) {
    const randomIndex = left + Math.floor(Math.random() * (right - left + 1));
    [arr[randomIndex], arr[right]] = [arr[right], arr[randomIndex]]; // Swap random pivot to end
    return partition(arr, left, right);
}

function partition(arr, left, right) {
    const pivotValue = arr[right].score;
    let pivotIndex = left;
    for (let i = left; i < right; i++) {
        if (arr[i].score > pivotValue) { // Sorting in descending order
            [arr[i], arr[pivotIndex]] = [arr[pivotIndex], arr[i]];
            pivotIndex++;
        }
    }
    [arr[pivotIndex], arr[right]] = [arr[right], arr[pivotIndex]];
    return pivotIndex;
}

function sorting(cosineResults, myRecipes, topN = 7) {
    const sortedRecipes = randomizedQuicksort(cosineResults).slice(0, topN);
    console.log("Top N Sorted Recipes: " + JSON.stringify(sortedRecipes, null, 2));
        return sortedRecipes.slice(0, topN).map(x => ({
        id: myRecipes[x.index].id,
        score: x.score
    }));
}


function capitalizeFirstLetter(string) {
    if (!string) return string; // Handle null, undefined, etc
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

module.exports= router 
