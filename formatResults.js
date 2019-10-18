const formatResults = (data) => [
  'id;author;content;people;hashtags',
  ...data.sort((a, b) => b.id - a.id).map((el) => `${el.id};${el.author};"${el.content.replace(/"/g, '"')};${el.people.join(
    ',',
  )};${el.hashtags.join(',')}`.replace(/\n/g, ' ')),
].join('\n');
