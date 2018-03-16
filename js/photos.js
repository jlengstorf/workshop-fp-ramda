const API_URL = 'https://pixabay.com/api/';

const getURL = (search, key) => {
  const url = new URL(API_URL);

  url.searchParams.set('key', key);
  url.searchParams.set('image_type', 'photo');
  url.searchParams.set('editors_choice', 'true');
  url.searchParams.set('q', search);

  return url;
};

const getImageDetails = R.pipe(
  R.prop('hits'),
  R.map(
    R.applySpec({
      src: R.prop('webformatURL'),
      alt: R.prop('tags'),
      link: R.prop('pageURL')
    })
  ),
  R.map(
    R.evolve({
      src: R.replace('_640', '_340'),
      alt: R.identity,
      link: R.identity
    })
  )
);

const convertToMarkup = ({ src, alt, link }) =>
  `<a href="${link}" class="list__link"><img src="${src}" alt="${alt}" class="list__image" /></a>`;

const getMarkup = R.compose(R.join(''), R.map(convertToMarkup));

const addToDOM = markup => {
  document.querySelector('.list').innerHTML = markup;
};

const fetchResults = url =>
  fetch(url)
    .then(body => body.json())
    .then(getImageDetails)
    .then(getMarkup)
    .then(addToDOM);

export default R.compose(fetchResults, getURL);
