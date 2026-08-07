const collapseStorageKey = 'flambe.thread-collapse-state.v1';

describe('Restored trace smoke flow', () => {
  const email = Cypress.env('email') || 'e2e@flambe.local';
  const password = Cypress.env('password') || 'e2e-password';

  it('logs in, renders a trace, and keeps a thread collapse after refresh', () => {
    cy.intercept('GET', '**/api/traces/*').as('loadTrace');
    cy.visit('/login');
    cy.clearLocalStorage(collapseStorageKey);
    cy.get('#login-email').type(email);
    cy.get('#login-password').type(password);
    cy.get('form').submit();

    cy.location('pathname').should('match', /^\/[^/]+\/traces\/\d+$/);
    cy.get('#chart-wrapper canvas').should('be.visible');
    cy.get('#chart-wrapper canvas').should($canvas => {
      const canvas = $canvas[0];
      const window = canvas.ownerDocument.defaultView;
      const bounds = canvas.getBoundingClientRect();

      // The canvas bitmap is scaled for high-DPI rendering, but its CSS size
      // must remain the measured viewport size. A mismatch makes the chart
      // appear dramatically zoomed in.
      expect(canvas.width / window.devicePixelRatio).to.be.closeTo(
        bounds.width,
        1,
      );
      expect(canvas.height / window.devicePixelRatio).to.be.closeTo(
        bounds.height,
        1,
      );
    });

    cy.location('pathname').then(pathname => {
      const traceId = pathname.split('/').pop();

      cy.wait('@loadTrace').then(({ response }) => {
        const [firstThread] = [...response.body.data.threads]
          .sort((left, right) => left.rank - right.rank);
        const threadId = String(firstThread.id);
        expect(threadId).to.exist;

        cy.window().should(window => {
          const allTraceState = JSON.parse(
            window.localStorage.getItem(collapseStorageKey) || '{}',
          );

          expect(allTraceState[traceId]).to.have.property(threadId, false);
        });

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

        cy.get('button[aria-label="Toggle thread filter"]').click();
        cy.get('input[aria-label="Filter threads"]')
          .should('be.visible')
          .type('Browser')
          .should('have.value', 'Browser');

        cy.get('[aria-label="Resize horizontal panes"]').then($handle => {
          const { top } = $handle[0].getBoundingClientRect();

          cy.wrap($handle).trigger('mousedown', {
            button: 0,
            clientY: top + 3,
            force: true,
          });
          cy.window().then(window => {
            window.dispatchEvent(new window.MouseEvent('mousemove', {
              clientY: top + 80,
              bubbles: true,
            }));
            window.dispatchEvent(new window.MouseEvent('mouseup', { bubbles: true }));
          });
        });
        cy.get('[aria-label="Resize horizontal panes"]')
          .should('not.have.attr', 'aria-valuenow', '100');

        cy.get('body').trigger('keydown', {
          key: 'p',
          ctrlKey: true,
          shiftKey: true,
        });
        cy.get('[role="dialog"] input')
          .should('be.visible')
          .type('zoom')
          .should('have.value', 'zoom');
        cy.get('[role="dialog"] [role="option"]')
          .should('have.length.at.least', 1);
      });
    });
  });

  it('returns an unauthenticated trace request to the login route', () => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.visit('/flambe_e2e/traces/2');

    cy.location('pathname').should('eq', '/login');
  });
});
