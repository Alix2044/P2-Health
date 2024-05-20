const { fetchMealsForMealType} = require('../../routes/profileSettings');
const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');

describe('fetchMealsForMealType function', () => {
  const mock = new MockAdapter(axios);

  afterEach(() => {
    mock.reset();
  });

  test('fetches meals successfully', async () => {
    const mockMeals = [
      { id: 1, nutrition: { ingredients: ['Chicken', 'Tomatoes', 'Quinoa'] } },
      { id: 2, nutrition: { ingredients: ['Salmon', 'Broccoli', 'Rice'] } }
    ];

    mock.onGet(PROCESS.ENV.API_KEY_SPOONACULAR).reply(200, { results: mockMeals });

    const ingredients = ['Chicken', 'Tomatoes', 'Quinoa'];
    const diet = 'Ketogenic';
    const mealType = 'Breakfast Type';
    const mealCalories = { calories: 500 };
    const cuisine = ['Italian'];

    const result = await fetchMealsForMealType(ingredients, diet, mealType, mealCalories, cuisine);

    expect(result).toEqual([
      { id: 1, listOfIngredients: ['Chicken', 'Tomatoes', 'Quinoa'] },
      { id: 2, listOfIngredients: ['Salmon', 'Broccoli', 'Rice'] }
    ]);
  });

  
});
test('fetches meals successfully with different ingredients, diet, cuisine, and meal type', async () => {
    // Mock data/ingredients for meals
    const mockMeals = [
        { id: 1, nutrition: { ingredients: ['Salmon', 'Broccoli', 'Rice'] } },
        { id: 2, nutrition: { ingredients: ['Chicken', 'Tomatoes', 'Quinoa'] } }
    ];

    
    mock.onGet(PROCESS.ENV.API_KEY_SPOONACULAR).reply(200, { results: mockMeals });

    // Test case 1
    let ingredients1 = ['Salmon', 'Broccoli', 'Rice'];
    let diet1 = 'Ketogenic';
    let mealType1 = 'Breakfast Type';
    let mealCalories1 = { calories: 500 };
    let cuisine1 = ['Italian'];
    let result1 = await fetchMealsForMealType(ingredients1, diet1, mealType1, mealCalories1, cuisine1);

    expect(result1).toEqual([
        { id: 1, listOfIngredients: ['Salmon', 'Broccoli', 'Rice'] },
        { id: 2, listOfIngredients: ['Chicken', 'Tomatoes', 'Quinoa'] }
    ]);

    // Test case 2
    let ingredients2 = ['Chicken', 'Salad', 'Tomatoes'];
    let diet2 = 'Vegetarian';
    let mealType2 = 'Lunch Type';
    let mealCalories2 = { calories: 400 };
    let cuisine2 = ['Mediterranean'];
    let result2 = await fetchMealsForMealType(ingredients2, diet2, mealType2, mealCalories2, cuisine2);

    expect(result2).toEqual([
        { id: 1, listOfIngredients: ['Salmon', 'Broccoli', 'Rice'] },
        { id: 2, listOfIngredients: ['Chicken', 'Tomatoes', 'Quinoa'] }
    ]);

    // Test case 3
    let ingredients3 = ['Tomatoes', 'Cucumber', 'Quinoa'];
    let diet3 = 'Vegan';
    let mealType3 = 'Dinner Type';
    let mealCalories3 = { calories: 600 };
    let cuisine3 = ['Asian'];
    let result3 = await fetchMealsForMealType(ingredients3, diet3, mealType3, mealCalories3, cuisine3);

    expect(result3).toEqual([
        { id: 1, listOfIngredients: ['Salmon', 'Broccoli', 'Rice'] },
        { id: 2, listOfIngredients: ['Chicken', 'Tomatoes', 'Quinoa'] }
    ]);


   
});
 test('handles no results returned from API', async () => {
   
    mock.onGet(PROCESS.ENV.API_KEY_SPOONACULAR).reply(200, { results: [] });

    const ingredients = ['Eggs', 'Oats', 'Low-fat yogurt'];
    const diet = 'Vegetarian';
    const mealType = 'Breakfast Type';
    const mealCalories = { calories: 500 };
    const cuisine = ['Mediterranean'];

    
    const result = await fetchMealsForMealType(ingredients, diet, mealType, mealCalories, cuisine);

    expect(result).toEqual(null);
});

test('handle when API error', async () => {
    
    mock.onGet(PROCESS.ENV.API_KEY_SPOONACULAR).reply(500);

 
    const ingredients = ['Chicken', 'Salad', 'Tomatoes'];
    const diet = 'Ketogenic';
    const mealType = 'Lunch Type';
    const mealCalories = { calories: 425 };
    const cuisine = ['Asian'];

    const result = await fetchMealsForMealType(ingredients, diet, mealType, mealCalories, cuisine);
    expect(result).toEqual([]);
});
