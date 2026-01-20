export const extractTags = (text) => {
  const regex = /#(\w+)/g;
  const matches = text.match(regex);
  return matches ? matches.map(m => m.slice(1)) : [];
};
