const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const { fetchMealsForMealType } = require('../../routes/profileSettings');

const API_KEY = process.env.API_KEY_SPOONACULAR;

describe('fetchMealsForMealType', () => {
	let mock;

	beforeAll(() => {
		mock = new MockAdapter(axios);
	});

	afterEach(() => {
		mock.reset();
	});

	afterAll(() => {
		mock.restore();
	});

	it('should fetch meals based on provided parameters', async () => {
		const ingredients = [ 'chicken', 'rice' ];
		const diet = 'Ketogenic';
		const mealType = 'lunch';
		const mealCalories = { calories: 350 };
		const cuisine = 'italian';

		const mockResponse = {
			results: [
				{
					id: 1,
					nutrition: { ingredients: [ { name: 'chicken' }, { name: 'rice' } ] }
				},
				{
					id: 2,
					nutrition: { ingredients: [ { name: 'tomato' }, { name: 'pasta' } ] }
				}
			]
		};

		const expectedMeals = [
			{ id: 1, listOfIngredients: [ 'chicken', 'rice' ] },
			{ id: 2, listOfIngredients: [ 'tomato', 'pasta' ] }
		];

		mock.onGet('https://api.spoonacular.com/recipes/complexSearch?').reply(200, mockResponse);

		const result = await fetchMealsForMealType(ingredients, diet, mealType, mealCalories, cuisine);

		expect(result).toEqual(expectedMeals);
	});

	it('should return null when no meals are found from Spoonacular', async () => {
		const ingredients = [ 'chicken', 'rice' ];
		const diet = 'Ketogenic';
		const mealType = 'lunch';
		const mealCalories = { calories: 400 };
		const cuisine = 'italian';

		mock.onGet('https://api.spoonacular.com/recipes/complexSearch?').reply(200, { results: [] });

		const result = await fetchMealsForMealType(ingredients, diet, mealType, mealCalories, cuisine);

		expect(result).toBeNull();
	});

	it('should return an empty array if an error occurs', async () => {
		const ingredients = [ 'chicken', 'rice' ];
		const diet = 'vegetarian';
		const mealType = 'lunch';
		const mealCalories = { calories: 300 };
		const cuisine = 'italian';

		mock.onGet('https://api.spoonacular.com/recipes/complexSearch?').networkError();

		const result = await fetchMealsForMealType(ingredients, diet, mealType, mealCalories, cuisine);

		expect(result).toEqual([]);
	});
});
