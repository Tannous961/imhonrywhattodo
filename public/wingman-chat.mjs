// In-memory only: no browser storage and no automatic conversation archive.
export function createConversation(){
 let owner=null,turns=[];
 return {
  setOwner(id){if(id!==owner){owner=id;turns=[];return true}return false},
  clear(){turns=[]},
  append(user,assistant){turns=[...turns,{role:'user',content:user},{role:'assistant',content:assistant}].slice(-8)},
  messages(){return turns.map(x=>({...x}))},
  history(){return turns.map(x=>({role:x.role,content:x.content.slice(0,1000)}))}
 };
}
