Cypress.Commands.add('login', () => {
	cy.visit('/auth/login');
	cy.get('input[name="email"]').type('CYPRESSTESTUSER@example.com');
	cy.get('input[name="password"]').type('SECRETPASSWORD123');
	cy.get('form').submit();
	cy.url().should('eq', Cypress.config().baseUrl + '/');
});

Cypress.Commands.add('navigateToPersonalInformation', () => {
	cy.login();
	cy.contains('Settings').click();
	cy.contains('Personal Information').click();
	cy.url().should('include', '/profileSettings/personalInformation');
});

Cypress.Commands.add('navigateToMealPreferences', () => {
	cy.navigateToPersonalInformation();
	cy.get('form').submit();
	cy.url().should('include', '/profileSettings/mealPreferences');
});

Cypress.Commands.add('navigateToCommunityPosts', () => {
	cy.login();
	cy.contains('Community Posts').click();
	cy.url().should('include', '/posts');
});

Cypress.Commands.add('navigateToCreatePost', () => {
	cy.navigateToCommunityPosts();
	cy.contains('Create Post').click();
	cy.url().should('include', '/posts/new');
});
