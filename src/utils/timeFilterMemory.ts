import { TimeFilter } from '@/types';
import { timeFilterOptions } from '@/utils';

// 共用的本地存储键名
const STORAGE_KEY = 'tesla_time_filter';

/**
 * 获取存储的时间过滤选项
 * @returns 存储的时间过滤选项，如果没有则返回默认值（近7天）
 */
export const getStoredTimeFilter = (): TimeFilter => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (stored) {
      const parsedFilter = JSON.parse(stored);
      // 验证存储的选项是否仍然有效
      const validFilter = timeFilterOptions.find(option => option.value === parsedFilter.value);
      if (validFilter) {
        return validFilter;
      }
    }
  } catch (error) {
    console.warn('Failed to get stored time filter:', error);
  }
  
  // 返回默认值：近7天
  return timeFilterOptions.find(f => f.value === '7days') || timeFilterOptions[0];
};

/**
 * 保存时间过滤选项到本地存储
 * @param filter 要保存的时间过滤选项
 */
export const saveTimeFilter = (filter: TimeFilter): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filter));
  } catch (error) {
    console.warn('Failed to save time filter:', error);
  }
};

/**
 * 清除存储的时间过滤选项
 */
export const clearStoredTimeFilter = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear stored time filter:', error);
  }
};

/**
 * 检查浏览器是否支持localStorage
 * @returns 是否支持localStorage
 */
export const isLocalStorageAvailable = (): boolean => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};