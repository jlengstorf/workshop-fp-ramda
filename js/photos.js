// To cut down on file size, import only the functions we’ll actually use.
import applySpec from 'https://unpkg.com/ramda@0.25.0/es/applySpec.js';
import compose from 'https://unpkg.com/ramda@0.25.0/es/compose.js';
import curry from 'https://unpkg.com/ramda@0.25.0/es/curry.js';
import evolve from 'https://unpkg.com/ramda@0.25.0/es/evolve.js';
import identity from 'https://unpkg.com/ramda@0.25.0/es/identity.js';
import join from 'https://unpkg.com/ramda@0.25.0/es/join.js';
import map from 'https://unpkg.com/ramda@0.25.0/es/map.js';
import prop from 'https://unpkg.com/ramda@0.25.0/es/prop.js';
import replace from 'https://unpkg.com/ramda@0.25.0/es/replace.js';
import tap from 'https://unpkg.com/ramda@0.25.0/es/tap.js';

/**
 * Replaces the contents of a node matching the selector with the given markup.
 *
 * 🚨 DANGER: This function is impure! 🚨
 *
 * @see http://ramdajs.com/docs/#curry
 *
 * @param  {String} selector  query selector for the target DOM node
 * @param  {String} markup    HTML markup to be inserted into the target node
 * @return {void}
 */
const addMarkupToDOM = curry((selector, markup) => {
  document.querySelector(selector).innerHTML = markup;
});

/**
 * Create a helper function to insert markup into the photos container.
 * @param  {String} markup  HTML markup to be inserted into the `.photos` div
 * @return {void}
 */
const addToPhotoContainer = addMarkupToDOM('.photos');

/**
 * Retrieves an API key from the URL query string.
 *
 * 🚨 DANGER: This function is impure! 🚨
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/URL/searchParams
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
 * Generates a URL with the correct query parameters.
 *
 * @see https://pixabay.com/api/docs/
 * @see https://developer.mozilla.org/en-US/docs/Web/API/URL/searchParams
 *
 * @param  {String} search  search term to use on Pixabay
 * @param  {String} key     API key for the Pixabay API
 * @return {String}         full URL to query the Pixabay API
 */
const createURL = ({ search, key }) => {
  const url = new URL('https://pixabay.com/api/');

  url.searchParams.set('key', key);
  url.searchParams.set('q', search);

  // These settings make sure we only get high quality photos.
  url.searchParams.set('image_type', 'photo');
  url.searchParams.set('editors_choice', 'true');

  return url;
};

/**
 * Get the full API URL for searching the Pixabay API.
 *
 * @see http://ramdajs.com/docs/#compose
 *
 * @param  {String} search  the term to search for
 * @return {String}         API URL for searching Pixabay
 */
const getSearchURL = compose(createURL, getKeyFromURL);

/**
 * Converts a full Pixabay image object into a simplified object.
 *
 * @see http://ramdajs.com/docs/#applySpec
 * @see http://ramdajs.com/docs/#prop
 *
 * @param  {Object} image   image object to simplify
 * @return {Object}         image object with only required props
 */
const simplifyImageObject = applySpec({
  src: prop('webformatURL'),
  alt: prop('tags'),
  link: prop('pageURL')
});

/**
 * Replaces the size string in the image object to use a smaller size.
 *
 * @see http://ramdajs.com/docs/#evolve
 * @see http://ramdajs.com/docs/#identity
 * @see http://ramdajs.com/docs/#replace
 *
 * @param  {Object} image   image object to transform
 * @return {Object}         image object with smaller image size
 */
const transformImageSize = evolve({
  src: replace('_640', '_340'),
  alt: identity,
  link: identity
});

/**
 * Applies data transformations to an array of image objects.
 *
 * @see http://ramdajs.com/docs/#compose
 *
 * @param  {Array} images   array of image objects to be transformed
 * @return {Array}          array of transformed image objects
 */
const getImageDetails = compose(transformImageSize, simplifyImageObject);

/**
 * Converts the raw API response to an array of simplified image objects.
 *
 * @see http://ramdajs.com/docs/#compose
 * @see http://ramdajs.com/docs/#map
 * @see http://ramdajs.com/docs/#prop
 *
 * @param  {Object} response  response from the Pixabay API
 * @return {Array}            image objects
 */
const getImagesArray = compose(map(getImageDetails), prop('hits'));

/**
 * Creates markup to display a given image object.
 * @param  {Object} image       image details
 * @param  {String} image.src   path to the image file
 * @param  {String} image.alt   alt text for the image
 * @param  {String} image.link  link to the Pixabay image page
 * @return {String}             HTML markup to display the image
 */
const convertToMarkup = ({ src, alt, link }) => `
  <a href="${link}" class="photos__link">
    <img src="${src}" alt="${alt}" class="photos__image" />
  </a>
`;

/**
 * Get the markup to display all images.
 *
 * @see http://ramdajs.com/docs/#compose
 * @see http://ramdajs.com/docs/#join
 * @see http://ramdajs.com/docs/#map
 *
 * @param  {Array}  images  array of all images
 * @return {String}         markup to display all images
 */
const getImageMarkup = compose(join(''), map(convertToMarkup));

/**
 * Loads JSON data from a given URL.
 * @param  {String} url   URL to query
 * @return {Object}       response object
 */
async function fetchData(url) {
  const data = await fetch(url);
  const response = await data.json();

  return response;
}

/**
 * Logs the argument and returns it unchanged.
 *
 * This is a helper function that should only be used during development, or in
 * conjunction with a library like `debug` (https://www.npmjs.com/package/debug)
 * to avoid cluttering up the console in production applications.
 *
 * @see http://ramdajs.com/docs/#tap
 *
 * @param  {*} arg  any argument
 * @return {*}      returns the argument unchanged
 */
const logAndReturn = tap(console.log);

/**
 * Creates markup for a given Pixabay API response and inserts it into the DOM.
 *
 * @see http://ramdajs.com/docs/#compose
 *
 * @param  {Object} response  Pixabay API response
 * @return {void}
 */
const displayImages = compose(
  addToPhotoContainer,
  getImageMarkup,
  getImagesArray
);

/**
 * Loads photos for a given search term and displays the results as thumbnails.
 * @param  {String} search  term to search on Pixabay
 * @return {void}
 */
export default async search => {
  const url = getSearchURL(search);
  const images = await fetchData(url);

  displayImages(images);
};
