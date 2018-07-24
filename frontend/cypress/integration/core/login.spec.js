describe('Login', () => {
  it('Login as a seed user works', () => {
    cy.visit('https://cors.stagingpatagonia.elasticsuite.com:3000/');

    cy.get('#elasticScramble_splash_login_username', {timeout: 10000})
      .type('lyle.rep')
      .should('have.value', 'lyle.rep');

    cy.get('#elasticScramble_splash_login_password').type('psweetelastic');

    cy.get('.submit > .dijit > .dijitButtonNode').click();

    cy.contains('Start Working', { timeout: 20000 }).should('be.visible');
  });
});
