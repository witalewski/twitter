const formatRestults = (data) => [
  'id;author;content;people;hashtags',
  ...data.map((el) => `${el.id};${el.author};"${el.content.replace(/"/g, '"')};${el.people.join(
    ',',
  )};${el.hashtags.join(',')}`.replace(/\n/g, ' ')),
].join('\n');
