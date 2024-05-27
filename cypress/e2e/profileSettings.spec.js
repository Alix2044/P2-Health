describe('E2E TEST - VITAL', () => {
    Cypress.on('uncaught:exception', (err) => {
        console.error(err);
        return false;
    });

    it('Logs in, fills personal information, meal preferences, and creates a post without an image and more...', () => {
    
        cy.visit('/');
        cy.register();
        cy.url().should('include', '/auth/login');
        cy.login();
        cy.url().should('include', '/profileSettings/personalInformation');

       
        cy.fillPersonalInformation();
        cy.url().should('include', '/profileSettings/mealPreferences');


        cy.fillMealPreferences();
        cy.url().should('include', `${Cypress.config().baseUrl}/`);

 
        cy.scrollBottom();
        cy.navigateTo('/mealplan/mealplan');
        cy.scrollBottom();
        cy.navigateTo('/challenges');
        cy.completeChallenge();

        
        cy.scrollBottom();
        cy.navigateTo('/posts');
        cy.scrollBottom();
        cy.navigateTo('/posts/new');
        cy.createPost();
        cy.url().should('include', '/posts');

       
        cy.Chat('HELLO EVERYONE!');
      
    
        cy.navigateTo('/dashboard');

  
        cy.get('a.nav-link[href="/auth/logout"]').click();
        cy.wait(1500);
        cy.url().should('include', '/');
        cy.scrollBottom();
    });
});
