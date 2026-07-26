
import { ChangeEvent, FormEvent, useMemo, useState } from 'react'
import './styles.css'

type SpaceType='personal'|'household'|'work'|'friends'
type Role='Owner'|'Admin'|'Approver'|'Member'
type Screen='home'|'activities'|'leaderboard'|'stats'|'goals'|'treats'|'community'|'notifications'|'members'|'settings'|'profile'|'account-settings'|'plan'|'friends'|'activity-settings'
type ActivityStatus='open'|'pending'|'complete'|'paused'|'archived'
type Visibility='space'|'private'|'selected'
type ProofMode='None'|'Optional photo'|'Required photo'
type CompletionMode='shared_once'|'per_member'
type NotificationPref={leaderboard:boolean;approvals:boolean;milestones:boolean;tiers:boolean;daily:boolean;community:boolean}

type Member={id:string;name:string;avatar?:string;globalLifetime:number;tier:string}
type SpaceMember={memberId:string;role:Role;balance:number;lifetime:number;weekly:number;joinedAt:string}
type Activity={
 id:string;spaceId:string;name:string;icon:string;category:string;points:number;recurrence:string;
 status:ActivityStatus;visibility:Visibility;visibleTo?:string[];assignedTo:string[];completionMode:CompletionMode;
 approval:boolean;approverIds:string[];proofMode:ProofMode;completedBy?:string;completedAt?:string;
 contributesToGoals:boolean;version:number;createdBy:string
}
type Treat={id:string;spaceId:string;name:string;icon:string;description:string;points:number;assignedTo:string[];priorityFor:string[];status:'locked'|'obtained';obtainedBy?:string;obtainedAt?:string}
type Goal={id:string;spaceId:string;name:string;icon:string;target:number;progress:number;status:'active'|'reached'|'celebrated';contributionMode:'space_only'|'selected';allowedSpaceIds:string[]}
type Space={id:string;name:string;icon:string;type:SpaceType;timezone:string;members:SpaceMember[];weeklyLeaderboard:boolean;poolEnabled:boolean;poolBalance:number}
type Notification={id:string;recipientId:string;spaceId?:string;title:string;body:string;read:boolean;action?:Screen;activityId?:string;createdAt:string}
type Friend={memberId:string;status:'connected'|'pending'}
type CommunityChallenge={id:string;title:string;icon:string;description:string;points:number;category:string;joins:string[];completedBy:string[];comments:{id:string;memberId:string;text:string}[]}
type History={id:string;spaceId:string;memberId:string;activityId?:string;title:string;detail:string;points:number;kind:'earn'|'undo'|'delete'|'treat'|'goal'|'admin';createdAt:string}
type AppData={
 currentUserId:string;members:Member[];spaces:Space[];activities:Activity[];treats:Treat[];goals:Goal[];
 notifications:Notification[];friends:Friend[];challenges:CommunityChallenge[];history:History[];
 notificationPrefs:Record<string,NotificationPref>
}

const BRAND={name:'Rally',logo:'✦',tagline:'Make progress feel good.'}
const KEY='rally-phase-7'
const now=()=>new Date().toLocaleString()
const historyEntry=(entry:History):History=>entry

const seed:AppData={
 currentUserId:'kerriann',
 members:[
  {id:'kerriann',name:'KerriAnn',globalLifetime:6240,tier:'Platinum'},
  {id:'zak',name:'Zak',globalLifetime:5860,tier:'Gold'},
  {id:'maya',name:'Maya',globalLifetime:3180,tier:'Gold'},
  {id:'sam',name:'Sam',globalLifetime:2100,tier:'Silver'}
 ],
 spaces:[
  {id:'personal',name:'My Rally',icon:'✨',type:'personal',timezone:'America/New_York',weeklyLeaderboard:false,poolEnabled:false,poolBalance:0,members:[
   {memberId:'kerriann',role:'Owner',balance:245,lifetime:1560,weekly:85,joinedAt:'2026-07-01'}
  ]},
  {id:'home',name:'Williams-Hurt Home',icon:'🏠',type:'household',timezone:'America/New_York',weeklyLeaderboard:true,poolEnabled:true,poolBalance:310,members:[
   {memberId:'kerriann',role:'Admin',balance:420,lifetime:2460,weekly:125,joinedAt:'2026-01-01'},
   {memberId:'zak',role:'Admin',balance:385,lifetime:2780,weekly:140,joinedAt:'2026-01-01'}
  ]},
  {id:'work',name:'Work Rally',icon:'💼',type:'work',timezone:'America/New_York',weeklyLeaderboard:true,poolEnabled:false,poolBalance:0,members:[
   {memberId:'kerriann',role:'Member',balance:180,lifetime:1280,weekly:60,joinedAt:'2026-06-01'},
   {memberId:'maya',role:'Admin',balance:220,lifetime:1780,weekly:95,joinedAt:'2026-06-01'},
   {memberId:'sam',role:'Approver',balance:155,lifetime:1100,weekly:55,joinedAt:'2026-06-01'}
  ]}
 ],
 activities:[
  {id:'p1',spaceId:'personal',name:'Read 30 minutes',icon:'📚',category:'Growth',points:15,recurrence:'Every day',status:'open',visibility:'private',assignedTo:['kerriann'],completionMode:'per_member',approval:false,approverIds:[],proofMode:'None',contributesToGoals:false,version:1,createdBy:'kerriann'},
  {id:'h1',spaceId:'home',name:'Take out trash',icon:'🗑️',category:'Home',points:8,recurrence:'Every week',status:'open',visibility:'space',assignedTo:['kerriann','zak'],completionMode:'shared_once',approval:false,approverIds:[],proofMode:'None',contributesToGoals:true,version:1,createdBy:'kerriann'},
  {id:'h2',spaceId:'home',name:'Deep clean floors',icon:'✨',category:'Home',points:45,recurrence:'Every 3 months',status:'pending',visibility:'space',assignedTo:['zak'],completionMode:'shared_once',approval:true,approverIds:['kerriann'],proofMode:'Required photo',completedBy:'zak',contributesToGoals:true,version:1,createdBy:'kerriann'},
  {id:'h3',spaceId:'home',name:'Feed Harley dinner',icon:'🐾',category:'Pets',points:5,recurrence:'Every day',status:'complete',visibility:'space',assignedTo:['kerriann','zak'],completionMode:'shared_once',approval:false,approverIds:[],proofMode:'None',completedBy:'kerriann',completedAt:'Today',contributesToGoals:true,version:1,createdBy:'kerriann'},
  {id:'w1',spaceId:'work',name:'Finish learning module',icon:'🎓',category:'Learning',points:25,recurrence:'One time',status:'open',visibility:'space',assignedTo:['kerriann','maya','sam'],completionMode:'per_member',approval:true,approverIds:['sam'],proofMode:'Optional photo',contributesToGoals:false,version:1,createdBy:'maya'}
 ],
 treats:[
  {id:'t1',spaceId:'home',name:'Weekend brunch',icon:'🥞',description:'A slow Saturday brunch together.',points:500,assignedTo:['kerriann','zak'],priorityFor:['kerriann'],status:'locked'},
  {id:'t2',spaceId:'personal',name:'Bookstore afternoon',icon:'📚',description:'Coffee and one new book.',points:350,assignedTo:['kerriann'],priorityFor:['kerriann'],status:'locked'}
 ],
 goals:[
  {id:'g1',spaceId:'home',name:'Weekend getaway',icon:'🌴',target:2500,progress:1860,status:'active',contributionMode:'space_only',allowedSpaceIds:['home']},
  {id:'g2',spaceId:'work',name:'Team learning sprint',icon:'🚀',target:1800,progress:940,status:'active',contributionMode:'space_only',allowedSpaceIds:['work']}
 ],
 notifications:[
  {id:'n1',recipientId:'kerriann',spaceId:'home',title:'Approval needed 👀',body:'Zak completed Deep clean floors. Review it now.',read:false,action:'activities',activityId:'h2',createdAt:'10 min ago'},
  {id:'n2',recipientId:'kerriann',spaceId:'home',title:'Zak took the lead 🏁',body:'Zak is 15 points ahead this week. Complete Deep clean floors approval or a 20-point activity to catch up.',read:false,action:'leaderboard',createdAt:'1 hr ago'},
  {id:'n3',recipientId:'kerriann',title:'Platinum tier unlocked ✨',body:'You crossed 6,000 lifetime Rally points.',read:true,createdAt:'Yesterday'}
 ],
 friends:[{memberId:'maya',status:'connected'}],
 challenges:[
  {id:'c1',title:'7-Day Reset',icon:'✨',description:'Complete one meaningful reset activity each day for a week.',points:100,category:'Wellness',joins:['maya'],completedBy:[],comments:[{id:'cc1',memberId:'maya',text:'Day 3 and still going!'}]},
  {id:'c2',title:'Declutter Five',icon:'📦',description:'Remove five things you no longer need.',points:60,category:'Home',joins:['sam'],completedBy:['maya'],comments:[]}
 ],
 history:[
  {id:'hh1',spaceId:'home',memberId:'kerriann',activityId:'h3',title:'Feed Harley dinner',detail:'KerriAnn completed this activity',points:5,kind:'earn',createdAt:'Today'}
 ],
 notificationPrefs:{
  kerriann:{leaderboard:true,approvals:true,milestones:true,tiers:true,daily:true,community:true},
  zak:{leaderboard:true,approvals:true,milestones:true,tiers:true,daily:false,community:true}
 }
}

