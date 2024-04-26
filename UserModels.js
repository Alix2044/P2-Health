const moongose = require('mongooese');

const userSchema = new mongose.Schema({
  createdBy: {
        type: Schema.Types.ObjectId, 
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
 age: {
        type: Number,
       required: true,
        min: 0
    },
 height: {
  type: Number,
  required: true,
     min: 0
},
  gender: {
        type: String,
        enum: ['Male', 'Female', 'Other']
    },
  
  weight: {
  type: Number,
  required: true,
      min: 0
},
  dailyActive: {
  type: String,
    enum: ['Sedentary', 'Lightly active', 'Moderately active', 'Very active', 'Extremely active'],
  required: true
},
  dietPattern: {
  type: String,
  required: true,
     enum: ['Vegan', 'Vegetarian', 'Meat-eater']
},
    foodSensitivityOrAllergies: {
        type: [String] // Hvis der kan være flere allergier eller følsomheder
    },
    preferredPhysicalActivities: {
        type: [String] // Hvis der kan være flere foretrukne aktiviteter
    },
    preferredFoods: {
        type: [String] // Hvis der kan være flere foretrukne fødevarer
    },
      location: {
        type: {
            type: String,
            required: true
        },
    }
  

});

module.exports =  mongoose.model('user',userSchema);
