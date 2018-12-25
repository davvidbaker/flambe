import { colors } from '../styles';

export function categoryColor(categories, activity) {
  const category = categories.find(({ id }) => activity.categories[0]) || {
    color_background: colors.flames.main,
    color_text: '#000',
  };

  return {
    background: category.color_background,
    text: category.color_text,
  };
}

/* 🤔 should I care about checking that the activity is complete here? */
function endedWithResolution(activity) {
  return activity.ending === 'V';
}

export function statusEmoji(activity) {
  console.log(`🔥  activity`, activity);
  switch (activity.status) {
    case 'active':
      return '🔥';

    case 'complete':
      return endedWithResolution(activity) ? '✅' : '❌';

    // suspended IS limbo, right? so upside down makes sense?
    case 'suspended':
      return '🙃';

    default:
      return '';
  }
}
