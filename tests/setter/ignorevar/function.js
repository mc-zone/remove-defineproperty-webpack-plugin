export var a = 0;

function test1(a){
  a = 1;
}

var test2 = function(a){
  a = 2;
};

const test3 = a => {
  a = 3;
};

var obj = {
  test4: a => {
    a = 4; 
  },
  test5: a => a = 5,
  test6: function(a){
    a = 6;
  },
  obj:{
    test7: function(a){
      a = 7;
    }  
  }
};

export const tests = [
  test1,
  test2,
  test3,
  obj.test4,
  obj.test5,
  obj.test6,
  obj.obj.test7,
];
