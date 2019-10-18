(() => {
  const AUTHOR_AND_ID_REGEX = /https:\/\/twitter.com\/(\w+)\/status\/(\d+)/;
  const PEOPLE_REGEX = /https:\/\/twitter.com\/(\w+)/;
  const HASHTAG_REGEX = /https:\/\/twitter.com\/hashtag\/(.*)+\?src=hashtag_click/;
  const REPLY_REGEX = /W odpowiedzi do/;
  const SPONSORED = 'Promowane';
  const AUTO_DIR_SELECTOR = 'div[dir="auto"]';
  const PROGRESS_INDICATOR_SELECTOR = '[role="progressbar"]';
  const A_SELECTOR = 'a';
  const ARTICLE_SELECTOR = 'article';
  const SEPARATOR = ';';

  const formatResults = (data) => [
    Object.keys(data[0]).join(SEPARATOR),
    ...data.map((el) => Object.values(el)
      .map((value) => JSON.stringify(value))
      .join(SEPARATOR)),
  ].join('\n');

  const countDuplicates = (data) => data && data.length - Array.from(new Set(data.map((el) => el.id))).length;

  const findHrefs = (el) => Array.from(el.getElementsByTagName(A_SELECTOR)).map((a) => a.href);

  const removeDuplicates = (arr) => Array.from(new Set(arr));

  const extractFieldsWithRegex = (hrefs, regex) => hrefs.filter((el) => el.match(regex)).map((el) => el.match(regex).slice(1));

  const extractFlat = (contentLinks, regex) => removeDuplicates(
    extractFieldsWithRegex(contentLinks, regex).flatMap((match) => decodeURIComponent(match[0])),
  );

  const extractAuthorAndIdFromHrefs = (hrefs) => extractFieldsWithRegex(hrefs, AUTHOR_AND_ID_REGEX).map((match) => ({
    author: match[0],
    id: match[1],
  }))[0];

  const parseContent = (contentDiv) => {
    if (!contentDiv) {
      return {};
    }
    const contentLinks = findHrefs(contentDiv);
    return {
      content: contentDiv.innerText,
      hashtags: extractFlat(contentLinks, HASHTAG_REGEX),
      mentions: extractFlat(contentLinks, PEOPLE_REGEX),
      otherLinks: contentLinks.filter(
        (el) => !PEOPLE_REGEX.test(el) && !HASHTAG_REGEX.test(el),
      ),
    };
  };

  const parseArticle = (article) => {
    const hrefs = findHrefs(article);
    const autoDivs = Array.from(article.querySelectorAll(AUTO_DIR_SELECTOR));
    let contentDiv = autoDivs[3];
    if (contentDiv.innerText.match(REPLY_REGEX)) {
      // eslint-disable-next-line prefer-destructuring
      contentDiv = autoDivs[4];
    }

    return {
      ...extractAuthorAndIdFromHrefs(hrefs),
      ...parseContent(contentDiv),
      people: extractFlat(hrefs, PEOPLE_REGEX),
    };
  };

  const addArticles = () => {
    window.lastLoaded = Date.now();
    const articles = document.getElementsByTagName(ARTICLE_SELECTOR);
    const newArticles = Array.from(articles)
      .map(parseArticle)
      .filter((el) => el.content !== SPONSORED)
      .filter((el) => !window.articleIds.includes(el.id));
    if (newArticles.length) {
      window.articles = [...window.articles, ...newArticles];
      window.articleIds = [
        ...window.articleIds,
        ...newArticles.map((el) => el.id),
      ];
      console.groupCollapsed(
        `${window.articles.length} results (${countDuplicates(
          window.articles,
        )} duplicates)`,
      );
      console.log(formatResults(window.articles));
      console.groupEnd();
      window.scrollTo(0, document.body.scrollHeight);
    }
  };

  window.articles = [];
  window.articleIds = [];
  window.lastLoaded = Date.now();
  window.spyingOnScrollLoad = true;
  setInterval(() => {
    const isLoading = document.querySelectorAll(PROGRESS_INDICATOR_SELECTOR).length > 0;
    if (!isLoading) {
      addArticles();
    }
  }, 1821);
  setInterval(() => {
    window.scrollTo(
      0,
      Math.floor(
        document.body.scrollHeight
          - Math.random() * document.body.scrollHeight * 0.25,
      ),
    );
    setTimeout(() => {
      window.scrollTo(
        0,
        Math.floor(
          document.body.scrollHeight
            - Math.random() * document.body.scrollHeight * 0.25,
        ),
      );
    }, 300 + Math.round(Math.random() * 200));
  }, 1439);
})();
