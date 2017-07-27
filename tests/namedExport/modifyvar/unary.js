export var a = 1;

export function getValue(){
  return a;
}

export function modifyTo2(){
  !(+(~(a = 2)));
}

export function modifyTo3(){
  typeof (a = 3);
}

export function modifyTo4(){
  var b = {};
  void(delete b[(a = 4)]);
}

export function modifyTo5(){
  a++;
}

export function modifyTo6(){
  (++a);
}
