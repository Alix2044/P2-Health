describe('Personal Information', () => {
	it('should navigate to personal information page after login', () => {
		cy.navigateToPersonalInformation();
	});

	it('should fill out personal information form', () => {
		cy.navigateToPersonalInformation();
		cy.get('#height').select('5\'8"');
		cy.get('#gender').select('Male');
		cy.get('#weight').clear().type('180');
		cy.get('#age').clear().type('30');
		cy.get('#activity-level').select('Moderately (description)');
		cy.get('form').submit();
		cy.url().should('include', '/profileSettings/mealPreferences');
	});
});
