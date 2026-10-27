// Release only the buttons used by a menu. A held attack must not swallow a
// fresh right-shoulder dash after the menu closes.
export function lobbyPracticeInput(state,input,menuOpen=false){
 const held=state.practiceHeldButtons||=new Set();
 if(menuOpen||state.practiceClosing){
  for(const [key,value] of Object.entries(input))if(value===true)held.add(key);
  state.practiceClosing=false;
 }
 const result={...input};
 for(const key of held){if(!input[key])held.delete(key);else result[key]=false;}
 return menuOpen?{x:0,y:0,attack:false,jump:false,dodge:false,block:false,holdPosition:false}:result;
}
