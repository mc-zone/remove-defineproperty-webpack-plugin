/*eslint no-unused-vars: "off"*/
/*eslint no-redeclare: "off"*/
/*eslint no-func-assign: "off"*/
export var a = -1;

var a = 2;

a = 1;

export function getValue(){
  return a;
}

function shoudlNotModify1(){
  var a = 3;
  a = 4;
}

function shoudlNotModify2(){
  a = 4;
  function a(){}
}

function shoudlNotModify3(){
  a = 4;
  if(false){
    var a = 3;
  }
}

function shoudlNotModify4(){
  a = 4;
  if(false){
    if(true){
    }else{
      var a = 3;
    }
  }
}

function shoudlNotModify5(){
  a = 4;
  while(false){
    if(true){
    }else if(false){
      var a = 3;
    }
  }
}

export function run(){
  shoudlNotModify1();
  shoudlNotModify2();
  shoudlNotModify3();
  shoudlNotModify4();
  shoudlNotModify5();
}
