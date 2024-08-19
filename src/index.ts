import qs from "qs";

const CONTENT_TYPE = "articles";
const BASE_URL = `http://localhost:1337/api/${CONTENT_TYPE}?`;

function decodeQueryString(queryString: string) {
  // Split the query string into individual key-value pairs
  const pairs = queryString.split("&");

  // Initialize an array to hold the decoded parameters
  const decodedPairs: string[] = [];

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

// const query_populate_array_notation = qs.stringify({
//   populate: {
//     dynamic_zone: {
//       on: {
//         ["components-page.page-gallery"]: {
//           populate: {
//             item: {
//               fields: ["title"],
//               populate: {
//                 media: {
//                   fields: ["url", "alternativeText"],
//                   filters: { id: { $eq: 31 } },
//                 },
//               },
//               filters: {
//                 category: { id: { $eq: 26 } },
//               },
//               // pagination: {
//               //   pageSize: 1,
//               //   page: 1,
//               // },
//               // start: 0,
//               // limit: 1,
//             },
//           },
//           // filters: {
//           //   item: {
//           //     id: { $eq: 26 },
//           //   },
//           // item: {
//           //   media: {
//           //     data: { id: { $eq: 31 } },
//           //   },
//           // },
//           // },
//         },
//       },
//     },
//   },
// });

// const QUERY_3 = decodeQueryString(query_populate_array_notation);

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

export type PopulateFilterParams<T> =
  | string
  | string[]
  | { [key: string]: T | string | string[] };

type BasicFilterOperatorKeys = keyof typeof BasicFilterOperators;

type AdvancedInnerFilter = {
  [key: string]: {
    [operator in BasicFilterOperatorKeys]?: string | number | boolean;
  };
};

type AdvancedFilterParams = {
  [operator in keyof typeof AdvancedFilterOperators]?: Array<AdvancedInnerFilter>;
};

export type OuterFilterParams = FilterParams | AdvancedFilterParams;

export interface InnerPopulateParams {
  sort?: { [key: string]: "asc" | "desc" };
  filters?: OuterFilterParams;
  populate?: PopulateFilterParams<InnerPopulateParams>;
  fields?: string[];
}

export interface PopulateDynamicZone {
  dynamic_zone: {
    on: PopulateFilterParams<InnerPopulateParams>;
  };
}

interface InteractiveQueryBuilderParams {
  sort?: { [key: string]: "asc" | "desc" };
  filters?: OuterFilterParams;
  populate?: PopulateFilterParams<InnerPopulateParams> | PopulateDynamicZone;
  fields?: string[];
  pagination?: {
    pageSize?: number;
    page?: number;
    start?: number;
    limit?: number;
    withCount?: boolean;
  };
  publicationState?: "live" | "preview";
  dynamicQuery?: string;
}

const replaceFilterOperatorInPopulate = (
  populate: PopulateFilterParams<InnerPopulateParams> | PopulateDynamicZone
) => {
  const result: PopulateFilterParams<InnerPopulateParams> = {};

  // check if is string
  if (typeof populate !== "object") return result;

  // check if its an array
  if (Array.isArray(populate)) return result;

  // if is an object then to the process of chaging the keys of the filters
  Object.entries(populate).forEach(([key, value]) => {
    if (key === "filters") {
      result[key] = replaceFilterOperators(value as FilterParams);
    } else {
      result[key] = replaceFilterOperatorInPopulate(
        value as PopulateFilterParams<InnerPopulateParams>
      );
    }
  });

  return result;
};

const testPopulate1: PopulateFilterParams<InnerPopulateParams> = {
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
      or: [
        {
          date: {
            greaterThan: "2020-01-01",
          },
        },
        {
          date: {
            isNull: "2020-01-02",
          },
        },
      ],
    },
  },
};

const testPopulate2: InteractiveQueryBuilderParams = {
  
};

const queryString = qs.stringify(testPopulate2);

const queryDecoded = decodeQueryString(queryString);

console.log(queryDecoded);
console.log(queryString);
// const QUERY_3 = decodeQueryString(query_populate_array_notation);

// decodeQueryString

// const example1Populate = replaceFilterOperatorInPopulate(testPopulate1);

// if (testPopulate2.populate) {
//   const example2Populate = replaceFilterOperatorInPopulate(
//     testPopulate2.populate
//   );

//   testPopulate2.populate = example2Populate;
// }
// console.log(example1Populate);

// const updatedFilters = replaceFilterOperators(filters);
// const testExample1 = replaceFilterOperators(example1);
// const testExample2 = replaceFilterOperators(example2);
// const testExample3 = replaceFilterOperators(example3);
