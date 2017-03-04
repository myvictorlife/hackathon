'use strict';

module.exports = function(){
  var map = {};

  return {

    put: function (id, client) {
      map[id] = client;
    },

    get: function (id) {
      return map[id];
    },

    remove: function (id) {
      delete map[id];
    },

    contains: function (id) {
      return map[id] !== undefined;
    },

    keys: function () {
      var indexes = [];
      for (var key in map) {
        if (map.hasOwnProperty(key)) {
          indexes.push(key);
        }
      }
      return indexes;
    }

  };
}();

