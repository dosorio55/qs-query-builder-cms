const qs = require("qs");

const CONTENT_TYPE = "articles";
const BASE_URL = `http://localhost:1337/api/${CONTENT_TYPE}?`;

function decodeQueryString(queryString) {
  // Split the query string into individual key-value pairs
  const pairs = queryString.split("&");

  // Initialize an array to hold the decoded parameters
  const decodedPairs = [];

  // Iterate over each pair
  pairs.forEach((pair) => {
    // Split the pair into key and value
    const [key, value] = pair.split("=");

    // Decode the key and value
    const decodedKey = decodeURIComponent(key);
    const decodedValue = decodeURIComponent(value);

    // Reconstruct the key-value pair and push it to the array
    decodedPairs.push(`${decodedKey}=${decodedValue}`);
  });

  // Join all pairs back into a single query string
  return decodedPairs.join("&");
}

// const query_params_1 = qs.stringify({});

// const QUERY_1 = BASE_URL + query_params_1;

// const query_params_wildcard = qs.stringify({
//   populate: "*",
// });

// const QUERY_2 = BASE_URL + query_params_wildcard;

// const query_populate_array_notation = qs.stringify({
//   populate: ["dynamic_zone.item"],
// });

const populateOnlyItemObj = {
  populate: {
    dynamic_zone: {
      on: {
        ["components-page.page-gallery"]: {
          populate: { item: { fields: ["title"] } },
        },
      },
    },
  },
};

const populateItemAndMediaObj = {
  populate: {
    dynamic_zone: {
      on: {
        ["components-page.page-gallery"]: {
          populate: {
            item: {
              fields: ["title"],
              populate: { media: { fields: ["url", "alternativeText"] } },
              // pagination: {
              //   pageSize: 1,
              //   page: 1,
              // },
              start: 0,
              limit: 1,
            },
          },
        },
      },
    },
  },
};

const query_populate_array_notation = qs.stringify({
  populate: {
    dynamic_zone: {
      on: {
        ["components-page.page-gallery"]: {
          populate: {
            item: { 
              fields: ["title"],
              populate: {
                media: {
                  fields: ["url", "alternativeText"],
                  filters: { id: { $eq: 31 } },
                },
              },
              filters: {
                category: { id: { $eq: 26 } },
              },
              // pagination: {
              //   pageSize: 1,
              //   page: 1,
              // },
              // start: 0,
              // limit: 1,
            },
          },
          // filters: {
          //   item: {
          //     id: { $eq: 26 },
          //   },
          // item: {
          //   media: {
          //     data: { id: { $eq: 31 } },
          //   },
          // },
          // },
        },
      },
    },
  },
});

const QUERY_3 = decodeQueryString(query_populate_array_notation);

console.log(QUERY_3);

//http://localhost:1337/api/global?populate=*
