export const getUser = state => state.user;

// ⚠️ TODO change
function user(
  state = { name: 'david', id: '1' },
  action
) {
  switch (action.type) {
    default:
      return state;
  }
}

export default user;
