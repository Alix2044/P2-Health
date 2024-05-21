describe('View Community Posts', () => {
	it('should navigate to community posts page', () => {
		cy.navigateToCommunityPosts();
	});

	it('should scroll down to view community posts', () => {
		cy.navigateToCommunityPosts();
		cy.scrollTo('bottom');
	});
});
