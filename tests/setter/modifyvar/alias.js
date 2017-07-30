var a = 1;
export { a as newA };

a = 2;

export function getValue(){
  return a;
}

export function modifyTo3(){
  if(a=3){}
}

export function modifyTo4(newA){
  a = 4;
}
