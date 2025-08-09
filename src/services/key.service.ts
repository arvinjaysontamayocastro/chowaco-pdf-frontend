const KeyService = {
  createGUID: function () {
    return crypto.randomUUID();
  },
};
export default KeyService;
