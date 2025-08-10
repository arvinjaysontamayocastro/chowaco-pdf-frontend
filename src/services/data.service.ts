import { ExtractedReport } from '../types/types';

const DataService = {
  getData: function (key: string) {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  },

  setData: function (key: string, data: ExtractedReport) {
    localStorage.setItem(key, JSON.stringify(data));
  },
};
export default DataService;
