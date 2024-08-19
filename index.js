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


interface FilterParams {
  [key: string]: any;
}

export const BasicFilterOperators = {
  equals: "$eq",
  equalsCaseInsensitive: "$eqi",
  notEquals: "$ne",
  notEqualsCaseInsensitive: "$nei",
  lessThan: "$lt",
  lessThanOrEqual: "$lte",
  greaterThan: "$gt",
  greaterThanOrEqual: "$gte",
  contains: "$contains",
  doesNotContain: "$notContains",
  containsCaseInsensitive: "$containsi",
  doesNotContainCaseInsensitive: "$notContainsi",
  isNull: "$null",
  isNotNull: "$notNull",
  startsWith: "$startsWith",
  startsWithCaseInsensitive: "$startsWithi",
  endsWith: "$endsWith",
  endsWithCaseInsensitive: "$endsWithi",
};

export const AdvancedFilterOperators = {
  or: "$or",
  and: "$and",
  not: "$not",
};

export const ArrayFilterOperators = {
  between: "$between",
  inArray: "$in",
  notInArray: "$notIn",
};

const allOperators = {
  ...BasicFilterOperators,
  ...AdvancedFilterOperators,
  ...ArrayFilterOperators,
};

const decodeKey = (key: string) => {
  if (key in allOperators)
    return allOperators[key as keyof typeof allOperators];

  return key;
};

function replaceFilterOperators(filters: FilterParams): FilterParams {
  const result: FilterParams = {};

  for (const key in filters) {
    if (Object.prototype.hasOwnProperty.call(filters, key)) {
      const value = filters[key];

      if (typeof value === "object" && !Array.isArray(value)) {
        // Recursively apply the function to nested objects
        result[decodeKey(key)] = replaceFilterOperators(value);
      } else if (Array.isArray(value)) {
        // Recursively apply the function to each item in the array if it's an object
        result[decodeKey(key)] = value.map((item) =>
          typeof item === "object" && item !== null
            ? replaceFilterOperators(item)
            : item
        );
      } else {
        // Replace the operator if it's found in the operator lists

        const newKey = allOperators[key as keyof typeof allOperators] || key;
        result[newKey] = value;
      }
    }
  }

  return result;
}

// Example usage
const filters: FilterParams = {
  equals: { someField: "someValue" },
  and: [
    { contains: { anotherField: "anotherValue" } },
    { inArray: ["value1", "value2"] },
  ],
};

const example1 = {
  filters: {
    chef: {
      restaurants: {
        stars: {
          equals: 5,
        },
      },
    },
  },
};

const example2 = {
  filters: {
    or: [
      {
        date: {
          equals: "2020-01-01",
        },
      },
      {
        date: {
          equals: "2020-01-02",
        },
      },
    ],
    author: {
      name: {
        equals: "Kai doe",
      },
    },
  },
};

const example3 = {
  filters: {
    id: {
      inArray: [3, 6, 8],
    },
  },
};

const updatedFilters = replaceFilterOperators(filters);
const testExample1 = replaceFilterOperators(example1);
const testExample2 = replaceFilterOperators(example2);
const testExample3 = replaceFilterOperators(example3);
