/**
 * Filters Module
 *
 * Provides filtering capabilities for links and objects.
 * Inspired by ideav/local filters.py implementation.
 *
 * Supports:
 * - Text operations: contains, exact match, starts with, ends with
 * - Numeric operations: equals, range (from/to), in list
 * - Reference operations: by reference ID
 * - Logical operations: NOT (negation with !)
 */

/**
 * Filter operators
 */
export const FilterOperators = {
  EQUALS: 'eq',
  NOT_EQUALS: 'ne',
  GREATER_THAN: 'gt',
  GREATER_THAN_OR_EQUALS: 'gte',
  LESS_THAN: 'lt',
  LESS_THAN_OR_EQUALS: 'lte',
  CONTAINS: 'contains',
  STARTS_WITH: 'startsWith',
  ENDS_WITH: 'endsWith',
  IN: 'in',
  NOT_IN: 'notIn',
  BETWEEN: 'between',
  IS_NULL: 'isNull',
  IS_NOT_NULL: 'isNotNull',
};

/**
 * Parse a filter value that may contain operators
 * Examples:
 * - "!value" -> negated
 * - "@123" -> reference to object 123
 * - "100..200" -> range from 100 to 200
 * - "value1,value2" -> in list
 *
 * @param {string} value - The filter value to parse
 * @returns {Object} Parsed filter with operator and value(s)
 */
export function parseFilterValue(value) {
  if (value === null || value === undefined) {
    return { operator: FilterOperators.IS_NULL, value: null };
  }

  const strValue = String(value).trim();

  // Check for negation
  if (strValue.startsWith('!')) {
    const inner = parseFilterValue(strValue.substring(1));
    return {
      ...inner,
      negated: true,
    };
  }

  // Check for reference
  if (strValue.startsWith('@')) {
    return {
      operator: FilterOperators.EQUALS,
      value: parseInt(strValue.substring(1), 10),
      isReference: true,
    };
  }

  // Check for range (from..to)
  if (strValue.includes('..')) {
    const [from, to] = strValue.split('..').map((v) => v.trim());
    return {
      operator: FilterOperators.BETWEEN,
      from: from ? parseFloat(from) : null,
      to: to ? parseFloat(to) : null,
    };
  }

  // Check for list (comma-separated)
  if (strValue.includes(',')) {
    const values = strValue.split(',').map((v) => v.trim());
    return {
      operator: FilterOperators.IN,
      values,
    };
  }

  // Check for numeric comparison operators
  if (strValue.startsWith('>=')) {
    return {
      operator: FilterOperators.GREATER_THAN_OR_EQUALS,
      value: parseFloat(strValue.substring(2)),
    };
  }
  if (strValue.startsWith('<=')) {
    return {
      operator: FilterOperators.LESS_THAN_OR_EQUALS,
      value: parseFloat(strValue.substring(2)),
    };
  }
  if (strValue.startsWith('>')) {
    return {
      operator: FilterOperators.GREATER_THAN,
      value: parseFloat(strValue.substring(1)),
    };
  }
  if (strValue.startsWith('<')) {
    return {
      operator: FilterOperators.LESS_THAN,
      value: parseFloat(strValue.substring(1)),
    };
  }

  // Check for wildcard patterns (contains, starts with, ends with)
  if (strValue.startsWith('*') && strValue.endsWith('*')) {
    return {
      operator: FilterOperators.CONTAINS,
      value: strValue.slice(1, -1),
    };
  }
  if (strValue.endsWith('*')) {
    return {
      operator: FilterOperators.STARTS_WITH,
      value: strValue.slice(0, -1),
    };
  }
  if (strValue.startsWith('*')) {
    return {
      operator: FilterOperators.ENDS_WITH,
      value: strValue.substring(1),
    };
  }

  // Default to exact match
  return {
    operator: FilterOperators.EQUALS,
    value: strValue,
  };
}

/**
 * Apply a filter to a single value
 * @param {*} value - The value to test
 * @param {Object} filter - The parsed filter
 * @returns {boolean} True if the value matches the filter
 */
