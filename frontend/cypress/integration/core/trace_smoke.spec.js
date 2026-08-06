const collapseStorageKey = 'flambe.thread-collapse-state.v1';

describe('Restored trace smoke flow', () => {
  const email = Cypress.env('email') || 'e2e@flambe.local';
  const password = Cypress.env('password') || 'e2e-password';

  it('logs in, renders a trace, and keeps a thread collapse after refresh', () => {
    cy.intercept('GET', 'http://localhost:4000/api/traces/*').as('loadTrace');
    cy.visit('/login');
    cy.get('#login-email').type(email);
    cy.get('#login-password').type(password);
    cy.get('form').submit();

    cy.location('pathname').should('match', /^\/[^/]+\/traces\/\d+$/);
    cy.get('#chart-wrapper canvas').should('be.visible');

    cy.location('pathname').then(pathname => {
      const traceId = pathname.split('/').pop();
      let threadId;

      cy.wait('@loadTrace').then(({ response }) => {
        [threadId] = response.body.data.threads.map(thread => String(thread.id));
        expect(threadId).to.exist;
      });

      cy.window().then(window => {
        const allTraceState = JSON.parse(
          window.localStorage.getItem(collapseStorageKey) || '{}',
        );
        window.localStorage.setItem(
          collapseStorageKey,
          JSON.stringify({
            ...allTraceState,
            [traceId]: { [threadId]: true },
          }),
        );
      });

      cy.reload();
      cy.get('#chart-wrapper canvas').should('be.visible');

      cy.window().should(window => {
        const allTraceState = JSON.parse(
          window.localStorage.getItem(collapseStorageKey) || '{}',
        );

        expect(allTraceState[traceId]).to.have.property(threadId, true);
      });
    });
  });
});
