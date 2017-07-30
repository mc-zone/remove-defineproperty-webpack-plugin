export var a = 1;
export function getValue(){
  return a;
}

if(a=2){
}

export function modifyTo3(){
  if(a=3){}
}

export function modifyTo4(){
  if(false){
  }else if(a=4){
  }
}

export function modifyTo5(){
  var i = 0;
  while(i == 0 && (a=5)){
    i = 1;
  }
}

export function modifyTo6(){
  var i = 0;
  do{
    i += 1;
  }while(i < 2 && (a=6));
}

export function modifyTo7(){
  var i = 0;
  switch(i){
    case (a=7):
      break;
  }
}

export function modifyTo8(){
  for(var i=0; (a=8)<8; i++){

  }
}

export function modifyTo9(){
  for(var i=0; i<1; (a=9) && i++){

  }
}
