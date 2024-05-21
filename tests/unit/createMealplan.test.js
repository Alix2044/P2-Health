const axios = require('axios');
const User = require('../models/User');
const MealPlan = require('../models/Mealplan');
const { fetchMealsForMealType, findRecipeByIdBulk } = require('../../routes/profileSettings');

// Mocking dependencies
jest.mock('axios');
jest.mock('../models/Mealplan');
jest.mock('../routes/profileSetting', () => ({
	fetchMealsForMealType: jest.fn(),
	findRecipeByIdBulk: jest.fn()
}));

/* mockResolvedValue method is used on the functions to mock them */

describe('createMealplan Function', () => {
	let userId;
	let user;

	// Before each test use mock user data
	beforeEach(() => {
		userId = 'UserIdTEST';
		user = {
			calories: 2660,
			mealPreferences: {
				breakfast: 'normal',
				lunch: 'normal',
				dinner: 'normal'
			},
			breakfastIngredients: [ 'eggs', 'bacon' ],
			lunchIngredients: [ 'chicken', 'rice' ],
			dinnerIngredients: [ 'beef', 'potato', 'bacon' ],
			diets: [ 'Ketogenic', 'Vegetarian' ],
			cuisine: [ 'italian' ]
		};
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should create a meal plan for the user', async () => {
		// for no existing meal plan
		MealPlan.findOne.mockResolvedValue(null);

		// since there is no existing meal plan
		MealPlan.deleteOne.mockResolvedValue({});

		//  return some mock recipes
		fetchMealsForMealType.mockResolvedValue([
			{ id: 1, listOfIngredients: [ 'eggs', 'bacon', 'Tomato Sauce', 'Parmesan Cheese', 'Red Wine' ] },
			{ id: 2, listOfIngredients: [ 'eggs', 'rice', 'Broccoli', 'Fish', 'Lemons' ] }
		]);

		// return mock recipes data
		findRecipeByIdBulk.mockResolvedValue([
			{
				id: 655853,
				name: 'Pesto Zucchini "Spaghetti',
				image: 'https://img.spoonacular.com/recipes/655853-556x370.jpg',
				url: 'https://www.foodista.com/recipe/RGY8Z8V3/pesto-zucchini-spaghetti',
				nutrition: { calorie: 335.53, protein: 17.95, carb: 12.15, fat: 24.77 }
			},
			{
				id: 647555,
				name: 'Hotcakes',
				image: 'https://img.spoonacular.com/recipes/647555-556x370.jpg',
				url: 'https://www.foodista.com/recipe/8QJLKHTF/hotcakes',
				nutrition: { calorie: 383.66, protein: 9.36, carb: 53.05, fat: 14.52 }
			}
		]);

		MealPlan.prototype.save = jest.fn().mockResolvedValue({});

		await createMealplan(userId, user);

		expect(MealPlan.findOne).toHaveBeenCalledWith({
			userId: userId,
			startDate: expect.any(Date),
			startDate: { $lte: expect.any(Date), $gte: expect.any(Date) }
		});

		// Asserting fetchMealsForMealType called 3 times because of B,D & L
		expect(fetchMealsForMealType).toHaveBeenCalledTimes(3);
		expect(fetchMealsForMealType).toHaveBeenCalledWith(
			expect.any(Array),
			expect.any(Array),
			expect.any(String),
			expect.any(Object),
			expect.any(Array)
		);

		// Assertion for saving the new meal plan
		expect(MealPlan.prototype.save).toHaveBeenCalled();
	});
});
