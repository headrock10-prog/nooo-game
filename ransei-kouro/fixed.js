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
    .promoteChoice{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:99;width:min(92vw,360px);padding:14px;border:2px solid #f3cd70;border-radius:14px;background:#18232aeF;box-shadow:0 8px 30px #000c;text-align:center;color:#fff0c4;font-weight:bold}.promoteChoice div{margin-bottom:9px}.promoteChoice button{margin:0 5px;padding:9px 18px;border:1px solid #f5d278;border-radius:8px;background:#7f332d;color:#fff6d9;font-weight:bold;cursor:pointer}.promoteChoice button:last-child{background:#31485e}
    .cell.enemyCan{box-shadow:inset 0 0 0 3px #76cdf5!important;background:#b4dded!important}.cell.enemyCan:after{background:#4bb8edbb!important}.autoBar{display:flex;justify-content:center;margin:8px 0 -5px}.autoBar button{padding:7px 13px;border:1px solid #e8c76b;border-radius:8px;background:#213d50;color:#fff2bf;font-weight:bold;cursor:pointer}.autoBar button.on{background:#8c3932}
    .chapterOverlay{position:fixed;inset:0;z-index:120;display:grid;place-items:center;padding:20px;background:#061016e8;animation:chapterIn .35s ease-out}.chapterCard{width:min(92vw,430px);overflow:hidden;border:2px solid #f3c75b;border-radius:18px;background:linear-gradient(145deg,#263842,#10191e);box-shadow:0 0 42px #f2ba4b55;text-align:center}.chapterCard img{display:block;width:100%;max-height:310px;object-fit:cover;object-position:center}.chapterCard .vs{margin:14px 0 4px;color:#ffe08b;font:700 30px serif;letter-spacing:.14em;text-shadow:0 0 14px #ffd25b;animation:flashVs .75s ease-in-out infinite alternate}.chapterCard h2{margin:3px 12px 6px;color:#fff0bd}.chapterCard p{margin:0 18px 12px;color:#cde9ee;font-size:13px}.chapterCard button{margin:0 0 17px;padding:10px 22px;border:1px solid #f5d26e;border-radius:8px;background:#85352e;color:#fff7d3;font-weight:bold;cursor:pointer}@keyframes flashVs{to{filter:brightness(1.45);scale:1.06}}@keyframes chapterIn{from{opacity:0;scale:.9}to{opacity:1;scale:1}}
    .cardBar{display:flex;flex-wrap:wrap;justify-content:center;gap:5px;margin:9px 0 0}.cardBar button{padding:6px 8px;border:1px solid #b98948;border-radius:7px;background:#382b45;color:#fff1c2;font-size:11px;cursor:pointer}.cardBar button.armed{outline:2px solid #7fd8ff;background:#24516a}.cardBar button:disabled{opacity:.55;cursor:default}
  `;
  document.head.append(css);

  const bosses=[
    {name:'海賊女王',place:'港湾航路',image:'boss-harbor-pirate-queen.png',card:'潮目を戻す'},
    {name:'反乱軍将軍',place:'豊穣の平原',image:'boss-plains-rebel-general.png',card:'蜂起の鎮圧'},
    {name:'山賊将',place:'山道関所',image:'boss-mountain-warlord.png',card:'山道封鎖'},
    {name:'城塞の主',place:'王都城塞',image:'terrain-fortified-castle.png',card:'王都の号令'}
  ];
  let campaign={stage:0,loop:1,cards:{}}, winAction='retry';
  let state=[], side='p', selected=null, hands={p:[],c:[]}, over=false, lastFx=null, pendingPromotion=null, autoMode=false, autoTimer=null, history=[], cardUse=null, frozenIndex=null, goldBoostIndex=null;
  const boss=()=>bosses[campaign.stage];
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
    state=Array(81).fill(null); hands={p:[],c:[]}; side='p'; selected=null; over=false; lastFx=null; pendingPromotion=null; autoMode=false; history=[];cardUse=null;frozenIndex=null;goldBoostIndex=null;if(autoTimer)clearTimeout(autoTimer); autoTimer=null;$('win').classList.remove('show');
    const back=['L','N','S','G','K','G','S','N','L'];
    back.forEach((t,x)=>{state[ix(x,8)]=piece(t,'p');state[ix(x,0)]=piece(t,'c')});
    state[ix(1,7)]=piece('R','p');state[ix(7,7)]=piece('B','p');state[ix(1,1)]=piece('B','c');state[ix(7,1)]=piece('R','c');
    for(let x=0;x<9;x++){state[ix(x,6)]=piece('P','p');state[ix(x,2)]=piece('P','c')}
    render(); say(`第${campaign.loop}周・${boss().place}：${boss().name}との戦いです。`);setTimeout(showChapter,80);
  }
  function showChapter(){
    const old=$('chapterOverlay');if(old)old.remove();if(over)return;
    const box=document.createElement('div');box.id='chapterOverlay';box.className='chapterOverlay';
    box.innerHTML=`<section class="chapterCard"><img src="./${boss().image}" alt="${boss().name}"><div class="vs">VS ${boss().name}</div><h2>第${campaign.loop}周・${boss().place}</h2><p>勝利報酬：一回こっきりの戦術カード「${boss().card}」</p></section>`;
    const go=document.createElement('button');go.textContent='戦闘開始';go.onclick=()=>box.remove();box.querySelector('.chapterCard').append(go);document.body.append(box);
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
    if(isGoldLike(p)||t==='G'||(p.owner==='p'&&goldBoostIndex===from))return goldDirs(p.owner).some(v=>v[0]===dx&&v[1]===dy);
    if(t==='K')return Math.abs(dx)<=1&&Math.abs(dy)<=1;
    if(t==='P')return dx===0&&dy===d;
    if(t==='L')return dx===0&&dy*d>0&&clearPath(from,to);
    if(t==='N')return Math.abs(dx)===1&&dy===2*d;
    if(t==='S')return [[0,d],[-1,d],[1,d],[-1,-d],[1,-d]].some(v=>v[0]===dx&&v[1]===dy);
    if(t==='B'){if(Math.abs(dx)===Math.abs(dy)&&dx!==0)return clearPath(from,to);return p.p&&Math.abs(dx)+Math.abs(dy)===1;}
    if(t==='R'){if((dx===0) !== (dy===0))return clearPath(from,to);return p.p&&Math.abs(dx)===1&&Math.abs(dy)===1;}
    return false;
  }
  function legalFor(owner,from,to){const old=side;side=owner;const ok=legal(from,to);side=old;return ok;}
  function saveHistory(){history.push({state:state.map(p=>p?{...p}:null),hands:{p:[...hands.p],c:[...hands.c]}});if(history.length>4)history.shift();}
  function spendCard(name){campaign.cards[name]--;if(campaign.cards[name]<=0)delete campaign.cards[name];cardUse=null;}
  function activateCard(name){
    if(over||side!=='p'||autoMode||!campaign.cards[name])return;
    selected=null;
    if(name==='潮目を戻す'){
      const past=history.pop();if(!past){say('まだ戻せる手がありません。');render();return;}
      state=past.state;hands=past.hands;side='p';spendCard(name);render();say('潮目を戻した。直前の自軍ターンへ戻ります。');return;
    }
    cardUse=name;render();
    const hint={
      '蜂起の鎮圧':'敵の歩を1体選んでください。',
      '山道封鎖':'次の敵ターンだけ止める敵駒を選んでください。',
      '王都の号令':'金将の動きを与える自軍の駒を選んでください。'
    };say(hint[name]);
  }
  function dropAllowed(owner,type,to){
    if(state[to])return false; const y=Math.floor(to/9);
    if((type==='P'||type==='L')&&lastRank(owner,to))return false;if(type==='N'&&lastTwo(owner,to))return false;
    if(type==='P'){const x=to%9;for(let r=0;r<9;r++){const q=state[ix(x,r)];if(q&&q.owner===owner&&q.type==='P'&&!q.p)return false;}}
    return true;
  }
  function finish(winner){
    over=true;status.textContent='対局終了';const panel=$('win'),button=panel.querySelector('button');panel.classList.add('show');
    if(winner==='p'){
      campaign.cards[boss().card]=(campaign.cards[boss().card]||0)+1;winAction='next';
      $('winTitle').textContent=`${boss().name}を撃破！`;
      $('winText').textContent=`戦術カード「${boss().card}」を獲得。所持：${campaign.cards[boss().card]}枚`;
      if(button)button.textContent='次の航路へ';
    }else{
      winAction='retry';$('winTitle').textContent='敗北…';$('winText').textContent=`${boss().name}に退けられました。もう一度挑戦できます。`;if(button)button.textContent='もう一度';
    }
  }
  function continueCampaign(){
    if(winAction==='next'){campaign.stage++;if(campaign.stage>=bosses.length){campaign.stage=0;campaign.loop++;}}
    setup();
  }
  function flash(index,owner){lastFx={index,owner};setTimeout(()=>{lastFx=null;render()},680);}
  function nextTurn(){
    if(over)return;
    if(side==='p'){side='c';render();say('敵軍が盤面を見ています…');setTimeout(aiTurn,520)}else{side='p';render();say('あなたの番です。');queueAuto()}
  }
  function queueAuto(){
    if(!autoMode||over||side!=='p'||pendingPromotion)return;
    if(autoTimer)clearTimeout(autoTimer);
    autoTimer=setTimeout(autoPlayTurn,620);
  }
  function autoPlayTurn(){
    autoTimer=null;if(!autoMode||over||side!=='p'||pendingPromotion)return;
    const moves=allMoves('p');
    if(!moves.length){autoMode=false;render();say('AutoPlay: 動かせる駒がありません。');return;}
    moves.sort((a,b)=>(state[b.to]?value[state[b.to].type]:0)-(state[a.to]?value[state[a.to].type]:0));
    const top=state[moves[0].to]?value[state[moves[0].to].type]:0;
    const best=moves.filter(m=>(state[m.to]?value[state[m.to].type]:0)===top);
    const m=best[Math.floor(Math.random()*best.length)];move(m.from,m.to,true);
  }
  function toggleAuto(){autoMode=!autoMode;selected=null;if(autoTimer)clearTimeout(autoTimer);autoTimer=null;render();if(autoMode){say('AutoPlay中：両軍を自動で進めます。');queueAuto()}else say('AutoPlayを停止しました。');}
  function choosePromotion(yes){if(!pendingPromotion)return;const p=state[pendingPromotion.to];if(p&&yes)p.p=true;pendingPromotion=null;render();nextTurn();}
  function move(from,to,auto=false){
    const p=state[from], captured=state[to];if(p.owner==='p'&&!auto)saveHistory();if(p.owner==='p'&&goldBoostIndex===from)goldBoostIndex=null; state[to]=p;state[from]=null;
    if(captured){hands[p.owner].push(captured.type);flash(to,captured.owner);if(captured.type==='K'){render();finish(p.owner);return;}}
    if(canPromote(p,from,to)){
      const forced=mustPromote(p,to);
      if(!auto&&!forced){pendingPromotion={to};selected=null;render();say('この駒は成れます。成りますか？');return;}
      if(auto?(p.type==='P'||p.type==='R'||p.type==='B'||forced):forced)p.p=true;
    }
    selected=null; render();nextTurn();
  }
  function drop(owner,type,to){if(owner==='p')saveHistory();state[to]=piece(type,owner);const n=hands[owner].indexOf(type);if(n>=0)hands[owner].splice(n,1);selected=null;render();if(owner==='p'){side='c';render();say('敵軍が盤面を見ています…');setTimeout(aiTurn,520)}else{side='p';render();say('あなたの番です。')}}
  function onCell(i){
    if(over||side!=='p'||pendingPromotion||autoMode)return;
    if(cardUse==='蜂起の鎮圧'){
      if(state[i]?.owner==='c'&&state[i].type==='P'){state[i]=null;spendCard('蜂起の鎮圧');render();say('敵の歩を鎮圧しました。');}return;
    }
    if(cardUse==='山道封鎖'){
      if(state[i]?.owner==='c'){frozenIndex=i;spendCard('山道封鎖');render();say('この敵駒は次の敵ターン、動けません。');}return;
    }
    if(cardUse==='王都の号令'){
      if(state[i]?.owner==='p'&&state[i].type!=='K'){goldBoostIndex=i;spendCard('王都の号令');render();say('この駒は次の一手だけ金将の動きになります。');}return;
    }
    if(selected&&selected.kind==='drop'){if(dropAllowed('p',selected.type,i))drop('p',selected.type,i);return;}
    if(selected&&selected.kind==='move'&&legal(selected.from,i)){move(selected.from,i);return;}
    if(state[i]&&state[i].owner==='c'){selected={kind:'preview',from:i};render();say('敵の駒が動ける範囲を青く表示しています。');return;}
    if(state[i]&&state[i].owner==='p'){selected={kind:'move',from:i};render();say('光るマスが行き先です。');}
  }
  function allMoves(owner){const out=[];const old=side;side=owner;state.forEach((p,from)=>{if(p&&p.owner===owner&&!(owner==='c'&&from===frozenIndex))for(let to=0;to<81;to++)if(legal(from,to))out.push({from,to});});side=old;return out;}
  function aiTurn(){
    if(over)return;const moves=allMoves('c');let drops=[];hands.c.forEach(type=>{for(let to=0;to<81;to++)if(dropAllowed('c',type,to))drops.push({type,to})});
    if(moves.length){moves.sort((a,b)=>(state[b.to]?value[state[b.to].type]:0)-(state[a.to]?value[state[a.to].type]:0));const best=moves.filter(m=>(state[m.to]?value[state[m.to].type]:0)===(state[moves[0].to]?value[state[moves[0].to].type]:0));const m=best[Math.floor(Math.random()*best.length)];const held=frozenIndex;move(m.from,m.to,true);if(held!==null)frozenIndex=null;}
    else if(drops.length){const d=drops[Math.floor(Math.random()*drops.length)];drop('c',d.type,d.to);}
    else{side='p';render();say('あなたの番です。');}
  }
  function render(){
    board.innerHTML='';state.forEach((p,i)=>{const cell=document.createElement('div');cell.className='cell';if(selected?.kind==='move'&&legal(selected.from,i))cell.classList.add('can');if(selected?.kind==='preview'&&legalFor('c',selected.from,i))cell.classList.add('enemyCan');if((selected?.kind==='move'||selected?.kind==='preview')&&selected.from===i)cell.classList.add('pick');if(selected?.kind==='drop'&&dropAllowed('p',selected.type,i))cell.classList.add('can');cell.onclick=()=>onCell(i);
      if(p){const u=document.createElement('div'),f=frame[p.type]||frame.P;u.className='unit '+(p.owner==='c'?'blue':'');u.style.backgroundImage="url('./piece-characters.png')";u.style.backgroundSize='400% 200%';u.style.backgroundPosition=`${f[0]}% ${f[1]}%`;const tag=document.createElement('span');tag.className='pieceTag '+(p.owner==='c'?'enemy ':'')+(p.p?'promoted':'');tag.textContent=shown(p);cell.title=(p.owner==='p'?'自軍 ':'敵軍 ')+shown(p);cell.append(u,tag)}
      if(lastFx&&lastFx.index===i){const fx=document.createElement('span');fx.className='hitFx';fx.textContent=lastFx.owner==='p'?'✦':'💥';cell.append(fx)}board.append(cell);
    });
    drawHand(myHand,'p');drawHand(aiHand,'c');status.textContent=over?'対局終了':pendingPromotion?'成りを選択':autoMode?'AutoPlay中':'コンピュータ思考中';if(!pendingPromotion&&!over&&side==='p'&&!autoMode)status.textContent='あなたの番';
    let autoBar=$('autoBar');if(!autoBar){autoBar=document.createElement('div');autoBar.id='autoBar';autoBar.className='autoBar';guide.before(autoBar)}autoBar.innerHTML='';const autoButton=document.createElement('button');autoButton.textContent=autoMode?'AutoPlay 停止':'AutoPlay（観戦）';autoButton.className=autoMode?'on':'';autoButton.onclick=toggleAuto;autoBar.append(autoButton);
    let cardBar=$('cardBar');if(!cardBar){cardBar=document.createElement('div');cardBar.id='cardBar';cardBar.className='cardBar';guide.before(cardBar)}cardBar.innerHTML='';const cardNames=['潮目を戻す','蜂起の鎮圧','山道封鎖','王都の号令'];cardNames.forEach(name=>{const count=campaign.cards[name]||0;if(!count)return;const b=document.createElement('button');b.textContent=`${name} ×${count}`;b.className=cardUse===name?'armed':'';b.onclick=()=>activateCard(name);cardBar.append(b)});
    const old=$('promotionChoice');if(old)old.remove();if(pendingPromotion){const box=document.createElement('div');box.id='promotionChoice';box.className='promoteChoice';box.innerHTML='<div>成りを選んでください</div>';const yes=document.createElement('button');yes.textContent='成る';yes.onclick=()=>choosePromotion(true);const no=document.createElement('button');no.textContent='成らない';no.onclick=()=>choosePromotion(false);box.append(yes,no);document.body.append(box);}
  }
  function drawHand(el,owner){el.innerHTML='';const title=document.createElement('b');title.textContent=owner==='p'?'自軍の持ち駒':'敵軍の持ち駒';el.append(title);hands[owner].forEach((type,n)=>{const b=document.createElement('button');b.textContent=label[type];if(owner==='p'&&selected?.kind==='drop'&&selected.type===type)b.classList.add('sel');b.onclick=()=>{if(owner==='p'&&side==='p'&&!over){selected={kind:'drop',type};render();say(label[type]+'を置く場所を選んでください。');}};el.append(b)});}
  const restartButton=$('win').querySelector('button');
  if(restartButton)restartButton.addEventListener('click',event=>{event.preventDefault();continueCampaign();});
  setup();
})();
