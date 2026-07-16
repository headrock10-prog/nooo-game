(()=>{
  const $=id=>document.getElementById(id), board=$('board'), myHand=$('myHand'), aiHand=$('aiHand'), guide=$('guide'), status=$('status');
  const types=['P','L','N','S','G','B','R','K'];
  const label={P:'歩',L:'香',N:'桂',S:'銀',G:'金',B:'角',R:'飛',K:'王'};
  const promoted={P:'と',L:'杏',N:'圭',S:'全',B:'馬',R:'龍'};
  const frame={P:[0,0],L:[33.33,0],N:[66.67,0],S:[100,0],G:[0,100],B:[33.33,100],R:[66.67,100],K:[100,100]};
  const value={P:1,L:3,N:3,S:4,G:5,B:8,R:9,K:99};
  const css=document.createElement('style');
  css.textContent=`
    .boardWrap{transform:none!important;margin-bottom:18px!important}.cell{overflow:hidden!important}
    .unit{width:90%!important;height:90%!important;border:0!important;border-radius:0!important;background-color:transparent!important;background-repeat:no-repeat!important;animation:none!important;filter:drop-shadow(1px 2px 1px #0008)!important}
    .unit.blue{transform:none!important;filter:hue-rotate(135deg) saturate(.78) brightness(.82) drop-shadow(1px 2px 1px #0008)!important}
    .tray{position:relative!important;z-index:20!important;margin-top:18px!important}.hand{background:#101b22!important;border-color:#b68b4e!important}
    .pieceTag{position:absolute;right:2px;bottom:2px;z-index:5;min-width:18px;padding:1px 3px;border:1px solid #f8d77a;border-radius:4px;background:#5d241eee;color:#fff7d5;font:700 11px serif;line-height:1;text-align:center;text-shadow:0 1px 1px #000;pointer-events:none}
    .pieceTag.enemy{left:2px;right:auto;top:2px;bottom:auto;background:#18385eee;border-color:#b8d9f8}.pieceTag.promoted{box-shadow:0 0 8px #ffe18a99;background:#7a3a95ee}
    .hand button{margin:3px 2px 0 0;padding:4px 7px;border:1px solid #d7b263;border-radius:6px;background:#3c2420;color:#fff3cc;font:700 14px serif;cursor:pointer}.hand button.sel{outline:2px solid #fff0a1;background:#783b31}
    .hitFx{position:absolute;inset:0;z-index:9;display:grid;place-items:center;font-size:34px;pointer-events:none;animation:hitFx .65s ease-out forwards}@keyframes hitFx{0%{opacity:0;scale:.3}30%{opacity:1;scale:1.25}100%{opacity:0;scale:1.8}}
  `;
  document.head.append(css);

  let state=[], side='p', selected=null, hands={p:[],c:[]}, over=false, lastFx=null;
  const piece=(type,owner,p=false)=>({type,owner,p});
  const xy=i=>[i%9,Math.floor(i/9)], ix=(x,y)=>y*9+x;
  const inside=(x,y)=>x>=0&&x<9&&y>=0&&y<9;
  const dir=owner=>owner==='p'?-1:1;
  const enemy=owner=>owner==='p'?'c':'p';
  const zone=(owner,index)=>{const y=Math.floor(index/9);return owner==='p'?y<=2:y>=6};
  const lastRank=(owner,index)=>owner==='p'?Math.floor(index/9)===0:Math.floor(index/9)===8;
  const lastTwo=(owner,index)=>owner==='p'?Math.floor(index/9)<=1:Math.floor(index/9)>=7;
  const goldDirs=owner=>{const d=dir(owner);return [[0,d],[-1,d],[1,d],[-1,0],[1,0],[0,-d]]};
  function setup(){
    state=Array(81).fill(null); hands={p:[],c:[]}; side='p'; selected=null; over=false; lastFx=null;
    const back=['L','N','S','G','K','G','S','N','L'];
    back.forEach((t,x)=>{state[ix(x,8)]=piece(t,'p');state[ix(x,0)]=piece(t,'c')});
    state[ix(1,7)]=piece('R','p');state[ix(7,7)]=piece('B','p');state[ix(1,1)]=piece('B','c');state[ix(7,1)]=piece('R','c');
    for(let x=0;x<9;x++){state[ix(x,6)]=piece('P','p');state[ix(x,2)]=piece('P','c')}
    render(); say('あなたの番です。朱い軍の駒を選んでください。');
  }
  const say=t=>guide.textContent=t;
  function shown(p){return p.p?(promoted[p.type]||label[p.type]):label[p.type]}
  function isGoldLike(p){return p.p&&['P','L','N','S'].includes(p.type)}
  function canPromote(p,from,to){return !p.p&&['P','L','N','S','B','R'].includes(p.type)&&(zone(p.owner,from)||zone(p.owner,to));}
  function mustPromote(p,to){return (['P','L'].includes(p.type)&&lastRank(p.owner,to))||(p.type==='N'&&lastTwo(p.owner,to));}
  function clearPath(from,to){const [x,y]=xy(from),[X,Y]=xy(to),sx=Math.sign(X-x),sy=Math.sign(Y-y);let a=x+sx,b=y+sy;while(a!==X||b!==Y){if(state[ix(a,b)])return false;a+=sx;b+=sy}return true;}
  function legal(from,to){
    const p=state[from]; if(!p||p.owner!==side||to<0||to>80||(state[to]&&state[to].owner===p.owner))return false;
    const [x,y]=xy(from),[X,Y]=xy(to),dx=X-x,dy=Y-y,d=dir(p.owner),t=p.type;
    if(isGoldLike(p)||t==='G')return goldDirs(p.owner).some(v=>v[0]===dx&&v[1]===dy);
    if(t==='K')return Math.abs(dx)<=1&&Math.abs(dy)<=1;
    if(t==='P')return dx===0&&dy===d;
    if(t==='L')return dx===0&&dy*d>0&&clearPath(from,to);
    if(t==='N')return Math.abs(dx)===1&&dy===2*d;
    if(t==='S')return [[0,d],[-1,d],[1,d],[-1,-d],[1,-d]].some(v=>v[0]===dx&&v[1]===dy);
    if(t==='B'){if(Math.abs(dx)===Math.abs(dy)&&dx!==0)return clearPath(from,to);return p.p&&Math.abs(dx)+Math.abs(dy)===1;}
    if(t==='R'){if((dx===0) !== (dy===0))return clearPath(from,to);return p.p&&Math.abs(dx)===1&&Math.abs(dy)===1;}
    return false;
  }
  function dropAllowed(owner,type,to){
    if(state[to])return false; const y=Math.floor(to/9);
    if((type==='P'||type==='L')&&lastRank(owner,to))return false;if(type==='N'&&lastTwo(owner,to))return false;
    if(type==='P'){const x=to%9;for(let r=0;r<9;r++){const q=state[ix(x,r)];if(q&&q.owner===owner&&q.type==='P'&&!q.p)return false;}}
    return true;
  }
  function finish(winner){over=true;status.textContent='対局終了';$('win').classList.add('show');$('winTitle').textContent=winner==='p'?'勝利！':'敗北…';$('winText').textContent=winner==='p'?'敵将を討ち取りました。':'王将が討ち取られました。';}
  function flash(index,owner){lastFx={index,owner};setTimeout(()=>{lastFx=null;render()},680);}
  function move(from,to,auto=false){
    const p=state[from], captured=state[to]; state[to]=p;state[from]=null;
    if(captured){hands[p.owner].push(captured.type);flash(to,captured.owner);if(captured.type==='K'){render();finish(p.owner);return;}}
    if(canPromote(p,from,to)){
      const forced=mustPromote(p,to);const yes=auto?(p.type==='P'||p.type==='R'||p.type==='B'||forced):(forced||confirm('この駒を成りますか？'));
      if(yes)p.p=true;
    }
    selected=null; render();
    if(!over){if(side==='p'){side='c';render();say('敵軍が盤面を見ています…');setTimeout(aiTurn,520)}else{side='p';render();say('あなたの番です。') }}
  }
  function drop(owner,type,to){state[to]=piece(type,owner);const n=hands[owner].indexOf(type);if(n>=0)hands[owner].splice(n,1);selected=null;render();if(owner==='p'){side='c';render();say('敵軍が盤面を見ています…');setTimeout(aiTurn,520)}else{side='p';render();say('あなたの番です。')}}
  function onCell(i){
    if(over||side!=='p')return;
    if(selected&&selected.kind==='drop'){if(dropAllowed('p',selected.type,i))drop('p',selected.type,i);return;}
    if(selected&&selected.kind==='move'&&legal(selected.from,i)){move(selected.from,i);return;}
    if(state[i]&&state[i].owner==='p'){selected={kind:'move',from:i};render();say('光るマスが行き先です。');}
  }
  function allMoves(owner){const out=[];const old=side;side=owner;state.forEach((p,from)=>{if(p&&p.owner===owner)for(let to=0;to<81;to++)if(legal(from,to))out.push({from,to});});side=old;return out;}
  function aiTurn(){
    if(over)return;const moves=allMoves('c');let drops=[];hands.c.forEach(type=>{for(let to=0;to<81;to++)if(dropAllowed('c',type,to))drops.push({type,to})});
    if(moves.length){moves.sort((a,b)=>(state[b.to]?value[state[b.to].type]:0)-(state[a.to]?value[state[a.to].type]:0));const best=moves.filter(m=>(state[m.to]?value[state[m.to].type]:0)===(state[moves[0].to]?value[state[moves[0].to].type]:0));const m=best[Math.floor(Math.random()*best.length)];move(m.from,m.to,true);}
    else if(drops.length){const d=drops[Math.floor(Math.random()*drops.length)];drop('c',d.type,d.to);}
    else{side='p';render();say('あなたの番です。');}
  }
  function render(){
    board.innerHTML='';state.forEach((p,i)=>{const cell=document.createElement('div');cell.className='cell';if(selected?.kind==='move'&&legal(selected.from,i))cell.classList.add('can');if(selected?.kind==='move'&&selected.from===i)cell.classList.add('pick');if(selected?.kind==='drop'&&dropAllowed('p',selected.type,i))cell.classList.add('can');cell.onclick=()=>onCell(i);
      if(p){const u=document.createElement('div'),f=frame[p.type]||frame.P;u.className='unit '+(p.owner==='c'?'blue':'');u.style.backgroundImage="url('./piece-characters.png')";u.style.backgroundSize='400% 200%';u.style.backgroundPosition=`${f[0]}% ${f[1]}%`;const tag=document.createElement('span');tag.className='pieceTag '+(p.owner==='c'?'enemy ':'')+(p.p?'promoted':'');tag.textContent=shown(p);cell.title=(p.owner==='p'?'自軍 ':'敵軍 ')+shown(p);cell.append(u,tag)}
      if(lastFx&&lastFx.index===i){const fx=document.createElement('span');fx.className='hitFx';fx.textContent=lastFx.owner==='p'?'✦':'💥';cell.append(fx)}board.append(cell);
    });
    drawHand(myHand,'p');drawHand(aiHand,'c');status.textContent=over?'対局終了':side==='p'?'あなたの番':'コンピュータ思考中';
  }
  function drawHand(el,owner){el.innerHTML='';const title=document.createElement('b');title.textContent=owner==='p'?'自軍の持ち駒':'敵軍の持ち駒';el.append(title);hands[owner].forEach((type,n)=>{const b=document.createElement('button');b.textContent=label[type];if(owner==='p'&&selected?.kind==='drop'&&selected.type===type)b.classList.add('sel');b.onclick=()=>{if(owner==='p'&&side==='p'&&!over){selected={kind:'drop',type};render();say(label[type]+'を置く場所を選んでください。');}};el.append(b)});}
  setup();
})();
