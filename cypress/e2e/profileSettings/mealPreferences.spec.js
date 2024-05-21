describe('Meal Preferences', () => {
	it('should navigate to meal preferences page after filling personal information', () => {
		cy.navigateToMealPreferences();
	});

	it('should fill out meal preferences form', () => {
		cy.navigateToMealPreferences();
		cy.get('input[name="diets[]"]').check([ 'Vegan', 'Keto' ]);
		cy.get('input[name="intolerance[]"]').check([ 'Lactose', 'Gluten' ]);
		cy.get('input[name="cuisines[]"]').check([ 'Italian', 'Japanese' ]);
		cy.get('input[name="breakfastIngredients[]"]').check([ 'Oats', 'Bananas' ]);
		cy.get('input[name="lunchIngredients[]"]').check([ 'Chicken', 'Broccoli' ]);
		cy.get('input[name="dinnerIngredients[]"]').check([ 'Salmon', 'Quinoa' ]);
		cy.get('select[name="breakfastType"]').select('Normal');
		cy.get('select[name="lunchType"]').select('Heavy');
		cy.get('select[name="dinnerType"]').select('Light');
		cy.get('form').submit();
		cy.url().should('eq', Cypress.config().baseUrl + '/');
	});
});
