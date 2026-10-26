import searchData from '../data/search.data.json';

export const SEARCH_RESULTS = searchData.searchResult as readonly string[];
export const EMPTY_SEARCH_RESULTS = searchData.emptySearchResult as readonly string[];

/**
 * Bốc ngẫu nhiên một từ khóa quần áo có trong danh mục để tìm kiếm
 */
export function getRandomSearchKeyword(): string {
  const index = Math.floor(Math.random() * SEARCH_RESULTS.length);
  return SEARCH_RESULTS[index];
}

/**
 * Bốc ngẫu nhiên một từ khóa quần áo không có trong danh mục để kiểm thử trường hợp tìm kiếm không có kết quả
 */
export function getRandomEmptySearchKeyword(): string {
  const index = Math.floor(Math.random() * EMPTY_SEARCH_RESULTS.length);
  return EMPTY_SEARCH_RESULTS[index];
}
