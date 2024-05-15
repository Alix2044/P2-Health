// activityLevelFactors.js
  const activityFactors = {
    sedentary: 1.2,
    lightly: 1.375,
    moderately: 1.55,
    very: 1.725,
    extra: 1.9
  };
  
  const getActivityFactor = (activityLevel) => {
    return activityFactors[activityLevel.toLowerCase()] || null;
  }
  
  module.exports = getActivityFactor;