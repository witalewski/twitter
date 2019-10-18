/* eslint-disable no-console */
(() => {
  const AUTHOR_AND_ID_REGEX = /https:\/\/twitter.com\/(\w+)\/status\/(\d+)/;
  const PEOPLE_REGEX = /https:\/\/twitter.com\/(\w+)/;
  const REPLY_REGEX = /W odpowiedzi do/;
  const SPONSORED = 'Promowane';
  const AUTO_DIR_SELECTOR = 'div[dir="auto"]';
  const PROGRESS_INDICATOR_SELECTOR = '[role="progressbar"]';
  const A_SELECTOR = 'a';
  const ARTICLE_SELECTOR = 'article';
  const TIME_SELECTOR = 'time';
  const SEPARATOR = ';';

  const posts = [];
  const postIds = [];
  let isLoading = false;

  const getMark = () => Math.floor(Date.now() / 1000);
  const formatTime = (time) => `${Math.floor(time / 3600)}:${Math.floor((time % 3600) / 60)
    .toString()
    .padStart(2, 0)}:${(time % 60).toString().padStart(2, 0)}`;
  const markStart = getMark();

  const sheet = new CSSStyleSheet();
  sheet.replaceSync(`
    img, video, [style^=background-image] {
      display: none;
    }
  `);
  document.adoptedStyleSheets = [sheet];

  const formatResults = (data) => [
    Object.keys(data[0]).join(SEPARATOR),
    ...data.map((el) => Object.values(el)
      .map((value) => JSON.stringify(value))
      .join(SEPARATOR)),
  ].join('\n');

  const printPosts = () => {
    console.groupCollapsed(
      `${posts.length} results, oldest from ${
        posts[posts.length - 1].dateTime
      }, time elapsed: ${formatTime(getMark() - markStart)}`,
    );
    console.log(formatResults(posts));
    console.groupEnd();
  };

  const extractFieldsWithRegex = (hrefs, regex) => hrefs.filter((el) => el.match(regex)).map((el) => el.match(regex).slice(1));

  const extractAuthorAndIdFromHrefs = (hrefs) => extractFieldsWithRegex(hrefs, AUTHOR_AND_ID_REGEX).map((match) => ({
    author: match[0],
    id: match[1],
  }))[0];

  const parsePost = (post) => {
    const hrefs = Array.from(post.getElementsByTagName(A_SELECTOR)).map(
      (a) => a.href,
    );
    const autoDivs = Array.from(post.querySelectorAll(AUTO_DIR_SELECTOR));
    let [, , , contentDiv] = autoDivs;
    let isReply = false;
    if (contentDiv.innerText.match(REPLY_REGEX)) {
      [, , , , contentDiv] = autoDivs;
      isReply = true;
    }

    const timeNode = post.querySelector(TIME_SELECTOR);
    let dateTime;
    if (timeNode) {
      dateTime = timeNode.dateTime;
    }

    post.remove();

    return {
      dateTime,
      ...extractAuthorAndIdFromHrefs(hrefs),
      content: contentDiv ? contentDiv.innerText : '',
      people: Array.from(
        new Set(
          extractFieldsWithRegex(hrefs, PEOPLE_REGEX).flatMap((match) => decodeURIComponent(match[0])),
        ),
      ),
      isReply,
    };
  };

  const addArticles = () => {
    const articles = document.getElementsByTagName(ARTICLE_SELECTOR);
    const newPosts = Array.from(articles)
      .map(parsePost)
      .filter((el) => el.content !== SPONSORED)
      .filter((el) => !postIds.includes(el.id));
    if (newPosts.length) {
      posts.push(...newPosts);
      postIds.push(...newPosts.map((el) => el.id));
      printPosts();
    }
  };

  const randomScroll = () => {
    window.scrollTo(
      0,
      Math.floor(document.body.scrollHeight - Math.random() * 1240),
    );
  };

  setInterval(() => {
    const wasLoading = isLoading;
    isLoading = document.querySelectorAll(PROGRESS_INDICATOR_SELECTOR).length > 0;

    if (!isLoading) {
      window.scrollTo(0, document.body.scrollHeight);
      if (wasLoading) {
        addArticles();
      }
    }
  }, 321);

  setInterval(() => {
    randomScroll();
    setTimeout(randomScroll, 300 + Math.round(Math.random() * 200));
  }, 2439);
})();
