export const extractTags = (text) => {
  const regex = /#(\w+)/g;
  const matches = text.match(regex);
  
  if (!matches) return [];

  // Map to remove '#' and then use Set to deduplicate
  const tags = matches.map(m => m.slice(1));
  return [...new Set(tags)];
};