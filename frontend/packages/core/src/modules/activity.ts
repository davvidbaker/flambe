import { colors } from '../styles';
import type { Activity } from '../types/Activity';
import type { Category } from '../types/Category';

interface LegacyActivity extends Activity {
  ending?: string;
}

export function categoryColor(categories: Category[], activity: Activity): { background: string; text: string } {
  const categoryId = activity.categories[0];
  const category = categories.find(({ id }) => String(id) === String(categoryId)) || {
    color_background: colors.flames.main,
    color_text: '#000',
  };

  return {
    background: category.color_background,
    text: category.color_text,
  };
}

/* 🤔 should I care about checking that the activity is complete here? */
function endedWithResolution(activity: LegacyActivity): boolean {
  return activity.ending === 'V';
}

export function statusEmoji(activity: LegacyActivity): string {
  switch (activity.status) {
    case 'active':
      return '🔥';

    case 'complete':
      return endedWithResolution(activity) ? '✅' : '❌';

    // suspended IS limbo, right? so upside down makes sense?
    case 'parent_suspended':
    case 'suspended':
      return '🙃';

    default:
      return '';
  }
}
