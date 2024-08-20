import qs from "qs";

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

type BasicFilterOperatorKeys = keyof typeof BasicFilterOperators;

type BasicFilterParams = {
  [operator in BasicFilterOperatorKeys]?: string | number | boolean;
};

type ArrayFilterParams = {
  inArray?: string[] | number[];
  notInArray?: string[] | number[];
  between?: [number, number] | [Date, Date];
};

type FilterOptionsParams = BasicFilterParams | ArrayFilterParams;

export type FilterParams = {
  [key: string]: FilterOptionsParams | FilterParams;
};

type AdvancedInnerFilter = {
  [key: string]: {
    [operator in BasicFilterOperatorKeys]?: string | number | boolean;
  };
};

type AdvancedFilterParams = {
  [operator in keyof typeof AdvancedFilterOperators]?: Array<AdvancedInnerFilter>;
};

export type OuterFilterParams = FilterParams | AdvancedFilterParams;

export type PopulateFilterParams<T> =
  | string
  | string[]
  | { [key: string]: T | string | string[] };

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

const replaceFilterOperators = (filters: FilterParams) => {
  const result: FilterParams = {};

  for (const key in filters) {
    if (Object.prototype.hasOwnProperty.call(filters, key)) {
      const value = filters[key];

      if (typeof value === "object" && !Array.isArray(value)) {
        result[decodeKey(key)] = replaceFilterOperators(value as FilterParams);
      } else if (Array.isArray(value)) {
        result[decodeKey(key)] = value.map((item) =>
          typeof item === "object" && item !== null
            ? replaceFilterOperators(item)
            : item
        ) as unknown as FilterParams;
      } else {
        const newKey = allOperators[key as keyof typeof allOperators] || key;
        result[newKey] = value as unknown as FilterParams;
      }
    }
  }

  return result;
};

const replaceFilterOperatorInPopulate = (
  populate: PopulateFilterParams<InnerPopulateParams> | PopulateDynamicZone
) => {
  const result:
    | PopulateFilterParams<InnerPopulateParams>
    | PopulateDynamicZone = {};

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

const example1: InteractiveQueryBuilderParams = {
  fields: ["title", "slug", "description"],
  filters: {
    title: {
      inArray: [
        "Origen de la Asociación",
        "Estatutos de la AsociaciónEstatutos",
      ],
    },
  },
  populate: {
    dynamic_zone: {
      on: {
        "components-page.page-gallery": {
          fields: ["description"],
          populate: {
            item: {
              filters: {
                title: {
                  contains: "test",
                },
              },
              populate: {
                media: {
                  fields: ["url", "alternativeText"],
                },
              },
            },
          },
        },
      },
    },
  },
};

if (example1.filters) {
  example1.filters = replaceFilterOperators(example1.filters as FilterParams);
  example1.populate = replaceFilterOperatorInPopulate(
    example1.populate as PopulateFilterParams<InnerPopulateParams>
  );

  const query1 = qs.stringify(example1);

  const decodedQuery = decodeQueryString(query1);

  console.log(decodedQuery);

  // Copy to clipboard
}
