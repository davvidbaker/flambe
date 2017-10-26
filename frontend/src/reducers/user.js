export const getUser = state => state.user;

// ⚠️ TODO change
function user(
  state = { name: 'David', id: 'cj75obgc8kecq0120mb7l3bej' },
  action
) {
  switch (action.type) {
    default:
      return state;
  }
}

export default user;