function load():AppData{try{return JSON.parse(localStorage.getItem(KEY)||'null')||seed}catch{return seed}}
const saveLocal=(d:AppData)=>localStorage.setItem(KEY,JSON.stringify(d))
const memberName=(d:AppData,id:string)=>d.members.find(m=>m.id===id)?.name||'Member'
const initials=(name:string)=>name.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()
const POINT_OPTIONS=[5,10,15,20,25,30,40,50,75,100]
const suggestedPoints=(name:string,category:string)=>{const t=(name+' '+category).toLowerCase();if(/deep|project|mow|presentation/.test(t))return 40;if(/laundry|workout|study|organize|module/.test(t))return 20;if(/feed|bed|trash|mail/.test(t))return 10;return 15}
const roleFor=(s:Space,userId:string)=>s.members.find(m=>m.memberId===userId)?.role
const spaceMember=(s:Space,userId:string)=>s.members.find(m=>m.memberId===userId)

export default function App(){
 const [data,setData]=useState<AppData>(load)
 const [spaceId,setSpaceId]=useState<string>('all')
 const [screen,setScreen]=useState<Screen>('home')
 const [toast,setToast]=useState('')
 const [inviteOpen,setInviteOpen]=useState(false)
 const user=data.members.find(m=>m.id===data.currentUserId)!
 const spaces=data.spaces.filter(s=>s.members.some(m=>m.memberId===user.id))
 const activeSpace=spaceId==='all'?null:spaces.find(s=>s.id===spaceId)||spaces[0]
 const isSolo=activeSpace?.members.length===1
 const myRole=activeSpace?roleFor(activeSpace,user.id):undefined
 const update=(next:AppData)=>{setData(next);saveLocal(next)}
 const note=(msg:string)=>{setToast(msg);setTimeout(()=>setToast(''),1800)}
 const visibleActivities=useMemo(()=>{
  const scoped=data.activities.filter(a=>spaceId==='all'?spaces.some(s=>s.id===a.spaceId):a.spaceId===spaceId)
  if(spaceId==='all') return scoped.filter(a=>{
   const s=spaces.find(sp=>sp.id===a.spaceId)
   return (s?.members.length||0)>1 ? true : (a.visibility==='space'||a.createdBy===user.id||a.visibleTo?.includes(user.id))
  })
  const s=spaces.find(sp=>sp.id===spaceId)
  return (s?.members.length||0)>1 ? scoped : scoped.filter(a=>a.visibility==='space'||a.createdBy===user.id||a.visibleTo?.includes(user.id))
 },[data.activities,spaceId,user.id,spaces])
 const myNotifications=data.notifications.filter(n=>n.recipientId===user.id)
 const unread=myNotifications.filter(n=>!n.read).length

 const complete=(a:Activity)=>{
  if(a.status==='complete'){
   undoComplete(a)
   return
  }
  if(a.status==='pending'||a.status==='paused'||a.status==='archived')return
  if(a.approval&&a.approverIds.length){
   update({...data,activities:data.activities.map(x=>x.id===a.id?{...x,status:'pending',completedBy:user.id,completedAt:now()}:x),
    notifications:[
     ...a.approverIds.map(id=>({id:crypto.randomUUID(),recipientId:id,spaceId:a.spaceId,title:'Approval needed 👀',body:`${user.name} completed ${a.name}. Tap to review.`,read:false,action:'activities' as Screen,activityId:a.id,createdAt:'Just now'})),
     ...data.notifications
    ]})
   note('Sent for approval.')
   return
  }
  award(a,user.id)
 }
 const award=(a:Activity,who:string)=>{
  const s=data.spaces.find(x=>x.id===a.spaceId)!
  const nextSpaces=data.spaces.map(sp=>sp.id!==s.id?sp:{...sp,members:sp.members.map(sm=>sm.memberId!==who?sm:{...sm,balance:sm.balance+a.points,lifetime:sm.lifetime+a.points,weekly:sm.weekly+a.points})})
  const nextMembers=data.members.map(m=>m.id!==who?m:{...m,globalLifetime:m.globalLifetime+a.points})
  const nextGoals=data.goals.map(g=>g.spaceId===a.spaceId&&g.status==='active'&&a.contributesToGoals?{...g,progress:Math.min(g.target,g.progress+a.points),status:(Math.min(g.target,g.progress+a.points)>=g.target?'reached':'active') as Goal['status']}:g)
  const next={...data,spaces:nextSpaces,members:nextMembers,goals:nextGoals,
   activities:data.activities.map((x):Activity=>x.id===a.id?{...x,status:'complete' as ActivityStatus,completedBy:who,completedAt:now()}:x),
   notifications:data.notifications.map(n=>n.activityId===a.id&&n.recipientId===user.id?{...n,read:true}:n),
   history:[historyEntry({id:crypto.randomUUID(),spaceId:a.spaceId,memberId:who,activityId:a.id,title:a.name,detail:`${memberName(data,who)} completed this activity`,points:a.points,kind:'earn',createdAt:now()}),...data.history]
  }
  update(next)
  note(`+${a.points} points`)
 }
 const undoComplete=(a:Activity)=>{
  if(a.status!=='complete'||!a.completedBy)return
  const who=a.completedBy
  const s=data.spaces.find(x=>x.id===a.spaceId)!
  const nextSpaces=data.spaces.map(sp=>sp.id!==s.id?sp:{...sp,members:sp.members.map(sm=>sm.memberId!==who?sm:{...sm,balance:Math.max(0,sm.balance-a.points),lifetime:Math.max(0,sm.lifetime-a.points),weekly:Math.max(0,sm.weekly-a.points)})})
  const nextMembers=data.members.map(m=>m.id!==who?m:{...m,globalLifetime:Math.max(0,m.globalLifetime-a.points)})
  const nextGoals=data.goals.map(g=>g.spaceId===a.spaceId&&a.contributesToGoals&&g.status!=='celebrated'?{...g,progress:Math.max(0,g.progress-a.points),status:(Math.max(0,g.progress-a.points)>=g.target?'reached':'active') as Goal['status']}:g)
  update({...data,spaces:nextSpaces,members:nextMembers,goals:nextGoals,activities:data.activities.map((x):Activity=>x.id===a.id?{...x,status:'open' as ActivityStatus,completedBy:undefined,completedAt:undefined}:x),history:[historyEntry({id:crypto.randomUUID(),spaceId:a.spaceId,memberId:who,activityId:a.id,title:a.name,detail:`${memberName(data,who)} undid this completion`,points:a.points,kind:'undo',createdAt:now()}),...data.history]})
  note('Completion undone and points removed.')
 }
 const approve=(a:Activity)=>{
  if(a.status!=='pending'||!a.approverIds.includes(user.id))return
  award(a,a.completedBy||user.id)
 }
 const sendBack=(a:Activity)=>{
  if(a.status!=='pending'||!a.approverIds.includes(user.id))return
  update({...data,activities:data.activities.map((x):Activity=>x.id===a.id?{...x,status:'open' as ActivityStatus,completedBy:undefined,completedAt:undefined}:x),notifications:data.notifications.map(n=>n.activityId===a.id&&n.recipientId===user.id?{...n,read:true}:n)})
  note('Activity sent back.')
 }

 return <div className="app">
  {toast&&<div className="toast">{toast}</div>}
  <header className="topbar">
   <button className="brand" onClick={()=>setScreen('home')}><span>{BRAND.logo}</span><b>{BRAND.name}</b></button>
   <div className="space-switcher">
    <select value={spaceId} onChange={e=>{setSpaceId(e.target.value);setScreen('home')}}>
     <option value="all">🌈 All My Rally</option>
     {spaces.map(s=><option value={s.id} key={s.id}>{s.icon} {s.name}</option>)}
    </select>
    <button className="plus" title="Create a Rally Space" aria-label="Create a Rally Space" onClick={()=>setInviteOpen(!inviteOpen)}>＋</button>
   </div>
   <div className="top-actions">
    <button className="bell" title="Notifications" aria-label="Notifications" onClick={()=>setScreen('notifications')}>🔔{unread>0&&<b>{unread}</b>}</button>
    <button className="profile-shortcut" onClick={()=>setScreen('profile')}><Avatar member={user}/></button>
   </div>
  </header>

  {inviteOpen&&<CreateSpace data={data} update={update} user={user} close={()=>setInviteOpen(false)}/>}

  <main>
   {spaceId==='all'?<AllView data={data} user={user} spaces={spaces} screen={screen} setScreen={setScreen} setSpaceId={setSpaceId}/>:activeSpace&&<>
    <SpaceHeader space={activeSpace} role={myRole} openSettings={()=>setScreen('settings')}/>
    {screen==='home'&&<SpaceHome data={data} space={activeSpace} user={user} activities={visibleActivities} complete={complete} setScreen={setScreen}/>}
    {screen==='activities'&&<Activities data={data} space={activeSpace} user={user} activities={visibleActivities} complete={complete} approve={approve} sendBack={sendBack} update={update} note={note}/>}
    {screen==='leaderboard'&&<Leaderboard data={data} space={activeSpace} user={user}/>}
    {screen==='stats'&&<Stats data={data} space={activeSpace}/>}
    {screen==='goals'&&<Goals data={data} space={activeSpace}/>}
    {screen==='treats'&&<Treats data={data} space={activeSpace} user={user} update={update} note={note}/>}
    {screen==='members'&&<Members data={data} space={activeSpace} user={user} update={update} note={note}/>}
    {screen==='settings'&&<SpaceSettings data={data} space={activeSpace} user={user} update={update} note={note}/>}
   </>}
   {screen==='community'&&<Community data={data} user={user} spaces={spaces} update={update} note={note}/>}
   {screen==='profile'&&<Profile data={data} user={user} spaces={spaces} update={update} note={note} setSpaceId={setSpaceId} setScreen={setScreen}/>}
   {screen==='account-settings'&&<AccountSettings data={data} user={user} update={update} note={note}/>}
   {screen==='plan'&&<PlanSettings data={data} user={user} spaces={spaces} setSpaceId={setSpaceId} setScreen={setScreen}/>}
   {screen==='friends'&&<FriendsSettings data={data} user={user} update={update} note={note}/>}
   {screen==='activity-settings'&&<ActivitySettingsIndex data={data} user={user} spaces={spaces} setSpaceId={setSpaceId} setScreen={setScreen}/>}
   {screen==='notifications'&&<Notifications data={data} user={user} update={update} setSpaceId={setSpaceId} setScreen={setScreen}/>}
  </main>

  <nav className="nav">
   <NavButton active={screen==='home'} icon="⌂" label="Home" go={()=>setScreen('home')}/>
   {spaceId!=='all'&&<><NavButton active={screen==='activities'} icon="✓" label="Activities" go={()=>setScreen('activities')}/><NavButton active={screen==='leaderboard'} icon="🏁" label="Leaderboard" go={()=>setScreen('leaderboard')}/><NavButton active={screen==='goals'} icon="◎" label="Goals" go={()=>setScreen('goals')}/><NavButton active={screen==='treats'} icon="🎁" label="Treats" go={()=>setScreen('treats')}/></>}
   <NavButton active={screen==='community'} icon="◉" label="Community" go={()=>setScreen('community')}/>
   {spaceId!=='all'&&<NavButton active={screen==='members'} icon="👥" label="Members" go={()=>setScreen('members')}/>}
   <NavButton active={screen==='profile'} icon="☺" label="Profile" go={()=>setScreen('profile')}/>
  </nav>
 </div>
}

