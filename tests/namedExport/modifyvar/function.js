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

export var modifyATo3 = function(){
  a = 3;
}

export var modifyBTo3;

var obj = {
  modifyBTo3:function(){
    if(true){
      b = 3; 
    }
  }
};

modifyBTo3 = function(){
  obj.modifyBTo3();
}

export function modifyFuncTo(stuff){
  modifyATo3 = stuff;
  modifyBTo3 = stuff;
}
