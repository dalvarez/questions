var utils = {
  extend : function(obj, src) {
    Object.keys(src).forEach(function(key) { if(src[key] !== undefined)obj[key] = src[key]; });
    return obj;
  }
};

module.exports = utils;