function Avatar({member}:{member:Member}){return member.avatar?<img className="avatar" src={member.avatar}/>:<span className="avatar">{initials(member.name)}</span>}
function NavButton({active,icon,label,go}:{active:boolean;icon:string;label:string;go:()=>void}){return <button className={active?'active':''} onClick={go}><span>{icon}</span><small>{label}</small></button>}
function Progress({value,max}:{value:number;max:number}){return <div className="progress"><span style={{width:`${Math.min(100,value/Math.max(1,max)*100)}%`}}/></div>}

function SpaceHeader({space,role,openSettings}:{space:Space;role?:Role;openSettings:()=>void}){const canManage=role==='Owner'||role==='Admin';return <section className={`space-header ${space.type}`}><div><p>{space.icon} {space.type.toUpperCase()} RALLY</p><h1>{space.name}</h1><span>{space.timezone}</span></div><div className="space-header-actions"><span className="role">{role}</span>{canManage&&<button className="space-settings-button" onClick={openSettings}>⚙️ Settings</button>}</div></section>}

function AllView({data,user,spaces,screen,setScreen,setSpaceId}:{data:AppData;user:Member;spaces:Space[];screen:Screen;setScreen:(s:Screen)=>void;setSpaceId:(id:string)=>void}){
 if(screen==='community'||screen==='notifications'||screen==='profile')return null
 const today=data.history.filter(h=>h.memberId===user.id).slice(0,6)
 const totalWeek=spaces.reduce((sum,s)=>sum+(spaceMember(s,user.id)?.weekly||0),0)
 return <>
  <section className="all-hero"><div><p>🌈 ALL MY RALLY</p><h1>Your whole life, one view.</h1><span>See what needs attention without mixing each Rally's private points or data.</span></div><div className="big-total"><strong>{totalWeek}</strong><span>points this week</span></div></section>
  <section className="all-grid">{spaces.map(s=>{const sm=spaceMember(s,user.id)!;const rank=[...s.members].sort((a,b)=>b.weekly-a.weekly).findIndex(m=>m.memberId===user.id)+1;const open=data.activities.filter(a=>a.spaceId===s.id&&a.status==='open'&&(a.assignedTo.includes(user.id)||a.assignedTo.length===0)).length;const pending=data.activities.filter(a=>a.spaceId===s.id&&a.status==='pending'&&a.approverIds.includes(user.id)).length;return <button className="space-summary" key={s.id} onClick={()=>{setSpaceId(s.id);setScreen('home')}}><div className="space-summary-top"><span className="space-icon">{s.icon}</span><div><strong>{s.name}</strong><small>{s.type}</small></div><b>→</b></div><div className="summary-stats"><span><b>{sm.balance}</b> available</span><span><b>{sm.weekly}</b> this week</span>{s.members.length>1&&<span><b>#{rank}</b> rank</span>}</div><div className="summary-bottom"><span>{open} activities ready</span>{pending>0&&<span className="alert">{pending} approval{pending>1?'s':''}</span>}</div></button>})}</section>
  <section className="panel"><div className="section-title"><div><p className="eyebrow">Across your spaces</p><h2>Recent wins</h2></div></div>{today.map(h=><div className="history-row" key={h.id}><span>{data.spaces.find(s=>s.id===h.spaceId)?.icon}</span><div><strong>{h.title}</strong><small>{data.spaces.find(s=>s.id===h.spaceId)?.name} · {h.createdAt}</small></div><b>+{h.points}</b></div>)}</section>
 </>}

function SpaceHome({data,space,user,activities,complete,setScreen}:{data:AppData;space:Space;user:Member;activities:Activity[];complete:(a:Activity)=>void;setScreen:(s:Screen)=>void}){
 const sm=spaceMember(space,user.id)!
 const leaders=[...space.members].sort((a,b)=>b.weekly-a.weekly)
 const max=Math.max(1,...leaders.map(x=>x.weekly))
 const ready=activities.filter(a=>a.status==='open'&&(a.assignedTo.includes(user.id)||a.assignedTo.length===0)).slice(0,4)
 const priority=data.treats.find(t=>t.spaceId===space.id&&t.status==='locked'&&t.priorityFor.includes(user.id))
 const recent=data.history.filter(h=>h.spaceId===space.id).slice(0,5)
 return <>
  <section className="home-hero"><div><p>{BRAND.tagline}</p><h2>Hey {user.name}! 👋</h2><span>{ready.length} things are ready for you in this Rally.</span></div><div className="score"><strong>{sm.balance}</strong><span>available points</span><small>{sm.weekly} this week</small></div></section>
  {space.members.length>1&&<section className="leaderboard-preview"><div className="section-title"><div><p className="eyebrow">Weekly race</p><h2>Leaderboard 🏁</h2></div><button onClick={()=>setScreen('leaderboard')}>Full leaderboard →</button></div>{leaders.map((m,i)=><div className={`racer ${i===0?'first':''}`} key={m.memberId}><span>{i===0?'👑':`#${i+1}`}</span><Avatar member={data.members.find(x=>x.id===m.memberId)!}/><strong>{memberName(data,m.memberId)}</strong><div className="track"><i style={{width:`${Math.max(8,m.weekly/max*100)}%`}}/></div><b>{m.weekly}</b></div>)}</section>}
  <section className="point-strip">{space.members.map(m=><article key={m.memberId} className={m.memberId===user.id?'me':''}><Avatar member={data.members.find(x=>x.id===m.memberId)!}/><div><small>{memberName(data,m.memberId)}</small><strong>{m.balance}</strong><span>{m.weekly} this week</span></div></article>)}</section>
  <section className="quick-actions"><button onClick={()=>setScreen('activities')}>＋ Activity</button><button onClick={()=>setScreen('goals')}>＋ Goal</button><button onClick={()=>setScreen('treats')}>＋ Treat</button></section><section className="home-grid"><article className="panel"><div className="section-title"><div><p className="eyebrow">Ready now</p><h2>Activities</h2></div><button onClick={()=>setScreen('activities')}>See all</button></div>{ready.length?ready.map(a=><ActivityCard key={a.id} a={a} data={data} user={user} complete={complete}/>):<div className="empty">Everything for this period is complete 🎉</div>}</article><article className="panel priority"><p className="eyebrow">Top-priority treat</p>{priority?<><span className="huge">{priority.icon}</span><h2>{priority.name}</h2><p>{priority.description}</p><Progress value={sm.balance} max={priority.points}/><b>{Math.max(0,priority.points-sm.balance)} points to go</b></>:<><h2>Pick your motivation</h2><p>Set a treat as top priority and it will live here.</p></>}</article></section>
  {space.members.length>1&&<section className="panel"><div className="section-title"><div><p className="eyebrow">Who did what</p><h2>Recent Rally activity</h2></div></div>{recent.map(h=><div className="history-row" key={h.id}><Avatar member={data.members.find(x=>x.id===h.memberId)!}/><div><strong>{h.title}</strong><small>{h.detail}</small></div><b>+{h.points}</b></div>)}</section>}
 </>}

function ActivityCard({a,data,user,complete,approve,sendBack}:{a:Activity;data:AppData;user:Member;complete:(a:Activity)=>void;approve?:(a:Activity)=>void;sendBack?:(a:Activity)=>void}){
 const canApprove=a.status==='pending'&&a.approverIds.includes(user.id)
 const canUndo=a.status==='complete'&&(a.completedBy===user.id||a.createdBy===user.id||data.spaces.find(s=>s.id===a.spaceId)?.members.find(m=>m.memberId===user.id)?.role==='Admin'||data.spaces.find(s=>s.id===a.spaceId)?.members.find(m=>m.memberId===user.id)?.role==='Owner')
 return <article className={`activity ${a.status}`}><span className="activity-icon">{a.icon}</span><div><strong>{a.name}</strong><small>{a.category} · {a.recurrence} · {a.points} pts</small>{a.completedBy&&<small>Completed by {memberName(data,a.completedBy)}</small>}</div><div className="activity-actions">{a.status==='open'&&<button className="primary" onClick={()=>complete(a)}>Complete +{a.points}</button>}{canApprove&&<><button className="primary" onClick={()=>approve?.(a)}>Approve +{a.points}</button><button className="secondary">View proof</button><button className="secondary" onClick={()=>sendBack?.(a)}>Send back</button></>}{a.status==='pending'&&!canApprove&&<span className="pending">Pending approval</span>}{a.status==='complete'&&<>{canUndo?<button className="secondary" onClick={()=>complete(a)}>Undo completion</button>:<span className="complete">✓ Complete</span>}</>}</div></article>
}

function Activities({data,space,user,activities,complete,approve,sendBack,update,note}:{data:AppData;space:Space;user:Member;activities:Activity[];complete:(a:Activity)=>void;approve:(a:Activity)=>void;sendBack:(a:Activity)=>void;update:(d:AppData)=>void;note:(s:string)=>void}){
 const [name,setName]=useState('');const [category,setCategory]=useState('Home');const [requireApproval,setRequireApproval]=useState(false)
 const points=suggestedPoints(name,category)
 const add=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const f=new FormData(e.currentTarget);const assigned=Array.from(f.getAll('assigned')).map(String);const approvers=Array.from(f.getAll('approver')).map(String);const a:Activity={id:crypto.randomUUID(),spaceId:space.id,name:String(f.get('name')),icon:String(f.get('icon')||'✨'),category:String(f.get('category')),points:Number(f.get('points')),recurrence:String(f.get('recurrence')),status:'open',visibility:String(f.get('visibility')) as Visibility,assignedTo:assigned.length?assigned:space.members.map(m=>m.memberId),completionMode:String(f.get('completionMode')) as CompletionMode,approval:f.get('approval')==='on',approverIds:approvers,proofMode:String(f.get('proof')) as ProofMode,contributesToGoals:f.get('goals')==='on',version:1,createdBy:user.id};update({...data,activities:[a,...data.activities]});setName('');setRequireApproval(false);note('Activity added.')}
 const canManage=['Owner','Admin'].includes(roleFor(space,user.id)||'')
 return <>
  <section className="activity-hero"><div><p>✓ THIS PERIOD</p><h1>Activities</h1><span>Incomplete activities simply earn no points. No overdue penalties.</span></div><b>{activities.filter(a=>a.status==='complete').length}/{activities.filter(a=>a.status!=='paused'&&a.status!=='archived').length}</b></section>
  <section className="panel">{activities.filter(a=>a.status!=='archived'&&a.status!=='paused').map(a=><ActivityCard key={a.id} a={a} data={data} user={user} complete={complete} approve={approve} sendBack={sendBack}/>)}</section>
  <form className="panel form" onSubmit={add}><div className="section-title"><div><p className="eyebrow">Create activity</p><h2>Add something new</h2></div></div><div className="two"><label>Name<input name="name" required value={name} onChange={e=>setName(e.target.value)}/></label><label>Icon<input name="icon" placeholder="✨"/></label></div><div className="three"><label>Category<input name="category" value={category} onChange={e=>setCategory(e.target.value)}/></label><label>Points<select name="points" defaultValue={String(points)} key={points}>{POINT_OPTIONS.map(p=><option value={p} key={p}>{p} points</option>)}</select><small>Suggested: {points}. Admin-controlled presets reduce point inflation.</small></label><label>Recurrence<select name="recurrence"><option>Every day</option><option>Every week</option><option>3x/week</option><option>Every other week</option><option>Twice/month</option><option>Every 90 days</option><option>One time</option></select></label></div><div className="three"><label>Completion<select name="completionMode"><option value="shared_once">One completion for the Rally</option><option value="per_member">Each member completes it</option></select></label><label>Visibility<select name="visibility"><option value="space">Visible to Rally</option><option value="private">Private to me</option></select></label><label>Photo proof<select name="proof"><option>None</option><option>Optional photo</option><option>Required photo</option></select></label></div><fieldset><legend>Assign to</legend>{space.members.map(m=><label className="check" key={m.memberId}><input type="checkbox" name="assigned" value={m.memberId}/>{memberName(data,m.memberId)}</label>)}</fieldset>{space.members.length>1&&<><label className="check approval-toggle"><input type="checkbox" name="approval" checked={requireApproval} onChange={e=>setRequireApproval(e.target.checked)}/> Require approval</label>{requireApproval&&<fieldset className="approver-picker"><legend>Who can approve?</legend><p className="field-help">Choose one or more people who can approve this activity.</p><div className="approver-options">{space.members.filter(m=>m.memberId!==user.id).map(m=><label className="person-option" key={m.memberId}><input type="checkbox" name="approver" value={m.memberId}/><Avatar member={data.members.find(x=>x.id===m.memberId)!}/><span>{memberName(data,m.memberId)}</span></label>)}</div></fieldset>}</>}<label className="check"><input type="checkbox" name="goals" defaultChecked/> Count toward this Rally's shared goals</label><button className="primary">Add activity</button></form>
  {canManage&&<p className="admin-note">Lifecycle controls like pause, archive, restore, point changes, and delete belong in Rally Settings so this page stays focused on doing.</p>}
 </>}

function Leaderboard({data,space,user}:{data:AppData;space:Space;user:Member}){
 const leaders=[...space.members].sort((a,b)=>b.weekly-a.weekly);const max=Math.max(1,...leaders.map(x=>x.weekly));const me=leaders.find(x=>x.memberId===user.id)!;const leader=leaders[0];const catchup=Math.max(0,leader.weekly-me.weekly+1);const suggestion=data.activities.filter(a=>a.spaceId===space.id&&a.status==='open'&&a.assignedTo.includes(user.id)).sort((a,b)=>b.points-a.points)[0]
 return <><section className="race-hero"><div><p>🏁 WEEKLY RACE</p><h1>{leader.memberId===user.id?'You’re in first!':'Catch the leader'}</h1><span>{leader.memberId===user.id?`You’re ${leader.weekly-(leaders[1]?.weekly||0)} points ahead.`:`You need ${catchup} more points to take #1.`}</span></div><span className="trophy">🏆</span></section><section className="leaderboard">{leaders.map((m,i)=><article key={m.memberId} className={i===0?'winner':''}><span className="rank">{i===0?'👑':`#${i+1}`}</span><Avatar member={data.members.find(x=>x.id===m.memberId)!}/><div className="who"><strong>{memberName(data,m.memberId)}{m.memberId===user.id?' · You':''}</strong><small>{data.members.find(x=>x.id===m.memberId)?.tier} · {m.lifetime} space lifetime</small></div><div className="track"><i style={{width:`${Math.max(7,m.weekly/max*100)}%`}}/></div><b>{m.weekly} pts</b></article>)}</section>{leader.memberId!==user.id&&suggestion&&<section className="catchup"><span>⚡</span><div><strong>Fastest way to catch up</strong><p>Complete <b>{suggestion.name}</b> for +{suggestion.points} points.</p></div><button>Let’s go</button></section>}</>
}

function Stats({data,space}:{data:AppData;space:Space}){
 const hist=data.history.filter(h=>h.spaceId===space.id&&h.kind==='earn');const cats=[...new Set(data.activities.filter(a=>a.spaceId===space.id).map(a=>a.category))]
 return <><section className="stats-hero"><p>▥ STATS</p><h1>How this Rally moves</h1></section><section className="stats-grid"><article className="panel"><h2>Contribution share</h2><div className="pie" style={{background:`conic-gradient(#5b5df0 0 48%,#ff8f70 48% 100%)`}}><span>100%</span></div>{space.members.map(m=>{const pts=hist.filter(h=>h.memberId===m.memberId).reduce((s,h)=>s+h.points,0);const total=hist.reduce((s,h)=>s+h.points,0)||1;return <p key={m.memberId}>{memberName(data,m.memberId)}: <b>{Math.round(pts/total*100)}%</b></p>})}</article><article className="panel"><h2>Category mix</h2>{cats.map(c=>{const ids=data.activities.filter(a=>a.spaceId===space.id&&a.category===c).map(a=>a.id);const pts=hist.filter(h=>h.activityId&&ids.includes(h.activityId)).reduce((s,h)=>s+h.points,0);const total=hist.reduce((s,h)=>s+h.points,0)||1;return <div className="statbar" key={c}><span>{c}</span><Progress value={pts} max={total}/><b>{Math.round(pts/total*100)}%</b></div>})}</article></section></>
}

function Goals({data,space}:{data:AppData;space:Space}){
 const [local,setLocal]=useState(data)
 const goals=local.goals.filter(g=>g.spaceId===space.id)
 const add=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const f=new FormData(e.currentTarget);const g:Goal={id:crypto.randomUUID(),spaceId:space.id,name:String(f.get('name')),icon:String(f.get('icon')||'🎯'),target:Number(f.get('target')),progress:0,status:'active',contributionMode:'space_only',allowedSpaceIds:[space.id]};const next={...local,goals:[g,...local.goals]};setLocal(next);saveLocal(next);e.currentTarget.reset()}
 return <><section className="goal-hero"><div><p>◎ SHARED GOALS</p><h1>Build toward something together</h1><span>Active Rally points can move these forward when the activity is set to contribute.</span></div><span className="huge">🎯</span></section><section className="cards">{goals.map(g=><article className="goal" key={g.id}><span>{g.icon}</span><p className="eyebrow">{g.status}</p><h2>{g.name}</h2><Progress value={g.progress} max={g.target}/><b>{g.progress}/{g.target} points</b>{g.status==='reached'&&<button className="primary">Mark celebrated</button>}</article>)}</section><form className="panel form create-card"><div className="section-title"><div><p className="eyebrow">Add goal</p><h2>Create a Rally goal</h2></div><span className="create-icon">＋</span></div><div className="two"><label>Goal name<input name="name" required placeholder="Weekend getaway"/></label><label>Icon<input name="icon" placeholder="🌴"/></label></div><label>Target points<select name="target" defaultValue="1000">{[250,500,750,1000,1500,2000,2500,3000,5000].map(p=><option key={p} value={p}>{p} points</option>)}</select></label><button className="primary">Add goal</button></form></>
}

function Treats({data,space,user,update,note}:{data:AppData;space:Space;user:Member;update:(d:AppData)=>void;note:(s:string)=>void}){
 const treats=data.treats.filter(t=>t.spaceId===space.id);const sm=spaceMember(space,user.id)!;const locked=treats.filter(t=>t.status==='locked'),obtained=treats.filter(t=>t.status==='obtained')
 const obtain=(t:Treat)=>{if(sm.balance<t.points){note(`${t.points-sm.balance} more points needed.`);return}const nextSpaces=data.spaces.map(s=>s.id!==space.id?s:{...s,members:s.members.map(m=>m.memberId!==user.id?m:{...m,balance:m.balance-t.points})});const alerts=space.members.filter(m=>m.memberId!==user.id).map(m=>({id:crypto.randomUUID(),recipientId:m.memberId,spaceId:space.id,title:'Treat obtained! 🎁',body:`${user.name} obtained ${t.name}.`,read:false,action:'treats' as Screen,createdAt:'Just now'}));update({...data,spaces:nextSpaces,treats:data.treats.map(x=>x.id===t.id?{...x,status:'obtained',obtainedBy:user.id,obtainedAt:now(),priorityFor:[]}:x),notifications:[...alerts,...data.notifications]});note('Treat obtained!')}
 const priority=(t:Treat)=>update({...data,treats:data.treats.map(x=>x.spaceId===space.id?{...x,priorityFor:x.id===t.id?[user.id]:x.priorityFor.filter(id=>id!==user.id)}:x)})
 const add=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const f=new FormData(e.currentTarget);const assigned=Array.from(f.getAll('assignedTo')).map(String);const t:Treat={id:crypto.randomUUID(),spaceId:space.id,name:String(f.get('name')),icon:String(f.get('icon')||'🎁'),description:String(f.get('description')||''),points:Number(f.get('points')),assignedTo:assigned.length?assigned:[user.id],priorityFor:f.get('priority')==='on'?[user.id]:[],status:'locked'};update({...data,treats:[t,...data.treats]});e.currentTarget.reset();note('Treat added.')}
 return <><section className="treat-hero"><div><p>🎁 TREAT YOURSELF</p><h1>Something fun to work toward</h1><span>Create your own motivation or work toward something shared.</span></div><span className="huge">✨</span></section><section className="cards">{locked.map(t=><article className={`treat ${t.priorityFor.includes(user.id)?'priority':''}`} key={t.id}><span className="huge">{t.icon}</span>{t.priorityFor.includes(user.id)&&<em>⭐ Top priority</em>}<h2>{t.name}</h2><p>{t.description}</p><small>For {t.assignedTo.map(id=>memberName(data,id)).join(', ')}</small><Progress value={sm.balance} max={t.points}/><b>{sm.balance}/{t.points}</b><div><button className="secondary" onClick={()=>priority(t)}>☆ Priority</button><button className="primary" onClick={()=>obtain(t)}>Mark obtained</button></div></article>)}</section><form className="panel form create-card"><div className="section-title"><div><p className="eyebrow">Add treat</p><h2>Create a custom treat</h2></div><span className="create-icon">＋</span></div><div className="two"><label>Treat name<input name="name" required placeholder="Dinner out"/></label><label>Icon<input name="icon" placeholder="🍝"/></label></div><label>Description<textarea name="description" placeholder="A fun thing to work toward."/></label><label>Unlock at<select name="points" defaultValue="500">{[100,150,200,250,300,400,500,750,1000,1500,2000].map(p=><option key={p} value={p}>{p} points</option>)}</select></label><fieldset><legend>Who is it for?</legend><div className="people-options">{space.members.map(m=><label className="check" key={m.memberId}><input type="checkbox" name="assignedTo" value={m.memberId} defaultChecked={m.memberId===user.id}/>{memberName(data,m.memberId)}</label>)}</div></fieldset><label className="check"><input type="checkbox" name="priority"/> Make this my top-priority treat</label><button className="primary">Add treat</button></form>{obtained.length>0&&<section className="obtained"><h2>Celebration shelf 🎉</h2>{obtained.map(t=><article key={t.id}><span>{t.icon}</span><div><strong>{t.name}</strong><small>{t.obtainedAt}</small></div><b>✓</b></article>)}</section>}</>
}

function Members({data,space,user,update,note}:{data:AppData;space:Space;user:Member;update:(d:AppData)=>void;note:(s:string)=>void}){
 const role=roleFor(space,user.id);const canAdmin=role==='Owner'||role==='Admin'
 const remove=(id:string)=>{if(!canAdmin)return;update({...data,spaces:data.spaces.map(s=>s.id!==space.id?s:{...s,members:s.members.filter(m=>m.memberId!==id)})});note('Member removed. History is preserved.')}
 return <><section className="panel"><div className="section-title"><div><p className="eyebrow">Rally members</p><h2>{space.name}</h2></div>{canAdmin&&<button className="primary">Invite member</button>}</div>{space.members.map(m=><div className="member-row" key={m.memberId}><Avatar member={data.members.find(x=>x.id===m.memberId)!}/><div><strong>{memberName(data,m.memberId)}</strong><small>{m.role} · joined {m.joinedAt}</small></div><span>{m.weekly} pts this week</span>{canAdmin&&m.memberId!==user.id&&<button className="danger" onClick={()=>remove(m.memberId)}>Remove</button>}</div>)}</section></>
}

function SpaceSettings({data,space,user,update,note}:{data:AppData;space:Space;user:Member;update:(d:AppData)=>void;note:(s:string)=>void}){
 const canAdmin=['Owner','Admin'].includes(roleFor(space,user.id)||'');if(!canAdmin)return <section className="panel"><h2>Admin only</h2><p>Only Rally owners and admins can manage these settings.</p></section>
 const acts=data.activities.filter(a=>a.spaceId===space.id)
 const setStatus=(a:Activity,status:ActivityStatus)=>{update({...data,activities:data.activities.map((x):Activity=>x.id===a.id?{...x,status}:x)});note(status==='archived'?'Activity archived.':status==='paused'?'Activity paused.':'Activity restored.')}
 const remove=(a:Activity)=>{if(!confirm(`Permanently delete "${a.name}"? Historical audit entries will remain.`))return;update({...data,activities:data.activities.filter(x=>x.id!==a.id),history:[historyEntry({id:crypto.randomUUID(),spaceId:space.id,memberId:user.id,title:a.name,detail:'Activity permanently deleted. Historical entries preserved for audit.',points:0,kind:'admin',createdAt:now()}),...data.history]});note('Activity deleted.')}
 return <>
  <section className="settings-hero"><div><p>⚙️ RALLY SETTINGS</p><h1>{space.name}</h1><span>Manage how this Rally works without cluttering the everyday Activities page.</span></div></section>
  <section className="panel settings-section"><div className="section-title"><div><p className="eyebrow">Rally options</p><h2>General settings</h2></div></div><div className="settings-options"><div><strong>Timezone</strong><span>{space.timezone}</span></div><label className="switch-row"><span><strong>Weekly leaderboard</strong><small>Show the friendly weekly competition.</small></span><input type="checkbox" checked={space.weeklyLeaderboard} onChange={e=>update({...data,spaces:data.spaces.map(s=>s.id===space.id?{...s,weeklyLeaderboard:e.target.checked}:s)})}/></label><label className="switch-row"><span><strong>Shared Rally point pool</strong><small>Allow this Rally to build a shared pool for group goals and treats.</small></span><input type="checkbox" checked={space.poolEnabled} onChange={e=>update({...data,spaces:data.spaces.map(s=>s.id===space.id?{...s,poolEnabled:e.target.checked}:s)})}/></label></div></section>
  <section className="panel settings-section"><div className="section-title"><div><p className="eyebrow">Activity lifecycle</p><h2>Manage activities</h2></div><span className="settings-count">{acts.length}</span></div><p className="settings-explainer">Pause something temporarily, archive it while keeping earned history, restore it later, or permanently delete it.</p><div className="settings-activity-list">{acts.map(a=><article className={`settings-activity-row ${a.status}`} key={a.id}><div className="settings-activity-info"><span className="activity-icon">{a.icon}</span><div><strong>{a.name}</strong><small>{a.category} · {a.points} points · {a.recurrence}</small><span className={`status-tag ${a.status}`}>{a.status}</span></div></div><div className="settings-activity-actions">{a.status==='archived'?<button className="secondary" onClick={()=>setStatus(a,'open')}>Restore</button>:<><button className="secondary" onClick={()=>setStatus(a,a.status==='paused'?'open':'paused')}>{a.status==='paused'?'Resume':'Pause'}</button><button className="secondary" onClick={()=>setStatus(a,'archived')}>Archive</button></>}<button className="danger" onClick={()=>remove(a)}>Delete</button></div></article>)}</div></section>
 </>}
function Community({data,user,spaces,update,note}:{data:AppData;user:Member;spaces:Space[];update:(d:AppData)=>void;note:(s:string)=>void}){
 const [target,setTarget]=useState(spaces[0]?.id||'')
 const join=(c:CommunityChallenge)=>{const s=data.spaces.find(x=>x.id===target);if(!s)return;const a:Activity={id:'challenge-'+c.id+'-'+crypto.randomUUID(),spaceId:s.id,name:c.title,icon:c.icon,category:c.category,points:c.points,recurrence:'One time',status:'open',visibility:'space',assignedTo:[user.id],completionMode:'per_member',approval:false,approverIds:[],proofMode:'None',contributesToGoals:true,version:1,createdBy:user.id};update({...data,activities:[a,...data.activities],challenges:data.challenges.map(x=>x.id===c.id?{...x,joins:[...new Set([...x.joins,user.id])]}:x)});note(`Added to ${s.name}`)}
 const comment=(c:CommunityChallenge,text:string)=>{if(!text.trim())return;update({...data,challenges:data.challenges.map(x=>x.id===c.id?{...x,comments:[...x.comments,{id:crypto.randomUUID(),memberId:user.id,text}]}:x)})}
 return <><section className="community-hero"><p>◉ COMMUNITY</p><h1>Challenges, friends, and shared wins</h1><span>Your private Rally data stays private unless you choose to share an accomplishment.</span></section><section className="friend-strip"><div><h2>Friends</h2><p>Connected: {data.friends.filter(f=>f.status==='connected').length}</p></div>{data.friends.map(f=><Avatar key={f.memberId} member={data.members.find(m=>m.id===f.memberId)!}/>) }<button className="plus">＋</button></section><label className="target">Join challenges in <select value={target} onChange={e=>setTarget(e.target.value)}>{spaces.map(s=><option value={s.id} key={s.id}>{s.icon} {s.name}</option>)}</select></label><section className="community-grid">{data.challenges.map(c=><article className="challenge" key={c.id}><span className="huge">{c.icon}</span><h2>{c.title}</h2><p>{c.description}</p><b>+{c.points} pts</b><button className="primary" onClick={()=>join(c)}>Join challenge</button>{c.completedBy.includes(user.id)?<button className="celebrate">🎉 Celebrate</button>:<small>🎉 unlocks after you complete it</small>}<div className="comments">{c.comments.map(cm=><p key={cm.id}><b>{memberName(data,cm.memberId)}:</b> {cm.text}</p>)}<CommentBox onSend={t=>comment(c,t)}/></div></article>)}</section><section className="panel"><h2>Share an accomplishment</h2><p>Create a share card for Facebook, messages, or anywhere else. Rally never includes a private Rally name unless you choose to add it.</p><button className="primary" onClick={()=>navigator.share?navigator.share({title:'My Rally win',text:'I just hit a new Rally milestone! 🎉'}):window.open('https://www.facebook.com/sharer/sharer.php','_blank')}>Share a win ↗</button></section></>
}
function CommentBox({onSend}:{onSend:(t:string)=>void}){const [t,setT]=useState('');return <div className="comment-box"><input value={t} onChange={e=>setT(e.target.value)} placeholder="Add a comment"/><button onClick={()=>{onSend(t);setT('')}}>Send</button></div>}



function Profile({data,user,spaces,update,note,setSpaceId,setScreen}:{data:AppData;user:Member;spaces:Space[];update:(d:AppData)=>void;note:(s:string)=>void;setSpaceId:(id:string)=>void;setScreen:(s:Screen)=>void}){
 const totalBalance=spaces.reduce((sum,s)=>sum+(spaceMember(s,user.id)?.balance||0),0)
 const totalWeekly=spaces.reduce((sum,s)=>sum+(spaceMember(s,user.id)?.weekly||0),0)
 const totalCompleted=data.history.filter(h=>h.memberId===user.id&&h.kind==='earn').length
 const totalTreats=data.treats.filter(t=>t.obtainedBy===user.id).length
 const pendingApprovals=data.activities.filter(a=>a.status==='pending'&&a.approverIds.includes(user.id)).length
 const prefs=data.notificationPrefs[user.id]||{leaderboard:true,approvals:true,milestones:true,tiers:true,daily:false,community:true}
 const upload=(e:ChangeEvent<HTMLInputElement>)=>{const file=e.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{update({...data,members:data.members.map(m=>m.id===user.id?{...m,avatar:String(reader.result)}:m)});note('Profile photo updated.')};reader.readAsDataURL(file)}
 const setPref=(key:keyof NotificationPref,val:boolean)=>update({...data,notificationPrefs:{...data.notificationPrefs,[user.id]:{...prefs,[key]:val}}})
 return <>
  <section className="profile-hero">
   <div className="profile-photo-wrap"><Avatar member={user}/><label className="photo-button">Change photo<input type="file" accept="image/*" onChange={upload}/></label></div>
   <div><p className="eyebrow light">Your Rally profile</p><h1>{user.name}</h1><p>{user.tier} tier · {user.globalLifetime.toLocaleString()} global lifetime points</p></div>
  </section>

  <section className="profile-stat-grid">
   <article><small>Available across spaces</small><strong>{totalBalance}</strong><span>points</span></article>
   <article><small>This week</small><strong>{totalWeekly}</strong><span>points earned</span></article>
   <article><small>Activities completed</small><strong>{totalCompleted}</strong><span>all time</span></article>
   <article><small>Pending approvals</small><strong>{pendingApprovals}</strong><span>waiting on you</span></article>
  </section>

  <section className="profile-control-grid">
   <button className="profile-control-card purple" onClick={()=>setScreen('notifications')}><span>🔔</span><div><strong>Notifications</strong><small>Alerts, approvals, competition, milestones, tiers, and daily kickoff.</small></div><b>→</b></button>
   <button className="profile-control-card teal" onClick={()=>setScreen('activity-settings')}><span>✓</span><div><strong>Activity settings</strong><small>Pause, archive, restore, delete, approvals, and Rally activity management.</small></div><b>→</b></button>
   <button className="profile-control-card coral" onClick={()=>setScreen('friends')}><span>👥</span><div><strong>Friends & Community</strong><small>Friends, challenges, comments, and shared accomplishments.</small></div><b>→</b></button>
   <button className="profile-control-card gold" onClick={()=>setScreen('plan')}><span>✦</span><div><strong>Plan & Rally capacity</strong><small>See member, activity, treat, and goal capacity for your Rally Spaces.</small></div><b>→</b></button>
   <button className="profile-control-card blue" onClick={()=>setScreen('account-settings')}><span>⚙️</span><div><strong>Account preferences</strong><small>Profile, competition preferences, privacy defaults, and account-wide options.</small></div><b>→</b></button>
   <button className="profile-control-card pink" onClick={()=>{setSpaceId('all');setScreen('home')}}><span>🌈</span><div><strong>All My Rally</strong><small>Your combined command center across every Rally Space.</small></div><b>→</b></button>
  </section>

  <section className="panel">
   <div className="section-title"><div><p className="eyebrow">Quick notification controls</p><h2>What should Rally tell you about?</h2></div><button className="text-link" onClick={()=>setScreen('notifications')}>Full settings →</button></div>
   <div className="profile-pref-grid">
    <label className="pref-tile"><span>🏁 <b>Leaderboard changes</b></span><input type="checkbox" checked={prefs.leaderboard} onChange={e=>setPref('leaderboard',e.target.checked)}/></label>
    <label className="pref-tile"><span>👀 <b>Approval requests</b></span><input type="checkbox" checked={prefs.approvals} onChange={e=>setPref('approvals',e.target.checked)}/></label>
    <label className="pref-tile"><span>🎯 <b>Point milestones</b></span><input type="checkbox" checked={prefs.milestones} onChange={e=>setPref('milestones',e.target.checked)}/></label>
    <label className="pref-tile"><span>💎 <b>New tiers</b></span><input type="checkbox" checked={prefs.tiers} onChange={e=>setPref('tiers',e.target.checked)}/></label>
    <label className="pref-tile"><span>☀️ <b>Daily kickoff</b></span><input type="checkbox" checked={prefs.daily} onChange={e=>setPref('daily',e.target.checked)}/></label>
    <label className="pref-tile"><span>◉ <b>Community activity</b></span><input type="checkbox" checked={prefs.community} onChange={e=>setPref('community',e.target.checked)}/></label>
   </div>
  </section>

  <section className="panel">
   <div className="section-title"><div><p className="eyebrow">Your spaces</p><h2>Rally memberships & admin tools</h2></div></div>
   {spaces.map(s=>{const sm=spaceMember(s,user.id)!;const canManage=sm.role==='Owner'||sm.role==='Admin';return <div className="profile-space-wrap" key={s.id}><button className="profile-space-row" onClick={()=>{setSpaceId(s.id);setScreen('home')}}><span className="space-icon">{s.icon}</span><div><strong>{s.name}</strong><small>{sm.role} · {sm.balance} available · {sm.weekly} this week</small></div><b>→</b></button>{canManage&&<button className="mini-settings" onClick={()=>{setSpaceId(s.id);setScreen('settings')}}>⚙️ Manage Rally</button>}</div>})}
  </section>

  <section className="panel">
   <div className="section-title"><div><p className="eyebrow">Your progress</p><h2>Recent Rally history</h2></div></div>
   {data.history.filter(h=>h.memberId===user.id).slice(0,12).map(h=><div className="history-row" key={h.id}><span>{data.spaces.find(s=>s.id===h.spaceId)?.icon||'✦'}</span><div><strong>{h.title}</strong><small>{h.detail} · {h.createdAt}</small></div><b>{h.kind==='earn'?'+':h.kind==='undo'?'-':''}{h.points}</b></div>)}
  </section>

  <section className="panel profile-account-summary">
   <div><span>🎁</span><strong>{totalTreats}</strong><small>Treats obtained</small></div>
   <div><span>🌟</span><strong>{user.globalLifetime.toLocaleString()}</strong><small>Global lifetime points</small></div>
   <div><span>🏠</span><strong>{spaces.length}</strong><small>Rally Spaces</small></div>
  </section>
 </>}

function AccountSettings({data,user,update,note}:{data:AppData;user:Member;update:(d:AppData)=>void;note:(s:string)=>void}){
 const [competition,setCompetition]=useState<'Competitive'|'Collaborative'|'Private'>('Competitive')
 return <>
  <section className="account-settings-hero"><div><p>⚙️ ACCOUNT SETTINGS</p><h1>How Rally works for you</h1><span>These settings follow your account rather than one specific Rally Space.</span></div></section>
  <section className="panel settings-section"><div className="section-title"><div><p className="eyebrow">Competition</p><h2>Default point experience</h2></div></div><div className="segmented">{(['Competitive','Collaborative','Private'] as const).map(x=><button className={competition===x?'active':''} key={x} onClick={()=>{setCompetition(x);note(`${x} preference selected.`)}}>{x}</button>)}</div><p className="settings-explainer">Individual Rally Spaces can still have their own leaderboard rules. This is your preferred account experience.</p></section>
  <section className="panel settings-section"><div className="section-title"><div><p className="eyebrow">Privacy</p><h2>Default sharing behavior</h2></div></div><label className="switch-row"><span><strong>Keep personal Rally activities private by default</strong><small>Group Rally activities remain visible to the people in that Rally.</small></span><input type="checkbox" defaultChecked/></label><label className="switch-row"><span><strong>Ask before including a Rally name in shared accomplishments</strong><small>Helps protect private household and work Rally names.</small></span><input type="checkbox" defaultChecked/></label></section>
  <section className="panel settings-section"><div className="section-title"><div><p className="eyebrow">Profile</p><h2>Account information</h2></div></div><label>Display name<input defaultValue={user.name} onBlur={e=>{const name=e.target.value.trim();if(name&&name!==user.name){update({...data,members:data.members.map(m=>m.id===user.id?{...m,name}:m)});note('Display name updated.')}}}/></label></section>
 </>}

function ActivitySettingsIndex({data,user,spaces,setSpaceId,setScreen}:{data:AppData;user:Member;spaces:Space[];setSpaceId:(id:string)=>void;setScreen:(s:Screen)=>void}){
 const managed=spaces.filter(s=>['Owner','Admin'].includes(roleFor(s,user.id)||''))
 return <><section className="account-settings-hero activity-settings-hero"><div><p>✓ ACTIVITY SETTINGS</p><h1>Manage Rally activities</h1><span>Everyday completing stays simple. Administrative controls live here.</span></div></section><section className="panel"><div className="section-title"><div><p className="eyebrow">Your Rally Spaces</p><h2>Choose a Rally to manage</h2></div></div>{managed.length?managed.map(s=>{const active=data.activities.filter(a=>a.spaceId===s.id&&a.status!=='archived').length;const archived=data.activities.filter(a=>a.spaceId===s.id&&a.status==='archived').length;return <button className="settings-index-row" key={s.id} onClick={()=>{setSpaceId(s.id);setScreen('settings')}}><span className="space-icon">{s.icon}</span><div><strong>{s.name}</strong><small>{active} active · {archived} archived · {roleFor(s,user.id)}</small></div><span>Pause · Archive · Restore · Delete</span><b>→</b></button>}):<div className="empty">You aren't an admin of any Rally Spaces yet.</div>}</section></>
}

function PlanSettings({data,user,spaces,setSpaceId,setScreen}:{data:AppData;user:Member;spaces:Space[];setSpaceId:(id:string)=>void;setScreen:(s:Screen)=>void}){
 const managed=spaces.filter(s=>['Owner','Admin'].includes(roleFor(s,user.id)||''))
 return <><section className="plan-hero"><div><p>✦ PLAN & RALLY CAPACITY</p><h1>What “limits” actually mean</h1><span>These are product capacity limits — never limits on how many points a person is allowed to earn.</span></div></section><section className="capacity-grid"><article><strong>Members</strong><span>People who can belong to a Rally Space</span></article><article><strong>Activities</strong><span>Active activities configured in a Rally</span></article><article><strong>Treats</strong><span>Active Treat Yourself goals</span></article><article><strong>Goals</strong><span>Shared Rally goals</span></article></section><section className="panel"><div className="section-title"><div><p className="eyebrow">Admin access</p><h2>Your managed Rally Spaces</h2></div></div>{managed.map(s=><button className="settings-index-row" key={s.id} onClick={()=>{setSpaceId(s.id);setScreen('settings')}}><span className="space-icon">{s.icon}</span><div><strong>{s.name}</strong><small>{s.members.length} members · {data.activities.filter(a=>a.spaceId===s.id&&a.status!=='archived').length} activities · {data.treats.filter(t=>t.spaceId===s.id&&t.status==='locked').length} active treats · {data.goals.filter(g=>g.spaceId===s.id&&g.status==='active').length} goals</small></div><b>Manage →</b></button>)}</section></>
}

function FriendsSettings({data,user,update,note}:{data:AppData;user:Member;update:(d:AppData)=>void;note:(s:string)=>void}){
 const connected=data.friends.filter(f=>f.status==='connected')
 const pending=data.friends.filter(f=>f.status==='pending')
 return <><section className="friends-hero"><div><p>👥 FRIENDS & COMMUNITY</p><h1>Your Rally circle</h1><span>Manage friends without exposing private Rally Space data.</span></div></section><section className="panel"><div className="section-title"><div><p className="eyebrow">Friends</p><h2>Connected</h2></div><button className="primary" onClick={()=>note('Friend invite flow is ready for backend connection.')}>＋ Add friend</button></div>{connected.map(f=><div className="friend-settings-row" key={f.memberId}><Avatar member={data.members.find(m=>m.id===f.memberId)!}/><div><strong>{memberName(data,f.memberId)}</strong><small>Connected friend</small></div><button className="secondary">View accomplishments</button><button className="danger" onClick={()=>{update({...data,friends:data.friends.filter(x=>x.memberId!==f.memberId)});note('Friend removed.')}}>Remove</button></div>)}{pending.length>0&&<><h3>Pending</h3>{pending.map(f=><div className="friend-settings-row" key={f.memberId}><Avatar member={data.members.find(m=>m.id===f.memberId)!}/><div><strong>{memberName(data,f.memberId)}</strong><small>Friend request pending</small></div></div>)}</>}</section></>
}

function Notifications({data,user,update,setSpaceId,setScreen}:{data:AppData;user:Member;update:(d:AppData)=>void;setSpaceId:(id:string)=>void;setScreen:(s:Screen)=>void}){
 const notes=data.notifications.filter(n=>n.recipientId===user.id)
 const open=(n:Notification)=>{update({...data,notifications:data.notifications.map(x=>x.id===n.id?{...x,read:true}:x)});if(n.spaceId)setSpaceId(n.spaceId);if(n.action)setScreen(n.action)}
 return <><section className="panel"><h1>Notifications</h1>{notes.map(n=><button className={`notification ${n.read?'':'unread'}`} key={n.id} onClick={()=>open(n)}><span>🔔</span><div><strong>{n.title}</strong><p>{n.body}</p><small>{n.createdAt}</small></div><b>→</b></button>)}</section><NotificationSettings data={data} user={user} update={update}/></>
}
function NotificationSettings({data,user,update}:{data:AppData;user:Member;update:(d:AppData)=>void}){const p=data.notificationPrefs[user.id]||{leaderboard:true,approvals:true,milestones:true,tiers:true,daily:false,community:true};return <section className="panel"><h2>Notification preferences</h2>{Object.entries(p).map(([k,v])=><label className="check" key={k}><input type="checkbox" checked={v} onChange={e=>update({...data,notificationPrefs:{...data.notificationPrefs,[user.id]:{...p,[k]:e.target.checked}}})}/>{k==='daily'?'Daily kickoff':k[0].toUpperCase()+k.slice(1)}</label>)}</section>}

function CreateSpace({data,update,user,close}:{data:AppData;update:(d:AppData)=>void;user:Member;close:()=>void}){
 const submit=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const f=new FormData(e.currentTarget);const id=crypto.randomUUID();const s:Space={id,name:String(f.get('name')),icon:String(f.get('icon')||'🎯'),type:String(f.get('type')) as SpaceType,timezone:String(f.get('timezone')),weeklyLeaderboard:true,poolEnabled:false,poolBalance:0,members:[{memberId:user.id,role:'Owner',balance:0,lifetime:0,weekly:0,joinedAt:new Date().toLocaleDateString()}]};update({...data,spaces:[...data.spaces,s]});close()}
 return <div className="modal-backdrop"><form className="modal" onSubmit={submit}><button type="button" className="close" onClick={close}>×</button><p className="eyebrow">New Rally Space</p><h2>Create a Rally</h2><label>Name<input name="name" required placeholder="Summer Fitness Crew"/></label><div className="two"><label>Type<select name="type"><option value="personal">Personal</option><option value="household">Household</option><option value="work">Work</option><option value="friends">Friends</option></select></label><label>Icon<input name="icon" placeholder="🏠"/></label></div><label>Timezone<input name="timezone" defaultValue="America/New_York"/></label><button className="primary">Create Rally</button></form></div>
}
