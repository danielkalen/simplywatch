// Generated by CoffeeScript 1.10.0
module.exports = new function() {
  var list;
  list = {
    '1': []
  };
  this.iteration = 1;
  this.add = function(event) {
    var name;
    if (list[name = this.iteration] == null) {
      list[name] = [];
    }
    return list[this.iteration].push(event);
  };
  this.output = function(targetIteration) {
    var event, i, len, ref;
    if (list[targetIteration]) {
      ref = list[targetIteration];
      for (i = 0, len = ref.length; i < len; i++) {
        event = ref[i];
        console.log(event);
      }
      return delete list[targetIteration];
    }
  };
  return this;
};
