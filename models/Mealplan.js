const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mealNutritionSchema = new Schema({
    calorie: Number,
    protein: Number,
    carb: Number,
    fat: Number
});

const mealSchema = new Schema({
    id: String,
    name: String,
    image: String, 
    url: String, 
    nutrition: mealNutritionSchema,
    isChecked: { type: Boolean, default: false }
});

const dailyMealPlanSchema = new Schema({
    date: Date,  
    meals: {
        breakfast: mealSchema,
        lunch: mealSchema,
        dinner: mealSchema
    },
    calorie: Number,
    protein: Number,
    carb: Number,
    fat: Number
});

// Schema for tracking all meal plans for a user
const weeklyMealPlanSchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    startDate: { type: Date, required: true, default: new Date() }, 
    dailyPlans: [dailyMealPlanSchema]
});

module.exports  = mongoose.model('MealPlan', weeklyMealPlanSchema);

