const SEPARATOR = ';';
const formatResults = (data) => [
  Object.keys(data[0]).join(SEPARATOR),
  ...data.map((el) => Object.values(el).map((value) => JSON.stringify(value)).join(SEPARATOR)),
].join('\n');

const countDuplicates = (data) => data.length - Array.from(new Set(data.map((el) => el.id))).length;
