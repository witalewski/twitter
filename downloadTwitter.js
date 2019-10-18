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
    let newArticles = Array.from(articles)
      .map(parseArticle)
      .filter((el) => el.content !== SPONSORED);
    if (window.articles.length) {
      const lastId = window.articles[window.articles.length - 1].id;
      const indexOfLastId = newArticles.findIndex((el) => el.id === lastId);
      if (indexOfLastId > 0) {
        newArticles = newArticles.slice(indexOfLastId + 1);
      }
    }
    if (newArticles.length) {
      window.articles = [...window.articles, ...newArticles];
      console.log(window.articles);
      window.scrollTo(0, document.body.scrollHeight);
    }
  };

  window.articles = [];
  window.lastLoaded = Date.now();
  window.spyingOnScrollLoad = true;
  setInterval(() => {
    const isLoading = document.querySelectorAll(PROGRESS_INDICATOR_SELECTOR).length > 0;
    if (!isLoading) {
      addArticles();
    }
  }, 2321);
  setInterval(() => {
    window.scrollTo(0, Math.floor(Math.random() * document.body.scrollHeight));
    setTimeout(() => {
      window.scrollTo(
        0,
        Math.floor(
          document.body.scrollHeight / 2
            + (Math.random() * document.body.scrollHeight) / 2,
        ),
      );
    }, 300 + Math.round(Math.random() * 200));
  }, 1991);
})();
