/*! Define global variables for activity levels*/

const LOW = 1.2;
const LIGHT = 1.375;
const MOD = 1.55;
const ACTIVE = 1.725;
const HIGH_ACT = 1.9;
const CALORIESINKG = 7700;
const WEEKSPERYEAR = 52;

/*! STEP 0: JS OBJECT THAT WE WILL PUT IN A MONGO DB */

let userOne = {
    name: "Yasmin",
    current_weight: 80,
    height: 170,
    age: 25,
    gender: "female",
    eater: "omnivore",
    allergies: "none",
    banned_foods: ["broccoli", "spinach", "eggs"],
    preferred_foods: ["chicken", "pasta", "rice"],
    activity_level: LOW //Constant var
}


/*! STEP 1:  Function to calculate BMI. TESTED OK */

function BMI(height, weight) {
    let height_in_m = height / 100 // Need to convert height to m from cm
    return weight / height_in_m ** 2;

};

userOne.BMI = BMI(userOne.height, userOne.current_weight);


/*! STEP 2: Function to calculate BMR for women and men using Mifflin-St Jeo. */

function calculate_RMR(weight, height, age) {
    if (userOne.gender === "female") {
        return (9.99 * weight) + (6.25 * height) - (4.92 * age) - 161;
    } else if (userOne.gender === "male") {
        return (9.99 * weight) + (6.25 * height) - (4.92 * age) + 5;
    } else {
        throw new Error("ERROR. GENDER not confirmed")
    }
}

userOne.RMR = calculate_RMR(userOne.current_weight, userOne.height, userOne.age);


/*! STEP 3: Function to calculate the total energy exp. based on activity level */

function calculate_total_energy_consumption(activity_level, RMR) {
    let total_energy_consumption = userOne.RMR * userOne.activity_level;
    return total_energy_consumption;
};

/*STEP 4: IDEAL BODY WEIGHT FOR WOMEN AND MEN using Acute Respiratory Distress Syndrome Network (ARDSnet) formula*/

function calculate_ideal_weight(height) {
    if (userOne.gender === "female") {
        return 49 + 0.66 * (height - 152.4);
    } else if (userOne.gender === "male") {
        return 52 + 0.9 * (height - 152.4);
    } else {
        throw new Error("ERROR. Height not properly defined. ")
    }
};

userOne.totalEnergyConsumption = calculate_total_energy_consumption(userOne.activity_level, userOne.RMR);

userOne.ideal = calculate_ideal_weight(userOne.height);

/*STEP 5: Calculate target caloric intake per day. Safe considered weight loss is 0,5 kg per week */

function calculate_daily_caloric_intake(calculate_total_energy_consumption) {
    //Check : Is calculate_total_energy_consumption a function?

    if (typeof calculate_total_energy_consumption === "function") {
        let caloric_deficit_in_a_day = (0.5 * 7700) / 7;
        let how_much_recommended = calculate_total_energy_consumption(userOne.activity_level, userOne.RMR);


        //Check : Is how_much recommended is a valid number? Also its value cannot be too low. 1200 calories per day os the minimum for the body to perform its basic functions. 

        if (!isNaN(how_much_recommended) && how_much_recommended >= 1200 && how_much_recommended <= 5000) {
            return how_much_recommended - caloric_deficit_in_a_day; /* How many kcal a day are recommended*/
        } else {
            throw new Error("Error in daily recommended caloric intake!");
        }
    } else {
        throw new Error("Calculate_daily_caloric intake is not defined properly");
    }

};

userOne.recommended_daily_intake = calculate_daily_caloric_intake(calculate_total_energy_consumption);

/*STEP 6 :  How much time for their ideal weight and how much weight loss in a span of a year*/

function calculate_length_of_journey() {

    let avg_daily_caloric_deficit = userOne.recommended_daily_intake - userOne.totalEnergyConsumption; /* we are calculating the average daily caloric deficit */

    let avg_weekly_weight_loss = Math.floor(avg_daily_caloric_deficit / CALORIESINKG); /*how many kg can we possibly loose in a week with a standart deviation of 0,1 kg (usually we would encourage the user the have weekly weighing so that we could use a vector and calculate the average of the past x weeks, and from that to calculate a standard deviation and then a z-score but we do not have that now so we will just assign a standart deviation of 0,1 kg per week to get a more sophisticated result*/

    let standart_dev_per_week = 0.1 * Math.sqrt(WEEKSPERYEAR); //we use arbitrary value of 0.1. Standart dev. formula : √(∑(x−μ)^2/n)

    let range_upper = avg_weekly_weight_loss - (1.9 * standart_dev_per_week); //max amount lost if they follow diet

    let range_lower = avg_weekly_weight_loss + (1.9 * standart_dev_per_week); //min amount lost if they follow diet

    let final_estimate = (range_lower + range_upper) / 2;

    let ca_how_long_to_ideal = (userOne.current_weight - userOne.ideal) / final_estimate;  /*how long does it take (in weeks) to achieve the ideal weight?*/

    let ca_annual_weight_loss = final_estimate * WEEKSPERYEAR;

    console.log("In a year you are expected to loose " + ca_annual_weight_loss + " kilogramms. You are also expected to reach you ideal weight in " + ca_how_long_to_ideal + " weeks. These are rough estimates and serve the purpose of encouragement and motivation.");

};


/*STEP 7 :  Recommendation system algorithm* What we need is to catch the user input, and also have the input from the API tags so we can create the two vectors!*/



const myRecipes = [
    { name: "Macaroni and Cheese", listOfIngredients: ["macaroni", "evaporated milk", "heavy cream", "grated cheese"], caloric_value: 400 },
    { name: "Greek Salad", listOfIngredients: ["tomato", "feta cheese", "onion", "olives", "mint", ""], caloric_value: 211 },
    { name: "Pesto Pasta", listOfIngredients: ["pasta", "onion", "pesto", "parmesan cheese"], caloric_value: 377 },
    { name: "Roasted Cauliflower Soup", listOfIngredients: ["cauliflower", "onion", "garlic", "water", "olive oil"], caloric_value: 114 }
];


// Extract the names of all ingredients from all recipes and remove duplicates
let allRecipeIngredients = [];
allRecipeIngredients = myRecipes.flatMap(recipe => recipe.listOfIngredients); // get all ingredients from recipes and put them in a list
const clearedIngredients = [...new Set(allRecipeIngredients)]; //do not mention an ingredient twice

//user vector needs to be converted to binary
let userVector = [];

userVector = clearedIngredients.map(ingredient => userVector.includes(ingredient) ? 1 : 0);


function matrix(myRecipes) {

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
function Magnitude(user_vector, matrix_vectors) { //uservector should be the first column of the matrix

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

function cosineSimilarity(magnitudes, dotProducts) {

    let cosine_results = [];

    let cosValue = 0;

    for (let m = 0; m < my_list.length; m++) {
        cosValue = ((dotProducts[m] / magnitudes[m]) + 1) / 2

        cosine_results.push(cosValue)
    }

    let maxIndex = cosine_results.indexOf(Math.max(...cosine_results));

    let mostSimilarRecipe = myRecipes[maxIndex].name;

    return mostSimilarRecipe;

}