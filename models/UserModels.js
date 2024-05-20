const mongoose = require('mongoose');

const userModel = new mongoose.Schema({
  userId: { type:mongoose.Schema.Types.ObjectId, ref: 'User' },
      calories: { type: Number },
      height: { type: Number },
      weight: { type: Number },
      age: { type: Number },
      gender: { type: String },
      BMR: { type: Number },
      BMI: { type: Number },
      activityLevel: {type: String},
      mealPreferences: {
        breakfast: { type: String, enum: ['light', 'normal', 'heavy'], default: 'normal' },
        lunch: { type: String, enum: ['light', 'normal', 'heavy'], default: 'normal' },
        dinner: { type: String, enum: ['light', 'normal', 'heavy'], default: 'normal' }
      },
      fat: { min: Number, max: Number },
      protein: { min: Number, max: Number },
      carbohydrates: { min: Number, max: Number },
      sodium:{Number},
      cuisines: [{ type: String }],
      diets: [{ type: String }],
      intolerances: [{ type: String }],
      breakfastIngredients: [{ type: String }],
      lunchIngredients: [{ type: String }],
      dinnerIngredients: [{ type: String }],

});

module.exports =  mongoose.model('UserModel',userModel);
