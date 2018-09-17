describe('Login', () => {
  it('Login as a seed user works', () => {
    cy.visit('https://localhost:8081');

    cy.location().should(loc => {
      expect(loc.pathname).to.eq('/login');
    });

    cy.get('form').find('input[type="text"]').type('seed_user');
    cy.get('form').find('input[type="password"]').type('password{enter}');

  });
});
