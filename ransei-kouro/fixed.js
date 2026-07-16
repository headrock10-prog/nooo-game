(()=>{
const $=x=>document.getElementById(x),bd=$('board'),tr=$('myHand'),g=$('guide'),st=$('status');
const rows={P:0,L:1,N:2,S:3,G:4,B:5,R:6,K:7,p:7,l:8,n:8,s:8,b:9,r:10},pr={P:'p',L:'l',N:'n',S:'s',B:'b',R:'r'};
let a=[],sel=-1,drop=-1,side=0,h=[];const back='LNSGKGSNL'.split('');
function init(){a=Array(81).fill('');back.forEach((x,i)=>{a[i]=x.toLowerCase();a[72+i]=x});for(let i=0;i<9;i++){a[18+i]='p';a[54+i]='P'}a[10]='b';a[16]='r';a[64]='R';a[70]='B';side=0;h=[];draw()}
function own(p){return p&&((side===0)===(p===p.toUpperCase()))}
function moveTo(i){if(side)return;if(drop>=0&&!a[i]){a[i]=h.splice(drop,1)[0];drop=-1;end();return}if(sel>=0&&ok(i)){let p=a[sel],cap=a[i],rank=i/9|0;a[i]=p;a[sel]='';sel=-1;if(cap)h.push(cap.toUpperCase());if(pr[p]&&rank<=2){let force=(p==='P'||p==='L')&&rank===0||p==='N'&&rank<=1;if(force||confirm('Promote this unit?'))a[i]=pr[p]}end();return}if(own(a[i])){sel=i;drop=-1;draw()}}
function ok(i){if(sel<0||a[i]&&own(a[i]))return false;let p=a[sel].toUpperCase(),x=sel%9,y=sel/9|0,X=i%9,Y=i/9|0,dx=X-x,dy=Y-y,s=side?-1:1;if(p==='P'||p==='L')return dx===0&&dy===s;if(p==='N')return Math.abs(dx)===1&&dy===2*s;if('KGS'.includes(p))return Math.abs(dx)<=1&&Math.abs(dy)<=1;return p==='B'?Math.abs(dx)===Math.abs(dy):p==='R'&&(dx===0||dy===0)}
function draw(){bd.innerHTML='';a.forEach((p,i)=>{let e=document.createElement('div');e.className='cell '+(sel===i?'pick':'')+(sel>=0&&ok(i)?' can':'');e.onclick=()=>moveTo(i);if(p){let u=document.createElement('div'),t=p.toUpperCase(),r=rows[p===t?t:t.toLowerCase()];u.className='unit '+(p===t?'':'blue');u.style.backgroundImage=`url(${p===t?'./shogi-player.png':'./shogi-enemy.png'})`;u.style.backgroundSize='600% 1100%';u.style.backgroundPosition=`25% ${r/10*100}%`;e.append(u)}bd.append(e)});tr.innerHTML='';h.forEach((p,i)=>{let b=document.createElement('button');b.className='buy';b.textContent=p;b.onclick=()=>{drop=i;sel=-1;g.textContent='Choose an empty square.';draw()};tr.append(b)});st.textContent=side?'Computer turn':'Your turn'}
function end(){side=1;draw();g.textContent='Computer is thinking...';setTimeout(ai,550)}
function ai(){let z=[];a.forEach((p,i)=>{if(p&&p===p.toLowerCase())for(let j=0;j<81;j++){let o=sel;sel=i;if(ok(j))z.push([i,j]);sel=o}});if(z[0]){let[x,y]=z.find(v=>a[v[1]])||z[0];a[y]=a[x];a[x]=''}side=0;draw();g.textContent='Your turn.'}init()
})();
