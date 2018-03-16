/**
 * Replaces the contents of a node matching the selector with the given markup.
 *
 * 🚨 DANGER: This function is impure! 🚨
 *
 * @param  {String} selector  query selector for the target DOM node
 * @param  {String} markup    HTML markup to be inserted into the target node
 * @return {void}
 */
const addMarkupToDOM = R.curry((selector, markup) => {
  document.querySelector(selector).innerHTML = markup;
});

const addToPhotoContainer = addMarkupToDOM('.photos');

/**
 * Retrieves an API key from the URL query string.
 *
 * 🚨 DANGER: This function is impure! 🚨
 *
 * @param  {String} search  search term to be passed through
 * @return {Object}         unmodified search term and retrieved API key
 */
const getKeyFromURL = search => {
  const key = new URL(window.location).searchParams.get('key');

  if (!key) {
    // If we didn’t find a key, log a helpful error, then die.
    addToPhotoContainer(`
      <p class="photos__error">
        A key is required in the URL (e.g. ?key=MY_API_KEY). Get an API key
        from <a href="https://pixabay.com/api/docs/">Pixabay</a>.
      </p>
    `);
    throw new Error('Missing API key');
  }

  return { search, key };
};

/**
 * Generates a URL to call the Pixabay API.
 *
 * @see https://pixabay.com/api/docs/
 *
 * @param  {String} search  search term to use on Pixabay
 * @param  {String} key     API key for the Pixabay API
 * @return {String}         full URL to query the Pixabay API
 */
const getSearchURL = ({ search, key }) => {
  const url = new URL('https://pixabay.com/api/');

  url.searchParams.set('key', key);
  url.searchParams.set('q', search);

  // These settings make sure we only get high quality photos.
  url.searchParams.set('image_type', 'photo');
  url.searchParams.set('editors_choice', 'true');

  return url;
};

/**
 * Converts a full Pixabay image object into a simplified object.
 * @param  {Object} image   image object to simplify
 * @return {Object}         image object with only required props
 */
const simplifyImageObject = R.applySpec({
  src: R.prop('webformatURL'),
  alt: R.prop('tags'),
  link: R.prop('pageURL')
});

/**
 * Replaces the size string in the image object to use a smaller size.
 * @param  {Object} image   image object to transform
 * @return {Object}         image object with smaller image size
 */
const transformImageSize = R.evolve({
  src: R.replace('_640', '_340'),
  alt: R.identity,
  link: R.identity
});

/**
 * Applies data transformations to an array of image objects.
 * @param  {Array} images   array of image objects to be transformed
 * @return {Array}          array of transformed image objects
 */
const getImageDetails = R.compose(transformImageSize, simplifyImageObject);

const getImagesArray = R.compose(R.map(getImageDetails), R.prop('hits'));

const convertToMarkup = ({ src, alt, link }) => `
  <a href="${link}" class="photos__link">
    <img src="${src}" alt="${alt}" class="photos__image" />
  </a>
`;

const getImageMarkup = R.compose(R.join(''), R.map(convertToMarkup));

const logAndReturn = R.tap(data => console.log(data));

const fetchResults = url =>
  fetch(url)
    .then(body => body.json())
    .then(logAndReturn)
    .then(getImagesArray)
    .then(logAndReturn)
    .then(getImageMarkup)
    .then(logAndReturn)
    .then(addToPhotoContainer);

export default R.compose(
  fetchResults,
  logAndReturn,
  getSearchURL,
  logAndReturn,
  getKeyFromURL
);
