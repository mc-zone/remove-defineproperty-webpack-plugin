export var a = 1, b;

export function getValue(){
  return {
    a:a,
    b:b
  }
}

export function modifyTo2(){
  a = 2;
  b = 2;
}

export var modifyATo3 = function(b){
  a = 3;
  b = 3;
}

export var modifyBTo4;

var obj = {
  modifyBTo4:function(a){
    if(true){
      a = 4;
      b = 4; 
    }
  }
};

modifyBTo4 = function(){
  obj.modifyBTo4();
}
