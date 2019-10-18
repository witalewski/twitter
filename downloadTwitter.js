/* eslint-disable no-console */
(() => {
  const AUTHOR_AND_ID_REGEX = /https:\/\/twitter.com\/(\w+)\/status\/(\d+)/;
  const PEOPLE_REGEX = /https:\/\/twitter.com\/(\w+)/;
  // const HASHTAG_REGEX = /https:\/\/twitter.com\/hashtag\/(.*)+\?src=hashtag_click/;
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

  // Create our shared stylesheet:
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(`
    img, video, [style^=background-image] {
      display: none;
    }
  `);

  // Apply the stylesheet to a document:
  document.adoptedStyleSheets = [sheet];

  const formatResults = (data) => [
    Object.keys(data[0]).join(SEPARATOR),
    ...data.map((el) => Object.values(el)
      .map((value) => JSON.stringify(value))
      .join(SEPARATOR)),
  ].join('\n');

  const printPosts = () => {
    console.groupCollapsed(
      `${posts.length} results, oldest from ${posts[posts.length - 1].dateTime}`,
    );
    console.log(formatResults(posts));
    console.groupEnd();
  };

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
    // const contentLinks = findHrefs(contentDiv);
    return {
      content: contentDiv.innerText,
      // mentions: extractFlat(contentLinks, PEOPLE_REGEX),
      // hashtags: extractFlat(contentLinks, HASHTAG_REGEX),
      // otherLinks: contentLinks.filter(
      //   (el) => !PEOPLE_REGEX.test(el) && !HASHTAG_REGEX.test(el),
      // ),
    };
  };

  const parsePost = (post) => {
    const hrefs = findHrefs(post);
    const autoDivs = Array.from(post.querySelectorAll(AUTO_DIR_SELECTOR));
    let [, , , contentDiv] = autoDivs;
    let isReply = false;
    if (contentDiv.innerText.match(REPLY_REGEX)) {
      // eslint-disable-next-line prefer-destructuring
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
      ...parseContent(contentDiv),
      people: extractFlat(hrefs, PEOPLE_REGEX),
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

  const scrollToBottom = () => window.scrollTo(0, document.body.scrollHeight);
  const randomScroll = () => {
    window.scrollTo(
      0,
      Math.floor(
        document.body.scrollHeight
          - Math.random() * 1240,
      ),
    );
  };

  const update = () => {
    const wasLoading = isLoading;
    isLoading = document.querySelectorAll(PROGRESS_INDICATOR_SELECTOR).length > 0;

    if (!isLoading) {
      scrollToBottom();
      if (wasLoading) {
        addArticles();
      }
    }
  };

  setInterval(update, 921);
  setInterval(() => {
    randomScroll();
    setTimeout(randomScroll, 300 + Math.round(Math.random() * 200));
  }, 2439);
})();
