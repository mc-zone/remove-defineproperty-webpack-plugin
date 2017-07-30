export var a = 0;


/*eslint no-redeclare: "off"*/
(function(){
  for(var a = 1; a<2; a++){
    a = 3;
  }

  for(var a in {a:a}){
    a = 4;
  }
})();


export function getValue(){
  return a;
}