export function applyFilter(value, filter) {
  let result;

  switch (filter.operator) {
    case FilterOperators.EQUALS:
      result = String(value) === String(filter.value);
      break;

    case FilterOperators.NOT_EQUALS:
      result = String(value) !== String(filter.value);
      break;

    case FilterOperators.GREATER_THAN:
      result = Number(value) > Number(filter.value);
      break;

    case FilterOperators.GREATER_THAN_OR_EQUALS:
      result = Number(value) >= Number(filter.value);
      break;

    case FilterOperators.LESS_THAN:
      result = Number(value) < Number(filter.value);
      break;

    case FilterOperators.LESS_THAN_OR_EQUALS:
      result = Number(value) <= Number(filter.value);
      break;

    case FilterOperators.CONTAINS:
      result = String(value)
        .toLowerCase()
        .includes(String(filter.value).toLowerCase());
      break;

    case FilterOperators.STARTS_WITH:
      result = String(value)
        .toLowerCase()
        .startsWith(String(filter.value).toLowerCase());
      break;

    case FilterOperators.ENDS_WITH:
      result = String(value)
        .toLowerCase()
        .endsWith(String(filter.value).toLowerCase());
      break;

    case FilterOperators.IN:
      result = filter.values.some((v) => String(value) === String(v));
      break;

    case FilterOperators.NOT_IN:
      result = !filter.values.some((v) => String(value) === String(v));
      break;

    case FilterOperators.BETWEEN: {
      const numValue = Number(value);
      const fromOk = filter.from === null || numValue >= filter.from;
      const toOk = filter.to === null || numValue <= filter.to;
      result = fromOk && toOk;
      break;
    }

    case FilterOperators.IS_NULL:
      result = value === null || value === undefined;
      break;

    case FilterOperators.IS_NOT_NULL:
      result = value !== null && value !== undefined;
      break;

    default:
      result = true;
  }

  // Apply negation if specified
  if (filter.negated) {
    result = !result;
  }

  return result;
}

/**
 * Apply multiple filters to a collection of items
 * @param {Array} items - Items to filter
 * @param {Object} filters - Object with field names as keys and filter values
 * @param {Function} getField - Function to get field value from item (item, fieldName) => value
 * @returns {Array} Filtered items
 */
export function applyFilters(
  items,
  filters,
  getField = (item, field) => item[field]
) {
  if (!filters || Object.keys(filters).length === 0) {
    return items;
  }

  // Parse all filters
  const parsedFilters = {};
  for (const [field, value] of Object.entries(filters)) {
    parsedFilters[field] = parseFilterValue(value);
  }

  // Apply filters to each item
  return items.filter((item) => {
    for (const [field, filter] of Object.entries(parsedFilters)) {
      const value = getField(item, field);
      if (!applyFilter(value, filter)) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Apply filters to links
 * @param {Array} links - Array of link objects {id, source, target}
 * @param {Object} filters - Filter object with id, source, target filters
 * @returns {Array} Filtered links
 */
export function filterLinks(links, filters) {
  return applyFilters(links, filters);
}

/**
 * Build a query string from filters (for logging/debugging)
 * @param {Object} filters - Filter object
 * @returns {string} Human-readable query description
 */
export function describeFilters(filters) {
  if (!filters || Object.keys(filters).length === 0) {
    return 'no filters';
  }

  const parts = [];
  for (const [field, value] of Object.entries(filters)) {
    const parsed = parseFilterValue(value);
    let desc = `${field} `;

    if (parsed.negated) {
      desc += 'NOT ';
    }

    switch (parsed.operator) {
      case FilterOperators.EQUALS:
        desc += `= ${parsed.value}`;
        break;
      case FilterOperators.BETWEEN:
        desc += `BETWEEN ${parsed.from ?? '*'} AND ${parsed.to ?? '*'}`;
        break;
      case FilterOperators.IN:
        desc += `IN (${parsed.values.join(', ')})`;
        break;
      case FilterOperators.CONTAINS:
        desc += `CONTAINS '${parsed.value}'`;
        break;
      case FilterOperators.STARTS_WITH:
        desc += `STARTS WITH '${parsed.value}'`;
        break;
      case FilterOperators.ENDS_WITH:
        desc += `ENDS WITH '${parsed.value}'`;
        break;
      default:
        desc += `${parsed.operator} ${parsed.value}`;
    }

    parts.push(desc);
  }

  return parts.join(' AND ');
}

export default {
  FilterOperators,
  parseFilterValue,
  applyFilter,
  applyFilters,
  filterLinks,
  describeFilters,
};
