const {matrix} = require(
    '../../routes/profileSettings'
)

describe('matrix function', () => {
    test('should create correct matrix based on recipes and ingredients', () => {
        const myRecipes = [
            { listOfIngredients: ['Eggs', 'Milk', 'Flour'] },
            { listOfIngredients: ['Oats', 'Honey', 'Bananas'] },
            { listOfIngredients: ['Chicken', 'Salad', 'Tomatoes'] }
        ];
        const clearedIngredients = ['Eggs', 'Milk', 'Flour', 'Oats', 'Honey', 'Bananas', 'Chicken', 'Salad', 'Tomatoes'];

        expect(matrix(myRecipes, clearedIngredients)).toEqual([
            [1, 1, 1, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 1, 1, 1, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 1, 1, 1]
        ]);
    });

    test('should create a 0 matrix if no ingredients match', () => {
        const myRecipes = [
            { listOfIngredients: ['Eggs', 'Milk', 'Flour'] },
            { listOfIngredients: ['Oats', 'Honey', 'Bananas'] }
        ];
        const clearedIngredients = ['Chicken', 'Salad', 'Tomatoes'];

        expect(matrix(myRecipes, clearedIngredients)).toEqual([
            [0, 0, 0],
            [0, 0, 0]
        ]);
    });

    test('should create an empty matrix for empty recipe list', () => {
        const myRecipes = [];
        const clearedIngredients = ['Eggs', 'Milk', 'Flour'];

        expect(matrix(myRecipes, clearedIngredients)).toEqual([]);
    });

    test('should create an empty matrix for empty ingredient list', () => {
        const myRecipes = [
            { listOfIngredients: ['Eggs', 'Milk', 'Flour'] },
            { listOfIngredients: ['Oats', 'Honey', 'Bananas'] }
        ];
        const clearedIngredients = [];

        expect(matrix(myRecipes, clearedIngredients)).toEqual([[], []]);
    });



    test('cuisines test', () => {
        const myRecipes = [
            { listOfIngredients: ['Tomato Sauce', 'Pasta', 'Parmesan Cheese'] },
            { listOfIngredients: ['Rice', 'Fish', 'Soy'] }
        ];
        const clearedIngredients = ['Tomato Sauce', 'Pasta', 'Parmesan Cheese', 'Rice', 'Fish', 'Soy'];

        expect(matrix(myRecipes, clearedIngredients)).toEqual([
            [1, 1, 1, 0, 0, 0],
            [0, 0, 0, 1, 1, 1]
        ]);
    });
});