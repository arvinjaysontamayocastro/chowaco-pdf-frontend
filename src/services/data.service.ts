const DataService = {
  getData: function (key: string) {
    if (localStorage.getItem(key) != null) {
      return JSON.parse(localStorage.getItem(key)!);
    } else {
      return null;
    }
  },

  setData: function (key: string, data: any) {
    console.log('setting Up');
    console.log('key', key);
    console.log('data', data);
    localStorage.setItem(key, JSON.stringify(data));
  },
};
export default DataService;
