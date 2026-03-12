/**
 * Default 7 appreciation categories. Users can write in each and add custom sections.
 */
export const GRATITUDE_DEFAULT_SECTIONS: { key: string; label: string }[] = [
  { key: 'life', label: 'Life' },
  { key: 'health', label: 'Health' },
  { key: 'family-friends', label: 'Family & Friends' },
  { key: 'love-happiness-joy', label: 'Love Happiness & Joy' },
  { key: 'shelter', label: 'Shelter' },
  { key: 'food-drinks', label: 'Food & Drinks' },
  { key: 'cherish', label: 'Cherish' },
];

export function getGratitudeSectionLabel(key: string): string {
  const found = GRATITUDE_DEFAULT_SECTIONS.find((s) => s.key === key);
  return found ? found.label : key;
}
