const collapseStorageKey = 'flambe.thread-collapse-state.v1';

describe('Restored trace smoke flow', () => {
  const email = Cypress.env('email') || 'e2e@flambe.local';
  const password = Cypress.env('password') || 'e2e-password';

  it('logs in, renders a trace, and keeps a thread collapse after refresh', () => {
    cy.intercept('GET', '**/api/traces/*').as('loadTrace');
    cy.visit('/login');
    cy.get('#login-email').type(email);
    cy.get('#login-password').type(password);
    cy.get('form').submit();

    cy.location('pathname').should('match', /^\/[^/]+\/traces\/\d+$/);
    cy.get('#chart-wrapper canvas').should('be.visible');

    cy.location('pathname').then(pathname => {
      const traceId = pathname.split('/').pop();

      cy.wait('@loadTrace').then(({ response }) => {
        const [firstThread] = [...response.body.data.threads]
          .sort((left, right) => left.rank - right.rank);
        const threadId = String(firstThread.id);
        expect(threadId).to.exist;

        // The first ranked thread is drawn at the canvas top; x=100 avoids
        // the detail-menu ellipsis on the right side of its header.
        cy.get('#chart-wrapper canvas').click(100, 10);

        cy.window().should(window => {
          const allTraceState = JSON.parse(
            window.localStorage.getItem(collapseStorageKey) || '{}',
          );

          expect(allTraceState[traceId]).to.have.property(threadId, true);
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
});
