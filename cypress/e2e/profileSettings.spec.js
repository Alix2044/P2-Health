describe('User Profile and Community Posts Flow', () => {
	it('Logs in, fills personal information, meal preferences, and creates a post without an image', () => {
		// Step 1: Log in
		cy.visit('/auth/login');
		cy.get('input[name="email"]').type('testuser@example.com');
		cy.get('input[name="password"]').type('password123');
		cy.get('form').submit();

		// Verify redirection to personal information
		cy.url().should('include', '/profileSettings/personalInformation');

		// Step 2: Fill out Personal Information
		cy.get('#height').select('5\'8"');
		cy.get('#gender').select('Male');
		cy.get('#weight').clear().type('180');
		cy.get('#age').clear().type('30');
		cy.get('#activity-level').select('Moderately (description)');
		cy.get('form').submit();

		// Verify redirection to meal preferences
		cy.url().should('include', '/profileSettings/mealPreferences');

		// Step 3: Fill out Meal Preferences
		// Assume some checkboxes and selects are here
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

		// Verify redirection to dashboard
		cy.url().should('eq', `${Cypress.config().baseUrl}/`);

		// Step 4: Scroll down to the bottom of the dashboard
		cy.scrollTo('bottom');

		// Step 5: Click on 'Community Posts'
		cy.get('a.nav-link[href="/posts"]').click();
		cy.url().should('include', '/posts');

		// Step 6: Scroll down to see community posts
		cy.scrollTo('bottom');

		// Step 7: Click on 'Create Post'
		cy.get('a.nav-link[href="/posts/new"]').click();
		cy.url().should('include', '/posts/new');

		// Step 8: Fill out the post form without an image
		cy.get('input[name="title"]').type('My Test Post');
		cy.get('textarea[name="content"]').type('This is the content of my test post.');
		cy.get('form').submit();

		// Verify post creation and redirection (assuming it redirects to /posts after creation)
		cy.url().should('include', '/posts');
	});
});
