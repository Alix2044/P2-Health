describe('Create Post', () => {
	it('should navigate to create post page', () => {
		cy.navigateToCreatePost();
	});

	it('should fill out create post form without an image', () => {
		cy.navigateToCreatePost();
		cy.get('input[name="title"]').type('Test Post');
		cy.get('textarea[name="content"]').type('This is the content of test post.');
		cy.get('form').submit();
		cy.url().should('include', '/posts');
	});
});
