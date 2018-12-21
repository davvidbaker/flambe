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
