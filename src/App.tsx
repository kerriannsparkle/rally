import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import './styles.css'
import { supabase } from './supabase'
import Auth from './Auth'

type SpaceType='personal'|'household'|'work'|'friends'
type Role='Owner'|'Admin'|'Approver'|'Member'
type Screen='home'|'activities'|'leaderboard'|'stats'|'goals'|'treats'|'community'|'notifications'|'members'|'settings'|'profile'|'account-settings'|'plan'|'friends'|'activity-settings'|'how-it-works'
type ActivityStatus='open'|'pending'|'complete'|'paused'|'archived'
type Visibility='space'|'private'|'selected'
type ProofMode='None'|'Optional photo'|'Required photo'
type CompletionMode='shared_once'|'per_member'
type RecurrenceUnit='day'|'week'|'month'
type RecurrenceConfig=
 | {v:2;kind:'once';anchor:string}
 | {v:2;kind:'interval';unit:RecurrenceUnit;interval:number;target:number;anchor:string}
 | {v:2;kind:'weekdays';interval:number;weekdays:number[];anchor:string}
 | {v:2;kind:'monthday';interval:number;day:number;anchor:string}
type NotificationPref={leaderboard:boolean;approvals:boolean;milestones:boolean;tiers:boolean;daily:boolean;community:boolean}

type Member={id:string;name:string;avatar?:string;globalLifetime:number;tier:string}
type SpaceMember={memberId:string;role:Role;balance:number;lifetime:number;weekly:number;joinedAt:string}
type Activity={
 id:string;spaceId:string;name:string;icon:string;category:string;points:number;recurrence:string;
 status:ActivityStatus;visibility:Visibility;visibleTo?:string[];assignedTo:string[];completionMode:CompletionMode;
 approval:boolean;approverIds:string[];proofMode:ProofMode;proofUrl?:string;completedBy?:string;completedAt?:string;
 contributesToGoals:boolean;pointDestination?:'personal'|'shared';version:number;createdBy:string;
 createdAt?:string;periodProgress?:number;periodTarget?:number;periodLabel?:string;
 recurrenceLabel?:string;isAvailableNow?:boolean;nextAvailableLabel?:string;approvalPending?:boolean;approvalPendingBy?:string;approvalProofUrl?:string
}
type Treat={id:string;spaceId:string;name:string;icon:string;description:string;points:number;assignedTo:string[];priorityFor:string[];status:'locked'|'obtained'|'archived';obtainedBy?:string;obtainedAt?:string}
type Goal={id:string;spaceId:string;name:string;icon:string;target:number;progress:number;status:'active'|'reached'|'celebrated'|'archived';contributionMode:'space_only'|'selected';allowedSpaceIds:string[]}
type Space={id:string;name:string;icon:string;type:SpaceType;timezone:string;members:SpaceMember[];weeklyLeaderboard:boolean;poolEnabled:boolean;poolBalance:number}
type Notification={id:string;recipientId:string;spaceId?:string;title:string;body:string;read:boolean;action?:Screen;activityId?:string;createdAt:string}
type Friend={memberId:string;status:'connected'|'pending';friendshipId?:string;requesterId?:string}
type CommunityChallenge={id:string;title:string;icon:string;description:string;points:number;category:string;joins:string[];completedBy:string[];comments:{id:string;memberId:string;text:string}[]}
type History={id:string;spaceId:string;memberId:string;activityId?:string;title:string;detail:string;points:number;kind:'earn'|'undo'|'delete'|'treat'|'goal'|'admin';createdAt:string}
type AccountPreferences={
 competition:'Competitive'|'Collaborative'|'Private';
 privatePersonal:boolean;
 askBeforeSharingName:boolean
}
type SubscriptionInfo={plan:'free'|'plus'|'pro';status:string;currentPeriodEnd?:string}
type RewardIdea={id:string;title:string;description:string;destinationUrl:string;category:string;suggestedPoints?:number;featured:boolean}
type SpaceInvitation={id:string;spaceId:string;spaceName:string;spaceIcon:string;role:'member'|'approver'|'admin';invitedByName:string;expiresAt:string;createdAt:string}
type AppData={
 currentUserId:string;members:Member[];spaces:Space[];activities:Activity[];treats:Treat[];goals:Goal[];
 notifications:Notification[];friends:Friend[];challenges:CommunityChallenge[];history:History[];
 notificationPrefs:Record<string,NotificationPref>;accountPrefs?:AccountPreferences;
 subscription?:SubscriptionInfo;rewardIdeas?:RewardIdea[];pendingInvites?:SpaceInvitation[]
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
 pendingInvites:[],
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
const normalizeRole=(role:string):Role=>{
 const value=role.toLowerCase()

 if(value==='owner') return 'Owner'
 if(value==='admin') return 'Admin'
 if(value==='approver') return 'Approver'

 return 'Member'
}

const tierFor=(points:number)=>{
 if(points>=6000) return 'Platinum'
 if(points>=3000) return 'Gold'
 if(points>=2000) return 'Silver'
 return 'Bronze'
}

const localDateKey=(date:Date)=>{
 const year=date.getFullYear()
 const month=String(date.getMonth()+1).padStart(2,'0')
 const day=String(date.getDate()).padStart(2,'0')
 return `${year}-${month}-${day}`
}

const safeInt=(value:number,min=1,max=999)=>Math.max(min,Math.min(max,Math.round(value||min)))
const R9_RECURRENCE_PREFIX='r9:'
const WEEKDAY_LABELS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const zonedDateKey=(date=new Date(),timezone='UTC')=>{
 try{
  const parts=new Intl.DateTimeFormat('en-US',{
   timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'
  }).formatToParts(date)
  const get=(type:string)=>parts.find(part=>part.type===type)?.value||''
  return `${get('year')}-${get('month')}-${get('day')}`
 }catch{
  return date.toISOString().slice(0,10)
 }
}

const dayNumberForKey=(key:string)=>{
 const [year,month,day]=key.split('-').map(Number)
 return Math.floor(Date.UTC(year,month-1,day)/86400000)
}

const keyForDayNumber=(value:number)=>new Date(value*86400000).toISOString().slice(0,10)
const addDaysToKey=(key:string,days:number)=>keyForDayNumber(dayNumberForKey(key)+days)
const weekdayForKey=(key:string)=>new Date(`${key}T00:00:00Z`).getUTCDay()
const mondayForKey=(key:string)=>addDaysToKey(key,-((weekdayForKey(key)+6)%7))
const monthIndexForKey=(key:string)=>{
 const [year,month]=key.split('-').map(Number)
 return year*12+(month-1)
}
const monthPartsFromIndex=(index:number)=>({year:Math.floor(index/12),month:(index%12)+1})
const daysInMonth=(year:number,month:number)=>new Date(Date.UTC(year,month,0)).getUTCDate()
const keyForMonthDay=(monthIndex:number,day:number)=>{
 const {year,month}=monthPartsFromIndex(monthIndex)
 const safeDay=Math.min(Math.max(1,day),daysInMonth(year,month))
 return `${year}-${String(month).padStart(2,'0')}-${String(safeDay).padStart(2,'0')}`
}
const friendlyDateKey=(key:string)=>new Intl.DateTimeFormat('en-US',{
 weekday:'short',month:'short',day:'numeric',timeZone:'UTC'
}).format(new Date(`${key}T12:00:00Z`))
const ordinal=(value:number)=>{
 const mod100=value%100
 if(mod100>=11&&mod100<=13) return `${value}th`
 if(value%10===1) return `${value}st`
 if(value%10===2) return `${value}nd`
 if(value%10===3) return `${value}rd`
 return `${value}th`
}

const serializeRecurrence=(config:RecurrenceConfig)=>`${R9_RECURRENCE_PREFIX}${JSON.stringify(config)}`
const isStructuredRecurrence=(recurrence:string)=>recurrence.trim().startsWith(R9_RECURRENCE_PREFIX)

const parseStructuredRecurrence=(recurrence:string):RecurrenceConfig|null=>{
 if(!isStructuredRecurrence(recurrence)) return null
 try{
  const parsed=JSON.parse(recurrence.trim().slice(R9_RECURRENCE_PREFIX.length)) as RecurrenceConfig
  if(parsed?.v!==2||!parsed.kind||!parsed.anchor) return null
  if(parsed.kind==='once') return parsed
  if(parsed.kind==='interval') return {
   ...parsed,
   interval:safeInt(parsed.interval),
   target:safeInt(parsed.target,1,31)
  }
  if(parsed.kind==='weekdays') return {
   ...parsed,
   interval:safeInt(parsed.interval,1,52),
   weekdays:[...new Set((parsed.weekdays||[]).filter(day=>day>=0&&day<=6))].sort()
  }
  if(parsed.kind==='monthday') return {
   ...parsed,
   interval:safeInt(parsed.interval,1,24),
   day:safeInt(parsed.day,1,31)
  }
  return null
 }catch{
  return null
 }
}

const recurrenceTarget=(recurrence:string)=>{
 const config=parseStructuredRecurrence(recurrence)
 if(config?.kind==='interval') return config.target
 if(config) return 1
 const value=recurrence.toLowerCase()
 const perWeek=value.match(/^(\d+)x\/week$/)
 const perMonth=value.match(/^(\d+)x\/month$/)
 if(perWeek) return safeInt(Number(perWeek[1]),1,31)
 if(perMonth) return safeInt(Number(perMonth[1]),1,31)
 if(value==='twice/month') return 2
 return 1
}

const recurrenceLabel=(recurrence:string)=>{
 const config=parseStructuredRecurrence(recurrence)
 if(!config) return recurrence
 if(config.kind==='once') return 'One time'
 if(config.kind==='weekdays'){
  const days=config.weekdays.map(day=>WEEKDAY_LABELS[day]).join(', ')
  return config.interval===1
   ? days
   : `Every ${config.interval} weeks · ${days}`
 }
 if(config.kind==='monthday'){
  return config.interval===1
   ? `Monthly on the ${ordinal(config.day)}`
   : `Every ${config.interval} months on the ${ordinal(config.day)}`
 }
 const unit=config.unit
 const interval=config.interval
 const target=config.target
 if(unit==='day'){
  if(interval===1&&target===1) return 'Every day'
  if(interval===1) return `${target}x per day`
  if(target===1) return `Every ${interval} days`
  return `${target} times every ${interval} days`
 }
 if(unit==='week'){
  if(interval===1&&target===1) return 'Once per week'
  if(interval===1) return `${target}x per week`
  if(target===1) return `Every ${interval} weeks`
  return `${target} times every ${interval} weeks`
 }
 if(interval===1&&target===1) return 'Once per month'
 if(interval===1) return `${target}x per month`
 if(target===1) return `Every ${interval} months`
 return `${target} times every ${interval} months`
}

type RecurrenceState={
 label:string;target:number;periodKey:string;available:boolean;nextAvailableLabel?:string
}

const structuredRecurrenceState=(config:RecurrenceConfig,timezone:string,date=new Date()):RecurrenceState=>{
 const today=zonedDateKey(date,timezone)
 const label=recurrenceLabel(serializeRecurrence(config))
 if(config.kind==='once') return {label,target:1,periodKey:'once',available:true}

 if(config.kind==='interval'){
  const target=config.target
  if(config.unit==='day'){
   const diff=dayNumberForKey(today)-dayNumberForKey(config.anchor)
   if(diff<0){
    return {label,target,periodKey:`r9:day:${config.anchor}`,available:false,nextAvailableLabel:friendlyDateKey(config.anchor)}
   }
   const start=addDaysToKey(config.anchor,Math.floor(diff/config.interval)*config.interval)
   return {label,target,periodKey:`r9:day:${start}:every:${config.interval}`,available:true}
  }

  if(config.unit==='week'){
   const anchorWeek=mondayForKey(config.anchor)
   const currentWeek=mondayForKey(today)
   const diffWeeks=Math.floor((dayNumberForKey(currentWeek)-dayNumberForKey(anchorWeek))/7)
   if(diffWeeks<0){
    return {label,target,periodKey:`r9:week:${anchorWeek}`,available:false,nextAvailableLabel:friendlyDateKey(anchorWeek)}
   }
   const block=Math.floor(diffWeeks/config.interval)
   const start=addDaysToKey(anchorWeek,block*config.interval*7)
   return {label,target,periodKey:`r9:week:${start}:every:${config.interval}`,available:true}
  }

  const anchorMonth=monthIndexForKey(config.anchor)
  const currentMonth=monthIndexForKey(today)
  const diffMonths=currentMonth-anchorMonth
  if(diffMonths<0){
   return {label,target,periodKey:`r9:month:${anchorMonth}`,available:false,nextAvailableLabel:friendlyDateKey(config.anchor)}
  }
  const block=Math.floor(diffMonths/config.interval)
  const startIndex=anchorMonth+block*config.interval
  const {year,month}=monthPartsFromIndex(startIndex)
  return {label,target,periodKey:`r9:month:${year}-${String(month).padStart(2,'0')}:every:${config.interval}`,available:true}
 }

 if(config.kind==='weekdays'){
  const anchorWeek=mondayForKey(config.anchor)
  const currentWeek=mondayForKey(today)
  const diffWeeks=Math.floor((dayNumberForKey(currentWeek)-dayNumberForKey(anchorWeek))/7)
  const activeWeek=diffWeeks>=0&&diffWeeks%config.interval===0
  const available=activeWeek&&config.weekdays.includes(weekdayForKey(today))
  let next:string|undefined
  if(!available){
   for(let offset=1;offset<=740;offset+=1){
    const candidate=addDaysToKey(today,offset)
    const candidateWeek=mondayForKey(candidate)
    const weekDiff=Math.floor((dayNumberForKey(candidateWeek)-dayNumberForKey(anchorWeek))/7)
    if(weekDiff>=0&&weekDiff%config.interval===0&&config.weekdays.includes(weekdayForKey(candidate))){
     next=candidate
     break
    }
   }
  }
  return {
   label,target:1,periodKey:`r9:weekday:${today}`,available,
   nextAvailableLabel:next?friendlyDateKey(next):undefined
  }
 }

 const anchorMonth=monthIndexForKey(config.anchor)
 const currentMonth=monthIndexForKey(today)
 const diffMonths=currentMonth-anchorMonth
 const activeMonth=diffMonths>=0&&diffMonths%config.interval===0
 const dueKey=activeMonth?keyForMonthDay(currentMonth,config.day):''
 const available=activeMonth&&today===dueKey
 let next:string|undefined
 if(!available){
  const startOffset=Math.max(0,diffMonths)
  for(let offset=0;offset<=60;offset+=1){
   const monthIndex=currentMonth+offset
   const monthDiff=monthIndex-anchorMonth
   if(monthDiff<0||monthDiff%config.interval!==0) continue
   const candidate=keyForMonthDay(monthIndex,config.day)
   if(dayNumberForKey(candidate)>dayNumberForKey(today)){
    next=candidate
    break
   }
  }
 }
 return {
  label,target:1,periodKey:`r9:monthday:${today}`,available,
  nextAvailableLabel:next?friendlyDateKey(next):undefined
 }
}

const legacyPeriodKeyFor=(recurrence:string,date:Date,timezone:string)=>{
 const value=recurrence.toLowerCase()
 const today=zonedDateKey(date,timezone)
 if(value==='one time') return 'once'
 if(value==='every day') return `day:${today}`
 if(value==='every week'||value==='3x/week') return `week:${mondayForKey(today)}`
 if(value==='every other week'){
  const monday=mondayForKey(today)
  const mondayNumber=Math.floor(dayNumberForKey(monday)/7)
  return `biweek:${Math.floor(mondayNumber/2)}`
 }
 if(value==='twice/month') return `month2:${today.slice(0,7)}`
 if(value==='every 90 days') return `90-day:${Math.floor(dayNumberForKey(today)/90)}`
 return `day:${today}`
}

const recurrenceState=(recurrence:string,timezone='UTC',date=new Date()):RecurrenceState=>{
 const config=parseStructuredRecurrence(recurrence)
 if(config) return structuredRecurrenceState(config,timezone,date)
 return {
  label:recurrenceLabel(recurrence),
  target:recurrenceTarget(recurrence),
  periodKey:legacyPeriodKeyFor(recurrence,date,timezone),
  available:true
 }
}

const periodKeyFor=(recurrence:string,date=new Date(),timezone='UTC')=>recurrenceState(recurrence,timezone,date).periodKey

const periodKeyMatches=(recurrence:string,key:string,date=new Date(),timezone='UTC')=>{
 const state=recurrenceState(recurrence,timezone,date)
 if(state.target===1) return key===state.periodKey
 return key===state.periodKey||key.startsWith(`${state.periodKey}:`)
}

const nextPeriodKey=(recurrence:string,existingKeys:string[],date=new Date(),timezone='UTC')=>{
 const state=recurrenceState(recurrence,timezone,date)
 const base=state.periodKey
 if(state.target===1) return base
 const used=new Set(existingKeys)
 if(!used.has(base)) return base
 for(let slot=2;slot<=state.target;slot+=1){
  const key=`${base}:${slot}`
  if(!used.has(key)) return key
 }
 return `${base}:${state.target}`
}

const recurrenceProgressLabel=(recurrence:string,progress:number,target:number)=>{
 const config=parseStructuredRecurrence(recurrence)
 if(target<=1) return recurrenceLabel(recurrence)
 if(config?.kind==='interval'){
  if(config.unit==='day'&&config.interval===1) return `${progress} of ${target} today`
  if(config.unit==='week'&&config.interval===1) return `${progress} of ${target} this week`
  if(config.unit==='month'&&config.interval===1) return `${progress} of ${target} this month`
  return `${progress} of ${target} this period`
 }
 const value=recurrence.toLowerCase()
 if(value==='3x/week') return `${progress} of ${target} this week`
 if(value==='twice/month') return `${progress} of ${target} this month`
 return `${progress} of ${target}`
}

const recurrencePriority=(recurrence:string)=>{
 const config=parseStructuredRecurrence(recurrence)
 if(config?.kind==='interval'){
  if(config.unit==='day') return 0
  if(config.unit==='week') return 2
  return 4
 }
 if(config?.kind==='weekdays') return 1
 if(config?.kind==='monthday') return 3
 if(config?.kind==='once') return 5
 const value=recurrence.toLowerCase()
 if(value==='every day') return 0
 if(value==='3x/week') return 1
 if(value==='every week') return 2
 if(value==='twice/month') return 3
 if(value==='every other week') return 4
 if(value==='every 90 days') return 5
 return 6
}

const startOfCurrentWeek=()=>{
 const start=new Date()
 const daysSinceMonday=(start.getDay()+6)%7
 start.setHours(0,0,0,0)
 start.setDate(start.getDate()-daysSinceMonday)
 return start
}

const formatTimestamp=(value?:string|null)=>{
 if(!value) return 'Just now'
 const date=new Date(value)
 return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString()
}

const spaceTypeFromDb=(value:string):SpaceType=>
 value==='group' ? 'friends' : value as SpaceType

const spaceTypeToDb=(value:SpaceType)=>
 value==='friends' ? 'group' : value

const notificationAction=(type:string):Screen|undefined=>{
 if(type==='approval_needed'||type==='approval_result') return 'activities'
 if(type==='leaderboard_change') return 'leaderboard'
 if(type==='treat_obtained') return 'treats'
 if(type==='goal_reached') return 'goals'
 if(type==='community') return 'community'
 return undefined
}

const chooseImageFile=()=>new Promise<File|null>(resolve=>{
 const input=document.createElement('input')
 input.type='file'
 input.accept='image/*'
 input.onchange=()=>resolve(input.files?.[0]||null)
 input.click()
})

const safeFileName=(file:File)=>{
 const extension=(file.name.split('.').pop()||'jpg').toLowerCase()
 return `${crypto.randomUUID()}.${extension.replace(/[^a-z0-9]/g,'')||'jpg'}`
}

export default function App(){
const [authenticated,setAuthenticated]=useState(false)
const [sessionChecked,setSessionChecked]=useState(false)
const [authUser,setAuthUser]=useState<User|null>(null)
const [accountLoaded,setAccountLoaded]=useState(false)
const [accountRefresh,setAccountRefresh]=useState(0)

useEffect(()=>{
 supabase.auth.getUser().then(({data,error})=>{
  if(error){
   console.error('Unable to load user:',error)
  }

  setAccountLoaded(false)
  setAuthUser(data.user)
  setAuthenticated(!!data.user)
  setSessionChecked(true)
 })

 const {
  data:{subscription}
 }=supabase.auth.onAuthStateChange((_event,session)=>{
  setAccountLoaded(false)
  setAuthUser(session?.user??null)
  setAuthenticated(!!session?.user)
  setSessionChecked(true)
 })

 return ()=>subscription.unsubscribe()
},[])

useEffect(()=>{
 if(!authUser) return

 let cancelled=false

 const loadAccount=async()=>{
  setAccountLoaded(false)

  try {
  // 1. Load the logged-in Rally profile
  const {data:profile,error:profileError}=await supabase
   .from('profiles')
   .select(
    'id, display_name, avatar_url, lifetime_points, competition_preference, private_personal_by_default, ask_before_sharing_space_name'
   )
   .eq('id',authUser.id)
   .maybeSingle()

  if(profileError){
   console.error('Unable to load profile:',profileError)
   return
  }

  // 2. Load pending Rally invitations. Invitees choose Accept or Decline.
  let appPendingInvites:SpaceInvitation[]=[]

  if(authUser.email){
   const {data:pendingInviteRows,error:inviteLoadError}=await supabase
    .rpc('get_my_pending_space_invitations')

   if(inviteLoadError){
    console.error('Unable to load Rally invitations:',inviteLoadError)
   }else{
    appPendingInvites=(pendingInviteRows||[]).map((invitation:any)=>({
     id:invitation.id,
     spaceId:invitation.space_id,
     spaceName:invitation.space_name || 'Rally Space',
     spaceIcon:invitation.space_icon || '✦',
     role:(invitation.role || 'member') as SpaceInvitation['role'],
     invitedByName:invitation.inviter_name || 'A Rally member',
     expiresAt:invitation.expires_at,
     createdAt:invitation.created_at
    }))
   }
  }

  // 3. Load this user's Rally memberships
  const {data:memberships,error:membershipError}=await supabase
   .from('space_members')
   .select('space_id, user_id, role, joined_at, shared_contribution_total')
   .eq('user_id',authUser.id)

  if(membershipError){
   console.error('Unable to load Rally memberships:',membershipError)
   return
  }

  const spaceIds=(memberships||[]).map(m=>m.space_id)

  const lifetimePoints=profile?.lifetime_points ?? 0
  const currentMember:Member={
   id:authUser.id,
   name:
    profile?.display_name ||
    String(authUser.user_metadata?.display_name || '') ||
    authUser.email?.split('@')[0] ||
    'Rally User',
   avatar:profile?.avatar_url || undefined,
   globalLifetime:lifetimePoints,
   tier:tierFor(lifetimePoints)
  }

  const defaultNotificationPrefs:NotificationPref={
   leaderboard:true,
   approvals:true,
   milestones:true,
   tiers:true,
   daily:false,
   community:true
  }

  const accountPrefs:AccountPreferences={
   competition:
    (profile?.competition_preference || 'Competitive') as
     AccountPreferences['competition'],
   privatePersonal:
    profile?.private_personal_by_default ?? true,
   askBeforeSharingName:
    profile?.ask_before_sharing_space_name ?? true
  }

  // A profile should normally have a Personal Rally created by the DB trigger.
  // This fallback keeps the UI safe if membership creation has not happened yet.
  if(spaceIds.length===0){
   const {data:prefRow}=await supabase
    .from('notification_preferences')
    .select(
     'leaderboard_changes, approval_requests, point_milestones, tier_unlocks, daily_kickoff, community_activity'
    )
    .eq('user_id',authUser.id)
    .maybeSingle()

   const loadedPrefs:NotificationPref=prefRow ? {
    leaderboard:prefRow.leaderboard_changes,
    approvals:prefRow.approval_requests,
    milestones:prefRow.point_milestones,
    tiers:prefRow.tier_unlocks,
    daily:prefRow.daily_kickoff,
    community:prefRow.community_activity
   } : defaultNotificationPrefs

   if(!cancelled){
    setData(current=>({
     ...current,
     currentUserId:authUser.id,
     members:[currentMember],
     spaces:[],
     activities:[],
     treats:[],
     goals:[],
     notifications:[],
     friends:[],
     challenges:[],
     history:[],
     rewardIdeas:[],
     pendingInvites:appPendingInvites,
     notificationPrefs:{
      ...current.notificationPrefs,
      [authUser.id]:loadedPrefs
     },
     accountPrefs
    }))
   }
   return
  }

  // 4. Load everyone who belongs to these Rally Spaces
  const {data:allMemberships,error:allMembershipsError}=await supabase
   .from('space_members')
   .select('space_id, user_id, role, joined_at, shared_contribution_total')
   .in('space_id',spaceIds)

  if(allMembershipsError){
   console.error('Unable to load Rally members:',allMembershipsError)
   return
  }

  const spaceMemberIds=[
   ...new Set((allMemberships||[]).map(member=>member.user_id))
  ]

  const {data:spaceMemberProfiles,error:memberProfilesError}=await supabase
   .from('profiles')
   .select('id, display_name, avatar_url, lifetime_points')
   .in('id',spaceMemberIds)

  if(memberProfilesError){
   console.error('Unable to load member profiles:',memberProfilesError)
   return
  }

  // 5. Load Rally Spaces
  const {data:supabaseSpaces,error:spacesError}=await supabase
   .from('spaces')
   .select('*')
   .in('id',spaceIds)

  if(spacesError){
   console.error('Unable to load Rally Spaces:',spacesError)
   return
  }

  // 6. Load Activities + relationships + completions
  const {data:supabaseActivities,error:activitiesError}=await supabase
   .from('activities')
   .select('*')
   .in('space_id',spaceIds)

  if(activitiesError){
   console.error('Unable to load Rally activities:',activitiesError)
   return
  }

  const activityIds=(supabaseActivities||[]).map(activity=>activity.id)

  let activityAssignments:any[]=[]
  let activityApprovers:any[]=[]
  let activityCompletions:any[]=[]

  if(activityIds.length>0){
   const {data:assignments,error:assignmentsError}=await supabase
    .from('activity_assignments')
    .select('activity_id, user_id')
    .in('activity_id',activityIds)

   if(assignmentsError){
    console.error('Unable to load activity assignments:',assignmentsError)
    return
   }

   activityAssignments=assignments || []

   const {data:approvers,error:approversError}=await supabase
    .from('activity_approvers')
    .select('activity_id, user_id')
    .in('activity_id',activityIds)

   if(approversError){
    console.error('Unable to load activity approvers:',approversError)
    return
   }

   activityApprovers=approvers || []

   const {data:completions,error:completionsError}=await supabase
    .from('activity_completions')
    .select(
     'id, activity_id, space_id, completed_by, points, period_key, proof_url, approval_status, approved_by, approved_at, completed_at'
    )
    .in('activity_id',activityIds)
    .order('completed_at',{ascending:false})

   if(completionsError){
    console.error('Unable to load activity completions:',completionsError)
    return
   }

   activityCompletions=completions || []

   for(const completion of activityCompletions){
    if(!completion.proof_url) continue

    if(
     String(completion.proof_url).startsWith('http://') ||
     String(completion.proof_url).startsWith('https://')
    ){
     completion.proof_signed_url=completion.proof_url
     continue
    }

    const {data:signed}=await supabase.storage
     .from('proofs')
     .createSignedUrl(completion.proof_url,60*60)

    completion.proof_signed_url=signed?.signedUrl || undefined
   }
  }

  // 7. Load points, goals, treats, notifications, friends, community, and plan
  const {data:pointsLedger,error:ledgerError}=await supabase
   .from('points_ledger')
   .select(
    'id, space_id, user_id, amount, transaction_type, activity_completion_id, treat_id, note, destination, created_at'
   )
   .in('space_id',spaceIds)
   .order('created_at',{ascending:false})

  if(ledgerError){
   console.error('Unable to load Rally points:',ledgerError)
   return
  }

  const {data:supabaseGoals,error:goalsError}=await supabase
   .from('goals')
   .select('*')
   .in('space_id',spaceIds)
   .order('created_at',{ascending:false})

  if(goalsError){
   console.error('Unable to load Rally goals:',goalsError)
   return
  }

  const {data:supabaseTreats,error:treatsError}=await supabase
   .from('treats')
   .select('*')
   .in('space_id',spaceIds)
   .order('created_at',{ascending:false})

  if(treatsError){
   console.error('Unable to load Rally treats:',treatsError)
   return
  }

  const treatIds=(supabaseTreats||[]).map(treat=>treat.id)
  let treatAssignments:any[]=[]

  if(treatIds.length>0){
   const {data:assignments,error:treatAssignmentError}=await supabase
    .from('treat_assignments')
    .select('treat_id, user_id, is_top_priority')
    .in('treat_id',treatIds)

   if(treatAssignmentError){
    console.error('Unable to load treat assignments:',treatAssignmentError)
    return
   }

   treatAssignments=assignments || []
  }

  const {data:notificationRows,error:notificationError}=await supabase
   .from('notifications')
   .select(
    'id, user_id, space_id, type, title, message, activity_id, treat_id, goal_id, is_read, created_at'
   )
   .eq('user_id',authUser.id)
   .order('created_at',{ascending:false})

  if(notificationError){
   console.error('Unable to load Rally notifications:',notificationError)
   return
  }

  const {data:prefRow,error:prefError}=await supabase
   .from('notification_preferences')
   .select(
    'leaderboard_changes, approval_requests, point_milestones, tier_unlocks, daily_kickoff, community_activity'
   )
   .eq('user_id',authUser.id)
   .maybeSingle()

  if(prefError){
   console.error('Unable to load notification preferences:',prefError)
  }

  const loadedPrefs:NotificationPref=prefRow ? {
   leaderboard:prefRow.leaderboard_changes,
   approvals:prefRow.approval_requests,
   milestones:prefRow.point_milestones,
   tiers:prefRow.tier_unlocks,
   daily:prefRow.daily_kickoff,
   community:prefRow.community_activity
  } : defaultNotificationPrefs

  const {data:friendRows,error:friendError}=await supabase
   .from('friendships')
   .select('id, requester_id, addressee_id, status, created_at')
   .or(`requester_id.eq.${authUser.id},addressee_id.eq.${authUser.id}`)
   .in('status',['pending','accepted'])

  if(friendError){
   console.error('Unable to load Rally friends:',friendError)
  }

  const {data:challengeRows,error:challengeError}=await supabase
   .from('community_challenges')
   .select('id, title, description, icon, category, points')
   .eq('is_active',true)
   .order('created_at',{ascending:false})

  if(challengeError){
   console.error('Unable to load community challenges:',challengeError)
  }

  const challengeIds=(challengeRows||[]).map(challenge=>challenge.id)
  let challengeJoins:any[]=[]
  let challengeComments:any[]=[]

  if(challengeIds.length>0){
   const {data:joins,error:joinError}=await supabase
    .from('challenge_joins')
    .select(
     'id, challenge_id, user_id, space_id, activity_id, completed_at, created_at'
    )
    .in('challenge_id',challengeIds)

   if(joinError){
    console.error('Unable to load challenge joins:',joinError)
   }else{
    challengeJoins=joins || []
   }

   const {data:comments,error:commentError}=await supabase
    .from('challenge_comments')
    .select('id, challenge_id, user_id, comment, created_at')
    .in('challenge_id',challengeIds)
    .order('created_at',{ascending:true})

   if(commentError){
    console.error('Unable to load challenge comments:',commentError)
   }else{
    challengeComments=comments || []
   }
  }

  const {data:subscriptionRow,error:subscriptionError}=await supabase
   .from('subscriptions')
   .select('plan, status, current_period_end')
   .eq('user_id',authUser.id)
   .maybeSingle()

  if(subscriptionError){
   console.error('Unable to load Rally subscription:',subscriptionError)
  }

  const {data:rewardRows,error:rewardError}=await supabase
   .from('reward_ideas')
   .select(
    'id, title, description, destination_url, category, suggested_points, is_featured'
   )
   .eq('is_active',true)
   .order('sort_order',{ascending:true})

  if(rewardError){
   console.error('Unable to load reward ideas:',rewardError)
  }

  // 8. Load profiles needed for friends and community names/avatars
  const relatedProfileIds=[
   ...(friendRows||[]).flatMap(friend=>[
    friend.requester_id,
    friend.addressee_id
   ]),
   ...challengeJoins.map(join=>join.user_id),
   ...challengeComments.map(comment=>comment.user_id)
  ]

  const extraProfileIds=[
   ...new Set(
    relatedProfileIds.filter(
     id=>id && !spaceMemberIds.includes(id)
    )
   )
  ]

  let extraProfiles:any[]=[]
  if(extraProfileIds.length>0){
   const {data:profiles,error:extraProfileError}=await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, lifetime_points')
    .in('id',extraProfileIds)

   if(extraProfileError){
    console.error('Unable to load related Rally profiles:',extraProfileError)
   }else{
    extraProfiles=profiles || []
   }
  }

  const profileMap=new Map<string,any>()
  for(const item of [
   ...(spaceMemberProfiles||[]),
   ...extraProfiles
  ]){
   profileMap.set(item.id,item)
  }

  if(!profileMap.has(authUser.id)){
   profileMap.set(authUser.id,{
    id:authUser.id,
    display_name:currentMember.name,
    avatar_url:currentMember.avatar,
    lifetime_points:currentMember.globalLifetime
   })
  }

  const allProfiles=[...profileMap.values()]
  const ledger=pointsLedger || []
  const weekStart=startOfCurrentWeek()

  const completionById=new Map<string,any>(
   activityCompletions.map(completion=>[completion.id,completion])
  )
  const activityById=new Map<string,any>(
   (supabaseActivities||[]).map(activity=>[activity.id,activity])
  )

  const isSharedActivityEntry=(entry:any)=>
   entry.destination==='shared'

  const earnedLifetime=(entries:any[])=>entries
   .filter(entry=>
    ['activity_earned','activity_undo','admin_adjustment'].includes(
     entry.transaction_type
    )
   )
   .reduce((sum,entry)=>sum+(entry.amount||0),0)

  const availableBalance=(entries:any[])=>entries
   .filter(entry=>!isSharedActivityEntry(entry))
   .reduce((sum,entry)=>sum+(entry.amount||0),0)

  const weeklyPoints=(entries:any[])=>entries
   .filter(entry=>
    ['activity_earned','activity_undo'].includes(entry.transaction_type) &&
    new Date(entry.created_at)>=weekStart
   )
   .reduce((sum,entry)=>sum+(entry.amount||0),0)

  const loadedMembers:Member[]=allProfiles.map(memberProfile=>{
   const globalLifetime=memberProfile.lifetime_points ?? 0

   return {
    id:memberProfile.id,
    name:
     memberProfile.display_name ||
     (memberProfile.id===authUser.id
      ? currentMember.name
      : 'Rally Member'),
    avatar:memberProfile.avatar_url || undefined,
    globalLifetime,
    tier:tierFor(globalLifetime)
   }
  })

  // 9. Convert Supabase rows into Rally's current front-end shapes
  const appSpaces:Space[]=(supabaseSpaces||[]).map(space=>{
   const spaceMemberships=(allMemberships||[]).filter(
    membership=>membership.space_id===space.id
   )

   return {
    id:space.id,
    name:space.name,
    icon:space.icon || '✨',
    type:spaceTypeFromDb(space.type),
    timezone:space.timezone || 'America/New_York',
    members:spaceMemberships.map(membership=>{
     const memberLedger=ledger.filter(
      entry=>
       entry.space_id===space.id &&
       entry.user_id===membership.user_id
     )

     return {
      memberId:membership.user_id,
      role:normalizeRole(membership.role || 'member'),
      balance:Math.max(0,availableBalance(memberLedger)),
      lifetime:Math.max(0,earnedLifetime(memberLedger)),
      weekly:Math.max(0,weeklyPoints(memberLedger)),
      joinedAt:
       membership.joined_at ||
       space.created_at ||
       new Date().toISOString()
     }
    }),
    weeklyLeaderboard:space.weekly_leaderboard ?? true,
    poolEnabled:space.pool_enabled ?? false,
    poolBalance:space.pool_balance ?? 0
   }
  })

  const appActivities:Activity[]=(supabaseActivities||[]).map(activity=>{
   const assignedTo=activityAssignments
    .filter(assignment=>assignment.activity_id===activity.id)
    .map(assignment=>assignment.user_id)

   const approverIds=activityApprovers
    .filter(approver=>approver.activity_id===activity.id)
    .map(approver=>approver.user_id)

   const activitySpace=appSpaces.find(space=>space.id===activity.space_id)
   const timezone=activitySpace?.timezone||'UTC'
   const recurrence=recurrenceState(activity.recurrence||'One time',timezone)
   const target=recurrence.target
   const periodCompletions=activityCompletions.filter(
    completion=>
     completion.activity_id===activity.id &&
     periodKeyMatches(
      activity.recurrence || 'One time',
      completion.period_key,
      new Date(),
      timezone
     ) &&
     completion.approval_status!=='rejected'
   )

   const completionsForProgress=
    activity.completion_mode==='per_member'
     ? periodCompletions.filter(
        completion=>completion.completed_by===authUser.id
       )
     : periodCompletions

   const earnedCompletions=completionsForProgress.filter(
    completion=>['approved','not_required'].includes(
     completion.approval_status
    )
   )

   const ownPending=completionsForProgress.find(
    completion=>completion.approval_status==='pending'
   )

   // Approval can happen after the original completion period has closed.
   // Keep the latest pending approval actionable even on a later day/week.
   const pendingForApproval=approverIds.includes(authUser.id)
    ? activityCompletions.find(
       completion=>
        completion.activity_id===activity.id &&
        completion.approval_status==='pending'
      )
    : undefined

   const latestEarned=earnedCompletions[0]
   const latestCompletion=ownPending || latestEarned

   const progress=Math.min(target,earnedCompletions.length)

   const completionStatus:ActivityStatus=
    activity.status==='paused'||activity.status==='archived'
     ? activity.status as ActivityStatus
     : ownPending
      ? 'pending'
      : progress>=target
       ? 'complete'
       : 'open'

   return {
    id:activity.id,
    spaceId:activity.space_id,
    name:activity.name,
    icon:activity.icon || '✨',
    category:activity.category || 'General',
    points:activity.points ?? 0,
    recurrence:activity.recurrence || 'One time',
    recurrenceLabel:recurrence.label,
    isAvailableNow:recurrence.available,
    nextAvailableLabel:recurrence.nextAvailableLabel,
    approvalPending:Boolean(pendingForApproval),
    approvalPendingBy:pendingForApproval?.completed_by || undefined,
    approvalProofUrl:pendingForApproval?.proof_signed_url || undefined,
    status:completionStatus,
    completedBy:latestCompletion?.completed_by || undefined,
    completedAt:latestCompletion?.completed_at || undefined,
    proofUrl:latestCompletion?.proof_signed_url || undefined,
    visibility:(activity.visibility || 'space') as Visibility,
    assignedTo,
    completionMode:
     (activity.completion_mode || 'shared_once') as CompletionMode,
    approval:activity.require_approval ?? false,
    approverIds,
    proofMode:
     activity.proof_mode==='required_photo'
      ? 'Required photo'
      : activity.proof_mode==='optional_photo'
       ? 'Optional photo'
       : 'None',
    contributesToGoals:
     activity.contributes_to_goals ?? false,
    pointDestination:
     (activity.point_destination || 'personal') as
      'personal'|'shared',
    version:1,
    createdBy:activity.created_by || authUser.id,
    createdAt:activity.created_at || undefined,
    periodProgress:progress,
    periodTarget:target,
    periodLabel:recurrenceProgressLabel(
     activity.recurrence || 'One time',
     progress,
     target
    )
   }
  })

  const appGoals:Goal[]=(supabaseGoals||[]).map(goal=>({
   id:goal.id,
   spaceId:goal.space_id,
   name:goal.name,
   icon:goal.icon || '🎯',
   target:goal.target_points,
   progress:goal.current_points ?? 0,
   status:goal.status as Goal['status'],
   contributionMode:'space_only',
   allowedSpaceIds:[goal.space_id]
  }))

  const appTreats:Treat[]=(supabaseTreats||[]).map(treat=>{
   const assignments=treatAssignments.filter(
    assignment=>assignment.treat_id===treat.id
   )

   return {
    id:treat.id,
    spaceId:treat.space_id,
    name:treat.name,
    icon:treat.icon || '🎁',
    description:treat.description || '',
    points:treat.points_required,
    assignedTo:assignments.map(assignment=>assignment.user_id),
    priorityFor:assignments
     .filter(assignment=>assignment.is_top_priority)
     .map(assignment=>assignment.user_id),
    status:treat.status as Treat['status'],
    obtainedBy:treat.obtained_by || undefined,
    obtainedAt:treat.obtained_at || undefined
   }
  })

  const appNotifications:Notification[]=(notificationRows||[]).map(row=>({
   id:row.id,
   recipientId:row.user_id,
   spaceId:row.space_id || undefined,
   title:row.title,
   body:row.message,
   read:row.is_read,
   action:notificationAction(row.type),
   activityId:row.activity_id || undefined,
   createdAt:formatTimestamp(row.created_at)
  }))

  const appFriends:Friend[]=(friendRows||[]).map(row=>({
   memberId:
    row.requester_id===authUser.id
     ? row.addressee_id
     : row.requester_id,
   status:row.status==='accepted' ? 'connected' : 'pending',
   friendshipId:row.id,
   requesterId:row.requester_id
  }))

  const appChallenges:CommunityChallenge[]=(challengeRows||[]).map(challenge=>{
   const joins=challengeJoins.filter(
    join=>join.challenge_id===challenge.id
   )
   const comments=challengeComments.filter(
    comment=>comment.challenge_id===challenge.id
   )

   const completedBy=joins
    .filter(join=>{
     if(join.completed_at) return true
     if(!join.activity_id) return false

     return activityCompletions.some(
      completion=>
       completion.activity_id===join.activity_id &&
       completion.completed_by===join.user_id &&
       ['approved','not_required'].includes(
        completion.approval_status
       )
     )
    })
    .map(join=>join.user_id)

   return {
    id:challenge.id,
    title:challenge.title,
    icon:challenge.icon || '✨',
    description:challenge.description || '',
    points:challenge.points,
    category:challenge.category || 'Other',
    joins:[...new Set(joins.map(join=>join.user_id))],
    completedBy:[...new Set(completedBy)],
    comments:comments.map(comment=>({
     id:comment.id,
     memberId:comment.user_id,
     text:comment.comment
    }))
   }
  })

  const profileName=(id:string)=>
   profileMap.get(id)?.display_name || 'Rally Member'

  const appHistory:History[]=ledger.map(entry=>{
   const completion=entry.activity_completion_id
    ? completionById.get(entry.activity_completion_id)
    : undefined
   const activity=completion
    ? activityById.get(completion.activity_id)
    : undefined
   const treat=(supabaseTreats||[]).find(
    item=>item.id===entry.treat_id
   )

   const kind:History['kind']=
    entry.transaction_type==='activity_earned'
     ? 'earn'
     : entry.transaction_type==='activity_undo'
      ? 'undo'
      : entry.transaction_type==='treat_obtained'
       ? 'treat'
       : entry.transaction_type==='goal_adjustment'
        ? 'goal'
        : 'admin'

   const isActivityEntry=
    entry.transaction_type==='activity_earned' ||
    entry.transaction_type==='activity_undo'

   const title=
    activity?.name ||
    treat?.name ||
    (isActivityEntry ? 'Activity points' : entry.note) ||
    'Rally points'

   const detail=
    entry.transaction_type==='activity_earned'
     ? activity
      ? `${profileName(entry.user_id)} completed this activity`
      : `${profileName(entry.user_id)} earned points`
     : entry.transaction_type==='activity_undo'
      ? activity
       ? `${profileName(entry.user_id)} undid this completion`
       : `${profileName(entry.user_id)} had activity points removed`
      : entry.transaction_type==='treat_obtained'
       ? `${profileName(entry.user_id)} obtained this treat`
       : entry.note || 'Points adjusted'

   return {
    id:entry.id,
    spaceId:entry.space_id,
    memberId:entry.user_id,
    activityId:activity?.id,
    title,
    detail,
    points:Math.abs(entry.amount || 0),
    kind,
    createdAt:formatTimestamp(entry.created_at)
   }
  })

  const subscription:SubscriptionInfo|undefined=subscriptionRow ? {
   plan:subscriptionRow.plan as SubscriptionInfo['plan'],
   status:subscriptionRow.status,
   currentPeriodEnd:subscriptionRow.current_period_end || undefined
  } : undefined

  const rewardIdeas:RewardIdea[]=(rewardRows||[]).map(row=>({
   id:row.id,
   title:row.title,
   description:row.description || '',
   destinationUrl:row.destination_url,
   category:row.category || 'Other',
   suggestedPoints:row.suggested_points || undefined,
   featured:row.is_featured ?? false
  }))

  // 10. Replace Supabase-backed portions of Rally state
  if(!cancelled){
   setData(current=>({
    ...current,
    currentUserId:authUser.id,
    members:loadedMembers,
    spaces:appSpaces,
    activities:appActivities,
    goals:appGoals,
    treats:appTreats,
    notifications:appNotifications,
    friends:appFriends,
    challenges:appChallenges,
    history:appHistory,
    notificationPrefs:{
     ...current.notificationPrefs,
     [authUser.id]:loadedPrefs
    },
    accountPrefs,
    subscription,
    rewardIdeas,
    pendingInvites:appPendingInvites
   }))
  }
  } finally {
   if(!cancelled) setAccountLoaded(true)
  }
 }

 loadAccount()

 return ()=>{
  cancelled=true
 }
},[authUser,accountRefresh])

console.log('Supabase connected:', supabase)
const [data,setData]=useState<AppData>(load)
 const [spaceId,setSpaceId]=useState<string>('all')
 const [screen,setScreen]=useState<Screen>('home')
 const [toast,setToast]=useState('')
 const [inviteOpen,setInviteOpen]=useState(false)
 const user=data.members.find(m=>m.id===data.currentUserId)!
 const spaces=data.spaces.filter(s=>s.members.some(m=>m.memberId===user.id))

 useEffect(()=>{
  if(!authUser) return

  const refreshPeriods=()=>{
   if(document.visibilityState==='visible'){
    setAccountRefresh(value=>value+1)
   }
  }

  window.addEventListener('focus',refreshPeriods)
  document.addEventListener('visibilitychange',refreshPeriods)
  const timer=window.setInterval(refreshPeriods,15*60*1000)

  return ()=>{
   window.removeEventListener('focus',refreshPeriods)
   document.removeEventListener('visibilitychange',refreshPeriods)
   window.clearInterval(timer)
  }
 },[authUser?.id])

 const activeSpace=spaceId==='all'?null:spaces.find(s=>s.id===spaceId)||spaces[0]
 const isSolo=activeSpace?.members.length===1
 const myRole=activeSpace?roleFor(activeSpace,user.id):undefined
 const update=(next:AppData)=>{setData(next);saveLocal(next)}
 const note=(msg:string)=>{setToast(msg);setTimeout(()=>setToast(''),1800)}
 const respondToInvite=async(invitation:SpaceInvitation,response:'accepted'|'declined')=>{
  const {error}=await supabase
   .rpc('respond_to_space_invitation',{
    p_invitation_id:invitation.id,
    p_response:response
   })

  if(error){
   console.error('Unable to respond to Rally invitation:',error)
   note(
    response==='accepted'
     ? 'Unable to join this Rally right now.'
     : 'Unable to decline this invitation right now.'
   )
   return
  }

  setData(current=>({
   ...current,
   pendingInvites:(current.pendingInvites||[]).filter(
    item=>item.id!==invitation.id
   )
  }))

  if(response==='accepted'){
   note(`You joined ${invitation.spaceName}.`)
   setSpaceId('all')
   setScreen('home')
   setAccountRefresh(value=>value+1)
  }else{
   note(`Invitation to ${invitation.spaceName} declined.`)
  }
 }
 const logout = async () => {
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error(error)
    note('Unable to log out.')
    return
  }

  setAccountLoaded(false)
  setAuthenticated(false)
  setAuthUser(null)
}
 const visibleActivities=useMemo(()=>{
  const scoped=data.activities.filter(a=>
   spaceId==='all'
    ? spaces.some(s=>s.id===a.spaceId)
    : a.spaceId===spaceId
  )

  return scoped.filter(a=>
   a.visibility==='space' ||
   a.createdBy===user.id ||
   a.assignedTo.includes(user.id) ||
   a.approverIds.includes(user.id) ||
   a.visibleTo?.includes(user.id)
  )
 },[data.activities,spaceId,user.id,spaces])
 const myNotifications=data.notifications.filter(n=>n.recipientId===user.id)
 const unread=myNotifications.filter(n=>!n.read).length+(data.pendingInvites?.length||0)

 const saveNotifications=async(rows:any[])=>{
  if(rows.length===0) return

  const {error}=await supabase
   .from('notifications')
   .insert(rows)

  if(error){
   console.error('Unable to save Rally notifications:',error)
  }
 }

 const uploadProof=async(a:Activity)=>{
  if(a.proofMode==='None') return undefined

  const shouldAdd=
   a.proofMode==='Required photo'
    ? true
    : window.confirm('Would you like to add photo proof?')

  if(!shouldAdd) return undefined

  const file=await chooseImageFile()

  if(!file){
   if(a.proofMode==='Required photo'){
    note('Photo proof is required for this activity.')
    return null
   }
   return undefined
  }

  const path=`${a.spaceId}/${user.id}/${a.id}/${safeFileName(file)}`
  const {error:uploadError}=await supabase.storage
   .from('proofs')
   .upload(path,file,{upsert:false})

  if(uploadError){
   console.error('Unable to upload proof:',uploadError)
   note('Unable to upload photo proof.')
   return null
  }

  const {data:signed,error:signedError}=await supabase.storage
   .from('proofs')
   .createSignedUrl(path,60*60)

  if(signedError){
   console.error('Unable to create proof link:',signedError)
   note('Photo uploaded, but Rally could not open it.')
   return null
  }

  return {
   path,
   url:signed.signedUrl
  }
 }

 const complete=async(a:Activity)=>{
  if(a.status==='complete'){
   await undoComplete(a)
   return
  }

  if(
   a.status==='pending' ||
   a.status==='paused' ||
   a.status==='archived'
  ) return

  const canComplete=
   a.assignedTo.length===0 || a.assignedTo.includes(user.id)

  if(!canComplete){
   note('This activity is assigned to someone else.')
   return
  }

  const activitySpace=data.spaces.find(space=>space.id===a.spaceId)
  const timezone=activitySpace?.timezone||'UTC'
  const currentRecurrence=recurrenceState(a.recurrence,timezone)

  if(!currentRecurrence.available){
   note(
    currentRecurrence.nextAvailableLabel
     ? `This activity is next available ${currentRecurrence.nextAvailableLabel}.`
     : 'This activity is not available right now.'
   )
   return
  }

  const target=currentRecurrence.target
  const basePeriodKey=currentRecurrence.periodKey

  let existingQuery=supabase
   .from('activity_completions')
   .select('id, approval_status, completed_by, completed_at, proof_url, period_key')
   .eq('activity_id',a.id)
   .in('approval_status',['pending','approved','not_required'])

  existingQuery=target>1
   ? existingQuery.like('period_key',`${basePeriodKey}%`)
   : existingQuery.eq('period_key',basePeriodKey)

  if(a.completionMode==='per_member'){
   existingQuery=existingQuery.eq('completed_by',user.id)
  }

  const {data:existing,error:existingError}=await existingQuery
   .order('completed_at',{ascending:false})

  if(existingError){
   console.error('Unable to check activity completion:',existingError)
   note('Unable to complete activity.')
   return
  }

  const liveCompletions=existing || []
  const pendingCompletion=liveCompletions.find(
   completion=>completion.approval_status==='pending'
  )
  const earnedCompletions=liveCompletions.filter(
   completion=>['approved','not_required'].includes(
    completion.approval_status
   )
  )

  if(pendingCompletion){
   note('Already waiting for approval.')
   return
  }

  if(earnedCompletions.length>=target){
   note('You already finished this activity for this period.')
   return
  }

  const proofUrl=await uploadProof(a)
  if(proofUrl===null) return

  const approvalStatus=
   a.approval&&a.approverIds.length
    ? 'pending'
    : 'not_required'

  const periodKey=nextPeriodKey(
   a.recurrence,
   liveCompletions.map(completion=>completion.period_key),
   new Date(),
   timezone
  )

  const {data:completion,error:completionError}=await supabase
   .from('activity_completions')
   .insert({
    activity_id:a.id,
    space_id:a.spaceId,
    completed_by:user.id,
    points:a.points,
    period_key:periodKey,
    proof_url:proofUrl?.path || null,
    approval_status:approvalStatus
   })
   .select(
    'id, completed_by, completed_at, approval_status, proof_url, period_key'
   )
   .single()

  if(completionError){
   console.error('Unable to create activity completion:',completionError)
   note(
    completionError.code==='23505'
     ? 'This activity is already completed for this period.'
     : 'Unable to complete activity.'
   )
   return
  }

  if(approvalStatus==='pending'){
   const rows=a.approverIds.map(id=>({
    user_id:id,
    space_id:a.spaceId,
    type:'approval_needed',
    title:'Approval needed 👀',
    message:`${user.name} submitted ${a.name} for approval.`,
    activity_id:a.id
   }))

   await saveNotifications(rows)

   update({
    ...data,
    activities:data.activities.map((x):Activity=>
     x.id===a.id
      ? {
         ...x,
         status:'pending',
         completedBy:user.id,
         completedAt:completion.completed_at,
         proofUrl:proofUrl?.url
        }
      : x
    )
   })

   note('Submitted for approval.')
   return
  }

  await award(
   a,
   user.id,
   completion.id,
   completion.completed_at
  )
 }

 const award=async(
  a:Activity,
  who:string,
  completionId:string,
  completedAt?:string
 )=>{
  const {data:existingLedger,error:ledgerCheckError}=await supabase
   .from('points_ledger')
   .select('id')
   .eq('activity_completion_id',completionId)
   .eq('transaction_type','activity_earned')
   .limit(1)

  if(ledgerCheckError){
   console.error('Unable to check Rally points:',ledgerCheckError)
   note('Unable to award points.')
   return
  }

  if(existingLedger?.length){
   note('Points were already awarded for this completion.')
   return
  }

  const {error:ledgerError}=await supabase
   .from('points_ledger')
   .insert({
    space_id:a.spaceId,
    user_id:who,
    amount:a.points,
    transaction_type:'activity_earned',
    destination:a.pointDestination || 'personal',
    activity_completion_id:completionId,
    note:`Completed ${a.name}`
   })

  if(ledgerError){
   console.error('Unable to award Rally points:',ledgerError)
   note('Activity completed, but points could not be awarded.')
   return
  }

  const s=data.spaces.find(x=>x.id===a.spaceId)
  if(!s) return

  const shared=a.pointDestination==='shared'

  const nextSpaces=data.spaces.map(sp=>
   sp.id!==s.id
    ? sp
    : {
       ...sp,
       poolBalance:shared
        ? sp.poolBalance+a.points
        : sp.poolBalance,
       members:sp.members.map(sm=>
        sm.memberId!==who
         ? sm
         : {
            ...sm,
            balance:shared
             ? sm.balance
             : sm.balance+a.points,
            lifetime:sm.lifetime+a.points,
            weekly:sm.weekly+a.points
           }
       )
      }
  )

  const nextMembers=data.members.map(m=>
   m.id!==who
    ? m
    : {
       ...m,
       globalLifetime:m.globalLifetime+a.points,
       tier:tierFor(m.globalLifetime+a.points)
      }
  )

  const reachedGoals=data.goals.filter(g=>
   g.spaceId===a.spaceId &&
   g.status==='active' &&
   a.contributesToGoals &&
   g.progress<g.target &&
   Math.min(g.target,g.progress+a.points)>=g.target
  )

  const nextGoals=data.goals.map(g=>
   g.spaceId===a.spaceId &&
   g.status==='active' &&
   a.contributesToGoals
    ? {
       ...g,
       progress:Math.min(g.target,g.progress+a.points),
       status:(
        Math.min(g.target,g.progress+a.points)>=g.target
         ? 'reached'
         : 'active'
       ) as Goal['status']
      }
    : g
  )

  if(reachedGoals.length>0){
   const goalRows=reachedGoals.flatMap(goal=>
    s.members.map(member=>({
     user_id:member.memberId,
     space_id:a.spaceId,
     type:'goal_reached',
     title:'Goal reached! 🎯',
     message:`${goal.name} reached ${goal.target} points.`,
     goal_id:goal.id
    }))
   )
   await saveNotifications(goalRows)
  }

  if(who!==user.id){
   await saveNotifications([{
    user_id:who,
    space_id:a.spaceId,
    type:'approval_result',
    title:'Activity approved ✨',
    message:`${a.name} was approved for +${a.points} points.`,
    activity_id:a.id
   }])
  }

  let completedChallengeId:string|undefined
  const {data:challengeJoin}=await supabase
   .from('challenge_joins')
   .select('challenge_id')
   .eq('activity_id',a.id)
   .eq('user_id',who)
   .maybeSingle()

  if(challengeJoin){
   completedChallengeId=challengeJoin.challenge_id

   if(who===authUser?.id){
    await supabase
     .from('challenge_joins')
     .update({completed_at:completedAt || new Date().toISOString()})
     .eq('activity_id',a.id)
     .eq('user_id',who)
   }
  }

  const target=a.periodTarget || recurrenceTarget(a.recurrence)
  const affectsCurrentView=
   a.completionMode==='shared_once' || who===user.id
  const nextProgress=affectsCurrentView
   ? Math.min(target,(a.periodProgress || 0)+1)
   : (a.periodProgress || 0)
  const nextStatus:ActivityStatus=
   nextProgress>=target ? 'complete' : 'open'

  update({
   ...data,
   spaces:nextSpaces,
   members:nextMembers,
   goals:nextGoals,
   challenges:data.challenges.map(challenge=>
    challenge.id===completedChallengeId
     ? {
        ...challenge,
        completedBy:[
         ...new Set([...challenge.completedBy,who])
        ]
       }
     : challenge
   ),
   activities:data.activities.map((x):Activity=>
    x.id===a.id
     ? {
        ...x,
        status:nextStatus,
        completedBy:who,
        completedAt:completedAt || new Date().toISOString(),
        periodProgress:nextProgress,
        periodTarget:target,
        periodLabel:recurrenceProgressLabel(
         a.recurrence,
         nextProgress,
         target
        ),
        approvalPending:false
       }
     : x
   ),
   notifications:data.notifications.map(n=>
    n.activityId===a.id&&n.recipientId===user.id
     ? {...n,read:true}
     : n
   ),
   history:[
    historyEntry({
     id:crypto.randomUUID(),
     spaceId:a.spaceId,
     memberId:who,
     activityId:a.id,
     title:a.name,
     detail:`${memberName(data,who)} completed this activity`,
     points:a.points,
     kind:'earn',
     createdAt:now()
    }),
    ...data.history
   ]
  })

  note(
   shared
    ? `+${a.points} shared Rally points`
    : `+${a.points} points`
  )
 }

 const undoComplete=async(a:Activity)=>{
  if(a.status!=='complete'||!a.completedBy) return

  const who=a.completedBy
  const activitySpace=data.spaces.find(space=>space.id===a.spaceId)
  const timezone=activitySpace?.timezone||'UTC'
  const currentRecurrence=recurrenceState(a.recurrence,timezone)
  const target=currentRecurrence.target
  const basePeriodKey=currentRecurrence.periodKey

  let completionQuery=supabase
   .from('activity_completions')
   .select('id, approval_status, period_key')
   .eq('activity_id',a.id)
   .eq('completed_by',who)
   .in('approval_status',['approved','not_required'])

  completionQuery=target>1
   ? completionQuery.like('period_key',`${basePeriodKey}%`)
   : completionQuery.eq('period_key',basePeriodKey)

  const {data:completion,error:completionError}=await completionQuery
   .order('completed_at',{ascending:false})
   .limit(1)
   .maybeSingle()

  if(completionError){
   console.error('Unable to find completion to undo:',completionError)
   note('Unable to undo completion.')
   return
  }

  if(!completion){
   note('No saved completion was found to undo.')
   return
  }

  const {data:existingUndo,error:undoCheckError}=await supabase
   .from('points_ledger')
   .select('id')
   .eq('activity_completion_id',completion.id)
   .eq('transaction_type','activity_undo')
   .limit(1)

  if(undoCheckError){
   console.error('Unable to check undo transaction:',undoCheckError)
   note('Unable to undo completion.')
   return
  }

  if(existingUndo?.length){
   note('This completion has already been undone.')
   return
  }

  const {error:ledgerError}=await supabase
   .from('points_ledger')
   .insert({
    space_id:a.spaceId,
    user_id:who,
    amount:-a.points,
    transaction_type:'activity_undo',
    destination:a.pointDestination || 'personal',
    activity_completion_id:completion.id,
    note:`Undid ${a.name}`
   })

  if(ledgerError){
   console.error('Unable to remove Rally points:',ledgerError)
   note('Unable to undo completion.')
   return
  }

  const {error:updateCompletionError}=await supabase
   .from('activity_completions')
   .update({
    approval_status:'rejected',
    approved_by:null,
    approved_at:null
   })
   .eq('id',completion.id)

  if(updateCompletionError){
   console.error(
    'Unable to reopen activity completion:',
    updateCompletionError
   )
   note('Points were adjusted, but the activity could not be reopened.')
   return
  }

  const s=data.spaces.find(x=>x.id===a.spaceId)
  if(!s) return

  const shared=a.pointDestination==='shared'

  const nextSpaces=data.spaces.map(sp=>
   sp.id!==s.id
    ? sp
    : {
       ...sp,
       poolBalance:shared
        ? Math.max(0,sp.poolBalance-a.points)
        : sp.poolBalance,
       members:sp.members.map(sm=>
        sm.memberId!==who
         ? sm
         : {
            ...sm,
            balance:shared
             ? sm.balance
             : Math.max(0,sm.balance-a.points),
            lifetime:Math.max(0,sm.lifetime-a.points),
            weekly:Math.max(0,sm.weekly-a.points)
           }
       )
      }
  )

  const nextMembers=data.members.map(m=>
   m.id!==who
    ? m
    : {
       ...m,
       globalLifetime:Math.max(0,m.globalLifetime-a.points),
       tier:tierFor(Math.max(0,m.globalLifetime-a.points))
      }
  )

  const nextGoals=data.goals.map(g=>
   g.spaceId===a.spaceId &&
   a.contributesToGoals &&
   g.status!=='celebrated' &&
   g.status!=='archived'
    ? {
       ...g,
       progress:Math.max(0,g.progress-a.points),
       status:(
        Math.max(0,g.progress-a.points)>=g.target
         ? 'reached'
         : 'active'
       ) as Goal['status']
      }
    : g
  )

  let challengeId:string|undefined
  const {data:challengeJoin}=await supabase
   .from('challenge_joins')
   .select('challenge_id')
   .eq('activity_id',a.id)
   .eq('user_id',who)
   .maybeSingle()

  if(challengeJoin){
   challengeId=challengeJoin.challenge_id
   if(who===authUser?.id){
    await supabase
     .from('challenge_joins')
     .update({completed_at:null})
     .eq('activity_id',a.id)
     .eq('user_id',who)
   }
  }

  const affectsCurrentView=
   a.completionMode==='shared_once' || who===user.id
  const nextProgress=affectsCurrentView
   ? Math.max(0,(a.periodProgress || target)-1)
   : (a.periodProgress || 0)

  update({
   ...data,
   spaces:nextSpaces,
   members:nextMembers,
   goals:nextGoals,
   challenges:data.challenges.map(challenge=>
    challenge.id===challengeId
     ? {
        ...challenge,
        completedBy:challenge.completedBy.filter(id=>id!==who)
       }
     : challenge
   ),
   activities:data.activities.map((x):Activity=>
    x.id===a.id
     ? {
        ...x,
        status:nextProgress>=target?'complete':'open',
        completedBy:undefined,
        completedAt:undefined,
        proofUrl:undefined,
        periodProgress:nextProgress,
        periodTarget:target,
        periodLabel:recurrenceProgressLabel(
         a.recurrence,
         nextProgress,
         target
        )
       }
     : x
   ),
   history:[
    historyEntry({
     id:crypto.randomUUID(),
     spaceId:a.spaceId,
     memberId:who,
     activityId:a.id,
     title:a.name,
     detail:`${memberName(data,who)} undid this completion`,
     points:a.points,
     kind:'undo',
     createdAt:now()
    }),
    ...data.history
   ]
  })

  note('Completion undone and points removed.')
 }

 const approve=async(a:Activity)=>{
  if(!a.approvalPending||!a.approverIds.includes(user.id)) return

  const {data:completion,error:completionError}=await supabase
   .from('activity_completions')
   .select('id, completed_by, completed_at, period_key')
   .eq('activity_id',a.id)
   .eq('approval_status','pending')
   .order('completed_at',{ascending:false})
   .limit(1)
   .maybeSingle()

  if(completionError){
   console.error('Unable to load pending approval:',completionError)
   note('Unable to approve activity.')
   return
  }

  if(!completion){
   note('No pending completion was found.')
   return
  }

  const approvedAt=new Date().toISOString()

  const {error:approvalError}=await supabase
   .from('activity_completions')
   .update({
    approval_status:'approved',
    approved_by:user.id,
    approved_at:approvedAt
   })
   .eq('id',completion.id)

  if(approvalError){
   console.error('Unable to approve activity:',approvalError)
   note('Unable to approve activity.')
   return
  }

  await award(
   a,
   completion.completed_by || user.id,
   completion.id,
   completion.completed_at
  )
 }

 const sendBack=async(a:Activity)=>{
  if(!a.approvalPending||!a.approverIds.includes(user.id)) return

  const {data:completion,error:completionError}=await supabase
   .from('activity_completions')
   .select('id, completed_by, period_key')
   .eq('activity_id',a.id)
   .eq('approval_status','pending')
   .order('completed_at',{ascending:false})
   .limit(1)
   .maybeSingle()

  if(completionError){
   console.error('Unable to load pending completion:',completionError)
   note('Unable to send activity back.')
   return
  }

  if(!completion){
   note('No pending completion was found.')
   return
  }

  const {error:rejectError}=await supabase
   .from('activity_completions')
   .update({
    approval_status:'rejected',
    approved_by:user.id,
    approved_at:new Date().toISOString()
   })
   .eq('id',completion.id)

  if(rejectError){
   console.error('Unable to send activity back:',rejectError)
   note('Unable to send activity back.')
   return
  }

  await saveNotifications([{
   user_id:completion.completed_by,
   space_id:a.spaceId,
   type:'approval_result',
   title:'Activity needs another try',
   message:`${a.name} was sent back for another attempt.`,
   activity_id:a.id
  }])

  const progress=a.periodProgress || 0

  update({
   ...data,
   activities:data.activities.map((x):Activity=>
    x.id===a.id
     ? {
        ...x,
        status:progress>=(a.periodTarget || 1)?'complete':'open',
        approvalPending:false,
        completedBy:undefined,
        completedAt:undefined,
        proofUrl:undefined
       }
     : x
   ),
   notifications:data.notifications.map(n=>
    n.activityId===a.id&&n.recipientId===user.id
     ? {...n,read:true}
     : n
   )
  })

  note('Activity sent back.')
 }

 if (!sessionChecked || (authenticated&&!accountLoaded)) {
  return <div className="auth-loading">Loading Rally...</div>
}

if (!authenticated) {
  return <Auth onAuthenticated={() => setAuthenticated(true)} />
}
 return <div className="app rally9-app canva-app-shell">
  {toast&&<div className="toast canva-toast"><RallySparkMascot mood="cheer"/><span>{toast}</span></div>}

  <header className="topbar rally9-topbar canva-topbar">
   <div className="canva-topbar-inner">
    <button
     className="brand canva-brand"
     onClick={()=>{setSpaceId('all');setScreen('home')}}
     aria-label="Go to Rally home"
    >
     <RallyBrandMark/>
     <b>{BRAND.name}</b>
    </button>

    <div className="top-actions canva-top-actions">
     <label className="sr-only" htmlFor="rally-space-switcher">Choose a Rally</label>
     <select
      id="rally-space-switcher"
      className="canva-space-select"
      value={spaceId}
      onChange={e=>{setSpaceId(e.target.value);setScreen('home')}}
     >
      <option value="all">All Rallies</option>
      {spaces.map(space=><option key={space.id} value={space.id}>{space.icon} {space.name}</option>)}
     </select>

     <button
      className="primary-button canva-new-rally"
      onClick={()=>setInviteOpen(true)}
      title="Create a Rally"
     >
      ＋ <span>New Rally</span>
     </button>

     <button
      className="icon-button canva-icon-button bell"
      title="Notifications"
      aria-label="Notifications"
      onClick={()=>{setSpaceId('all');setScreen('notifications')}}
     >
      🔔{unread>0&&<b className="canva-notification-count">{unread}</b>}
     </button>

     <button
      className="profile-shortcut canva-profile-shortcut"
      onClick={()=>{setSpaceId('all');setScreen('profile')}}
      aria-label="Profile"
     >
      <Avatar member={user}/>
     </button>
    </div>
   </div>
  </header>

  {inviteOpen&&
   <CreateSpace
    data={data}
    update={update}
    user={user}
    authUser={authUser}
    close={()=>setInviteOpen(false)}
   />
  }

  <main className="rally9-main">
   {screen==='notifications'&&
    <Notifications
     data={data}
     user={user}
     update={update}
     respondToInvite={respondToInvite}
     setSpaceId={setSpaceId}
     setScreen={setScreen}
    />
   }

   {screen==='community'&&
    <Community
     data={data}
     user={user}
     spaces={spaces}
     update={update}
     note={note}
     setScreen={setScreen}
    />
   }

   {screen==='profile'&&
    <Profile
     data={data}
     user={user}
     spaces={spaces}
     update={update}
     note={note}
     setSpaceId={setSpaceId}
     setScreen={setScreen}
     logout={logout}
    />
   }

   {screen==='how-it-works'&&
    <HowRallyWorks setScreen={setScreen}/>
   }

   {screen==='account-settings'&&
    <AccountSettings data={data} user={user} update={update} note={note}/>
   }

   {screen==='plan'&&
    <PlanSettings
     data={data}
     user={user}
     spaces={spaces}
     setSpaceId={setSpaceId}
     setScreen={setScreen}
    />
   }

   {screen==='friends'&&
    <FriendsSettings data={data} user={user} update={update} note={note}/>
   }

   {screen==='activity-settings'&&
    <ActivitySettingsIndex
     data={data}
     user={user}
     spaces={spaces}
     setSpaceId={setSpaceId}
     setScreen={setScreen}
    />
   }

   {!['notifications','community','profile','account-settings','plan','friends','activity-settings','how-it-works'].includes(screen)&&spaceId==='all'&&
    <>
     {screen==='activities'
      ? <GlobalActivities
         data={data}
         user={user}
         spaces={spaces}
         activities={visibleActivities}
         complete={complete}
         approve={approve}
         sendBack={sendBack}
         update={update}
         note={note}
        />
      : <GlobalHome
         data={data}
         user={user}
         spaces={spaces}
         activities={visibleActivities}
         complete={complete}
         approve={approve}
         sendBack={sendBack}
         respondToInvite={respondToInvite}
         setSpaceId={setSpaceId}
         setScreen={setScreen}
        />
     }
    </>
   }

   {!['notifications','community','profile','account-settings','plan','friends','activity-settings','how-it-works'].includes(screen)&&spaceId!=='all'&&activeSpace&&
    <>
     <SpaceHeader
      space={activeSpace}
      role={myRole}
      backHome={()=>{setSpaceId('all');setScreen('home')}}
      openSettings={()=>setScreen('settings')}
     />

     <RallyTabs
      screen={screen}
      space={activeSpace}
      setScreen={setScreen}
     />

     {screen==='home'&&
      <SpaceHome
       data={data}
       space={activeSpace}
       user={user}
       activities={visibleActivities}
       complete={complete}
       approve={approve}
       sendBack={sendBack}
       setScreen={setScreen}
      />
     }

     {screen==='activities'&&
      <Activities
       data={data}
       space={activeSpace}
       user={user}
       activities={visibleActivities}
       complete={complete}
       approve={approve}
       sendBack={sendBack}
       update={update}
       note={note}
      />
     }

     {screen==='leaderboard'&&
      <Leaderboard data={data} space={activeSpace} user={user}/>
     }

     {screen==='stats'&&<Stats data={data} space={activeSpace}/>} 

     {screen==='goals'&&
      <Goals
       data={data}
       space={activeSpace}
       user={user}
       update={update}
       note={note}
      />
     }

     {screen==='treats'&&
      <Treats
       data={data}
       space={activeSpace}
       user={user}
       update={update}
       note={note}
      />
     }

     {screen==='members'&&
      <Members
       data={data}
       space={activeSpace}
       user={user}
       update={update}
       note={note}
      />
     }

     {screen==='settings'&&
      <SpaceSettings
       data={data}
       space={activeSpace}
       user={user}
       update={update}
       note={note}
      />
     }
    </>
   }
  </main>

  <nav className="nav rally9-nav" aria-label="Main navigation">
   {spaceId!=='all'&&activeSpace&&!['notifications','community','profile','account-settings','plan','friends','activity-settings','how-it-works'].includes(screen)
    ? <>
       <NavButton
        active={screen==='home'}
        icon="⌂"
        label="Home"
        go={()=>setScreen('home')}
       />
       <NavButton
        active={screen==='activities'}
        icon="▣"
        label="Activities"
        go={()=>setScreen('activities')}
       />
       {activeSpace.members.length>1&&activeSpace.weeklyLeaderboard&&
        <NavButton
         active={screen==='leaderboard'}
         icon="♛"
         label="Leaderboard"
         go={()=>setScreen('leaderboard')}
        />
       }
       <NavButton
        active={screen==='goals'}
        icon="◎"
        label="Goals"
        go={()=>setScreen('goals')}
       />
       <NavButton
        active={screen==='treats'}
        icon="▦"
        label="Treats"
        go={()=>setScreen('treats')}
       />
      </>
    : <>
       <NavButton
        active={spaceId==='all'&&screen==='home'}
        icon="⌂"
        label="Home"
        go={()=>{setSpaceId('all');setScreen('home')}}
       />
       <NavButton
        active={spaceId==='all'&&screen==='activities'}
        icon="▣"
        label="Activities"
        go={()=>{setSpaceId('all');setScreen('activities')}}
       />
       <NavButton
        active={screen==='community'}
        icon="◉"
        label="Community"
        go={()=>{setSpaceId('all');setScreen('community')}}
       />
       <NavButton
        active={['profile','account-settings','plan','friends','activity-settings','how-it-works'].includes(screen)}
        icon="☺"
        label="Profile"
        go={()=>{setSpaceId('all');setScreen('profile')}}
       />
      </>
   }
  </nav>
 </div>
}


function RallyBrandMark(){
 return <span className="canva-brand-mark" aria-hidden="true">
  <svg viewBox="0 0 64 64" width="26" height="26">
   <path fill="#de705d" stroke="#292522" strokeWidth="3" d="M32 4l7 21 21 7-21 7-7 21-7-21-21-7 21-7z"/>
  </svg>
 </span>
}

function RallySparkMascot({mood='happy'}:{mood?:'happy'|'cheer'|'wait'}){
 return <span className="rally-spark mascot-inline" aria-hidden="true">
  <svg viewBox="0 0 100 100" className="spark-svg">
   <path fill="#ffd34c" stroke="#292522" strokeWidth="3" strokeLinejoin="round" d="M50 5l10 34 35 11-35 11-10 34-10-34L5 50l35-11z"/>
   <circle cx="39" cy="47" r="2.6" fill="#292522"/><circle cx="61" cy="47" r="2.6" fill="#292522"/>
   {mood==='cheer'
    ? <><path className="spark-face" d="M38 57q12 13 24 0"/><path className="spark-face" d="M33 39l7-3m20 0l7 3"/></>
    : mood==='wait'
     ? <><path className="spark-face" d="M39 59q11-6 22 0"/><path className="spark-face" d="M34 39l7-3m18 0l7 3"/></>
     : <path className="spark-face" d="M40 58q10 9 20 0"/>
   }
  </svg>
 </span>
}

function CanvaStateArt({state,icon}:{state:'ready'|'waiting'|'done';icon?:string}){
 return <div className={`state-art ${state}`} aria-hidden="true">
  {state==='done'
   ? <RallySparkMascot mood="cheer"/>
   : icon
    ? <span className="state-emoji">{icon}</span>
    : <span className="state-symbol">{state==='waiting'?'◷':'✓'}</span>
  }
 </div>
}

function MomentumRoute(){
 return <div className="hero-route" aria-hidden="true">
  <svg className="route-svg" viewBox="0 0 220 280">
   <path className="route-line" d="M28 251C21 204 141 221 106 153S86 77 176 35"/>
   <circle cx="29" cy="250" r="11" fill="#ffd34c" stroke="#292522" strokeWidth="2.5"/>
   <circle cx="91" cy="190" r="8" fill="#fff" stroke="#292522" strokeWidth="2.5"/>
   <circle cx="110" cy="132" r="10" fill="#ffd34c" stroke="#292522" strokeWidth="2.5"/>
   <path className="route-line ink" d="M174 71V25m0 0h34l-10 13 10 13h-34"/>
   <path fill="#de705d" stroke="#292522" strokeWidth="2.5" d="M174 25h34l-10 13 10 13h-34z"/>
   <path fill="#ffd34c" stroke="#292522" strokeWidth="2.5" d="M46 215l5 13 13 5-13 5-5 13-5-13-13-5 13-5z"/>
   <path fill="#ffd34c" stroke="#292522" strokeWidth="2.5" d="M119 64l4 10 10 4-10 4-4 10-4-10-10-4 10-4z"/>
  </svg>
 </div>
}

function DestinationScene({kind='goal'}:{kind?:'goal'|'treat'|'movie'}){
 if(kind==='treat') return <div className="destination-scene mint" aria-hidden="true">
  <svg viewBox="0 0 320 130">
   <path className="scene-path" d="M12 102c58-58 103 14 168-38 37-30 72-19 129-52"/>
   <path className="scene-ink" d="M263 87V32m0 0h35l-10 14 10 14h-35"/>
   <path fill="#de705d" stroke="#292522" strokeWidth="2.4" d="M263 32h35l-10 14 10 14h-35z"/>
   <circle className="scene-fill" cx="45" cy="90" r="10"/>
   <path fill="#fff0af" stroke="#292522" strokeWidth="2.4" d="M135 67c0-18 27-18 27 0 0-18 27-18 27 0 0 15-54 15-54 0z"/>
   <path fill="#ffd34c" stroke="#292522" strokeWidth="2.4" d="M145 67h32l-6 38h-20z"/>
  </svg>
 </div>
 if(kind==='movie') return <div className="destination-scene pink" aria-hidden="true">
  <svg viewBox="0 0 320 130">
   <path className="scene-path" d="M16 107c49-38 69 8 131-30s91 13 159-52"/>
   <circle className="scene-fill" cx="35" cy="97" r="10"/>
   <rect x="192" y="32" width="79" height="55" rx="8" fill="#fff9ee" stroke="#292522" strokeWidth="2.4"/>
   <path className="scene-ink" d="M200 43h63M206 92l-10 21m62-21 10 21"/>
   <circle fill="#ffd34c" stroke="#292522" strokeWidth="2" cx="229" cy="59" r="5"/><path className="scene-ink" d="M220 73h20"/>
  </svg>
 </div>
 return <div className="destination-scene" aria-hidden="true">
  <svg viewBox="0 0 460 130">
   <path className="scene-path" d="M22 106C71 49 126 125 176 73s89 26 145-28 76-7 120-37"/>
   <circle className="scene-fill" cx="25" cy="104" r="10"/><circle fill="#fff" stroke="#292522" strokeWidth="2.4" cx="177" cy="73" r="8"/><circle className="scene-fill" cx="317" cy="45" r="10"/>
   <path className="scene-ink" d="M429 76V20m0 0h25l-8 13 8 13h-25"/><path fill="#de705d" stroke="#292522" strokeWidth="2.4" d="M429 20h25l-8 13 8 13h-25z"/>
  </svg>
 </div>
}

function PennantBadge({children,tone='coral'}:{children?:any;tone?:'coral'|'sun'|'mint'}){
 const fill=tone==='sun'?'#ffd34c':tone==='mint'?'#dff3e8':'#de705d'
 return <span className="pennant"><svg viewBox="0 0 36 28" aria-hidden="true"><path fill={fill} stroke="#292522" strokeWidth="2" d="M4 2v24M5 3h26L23 10l8 7H5z"/></svg>{children}</span>
}

function Avatar({member}:{member:Member}){
 return member.avatar
  ? <img className="avatar" src={member.avatar}/>
  : <span className="avatar">{initials(member.name)}</span>
}

function NavButton({active,icon,label,go}:{active:boolean;icon:string;label:string;go:()=>void}){
 return <button className={active?'active':''} onClick={go}>
  <span>{icon}</span><small>{label}</small>
 </button>
}

function Progress({value,max}:{value:number;max:number}){
 return <div className="progress">
  <span style={{width:`${Math.min(100,value/Math.max(1,max)*100)}%`}}/>
 </div>
}

function SpaceHeader({space,role,backHome,openSettings}:{space:Space;role?:Role;backHome:()=>void;openSettings:()=>void}){
 const canManage=role==='Owner'||role==='Admin'
 return <section className="space-header rally9-space-header figma-space-header">
  <button className="space-back figma-icon-button" onClick={backHome} aria-label="Back to all Rallies">←</button>
  <div className="figma-space-pill" title={`${space.name} · ${role||'Member'}`}>
   <span>{space.icon}</span>
   <strong>{space.name}</strong>
   <small>{role||'Member'}</small>
  </div>
  {canManage
   ? <button className="figma-icon-button" onClick={openSettings} aria-label="Rally settings">⚙</button>
   : <span className="figma-header-spacer"/>
  }
 </section>
}

function RallyTabs({screen,space,setScreen}:{screen:Screen;space:Space;setScreen:(s:Screen)=>void}){
 const tabs:{screen:Screen;label:string}[]=[
  {screen:'members',label:'Members'},
  {screen:'stats',label:'Insights'},
  {screen:'settings',label:'Settings'}
 ]

 return <nav className="rally-tabs figma-utility-tabs" aria-label={`${space.name} more options`}>
  {tabs.map(tab=>
   <button
    key={tab.screen}
    className={screen===tab.screen?'active':''}
    onClick={()=>setScreen(tab.screen)}
   >
    {tab.label}
   </button>
  )}
 </nav>
}

function GlobalHome({data,user,spaces,activities,complete,approve,sendBack,respondToInvite,setSpaceId,setScreen}:{data:AppData;user:Member;spaces:Space[];activities:Activity[];complete:(a:Activity)=>void;approve:(a:Activity)=>void;sendBack:(a:Activity)=>void;respondToInvite:(invitation:SpaceInvitation,response:'accepted'|'declined')=>void|Promise<void>;setSpaceId:(id:string)=>void;setScreen:(s:Screen)=>void}){
 const ready=activities
  .filter(a=>
   a.status==='open' &&
   a.isAvailableNow!==false &&
   (a.assignedTo.length===0||a.assignedTo.includes(user.id))
  )
  .sort((a,b)=>
   recurrencePriority(a.recurrence)-recurrencePriority(b.recurrence) ||
   b.points-a.points
  )

 const approvals=activities.filter(a=>
  Boolean(a.approvalPending)&&a.approverIds.includes(user.id)
 )
 const pendingInvites=data.pendingInvites||[]
 const attentionCount=approvals.length+pendingInvites.length

 const totalWeekly=spaces.reduce(
  (sum,space)=>sum+(spaceMember(space,user.id)?.weekly||0),0
 )

 const weekStart=startOfCurrentWeek()
 const weeklyWins=data.history.filter(history=>{
  if(history.memberId!==user.id||history.kind!=='earn') return false
  const date=new Date(history.createdAt)
  return !Number.isNaN(date.getTime())&&date>=weekStart
 })

 const activeDays=new Set(
  weeklyWins.map(history=>{
   const date=new Date(history.createdAt)
   return Number.isNaN(date.getTime())?'':localDateKey(date)
  }).filter(Boolean)
 ).size

 const topTreat=data.treats
  .filter(treat=>
   treat.status==='locked'&&
   (treat.assignedTo.length===0||treat.assignedTo.includes(user.id))
  )
  .sort((a,b)=>{
   const aPriority=a.priorityFor.includes(user.id)?0:1
   const bPriority=b.priorityFor.includes(user.id)?0:1
   if(aPriority!==bPriority) return aPriority-bPriority
   const aSpace=spaces.find(space=>space.id===a.spaceId)
   const bSpace=spaces.find(space=>space.id===b.spaceId)
   const aBalance=aSpace?spaceMember(aSpace,user.id)?.balance||0:0
   const bBalance=bSpace?spaceMember(bSpace,user.id)?.balance||0:0
   return Math.max(0,a.points-aBalance)-Math.max(0,b.points-bBalance)
  })[0]

 const topGoal=data.goals
  .filter(goal=>goal.status==='active'||goal.status==='reached')
  .sort((a,b)=>(b.progress/Math.max(1,b.target))-(a.progress/Math.max(1,a.target)))[0]

 const motivationSpace=topTreat
  ? spaces.find(space=>space.id===topTreat.spaceId)
  : topGoal
   ? spaces.find(space=>space.id===topGoal.spaceId)
   : undefined

 const motivatorValue=topTreat&&motivationSpace
  ? spaceMember(motivationSpace,user.id)?.balance||0
  : topGoal?.progress||0
 const motivatorMax=topTreat?.points||topGoal?.target||7
 const momentumPct=Math.min(100,Math.round((topTreat||topGoal)
  ? motivatorValue/Math.max(1,motivatorMax)*100
  : activeDays/7*100
 ))

 const recentWins=data.history
  .filter(history=>history.memberId===user.id&&history.kind==='earn')
  .slice(0,3)

 const hasAnyActivities=activities.some(a=>
  a.assignedTo.includes(user.id)||a.createdBy===user.id
 )
 const userSpaceIds=new Set(spaces.map(space=>space.id))
 const hasMotivator=
  data.goals.some(goal=>userSpaceIds.has(goal.spaceId)&&goal.status!=='archived')||
  data.treats.some(treat=>userSpaceIds.has(treat.spaceId)&&treat.status!=='archived')
 const totalWins=data.history.filter(history=>history.memberId===user.id&&history.kind==='earn').length
 const onboardingSpace=spaces.find(space=>space.type==='personal')||spaces[0]
 const [guideDismissed,setGuideDismissed]=useState(()=>
  localStorage.getItem(`rally-how-it-works-dismissed:${user.id}`)==='1'
 )
 const dismissGuide=()=>{
  localStorage.setItem(`rally-how-it-works-dismissed:${user.id}`,'1')
  setGuideDismissed(true)
 }
 const goToMotivator=(screen:'goals'|'treats')=>{
  if(!onboardingSpace) return
  setSpaceId(onboardingSpace.id)
  setScreen(screen)
 }
 const needsGettingStarted=Boolean(onboardingSpace)&&(!hasMotivator||!hasAnyActivities)
 const showHowRallyWorks=!guideDismissed&&totalWins<3
 const todayLabel=new Intl.DateTimeFormat(undefined,{weekday:'long'}).format(new Date())

 return <>
  <section className="canva-page-head canva-home-head">
   <div>
    <p className="eyebrow">All Rallies · {todayLabel}</p>
    <h1>Hey {user.name.split(' ')[0]}, you’re doing brilliantly.</h1>
    <p className="supporting">A few small wins can make the whole day feel lighter.</p>
   </div>
  </section>

  <div className="canva-grid-main">
   <div className="canva-stack">
    <section className="card hero-card canva-card">
     <MomentumRoute/>
     <div className="hero-content">
      <p className="eyebrow">This week’s momentum</p>
      <div className="summary-grid">
       <div>
        <div className="point-number">{totalWeekly.toLocaleString()}</div>
        <p className="point-caption">points collected across your Rallies</p>
       </div>
       <div className="progress-ring" style={{'--progress':momentumPct} as any}>
        <span>{momentumPct}%</span>
       </div>
      </div>
      <div className="progress-track"><div className="progress-fill" style={{width:`${momentumPct}%`}}/></div>
      <p className="supporting hero-progress-copy">
       {topTreat?`${motivatorValue.toLocaleString()} of ${motivatorMax.toLocaleString()} points toward ${topTreat.name}`:
        topGoal?`${motivatorValue.toLocaleString()} of ${motivatorMax.toLocaleString()} points toward ${topGoal.name}`:
        `${activeDays} of 7 days active this week`}
      </p>
      <div className="summary-stats">
       <div className="summary-stat"><strong>{activeDays} {activeDays===1?'day':'days'}</strong><span>active this week</span></div>
       <div className="summary-stat"><strong>{weeklyWins.length} {weeklyWins.length===1?'win':'wins'}</strong><span>this week</span></div>
       <div className="summary-stat"><strong>{user.tier}</strong><span>your tier</span></div>
      </div>
     </div>
    </section>

    {attentionCount>0&&
     <section className="card attention card-pad canva-card">
      <div className="section-title">
       <h2>Needs your attention</h2>
       <span className="pill waiting">{attentionCount} waiting</span>
      </div>
      {pendingInvites.map(invitation=><PendingInvitationCard key={invitation.id} invitation={invitation} respond={respondToInvite}/>)}
      {approvals.slice(0,3).map(activity=>{
       const submitter=activity.approvalPendingBy?memberName(data,activity.approvalPendingBy):'Someone'
       return <div className="list-row" key={activity.id}>
        <CanvaStateArt state="waiting" icon={activity.icon}/>
        <div className="row-text"><strong>{activity.name}</strong><span>{submitter} submitted this · {activity.points} points</span></div>
        <button className="primary-button" onClick={()=>{setSpaceId(activity.spaceId);setScreen('activities')}}>Review</button>
       </div>
      })}
     </section>
    }

    <section className="card card-pad canva-card">
     <div className="section-title">
      <h2>Up next</h2>
      {ready.length>3&&<button className="link-button" onClick={()=>setScreen('activities')}>View all Rallies</button>}
     </div>
     {!hasAnyActivities&&<div className="empty-state"><div className="mascot-wrap"><RallySparkMascot mood="happy"/></div><strong>Your first win starts here</strong><p>Add one small thing you’d like to make progress on.</p><button className="primary-button" onClick={()=>setScreen('activities')}>Add your first activity</button></div>}
     {hasAnyActivities&&ready.length===0&&<div className="empty-state"><div className="mascot-wrap"><RallySparkMascot mood="cheer"/></div><strong>You’re all caught up</strong><p>Enjoy the extra breathing room.</p></div>}
     {ready.slice(0,3).map(activity=>{
      const space=spaces.find(item=>item.id===activity.spaceId)
      return <div className="list-row" key={activity.id}>
       <CanvaStateArt state="ready" icon={activity.icon}/>
       <div className="row-text"><strong>{activity.name}</strong><span>{activity.recurrenceLabel||recurrenceLabel(activity.recurrence)}{space?` · ${space.name}`:''}</span></div>
       <button className="secondary-button compact-complete" onClick={()=>complete(activity)}>Complete</button>
       <span className="token">+{activity.points}</span>
      </div>
     })}
    </section>
   </div>

   <aside className="canva-stack">
    {(topTreat||topGoal)&&
     <section className={`card card-pad canva-card ${topTreat?'treat-card':'goal-motivation-card'}`}>
      <DestinationScene kind={topTreat?'treat':'goal'}/>
      <div className="section-title">
       <span className={`space-badge ${motivationSpace?.type||'personal'}`}>{motivationSpace?.icon||'✦'}</span>
       <PennantBadge>{topTreat?'Next reward':'Active goal'}</PennantBadge>
      </div>
      <h2>{topTreat?topTreat.name:topGoal!.name}</h2>
      <p className="supporting">{topTreat?'Keep going—your next Treat is getting closer.':'Every selected win can move this Goal forward.'}</p>
      <div className="progress-track motivation-track"><div className="progress-fill" style={{width:`${momentumPct}%`}}/></div>
      <p className="supporting motivation-progress">
       {topTreat
        ? `${Math.max(0,topTreat.points-motivatorValue).toLocaleString()} points to go`
        : `${Math.max(0,topGoal!.target-topGoal!.progress).toLocaleString()} points to go`}
      </p>
     </section>
    }

    <section className="card card-pad win-card canva-card">
     <div className="section-title"><h2>Recent wins</h2><RallySparkMascot mood="cheer"/></div>
     {recentWins.length
      ? recentWins.map(history=><div className="list-row" key={history.id}>
         <CanvaStateArt state="done"/>
         <div className="row-text"><strong>{history.title}</strong><span>{spaces.find(s=>s.id===history.spaceId)?.name||'Rally'} · {formatTimestamp(history.createdAt)}</span></div>
         <span className="token">+{history.points}</span>
        </div>)
      : <div className="empty-state compact-empty"><strong>Your wins will show up here.</strong></div>
     }
    </section>
   </aside>
  </div>

  <section className="canva-space-section">
   <div className="section-title"><div><p className="eyebrow">Your Rallies</p><h2>{spaces.length===1?'Your space':'Your spaces'}</h2></div></div>
   <div className="canva-space-grid">
    {spaces.map(space=>{
     const sm=spaceMember(space,user.id)!
     const readyCount=data.activities.filter(a=>a.spaceId===space.id&&a.status==='open'&&a.isAvailableNow!==false&&(a.assignedTo.length===0||a.assignedTo.includes(user.id))).length
     return <button className="canva-space-card" key={space.id} onClick={()=>{setSpaceId(space.id);setScreen('home')}}>
      <span className={`space-badge ${space.type}`}>{space.icon}</span>
      <div><strong>{space.name}</strong><small>{readyCount} ready · {sm.weekly} pts this week</small></div>
      <span>→</span>
     </button>
    })}
   </div>
  </section>

  {needsGettingStarted&&onboardingSpace&&
   <section className="card card-pad canva-onboarding-card">
    <div className="section-title"><div><p className="eyebrow">Start with motivation</p><h2>Give your points a purpose.</h2></div><RallySparkMascot mood="happy"/></div>
    <p className="supporting">Pick a Goal to track progress or a Treat to give yourself something fun to earn, then add an activity.</p>
    <div className="canva-onboarding-actions">
     {!hasMotivator&&<><button className="secondary-button" onClick={()=>goToMotivator('goals')}>🎯 Create a Goal</button><button className="secondary-button" onClick={()=>goToMotivator('treats')}>🎁 Create a Treat</button></>}
     {!hasAnyActivities&&<button className="primary-button" onClick={()=>{setSpaceId('all');setScreen('activities')}}>＋ Add your first activity</button>}
    </div>
   </section>
  }

  {showHowRallyWorks&&
   <section className="card card-pad canva-how-card">
    <div className="section-title"><div><p className="eyebrow">How Rally works</p><h2>Get things done. See your progress. Stay motivated.</h2></div><RallySparkMascot mood="happy"/></div>
    <p className="supporting">Complete activities to earn points. Points make progress visible, move the Goals you choose forward, and can unlock Treats you set for yourself.</p>
    <div className="canva-how-actions"><button className="secondary-button" onClick={()=>setScreen('how-it-works')}>Learn how Rally works</button><button className="link-button" onClick={dismissGuide}>Got it</button></div>
   </section>
  }
 </>
}


function GlobalActivities({data,user,spaces,activities,complete,approve,sendBack,update,note}:{data:AppData;user:Member;spaces:Space[];activities:Activity[];complete:(a:Activity)=>void;approve:(a:Activity)=>void;sendBack:(a:Activity)=>void;update:(d:AppData)=>void;note:(s:string)=>void}){
 const [statusFilter,setStatusFilter]=useState<'ready'|'waiting'|'done'|'all'>('ready')
 const [rallyFilter,setRallyFilter]=useState('all')
 const [createSpaceId,setCreateSpaceId]=useState(spaces[0]?.id||'')

 useEffect(()=>{
  if(!createSpaceId&&spaces[0]?.id) setCreateSpaceId(spaces[0].id)
 },[createSpaceId,spaces])

 const relevant=activities.filter(activity=>
  activity.assignedTo.includes(user.id)||
  activity.approverIds.includes(user.id)||
  activity.createdBy===user.id
 )

 const filtered=relevant
  .filter(activity=>rallyFilter==='all'||activity.spaceId===rallyFilter)
  .filter(activity=>{
   if(statusFilter==='ready') return activity.status==='open'&&activity.isAvailableNow!==false&&(activity.assignedTo.length===0||activity.assignedTo.includes(user.id))
   if(statusFilter==='waiting') return activity.status==='pending'||(Boolean(activity.approvalPending)&&activity.approverIds.includes(user.id))
   if(statusFilter==='done') return activity.status==='complete'
   return activity.status!=='archived'
  })
  .sort((a,b)=>recurrencePriority(a.recurrence)-recurrencePriority(b.recurrence)||b.points-a.points)

 const createSpace=spaces.find(space=>space.id===createSpaceId)||spaces[0]

 return <>
  <section className="canva-page-head">
   <div>
    <p className="eyebrow">Make progress together</p>
    <h1>Activities</h1>
    <p className="supporting">Clear little actions, shared momentum.</p>
   </div>
   <button className="primary-button" onClick={()=>document.getElementById('global-add-activity')?.setAttribute('open','true')}>＋ Add activity</button>
  </section>

  <div className="canva-activity-tools">
   <div className="segmented" role="tablist" aria-label="Activity filters">
    {([['ready','Ready'],['waiting','Waiting'],['done','Done'],['all','All']] as const).map(([value,label])=>
     <button key={value} className={statusFilter===value?'active':''} onClick={()=>setStatusFilter(value)}>{label}</button>
    )}
   </div>
   <label className="canva-filter-select"><span>Rally</span><select value={rallyFilter} onChange={e=>setRallyFilter(e.target.value)}><option value="all">All Rallies</option>{spaces.map(space=><option value={space.id} key={space.id}>{space.icon} {space.name}</option>)}</select></label>
  </div>

  <section className="activity-grid canva-activity-grid">
   {filtered.length
    ? filtered.map(activity=><ActivityCard key={activity.id} a={activity} data={data} user={user} complete={complete} approve={approve} sendBack={sendBack} showSpace/>)
    : <div className="empty-state" style={{gridColumn:'1/-1'}}><div className="mascot-wrap"><RallySparkMascot mood="wait"/></div><strong>Nothing here yet</strong><p>{statusFilter==='ready'?'You’re all caught up for now.':'There’s nothing to show in this view.'}</p></div>
   }
  </section>

  {createSpace&&<details id="global-add-activity" className="canva-create-shell" open={relevant.length===0}>
   <summary>＋ Add activity</summary>
   <div className="canva-create-body">
    <label className="canva-filter-select create-rally-picker"><span>Which Rally?</span><select value={createSpace.id} onChange={e=>setCreateSpaceId(e.target.value)}>{spaces.map(space=><option value={space.id} key={space.id}>{space.icon} {space.name}</option>)}</select></label>
    <AddActivityForm key={createSpace.id} data={data} space={createSpace} user={user} update={update} note={note}/>
   </div>
  </details>}
 </>
}


function ActivityCard({a,data,user,complete,approve,sendBack,showSpace=false}:{a:Activity;data:AppData;user:Member;complete:(a:Activity)=>void;approve?:(a:Activity)=>void;sendBack?:(a:Activity)=>void;showSpace?:boolean}){
 const space=data.spaces.find(s=>s.id===a.spaceId)
 const canApprove=Boolean(a.approvalPending)&&a.approverIds.includes(user.id)
 const isAssigned=a.assignedTo.length===0||a.assignedTo.includes(user.id)
 const availableNow=a.isAvailableNow!==false
 const mySpaceRole=space?.members.find(m=>m.memberId===user.id)?.role
 const canUndo=a.status==='complete'&&(a.completedBy===user.id||mySpaceRole==='Admin'||mySpaceRole==='Owner')
 const assignedNames=a.assignedTo.map(id=>memberName(data,id)).filter(Boolean)
 const target=a.periodTarget||1
 const progress=a.periodProgress||0
 const statusState:'ready'|'waiting'|'done' = a.status==='complete'?'done':(a.status==='pending'||a.approvalPending)?'waiting':'ready'
 const statusLabel=statusState==='done'?'Completed':statusState==='waiting'?'Waiting for approval':availableNow?'Ready to go':'Not due yet'
 const completionText=a.approval?'Submit for approval':a.proofMode==='Required photo'?'Add proof & complete':'Complete'
 const periodPct=target>0?Math.min(100,Math.round(progress/target*100)):(a.status==='complete'?100:0)
 const assignmentLine=canApprove&&a.approvalPendingBy
  ? `Proof submitted by ${memberName(data,a.approvalPendingBy)}`
  : a.status==='complete'&&a.completedBy
   ? `Completed by ${memberName(data,a.completedBy)}`
   : !isAssigned&&assignedNames.length
    ? `Assigned to ${assignedNames.join(', ')}`
    : assignedNames.length
     ? `Assigned to ${assignedNames.join(', ')}`
     : 'Ready when you are'

 return <article className={`card activity-card canva-card ${statusState==='done'?'completed celebrate':''} ${!availableNow&&a.status==='open'?'not-due':''}`}>
  <div className="activity-top">
   <div>
    <CanvaStateArt state={statusState} icon={a.icon}/>
    <h2 className="activity-title">{a.name}</h2>
   </div>
   <span className={`pill ${statusState}`}>{statusLabel}</span>
  </div>

  <div className="meta">
   <span>{a.category}</span>
   <span>{a.recurrenceLabel||recurrenceLabel(a.recurrence)}</span>
   {showSpace&&space&&<span>{space.icon} {space.name}</span>}
  </div>

  <div>
   <div className="progress-track"><div className="progress-fill" style={{width:`${a.status==='complete'?100:periodPct}%`,background:a.status==='complete'?'#7354b0':undefined}}/></div>
   <p className="tiny-progress">{target>1?`${progress} of ${target} this period · `:''}{assignmentLine}</p>
   {!availableNow&&a.nextAvailableLabel&&<p className="tiny-progress">Next available {a.nextAvailableLabel}</p>}
  </div>

  <div className="activity-bottom">
   <div className="canva-activity-actions">
    {a.status==='open'&&isAssigned&&availableNow&&<button className="primary-button" onClick={()=>complete(a)}>✓ {completionText}</button>}
    {a.status==='open'&&isAssigned&&!availableNow&&<span className="pill waiting">Not due today</span>}
    {canApprove&&<>
     <button className="primary-button" onClick={()=>approve?.(a)}>Approve</button>
     {a.approvalProofUrl&&<button className="secondary-button" onClick={()=>window.open(a.approvalProofUrl,'_blank')}>View proof</button>}
     <button className="secondary-button" onClick={()=>sendBack?.(a)}>Send back</button>
    </>}
    {a.status==='pending'&&!canApprove&&<span className="pill waiting">Waiting for approval</span>}
    {a.status==='complete'&&<>
     {a.proofUrl&&<button className="secondary-button" onClick={()=>window.open(a.proofUrl,'_blank')}>View proof</button>}
     {canUndo?<button className="secondary-button" onClick={()=>complete(a)}>Undo completion</button>:<span className="pill done">✓ Completed</span>}
    </>}
   </div>
   <span className="token">+{a.points}</span>
  </div>
 </article>
}


function AddActivityForm({data,space,user,update,note}:{data:AppData;space:Space;user:Member;update:(d:AppData)=>void;note:(s:string)=>void}){
 const solo=space.members.length===1
 const [name,setName]=useState('')
 const [category,setCategory]=useState('Other')
 const [requireApproval,setRequireApproval]=useState(false)
 const [assignees,setAssignees]=useState<string[]>([user.id])
 const [completionMode,setCompletionMode]=useState<CompletionMode>('per_member')
 const [recurrenceAnchor]=useState(()=>zonedDateKey(new Date(),space.timezone))
 const startingWeekday=weekdayForKey(recurrenceAnchor)
 const startingMonthDay=Number(recurrenceAnchor.slice(-2))
 const [frequency,setFrequency]=useState<'once'|'daily'|'weekdays'|'times-week'|'weekly'|'monthly'|'custom'>('daily')
 const [selectedWeekdays,setSelectedWeekdays]=useState<number[]>([startingWeekday])
 const [weeklyCount,setWeeklyCount]=useState(3)
 const [weeklyDay,setWeeklyDay]=useState(startingWeekday)
 const [monthlyDay,setMonthlyDay]=useState(startingMonthDay)
 const [customInterval,setCustomInterval]=useState(2)
 const [customUnit,setCustomUnit]=useState<RecurrenceUnit>('week')
 const [customTarget,setCustomTarget]=useState(1)
 const [customMode,setCustomMode]=useState<'count'|'weekdays'>('count')
 const [customWeekdays,setCustomWeekdays]=useState<number[]>([startingWeekday])
 const points=suggestedPoints(name,category)
 const activeGoals=data.goals.filter(goal=>goal.spaceId===space.id&&goal.status==='active')
 const weekdayOrder=[1,2,3,4,5,6,0]

 const recurrenceValue=useMemo(()=>{
  if(frequency==='once'){
   return serializeRecurrence({v:2,kind:'once',anchor:recurrenceAnchor})
  }
  if(frequency==='daily'){
   return serializeRecurrence({v:2,kind:'interval',unit:'day',interval:1,target:1,anchor:recurrenceAnchor})
  }
  if(frequency==='weekdays'){
   return serializeRecurrence({v:2,kind:'weekdays',interval:1,weekdays:selectedWeekdays,anchor:recurrenceAnchor})
  }
  if(frequency==='times-week'){
   return serializeRecurrence({v:2,kind:'interval',unit:'week',interval:1,target:safeInt(weeklyCount,1,31),anchor:recurrenceAnchor})
  }
  if(frequency==='weekly'){
   return serializeRecurrence({v:2,kind:'weekdays',interval:1,weekdays:[weeklyDay],anchor:recurrenceAnchor})
  }
  if(frequency==='monthly'){
   return serializeRecurrence({v:2,kind:'monthday',interval:1,day:safeInt(monthlyDay,1,31),anchor:recurrenceAnchor})
  }
  if(customUnit==='week'&&customMode==='weekdays'){
   const todayIndex=weekdayOrder.indexOf(startingWeekday)
   const hasDayLeftThisWeek=customWeekdays.some(day=>weekdayOrder.indexOf(day)>=todayIndex)
   const scheduleAnchor=customInterval>1&&!hasDayLeftThisWeek
    ? addDaysToKey(recurrenceAnchor,7)
    : recurrenceAnchor
   return serializeRecurrence({
    v:2,kind:'weekdays',interval:safeInt(customInterval,1,52),weekdays:customWeekdays,anchor:scheduleAnchor
   })
  }
  return serializeRecurrence({
   v:2,
   kind:'interval',
   unit:customUnit,
   interval:safeInt(customInterval,1,365),
   target:safeInt(customTarget,1,31),
   anchor:recurrenceAnchor
  })
 },[
  frequency,recurrenceAnchor,selectedWeekdays,weeklyCount,weeklyDay,monthlyDay,
  customUnit,customMode,customInterval,customTarget,customWeekdays
 ])

 const resetRecurrence=()=>{
  setFrequency('daily')
  setSelectedWeekdays([startingWeekday])
  setWeeklyCount(3)
  setWeeklyDay(startingWeekday)
  setMonthlyDay(startingMonthDay)
  setCustomInterval(2)
  setCustomUnit('week')
  setCustomTarget(1)
  setCustomMode('count')
  setCustomWeekdays([startingWeekday])
 }

 useEffect(()=>{
  setAssignees([user.id])
  setCompletionMode('per_member')
  setRequireApproval(false)
 },[space.id,user.id])

 const toggleAssignee=(id:string)=>{
  setAssignees(current=>
   current.includes(id)
    ? current.filter(memberId=>memberId!==id)
    : [...current,id]
  )
 }

 const toggleWeekday=(day:number,custom=false)=>{
  const setter=custom?setCustomWeekdays:setSelectedWeekdays
  setter(current=>{
   if(current.includes(day)){
    return current.length===1?current:current.filter(value=>value!==day)
   }
   return [...current,day].sort((a,b)=>weekdayOrder.indexOf(a)-weekdayOrder.indexOf(b))
  })
 }

 const add=async(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault()
  const form=e.currentTarget
  const f=new FormData(form)

  const assignedTo=solo?[user.id]:assignees
  if(assignedTo.length===0){
   note('Choose at least one person for this activity.')
   return
  }

  const approvers=requireApproval
   ? Array.from(f.getAll('approver')).map(String)
   : []

  if(requireApproval&&approvers.length===0){
   note('Choose at least one approver.')
   return
  }

  const finalCompletionMode:CompletionMode=
   assignedTo.length>1 ? completionMode : 'per_member'

  const pointDestination:Activity['pointDestination']=
   space.poolEnabled
    ? String(f.get('pointDestination')||'personal') as 'personal'|'shared'
    : 'personal'

  const savedRecurrence=String(f.get('recurrence'))
  const recurrence=recurrenceState(savedRecurrence,space.timezone)
  const activityId=crypto.randomUUID()
  const a:Activity={
   id:activityId,
   spaceId:space.id,
   name:String(f.get('name')),
   icon:String(f.get('icon')||'✨'),
   category:String(f.get('category')||'Other'),
   points:Number(f.get('points')),
   recurrence:savedRecurrence,
   recurrenceLabel:recurrence.label,
   isAvailableNow:recurrence.available,
   nextAvailableLabel:recurrence.nextAvailableLabel,
   status:'open',
   visibility:String(f.get('visibility')) as Visibility,
   assignedTo,
   completionMode:finalCompletionMode,
   approval:!solo&&requireApproval,
   approverIds:approvers,
   proofMode:String(f.get('proof')) as ProofMode,
   contributesToGoals:f.get('goals')==='on',
   pointDestination,
   version:1,
   createdBy:user.id,
   createdAt:new Date().toISOString(),
   periodProgress:0,
   periodTarget:recurrence.target,
   periodLabel:recurrenceProgressLabel(savedRecurrence,0,recurrence.target)
  }

  const {error:activityError}=await supabase
   .from('activities')
   .insert({
    id:activityId,
    space_id:space.id,
    name:a.name,
    icon:a.icon,
    category:a.category,
    points:a.points,
    recurrence:a.recurrence,
    completion_mode:a.completionMode,
    proof_mode:
     a.proofMode==='Required photo'
      ? 'required_photo'
      : a.proofMode==='Optional photo'
       ? 'optional_photo'
       : 'none',
    require_approval:a.approval,
    contributes_to_goals:a.contributesToGoals,
    status:'active',
    created_by:user.id,
    point_destination:a.pointDestination,
    visibility:a.visibility
   })

  if(activityError){
   console.error('Unable to create activity:',activityError)
   note('Unable to add activity.')
   return
  }

  const {error:assignmentError}=await supabase
   .from('activity_assignments')
   .insert(
    assignedTo.map(userId=>({
     activity_id:activityId,
     user_id:userId
    }))
   )

  if(assignmentError){
   console.error('Unable to save activity assignments:',assignmentError)
   await supabase.from('activities').update({status:'archived'}).eq('id',activityId)
   note('Activity could not be fully created.')
   return
  }

  if(approvers.length>0){
   const {error:approverError}=await supabase
    .from('activity_approvers')
    .insert(
     approvers.map(userId=>({
      activity_id:activityId,
      user_id:userId
     }))
    )

   if(approverError){
    console.error('Unable to save activity approvers:',approverError)
    await supabase.from('activities').update({status:'archived'}).eq('id',activityId)
    note('Activity could not be fully created.')
    return
   }
  }

  update({...data,activities:[a,...data.activities]})
  form.reset()
  setName('')
  setCategory('Other')
  setAssignees([user.id])
  setCompletionMode('per_member')
  setRequireApproval(false)
  resetRecurrence()
  note('Activity added.')
 }

 return <form className="form rally9-create-form" onSubmit={add}>
  <div className="create-form-intro">
   <div>
    <p className="eyebrow">New activity</p>
    <h2>Add something worth doing</h2>
   </div>
   {solo&&<span className="smart-default">Assigned to you automatically</span>}
  </div>

  <div className="activity-basic-grid">
   <label className="activity-name-field">
    What do you want to do?
    <input
     name="name"
     required
     value={name}
     onChange={e=>setName(e.target.value)}
     placeholder="Read for 30 minutes"
    />
   </label>
   <label className="icon-field">
    Icon
    <input name="icon" placeholder="✨"/>
   </label>
  </div>

  <input type="hidden" name="recurrence" value={recurrenceValue}/>

  <div className="two recurrence-main-row">
   <label>
    How often?
    <select value={frequency} onChange={e=>setFrequency(e.target.value as typeof frequency)}>
     <option value="once">One time</option>
     <option value="daily">Every day</option>
     <option value="weekdays">Certain days</option>
     <option value="times-week">X times per week</option>
     <option value="weekly">Weekly</option>
     <option value="monthly">Monthly</option>
     <option value="custom">Custom</option>
    </select>
   </label>
   <label>
    Points
    <select name="points" defaultValue={String(points)} key={points}>
     {POINT_OPTIONS.map(point=><option value={point} key={point}>{point} points</option>)}
    </select>
    <small>How motivating should this win be? Bigger or harder activities can be worth more.</small>
   </label>
  </div>

  <div className="recurrence-builder">
   {frequency==='weekdays'&&<>
    <span className="field-label">Repeat on</span>
    <div className="weekday-picker" aria-label="Days of week">
     {weekdayOrder.map(day=>
      <button
       type="button"
       key={day}
       className={selectedWeekdays.includes(day)?'selected':''}
       onClick={()=>toggleWeekday(day)}
      >
       {WEEKDAY_LABELS[day].slice(0,2)}
      </button>
     )}
    </div>
   </>}

   {frequency==='times-week'&&
    <label className="compact-number-field">
     How many times each week?
     <input
      type="number"
      min="1"
      max="31"
      value={weeklyCount}
      onChange={e=>setWeeklyCount(safeInt(Number(e.target.value),1,31))}
     />
     <small>Complete it any {weeklyCount} {weeklyCount===1?'time':'times'} during the week.</small>
    </label>
   }

   {frequency==='weekly'&&
    <label>
     On
     <select value={weeklyDay} onChange={e=>setWeeklyDay(Number(e.target.value))}>
      {weekdayOrder.map(day=><option value={day} key={day}>{WEEKDAY_LABELS[day]}</option>)}
     </select>
    </label>
   }

   {frequency==='monthly'&&
    <label>
     On day
     <select value={monthlyDay} onChange={e=>setMonthlyDay(Number(e.target.value))}>
      {Array.from({length:31},(_,index)=>index+1).map(day=><option value={day} key={day}>{ordinal(day)}</option>)}
     </select>
     <small>If that date doesn’t exist in a month, Rally uses the last day of that month.</small>
    </label>
   }

   {frequency==='custom'&&<div className="custom-recurrence">
    <div className="custom-repeat-row">
     <span className="field-label">Repeat every</span>
     <input
      aria-label="Repeat interval"
      type="number"
      min="1"
      max="365"
      value={customInterval}
      onChange={e=>setCustomInterval(safeInt(Number(e.target.value),1,365))}
     />
     <select value={customUnit} onChange={e=>{
      const unit=e.target.value as RecurrenceUnit
      setCustomUnit(unit)
      if(unit!=='week') setCustomMode('count')
     }}>
      <option value="day">day{customInterval===1?'':'s'}</option>
      <option value="week">week{customInterval===1?'':'s'}</option>
      <option value="month">month{customInterval===1?'':'s'}</option>
     </select>
    </div>

    {customUnit==='week'&&
     <fieldset className="recurrence-method">
      <legend>How should it work?</legend>
      <label className={customMode==='count'?'selected':''}>
       <input type="radio" checked={customMode==='count'} onChange={()=>setCustomMode('count')}/>
       <span><strong>Complete it a certain number of times</strong><small>Any days during the period.</small></span>
      </label>
      <label className={customMode==='weekdays'?'selected':''}>
       <input type="radio" checked={customMode==='weekdays'} onChange={()=>setCustomMode('weekdays')}/>
       <span><strong>Use specific days</strong><small>Only those days can be completed.</small></span>
      </label>
     </fieldset>
    }

    {customUnit==='week'&&customMode==='weekdays'
     ? <>
       <span className="field-label">Repeat on</span>
       <div className="weekday-picker" aria-label="Custom days of week">
        {weekdayOrder.map(day=>
         <button
          type="button"
          key={day}
          className={customWeekdays.includes(day)?'selected':''}
          onClick={()=>toggleWeekday(day,true)}
         >
          {WEEKDAY_LABELS[day].slice(0,2)}
         </button>
        )}
       </div>
      </>
     : <label className="compact-number-field">
       Completions per period
       <input
        type="number"
        min="1"
        max="31"
        value={customTarget}
        onChange={e=>setCustomTarget(safeInt(Number(e.target.value),1,31))}
       />
       <small>Use 1 for once per period, or more for goals like 3 times per day or 5 times per month.</small>
      </label>
    }
   </div>}

   <div className="recurrence-preview">
    <span>↻</span>
    <div><strong>{recurrenceLabel(recurrenceValue)}</strong><small>Missed periods close automatically and can’t be completed later.</small></div>
   </div>
  </div>

  {!solo&&<fieldset className="assignment-fieldset">
   <legend>Who is this for?</legend>
   <div className="assignment-pills">
    {space.members.map(member=>{
     const selected=assignees.includes(member.memberId)
     return <label className={`person-pill ${selected?'selected':''}`} key={member.memberId}>
      <input
       type="checkbox"
       checked={selected}
       onChange={()=>toggleAssignee(member.memberId)}
      />
      <Avatar member={data.members.find(x=>x.id===member.memberId)!}/>
      <span>{member.memberId===user.id?'Me':memberName(data,member.memberId)}</span>
     </label>
    })}
   </div>
  </fieldset>}

  {!solo&&assignees.length>1&&
   <fieldset className="completion-choice">
    <legend>Who needs to complete this?</legend>
    <label className={completionMode==='per_member'?'selected':''}>
     <input
      type="radio"
      name="completionChoice"
      checked={completionMode==='per_member'}
      onChange={()=>setCompletionMode('per_member')}
     />
     <span>
      <strong>Everyone individually</strong>
      <small>Each person gets their own completion and points.</small>
     </span>
    </label>
    <label className={completionMode==='shared_once'?'selected':''}>
     <input
      type="radio"
      name="completionChoice"
      checked={completionMode==='shared_once'}
      onChange={()=>setCompletionMode('shared_once')}
     />
     <span>
      <strong>Anyone can complete it</strong>
      <small>One person completes it for the Rally.</small>
     </span>
    </label>
   </fieldset>
  }

  <details className="more-options">
   <summary>More options</summary>
   <div className="more-options-body">
    <div className="three">
     <label>
      Category
      <input name="category" value={category} onChange={e=>setCategory(e.target.value)}/>
     </label>
     <label>
      Visibility
      <select
       name="visibility"
       defaultValue={space.type==='personal'&&data.accountPrefs?.privatePersonal?'private':'space'}
      >
       <option value="space">Visible to Rally</option>
       <option value="private">Private</option>
      </select>
     </label>
     <label>
      Photo proof
      <select name="proof">
       <option>None</option>
       <option>Optional photo</option>
       <option>Required photo</option>
      </select>
     </label>
    </div>

    {!solo&&
     <label className="check approval-toggle">
      <input
       type="checkbox"
       checked={requireApproval}
       onChange={e=>setRequireApproval(e.target.checked)}
      />
      Require approval before points are awarded
     </label>
    }

    {!solo&&requireApproval&&
     <fieldset className="approver-picker">
      <legend>Who can approve?</legend>
      <div className="approver-options">
       {space.members
        .filter(member=>member.memberId!==user.id)
        .map(member=>
         <label className="person-option" key={member.memberId}>
          <input type="checkbox" name="approver" value={member.memberId}/>
          <Avatar member={data.members.find(x=>x.id===member.memberId)!}/>
          <span>{memberName(data,member.memberId)}</span>
         </label>
        )}
      </div>
     </fieldset>
    }

    {space.poolEnabled&&
     <fieldset>
      <legend>Where should the points go?</legend>
      <label className="check">
       <input type="radio" name="pointDestination" value="personal" defaultChecked/>
       My available points
      </label>
      <label className="check">
       <input type="radio" name="pointDestination" value="shared"/>
       Shared Rally pool
      </label>
     </fieldset>
    }

    {activeGoals.length>0&&
     <label className="check">
      <input type="checkbox" name="goals" defaultChecked/>
      {activeGoals.length===1
       ? <>Count these points toward “{activeGoals[0].name}”</>
       : <>Count these points toward this Rally’s Goals</>
      }
     </label>
    }
   </div>
  </details>

  <button className="primary add-activity-button">Add activity</button>
 </form>
}

function Activities({data,space,user,activities,complete,approve,sendBack,update,note}:{data:AppData;space:Space;user:Member;activities:Activity[];complete:(a:Activity)=>void;approve:(a:Activity)=>void;sendBack:(a:Activity)=>void;update:(d:AppData)=>void;note:(s:string)=>void}){
 const [filter,setFilter]=useState<'ready'|'waiting'|'done'|'all'>('ready')
 const canManage=['Owner','Admin'].includes(roleFor(space,user.id)||'')
 const filtered=activities.filter(activity=>{
  if(filter==='ready') return activity.status==='open'&&activity.isAvailableNow!==false
  if(filter==='waiting') return activity.status==='pending'||(Boolean(activity.approvalPending)&&activity.approverIds.includes(user.id))
  if(filter==='done') return activity.status==='complete'
  return activity.status!=='archived'
 })

 return <>
  <section className="canva-page-head">
   <div><p className="eyebrow">Make progress together</p><h1>Activities</h1><p className="supporting">Clear little actions, shared momentum.</p></div>
   <button className="primary-button" onClick={()=>document.getElementById('space-add-activity')?.setAttribute('open','true')}>＋ Add activity</button>
  </section>
  <div className="segmented" role="tablist" aria-label="Activity filters">
   {([['ready','Ready'],['waiting','Waiting'],['done','Done'],['all','All']] as const).map(([value,label])=><button key={value} className={filter===value?'active':''} onClick={()=>setFilter(value)}>{label}</button>)}
  </div>
  <section className="activity-grid canva-activity-grid">
   {filtered.length
    ? filtered.map(activity=><ActivityCard key={activity.id} a={activity} data={data} user={user} complete={complete} approve={approve} sendBack={sendBack}/>)
    : <div className="empty-state" style={{gridColumn:'1/-1'}}><div className="mascot-wrap"><RallySparkMascot mood="wait"/></div><strong>Nothing here yet</strong><p>There’s nothing to show in this view.</p></div>
   }
  </section>
  <details id="space-add-activity" className="canva-create-shell"><summary>＋ Add activity</summary><div className="canva-create-body"><AddActivityForm data={data} space={space} user={user} update={update} note={note}/></div></details>
  {canManage&&<p className="admin-note">Need to pause, archive, restore, or delete something? Use Rally Settings.</p>}
 </>
}


function SpaceHome({data,space,user,activities,complete,approve,sendBack,setScreen}:{data:AppData;space:Space;user:Member;activities:Activity[];complete:(a:Activity)=>void;approve:(a:Activity)=>void;sendBack:(a:Activity)=>void;setScreen:(s:Screen)=>void}){
 const sm=spaceMember(space,user.id)!
 const leaders=[...space.members].sort((a,b)=>b.weekly-a.weekly)
 const ready=activities.filter(activity=>activity.status==='open'&&activity.isAvailableNow!==false&&(activity.assignedTo.length===0||activity.assignedTo.includes(user.id))).sort((a,b)=>recurrencePriority(a.recurrence)-recurrencePriority(b.recurrence)).slice(0,3)
 const approvals=activities.filter(activity=>Boolean(activity.approvalPending)&&activity.approverIds.includes(user.id))
 const priorityTreat=data.treats.find(treat=>treat.spaceId===space.id&&treat.status==='locked'&&treat.priorityFor.includes(user.id))||data.treats.find(treat=>treat.spaceId===space.id&&treat.status==='locked')
 const activeGoal=data.goals.filter(goal=>goal.spaceId===space.id&&goal.status!=='archived'&&goal.status!=='celebrated').sort((a,b)=>(b.progress/Math.max(1,b.target))-(a.progress/Math.max(1,a.target)))[0]
 const weekStart=startOfCurrentWeek()
 const weeklyWins=data.history.filter(h=>h.spaceId===space.id&&h.memberId===user.id&&h.kind==='earn'&&new Date(h.createdAt)>=weekStart)
 const activeDays=new Set(weeklyWins.map(h=>localDateKey(new Date(h.createdAt)))).size
 const heroPct=activeGoal?Math.min(100,Math.round(activeGoal.progress/Math.max(1,activeGoal.target)*100)):priorityTreat?Math.min(100,Math.round(sm.balance/Math.max(1,priorityTreat.points)*100)):Math.min(100,Math.round(activeDays/7*100))
 const recentWins=data.history.filter(h=>h.spaceId===space.id&&h.kind==='earn').slice(0,3)
 const todayLabel=new Intl.DateTimeFormat(undefined,{weekday:'long'}).format(new Date())

 return <>
  <section className="canva-page-head canva-home-head">
   <div><p className="eyebrow">{space.name} · {todayLabel}</p><h1>Hey {user.name.split(' ')[0]}, you’re doing brilliantly.</h1><p className="supporting">A few small wins can make the whole day feel lighter.</p></div>
  </section>

  <div className="canva-grid-main">
   <div className="canva-stack">
    <section className="card hero-card canva-card">
     <MomentumRoute/>
     <div className="hero-content">
      <p className="eyebrow">This week’s momentum</p>
      <div className="summary-grid">
       <div><div className="point-number">{sm.weekly.toLocaleString()}</div><p className="point-caption">points collected this week</p></div>
       <div className="progress-ring" style={{'--progress':heroPct} as any}><span>{heroPct}%</span></div>
      </div>
      <div className="progress-track"><div className="progress-fill" style={{width:`${heroPct}%`}}/></div>
      <p className="supporting hero-progress-copy">{activeGoal?`${activeGoal.progress.toLocaleString()} of ${activeGoal.target.toLocaleString()} points toward ${activeGoal.name}`:priorityTreat?`${sm.balance.toLocaleString()} of ${priorityTreat.points.toLocaleString()} points toward ${priorityTreat.name}`:`${activeDays} of 7 days active this week`}</p>
      <div className="summary-stats"><div className="summary-stat"><strong>{activeDays} {activeDays===1?'day':'days'}</strong><span>active this week</span></div><div className="summary-stat"><strong>{weeklyWins.length} {weeklyWins.length===1?'win':'wins'}</strong><span>this week</span></div><div className="summary-stat"><strong>{roleFor(space,user.id)||'Member'}</strong><span>your role</span></div></div>
     </div>
    </section>

    {approvals.length>0&&<section className="card attention card-pad canva-card"><div className="section-title"><h2>Needs your attention</h2><span className="pill waiting">{approvals.length} waiting</span></div>{approvals.slice(0,3).map(activity=><div className="list-row" key={activity.id}><CanvaStateArt state="waiting" icon={activity.icon}/><div className="row-text"><strong>{activity.name}</strong><span>{activity.approvalPendingBy?memberName(data,activity.approvalPendingBy):'Someone'} submitted this · {activity.points} points</span></div><button className="primary-button" onClick={()=>setScreen('activities')}>Review</button></div>)}</section>}

    <section className="card card-pad canva-card"><div className="section-title"><h2>Up next</h2><button className="link-button" onClick={()=>setScreen('activities')}>View all</button></div>{ready.length?ready.map(activity=><div className="list-row" key={activity.id}><CanvaStateArt state="ready" icon={activity.icon}/><div className="row-text"><strong>{activity.name}</strong><span>{activity.recurrenceLabel||recurrenceLabel(activity.recurrence)}</span></div><button className="secondary-button compact-complete" onClick={()=>complete(activity)}>Complete</button><span className="token">+{activity.points}</span></div>):<div className="empty-state"><div className="mascot-wrap"><RallySparkMascot mood="cheer"/></div><strong>You’re all caught up</strong><p>Enjoy the extra breathing room.</p></div>}</section>
   </div>

   <aside className="canva-stack">
    {priorityTreat&&<section className="card card-pad treat-card canva-card"><DestinationScene kind="treat"/><div className="section-title"><span className={`space-badge ${space.type}`}>{space.icon}</span><PennantBadge>Next reward</PennantBadge></div><h2>{priorityTreat.name}</h2><p className="supporting">Keep going—just a few more points unlocks a Treat you chose.</p><div className="progress-track motivation-track"><div className="progress-fill treat-progress-fill" style={{width:`${Math.min(100,sm.balance/Math.max(1,priorityTreat.points)*100)}%`}}/></div><p className="supporting motivation-progress">{Math.max(0,priorityTreat.points-sm.balance).toLocaleString()} points to go</p></section>}

    {!priorityTreat&&activeGoal&&<section className="card card-pad goal-motivation-card canva-card"><DestinationScene kind="goal"/><div className="section-title"><span className={`space-badge ${space.type}`}>{space.icon}</span><PennantBadge>Active goal</PennantBadge></div><h2>{activeGoal.name}</h2><p className="supporting">Every selected win can move this Goal forward.</p><div className="progress-track motivation-track"><div className="progress-fill" style={{width:`${heroPct}%`}}/></div><p className="supporting motivation-progress">{Math.max(0,activeGoal.target-activeGoal.progress).toLocaleString()} points to go</p></section>}

    {space.members.length>1&&space.weeklyLeaderboard&&<section className="card card-pad canva-card"><div className="section-title"><h2>Leaderboard</h2><button className="link-button" onClick={()=>setScreen('leaderboard')}>This week</button></div>{leaders.slice(0,3).map((member,index)=><div className="list-row" key={member.memberId}><span className="rank-number">{index+1}</span><Avatar member={data.members.find(item=>item.id===member.memberId)!}/><div className="row-text"><strong>{memberName(data,member.memberId)}{member.memberId===user.id?' (You)':''}</strong><span>{member.weekly.toLocaleString()} points</span></div>{index<3?<PennantBadge tone={index===0?'sun':index===1?'coral':'mint'}>#{index+1}</PennantBadge>:null}</div>)}</section>}

    <section className="card card-pad win-card canva-card"><div className="section-title"><h2>Recent wins</h2><RallySparkMascot mood="cheer"/></div>{recentWins.length?recentWins.map(h=><div className="list-row" key={h.id}><CanvaStateArt state="done"/><div className="row-text"><strong>{h.title}</strong><span>{memberName(data,h.memberId)} · {formatTimestamp(h.createdAt)}</span></div><span className="token">+{h.points}</span></div>):<div className="empty-state compact-empty"><strong>Your wins will show up here.</strong></div>}</section>
   </aside>
  </div>
 </>
}


function Leaderboard({data,space,user}:{data:AppData;space:Space;user:Member}){
 const [period,setPeriod]=useState<'week'|'all'>('week')
 const leaders=[...space.members].sort((a,b)=>period==='week'?b.weekly-a.weekly:b.lifetime-a.lifetime)
 const pointsFor=(m:SpaceMember)=>period==='week'?m.weekly:m.lifetime
 if(space.members.length<=1) return <section className="empty-state canva-full-empty"><div className="mascot-wrap"><RallySparkMascot mood="happy"/></div><strong>Leaderboard</strong><p>Invite someone when you want a little friendly competition.</p></section>
 return <>
  <section className="canva-page-head"><div><p className="eyebrow">Every effort counts</p><h1>Leaderboard</h1><p className="supporting">A friendly snapshot of the wins your crew is making.</p></div></section>
  <div className="segmented canva-leader-filter"><button className={period==='week'?'active':''} onClick={()=>setPeriod('week')}>This Week</button><button className={period==='all'?'active':''} onClick={()=>setPeriod('all')}>All Time</button></div>
  <section className="card card-pad canva-card canva-leader-list">
   {leaders.map((m,index)=>{
    const member=data.members.find(x=>x.id===m.memberId)!
    return <div className={`list-row ${m.memberId===user.id?'is-me':''}`} key={m.memberId}>
     <Avatar member={member}/>
     <div className="row-text"><strong>{memberName(data,m.memberId)}{m.memberId===user.id?' (You)':''}</strong><span>{period==='week'?'This week':'All-time progress'}</span></div>
     <PennantBadge tone={index===0?'sun':index===1?'coral':'mint'}>#{index+1}</PennantBadge>
     <span className="token">{pointsFor(m).toLocaleString()}</span>
    </div>
   })}
  </section>
 </>
}


function Stats({data,space}:{data:AppData;space:Space}){
 const hist=data.history.filter(h=>h.spaceId===space.id&&h.kind==='earn');const cats=[...new Set(data.activities.filter(a=>a.spaceId===space.id).map(a=>a.category))]
 return <><section className="stats-hero"><p>▥ INSIGHTS</p><h1>How this Rally moves</h1></section><section className="stats-grid"><article className="panel"><h2>Contribution share</h2><div className="pie" style={{background:`conic-gradient(#5b5df0 0 48%,#ff8f70 48% 100%)`}}><span>100%</span></div>{space.members.map(m=>{const pts=hist.filter(h=>h.memberId===m.memberId).reduce((s,h)=>s+h.points,0);const total=hist.reduce((s,h)=>s+h.points,0)||1;return <p key={m.memberId}>{memberName(data,m.memberId)}: <b>{Math.round(pts/total*100)}%</b></p>})}</article><article className="panel"><h2>Category mix</h2>{cats.map(c=>{const ids=data.activities.filter(a=>a.spaceId===space.id&&a.category===c).map(a=>a.id);const pts=hist.filter(h=>h.activityId&&ids.includes(h.activityId)).reduce((s,h)=>s+h.points,0);const total=hist.reduce((s,h)=>s+h.points,0)||1;return <div className="statbar" key={c}><span>{c}</span><Progress value={pts} max={total}/><b>{Math.round(pts/total*100)}%</b></div>})}</article></section></>
}

function Goals({data,space,user,update,note}:{data:AppData;space:Space;user:Member;update:(d:AppData)=>void;note:(s:string)=>void}){
 const goals=data.goals.filter(g=>g.spaceId===space.id&&g.status!=='archived')
 const active=goals.filter(g=>g.status!=='celebrated')
 const celebrated=goals.filter(g=>g.status==='celebrated')

 const add=async(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault()
  const form=e.currentTarget
  const f=new FormData(form)
  const goalId=crypto.randomUUID()
  const g:Goal={
   id:goalId,
   spaceId:space.id,
   name:String(f.get('name')),
   icon:String(f.get('icon')||'🎯'),
   target:Number(f.get('target')),
   progress:0,
   status:'active',
   contributionMode:'space_only',
   allowedSpaceIds:[space.id]
  }

  const {error}=await supabase
   .from('goals')
   .insert({
    id:goalId,
    space_id:space.id,
    name:g.name,
    icon:g.icon,
    target_points:g.target,
    current_points:0,
    status:'active',
    created_by:user.id
   })

  if(error){
   console.error('Unable to create Rally goal:',error)
   note('Unable to add goal.')
   return
  }

  update({...data,goals:[g,...data.goals]})
  form.reset()
  note('Goal added.')
 }

 const celebrate=async(g:Goal)=>{
  const {error}=await supabase.from('goals').update({status:'celebrated'}).eq('id',g.id)
  if(error){
   console.error('Unable to celebrate Rally goal:',error)
   note('Unable to update goal.')
   return
  }
  update({...data,goals:data.goals.map(goal=>goal.id===g.id?{...goal,status:'celebrated'}:goal)})
  note('Goal celebrated! 🎉')
 }

 return <>
  <section className="canva-page-head">
   <div><p className="eyebrow">A shared direction</p><h1>{space.members.length>1?'Goals':'Goals'}</h1><p className="supporting">Keep the big picture encouraging and easy to follow.</p></div>
  </section>

  {active.length===0
   ? <section className="empty-state canva-full-empty"><div className="mascot-wrap"><RallySparkMascot mood="happy"/></div><strong>What are you working toward?</strong><p>Create a Goal and let everyday wins move you closer.</p></section>
   : <>
      <div className="canva-grid-main canva-goals-layout">
       <div className="canva-stack">
        {active.map((g,index)=>{
         const pct=Math.min(100,Math.round((g.progress/Math.max(1,g.target))*100))
         return <section className={`card card-pad canva-card canva-goal-card ${g.status}`} key={g.id}>
          {index===0&&<DestinationScene kind="goal"/>}
          <div className="section-title">
           <div className="goal-title-lockup"><span className={`space-badge ${space.type}`}>{g.icon}</span><div><h2>{g.name}</h2><p className="supporting">{space.members.length>1?'Shared Rally goal':'Personal goal'}</p></div></div>
           <PennantBadge>{g.status==='reached'?'Reached':'Active goal'}</PennantBadge>
          </div>
          <p className="supporting">{g.status==='reached'?'You reached this Goal — your Rally points are still yours.':'Selected activities add their points to this progress.'}</p>
          <div className="goal-progress-layout">
           <div className="progress-ring" style={{'--progress':pct} as any}><span>{pct}%</span></div>
           <div className="goal-progress-main"><div className="progress-track"><div className="progress-fill" style={{width:`${pct}%`}}/></div><p className="supporting">{g.progress.toLocaleString()} of {g.target.toLocaleString()} points collected</p></div>
          </div>
          {g.status==='reached'&&<button className="primary-button goal-celebrate" onClick={()=>celebrate(g)}>Celebrate goal 🎉</button>}
         </section>
        })}
       </div>

       <aside className="card card-pad canva-card canva-goal-tip">
        <div className="mascot-wrap goal-tip-mascot"><RallySparkMascot mood="happy"/></div>
        <h2>A little goes a long way</h2>
        <p className="supporting">Each activity can help one Goal, several Goals, all of them, or none. Reaching a Goal tracks your progress — it never spends your points.</p>
       </aside>
      </div>
     </>
  }

  <details className="canva-create-shell" open={active.length===0}>
   <summary>＋ New goal</summary>
   <div className="canva-create-body">
    <form className="form rally9-create-form" onSubmit={add}>
     <div className="two"><label>What are you working toward?<input name="name" required placeholder="Weekend getaway"/></label><label>Icon<input name="icon" placeholder="🌴"/></label></div>
     <label>Target<select name="target" defaultValue="1000">{[250,500,750,1000,1500,2000,2500,3000,5000].map(p=><option key={p} value={p}>{p.toLocaleString()} points</option>)}</select></label>
     <button className="primary-button">Create goal</button>
    </form>
   </div>
  </details>

  {celebrated.length>0&&<section className="card card-pad canva-card canva-history-shelf"><div className="section-title"><div><p className="eyebrow">Completed Goals</p><h2>Progress worth celebrating</h2></div></div>{celebrated.map(g=><div className="list-row" key={g.id}><CanvaStateArt state="done" icon={g.icon}/><div className="row-text"><strong>{g.name}</strong><span>{g.target.toLocaleString()} point goal</span></div><PennantBadge tone="mint">Done</PennantBadge></div>)}</section>}
 </>
}


function Treats({data,space,user,update,note}:{data:AppData;space:Space;user:Member;update:(d:AppData)=>void;note:(s:string)=>void}){
 const treats=data.treats.filter(t=>t.spaceId===space.id)
 const sm=spaceMember(space,user.id)!
 const locked=treats.filter(t=>t.status==='locked')
 const obtained=treats.filter(t=>t.status==='obtained')

 const obtain=async(t:Treat)=>{
  if(sm.balance<t.points){
   note(`${t.points-sm.balance} more points needed.`)
   return
  }

  if(!window.confirm(`Use ${t.points} points for “${t.name}”? Your lifetime progress will stay the same.`)) return

  const obtainedAt=new Date().toISOString()

  const {error:treatError}=await supabase
   .from('treats')
   .update({
    status:'obtained',
    obtained_by:user.id,
    obtained_at:obtainedAt
   })
   .eq('id',t.id)

  if(treatError){
   console.error('Unable to obtain Rally treat:',treatError)
   note('Unable to obtain treat.')
   return
  }

  const {error:ledgerError}=await supabase
   .from('points_ledger')
   .insert({
    space_id:space.id,
    user_id:user.id,
    amount:-t.points,
    transaction_type:'treat_obtained',
    destination:'personal',
    treat_id:t.id,
    note:`Obtained ${t.name}`
   })

  if(ledgerError){
   console.error('Unable to spend Rally points:',ledgerError)

   await supabase
    .from('treats')
    .update({
     status:'locked',
     obtained_by:null,
     obtained_at:null
    })
    .eq('id',t.id)

   note('Unable to spend points for this treat.')
   return
  }

  await supabase
   .from('treat_assignments')
   .update({is_top_priority:false})
   .eq('treat_id',t.id)
   .eq('user_id',user.id)

  const notificationRows=space.members
   .filter(member=>member.memberId!==user.id)
   .map(member=>({
    user_id:member.memberId,
    space_id:space.id,
    type:'treat_obtained',
    title:'Treat obtained! 🎁',
    message:`${user.name} obtained ${t.name}.`,
    treat_id:t.id
   }))

  if(notificationRows.length>0){
   const {error:notificationError}=await supabase
    .from('notifications')
    .insert(notificationRows)

   if(notificationError){
    console.error(
     'Unable to save treat notifications:',
     notificationError
    )
   }
  }

  const nextSpaces=data.spaces.map(s=>
   s.id!==space.id
    ? s
    : {
       ...s,
       members:s.members.map(member=>
        member.memberId!==user.id
         ? member
         : {
            ...member,
            balance:Math.max(0,member.balance-t.points)
           }
       )
      }
  )

  update({
   ...data,
   spaces:nextSpaces,
   treats:data.treats.map(item=>
    item.id===t.id
     ? {
        ...item,
        status:'obtained',
        obtainedBy:user.id,
        obtainedAt,
        priorityFor:[]
       }
     : item
   ),
   history:[
    historyEntry({
     id:crypto.randomUUID(),
     spaceId:space.id,
     memberId:user.id,
     title:t.name,
     detail:`${user.name} obtained this treat`,
     points:t.points,
     kind:'treat',
     createdAt:now()
    }),
    ...data.history
   ]
  })

  note('Treat unlocked! Enjoy it 🎉')
 }

 const priority=async(t:Treat)=>{
  const spaceTreatIds=treats.map(item=>item.id)

  if(spaceTreatIds.length>0){
   const {error:clearError}=await supabase
    .from('treat_assignments')
    .update({is_top_priority:false})
    .eq('user_id',user.id)
    .in('treat_id',spaceTreatIds)

   if(clearError){
    console.error('Unable to clear treat priority:',clearError)
    note('Unable to update priority.')
    return
   }
  }

  const {error:setError}=await supabase
   .from('treat_assignments')
   .upsert({
    treat_id:t.id,
    user_id:user.id,
    is_top_priority:true
   },{
    onConflict:'treat_id,user_id'
   })

  if(setError){
   console.error('Unable to set treat priority:',setError)
   note('Unable to update priority.')
   return
  }

  update({
   ...data,
   treats:data.treats.map(item=>
    item.spaceId===space.id
     ? {
        ...item,
        assignedTo:item.id===t.id
         ? [...new Set([...item.assignedTo,user.id])]
         : item.assignedTo,
        priorityFor:item.id===t.id
         ? [user.id]
         : item.priorityFor.filter(id=>id!==user.id)
       }
     : item
   )
  })

  note('Top-priority treat updated.')
 }

 const add=async(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault()
  const form=e.currentTarget
  const f=new FormData(form)
  const assigned=Array.from(f.getAll('assignedTo')).map(String)
  const assignedTo=assigned.length ? assigned : [user.id]
  const treatId=crypto.randomUUID()

  const t:Treat={
   id:treatId,
   spaceId:space.id,
   name:String(f.get('name')),
   icon:String(f.get('icon')||'🎁'),
   description:String(f.get('description')||''),
   points:Number(f.get('points')),
   assignedTo,
   priorityFor:f.get('priority')==='on' ? [user.id] : [],
   status:'locked'
  }

  const {error:treatError}=await supabase
   .from('treats')
   .insert({
    id:treatId,
    space_id:space.id,
    name:t.name,
    icon:t.icon,
    description:t.description,
    points_required:t.points,
    status:'locked',
    created_by:user.id
   })

  if(treatError){
   console.error('Unable to create Rally treat:',treatError)
   note('Unable to add treat.')
   return
  }

  const assignmentRows=assignedTo.map(userId=>({
   treat_id:treatId,
   user_id:userId,
   is_top_priority:
    userId===user.id && t.priorityFor.includes(user.id)
  }))

  const {error:assignmentError}=await supabase
   .from('treat_assignments')
   .insert(assignmentRows)

  if(assignmentError){
   console.error('Unable to save treat assignments:',assignmentError)
   await supabase
    .from('treats')
    .update({status:'archived'})
    .eq('id',treatId)
   note('Treat could not be fully created.')
   return
  }

  if(t.priorityFor.includes(user.id)){
   const otherTreatIds=treats
    .filter(item=>item.id!==t.id)
    .map(item=>item.id)

   if(otherTreatIds.length>0){
    await supabase
     .from('treat_assignments')
     .update({is_top_priority:false})
     .eq('user_id',user.id)
     .in('treat_id',otherTreatIds)
   }
  }

  update({
   ...data,
   treats:[
    t,
    ...data.treats.map(item=>
     t.priorityFor.includes(user.id)&&item.spaceId===space.id
      ? {
         ...item,
         priorityFor:item.priorityFor.filter(id=>id!==user.id)
        }
      : item
    )
   ]
  })

  form.reset()
  note('Treat added.')
 }



 return <>
  <section className="canva-page-head">
   <div><p className="eyebrow">Celebrate the effort</p><h1>Treats</h1><p className="supporting">Lovely reasons to keep the good momentum moving.</p></div>
  </section>

  <section className="canva-treat-points-strip">
   <div><RallySparkMascot mood="cheer"/><span><strong>{sm.balance.toLocaleString()} points</strong><small>ready to use when you choose</small></span></div>
   <p>Rally points are for motivation, not money. Treats are rewards you choose for yourself or your crew.</p>
  </section>

  {locked.length===0
   ? <section className="empty-state canva-full-empty"><div className="mascot-wrap"><RallySparkMascot mood="happy"/></div><strong>Give yourself something worth working toward.</strong><p>Add a small reward or a big one — whatever actually motivates you.</p></section>
   : <section className="activity-grid canva-treat-grid">
      {[...locked].sort((a,b)=>Number(b.priorityFor.includes(user.id))-Number(a.priorityFor.includes(user.id))).map((t,index)=>{
       const isPriority=t.priorityFor.includes(user.id)
       const canAfford=sm.balance>=t.points
       const pct=Math.min(100,Math.round(sm.balance/Math.max(1,t.points)*100))
       return <article className={`card card-pad canva-card canva-treat-card ${index%2===0?'mint':'pink'} ${isPriority?'priority':''}`} key={t.id}>
        <DestinationScene kind={index%2===0?'treat':'movie'}/>
        <div className="section-title">
         <div className="goal-title-lockup"><span className="space-badge household">{t.icon}</span><div><h2>{t.name}</h2>{isPriority&&<small>Top Treat</small>}</div></div>
         <span className="token">{t.points.toLocaleString()}</span>
        </div>
        <p className="supporting">{t.description||'A reward to celebrate your progress.'}</p>
        <div className="progress-track treat-card-progress"><div className="progress-fill" style={{width:`${pct}%`,background:index%2===0?'#25815e':'#de705d'}}/></div>
        <p className="supporting treat-progress-copy">{canAfford?'You earned this 🎉':`${(t.points-sm.balance).toLocaleString()} points to go`}</p>
        {space.members.length>1&&t.assignedTo.length>0&&<p className="tiny-progress">For {t.assignedTo.map(id=>memberName(data,id)).join(', ')}</p>}
        <div className="canva-treat-actions">
         {!isPriority&&<button className="secondary-button" onClick={()=>priority(t)}>☆ Make top Treat</button>}
         {canAfford?<button className="primary-button" onClick={()=>obtain(t)}>Use Treat</button>:<span className="pill waiting">Keep going</span>}
        </div>
       </article>
      })}
     </section>
  }

  <details className="canva-create-shell" open={locked.length===0}>
   <summary>＋ New treat</summary>
   <div className="canva-create-body">
    <form className="form rally9-create-form" onSubmit={add}>
     <div className="two"><label>Treat name<input name="name" required placeholder="Dinner out"/></label><label>Icon<input name="icon" placeholder="🍝"/></label></div>
     <label>Description<textarea name="description" placeholder="A fun thing to work toward."/></label>
     <label>Unlock at<select name="points" defaultValue="500">{[100,150,200,250,300,400,500,750,1000,1500,2000].map(p=><option key={p} value={p}>{p.toLocaleString()} points</option>)}</select></label>
     {space.members.length>1&&<fieldset><legend>Who is it for?</legend><div className="people-options">{space.members.map(member=><label className="check" key={member.memberId}><input type="checkbox" name="assignedTo" value={member.memberId} defaultChecked={member.memberId===user.id}/>{member.memberId===user.id?'Me':memberName(data,member.memberId)}</label>)}</div></fieldset>}
     <label className="check"><input type="checkbox" name="priority"/> Make this my top treat</label>
     <button className="primary-button">Create treat</button>
    </form>
   </div>
  </details>

  {(data.rewardIdeas||[]).length>0&&<details className="canva-create-shell inspiration-panel"><summary>Need inspiration?</summary><div className="cards canva-inspiration-grid">{(data.rewardIdeas||[]).slice(0,6).map(idea=><article className="card card-pad canva-card" key={idea.id}><p className="eyebrow">{idea.category}</p><h2>{idea.title}</h2><p className="supporting">{idea.description}</p>{idea.suggestedPoints&&<span className="token">{idea.suggestedPoints}</span>}<button className="secondary-button" onClick={()=>window.open(idea.destinationUrl,'_blank')}>Explore idea ↗</button></article>)}</div></details>}

  {obtained.length>0&&<section className="card card-pad canva-card canva-history-shelf"><div className="section-title"><div><p className="eyebrow">Past Treats</p><h2>Rewards you’ve already enjoyed 🎉</h2></div></div>{obtained.map(t=><div className="list-row" key={t.id}><CanvaStateArt state="done" icon={t.icon}/><div className="row-text"><strong>{t.name}</strong><span>{formatTimestamp(t.obtainedAt)}</span></div><PennantBadge tone="mint">Used</PennantBadge></div>)}</section>}
 </>
}


function Members({data,space,user,update,note}:{data:AppData;space:Space;user:Member;update:(d:AppData)=>void;note:(s:string)=>void}){
 const role=roleFor(space,user.id)
 const canAdmin=role==='Owner'||role==='Admin'
 const [inviteOpen,setInviteOpen]=useState(false)
 const [inviteEmail,setInviteEmail]=useState('')
 const [inviteRole,setInviteRole]=useState<'member'|'approver'|'admin'>('member')

 const invite=async(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault()
  if(!canAdmin) return

  const email=inviteEmail.trim().toLowerCase()
  if(!email) return

  const expiresAt=new Date(Date.now()+7*24*60*60*1000).toISOString()

  const {error}=await supabase
   .from('space_invitations')
   .upsert({
    space_id:space.id,
    email,
    role:inviteRole,
    invited_by:user.id,
    status:'pending',
    expires_at:expiresAt
   },{
    onConflict:'space_id,email'
   })

  if(error){
   console.error('Unable to create Rally invitation:',error)
   note('Unable to create invitation.')
   return
  }

  setInviteEmail('')
  setInviteRole('member')
  setInviteOpen(false)
  note('Invitation sent. They can accept or decline it after signing in with that email.')
 }

 const changeRole=async(id:string,nextRole:Role)=>{
  if(!canAdmin||id===user.id||nextRole==='Owner') return
  const target=space.members.find(member=>member.memberId===id)
  if(!target||target.role==='Owner') return

  const dbRole=nextRole.toLowerCase()
  const {error}=await supabase
   .from('space_members')
   .update({role:dbRole})
   .eq('space_id',space.id)
   .eq('user_id',id)

  if(error){
   console.error('Unable to update member role:',error)
   note('Unable to update role.')
   return
  }

  update({
   ...data,
   spaces:data.spaces.map(item=>
    item.id!==space.id
     ? item
     : {
        ...item,
        members:item.members.map(member=>
         member.memberId===id ? {...member,role:nextRole} : member
        )
       }
   )
  })
  note('Member role updated.')
 }

 const remove=async(id:string)=>{
  if(!canAdmin||id===user.id) return

  const target=space.members.find(member=>member.memberId===id)
  if(target?.role==='Owner'){
   note('The Rally owner cannot be removed.')
   return
  }

  if(!window.confirm(`Remove ${memberName(data,id)} from ${space.name}?`)) return

  const {error}=await supabase
   .from('space_members')
   .delete()
   .eq('space_id',space.id)
   .eq('user_id',id)

  if(error){
   console.error('Unable to remove Rally member:',error)
   note('Unable to remove member.')
   return
  }

  update({
   ...data,
   spaces:data.spaces.map(item=>
    item.id!==space.id
     ? item
     : {...item,members:item.members.filter(member=>member.memberId!==id)}
   )
  })

  note('Member removed. History is preserved.')
 }

 return <>
  <section className="page-heading simple-heading rally-page-heading">
   <div>
    <p className="eyebrow">Members</p>
    <h1>Who’s in this Rally?</h1>
    <p>Roles only show management options when they’re actually relevant.</p>
   </div>
   {canAdmin&&
    <button className="primary" onClick={()=>setInviteOpen(current=>!current)}>
     + Invite someone
    </button>
   }
  </section>

  {inviteOpen&&
   <form className="panel invite-form" onSubmit={invite}>
    <div className="section-title">
     <div><p className="eyebrow">Invite someone</p><h2>Add them to {space.name}</h2></div>
     <button type="button" onClick={()=>setInviteOpen(false)}>Cancel</button>
    </div>
    <div className="two">
     <label>
      Email
      <input
       type="email"
       required
       value={inviteEmail}
       onChange={e=>setInviteEmail(e.target.value)}
       placeholder="name@example.com"
      />
     </label>
     <label>
      Role
      <select value={inviteRole} onChange={e=>setInviteRole(e.target.value as typeof inviteRole)}>
       <option value="member">Member</option>
       <option value="approver">Approver</option>
       <option value="admin">Admin</option>
      </select>
     </label>
    </div>
    <div className="role-explainer">
     {inviteRole==='member'&&<span><b>Member</b> · participates normally in the Rally.</span>}
     {inviteRole==='approver'&&<span><b>Approver</b> · can approve activities they’re selected to review.</span>}
     {inviteRole==='admin'&&<span><b>Admin</b> · can manage Rally activities, members, and settings.</span>}
    </div>
    <button className="primary">Create invite</button>
   </form>
  }

  <section className="panel member-list-panel">
   {space.members.map(member=>{
    const person=data.members.find(x=>x.id===member.memberId)
    if(!person) return null
    const editable=canAdmin&&member.memberId!==user.id&&member.role!=='Owner'

    return <article className="member-card-row" key={member.memberId}>
     <Avatar member={person}/>
     <div className="member-card-copy">
      <strong>{person.name}{member.memberId===user.id?' · You':''}</strong>
      <small>Joined {formatTimestamp(member.joinedAt)}</small>
     </div>
     <div className="member-weekly">
      <b>{member.weekly}</b><small>pts this week</small>
     </div>
     {editable
      ? <select
         className="member-role-select"
         value={member.role}
         onChange={e=>changeRole(member.memberId,e.target.value as Role)}
        >
         <option value="Member">Member</option>
         <option value="Approver">Approver</option>
         <option value="Admin">Admin</option>
        </select>
      : <span className="role">{member.role}</span>
     }
     {editable&&
      <button className="danger member-remove" onClick={()=>remove(member.memberId)}>
       Remove
      </button>
     }
    </article>
   })}
  </section>
 </>
}

function SpaceSettings({data,space,user,update,note}:{data:AppData;space:Space;user:Member;update:(d:AppData)=>void;note:(s:string)=>void}){
 const canAdmin=['Owner','Admin'].includes(roleFor(space,user.id)||'')

 if(!canAdmin){
  return <section className="panel">
   <h2>Admin only</h2>
   <p>Only Rally owners and admins can manage these settings.</p>
  </section>
 }

 const acts=data.activities.filter(a=>a.spaceId===space.id)

 const setStatus=async(a:Activity,status:ActivityStatus)=>{
  const databaseStatus=
   status==='open'||status==='complete'||status==='pending'
    ? 'active'
    : status

  const {error}=await supabase
   .from('activities')
   .update({status:databaseStatus})
   .eq('id',a.id)

  if(error){
   console.error('Unable to update activity status:',error)
   note('Unable to update activity.')
   return
  }

  update({
   ...data,
   activities:data.activities.map((x):Activity=>
    x.id===a.id ? {...x,status} : x
   )
  })

  note(
   status==='archived'
    ? 'Activity archived.'
    : status==='paused'
     ? 'Activity paused.'
     : 'Activity restored.'
  )
 }

 const remove=async(a:Activity)=>{
  if(!confirm(
   `Permanently delete "${a.name}"? Historical point entries will remain.`
  )) return

  const {error}=await supabase
   .from('activities')
   .delete()
   .eq('id',a.id)

  if(error){
   console.error('Unable to delete Rally activity:',error)
   note('Unable to delete activity.')
   return
  }

  update({
   ...data,
   activities:data.activities.filter(x=>x.id!==a.id),
   history:[
    historyEntry({
     id:crypto.randomUUID(),
     spaceId:space.id,
     memberId:user.id,
     title:a.name,
     detail:'Activity permanently deleted. Historical point entries preserved.',
     points:0,
     kind:'admin',
     createdAt:now()
    }),
    ...data.history
   ]
  })

  note('Activity deleted.')
 }

 const updateTimezone=async(value:string)=>{
  const timezone=value.trim()
  if(!timezone||timezone===space.timezone) return

  const {error}=await supabase
   .from('spaces')
   .update({timezone})
   .eq('id',space.id)

  if(error){
   console.error('Unable to update Rally timezone:',error)
   note('Unable to update timezone.')
   return
  }

  update({
   ...data,
   spaces:data.spaces.map(s=>
    s.id===space.id ? {...s,timezone} : s
   )
  })

  note('Timezone updated.')
 }

 const updateWeeklyLeaderboard=async(checked:boolean)=>{
  const {error}=await supabase
   .from('spaces')
   .update({weekly_leaderboard:checked})
   .eq('id',space.id)

  if(error){
   console.error('Unable to update weekly leaderboard:',error)
   note('Unable to update setting.')
   return
  }

  update({
   ...data,
   spaces:data.spaces.map(s=>
    s.id===space.id
     ? {...s,weeklyLeaderboard:checked}
     : s
   )
  })

  note('Weekly leaderboard updated.')
 }

 const updatePoolEnabled=async(checked:boolean)=>{
  const {error}=await supabase
   .from('spaces')
   .update({pool_enabled:checked})
   .eq('id',space.id)

  if(error){
   console.error('Unable to update shared Rally pool:',error)
   note('Unable to update setting.')
   return
  }

  update({
   ...data,
   spaces:data.spaces.map(s=>
    s.id===space.id
     ? {...s,poolEnabled:checked}
     : s
   )
  })

  note('Shared Rally pool updated.')
 }

 return <>
  <section className="settings-hero">
   <div>
    <p>⚙️ RALLY SETTINGS</p>
    <h1>{space.name}</h1>
    <span>Manage how this Rally works without cluttering the everyday Activities page.</span>
   </div>
  </section>

  <section className="panel settings-section">
   <div className="section-title">
    <div>
     <p className="eyebrow">Rally options</p>
     <h2>General settings</h2>
    </div>
   </div>

   <div className="settings-options">
    <label>
     <strong>Timezone</strong>
     <input
      defaultValue={space.timezone}
      onBlur={e=>updateTimezone(e.target.value)}
     />
    </label>

    <label className="switch-row">
     <span>
      <strong>Weekly leaderboard</strong>
      <small>Show the friendly weekly competition.</small>
     </span>
     <input
      type="checkbox"
      checked={space.weeklyLeaderboard}
      onChange={e=>updateWeeklyLeaderboard(e.target.checked)}
     />
    </label>

    <label className="switch-row">
     <span>
      <strong>Shared Rally point pool</strong>
      <small>Allow activities to contribute to a shared pool for group goals and rewards.</small>
     </span>
     <input
      type="checkbox"
      checked={space.poolEnabled}
      onChange={e=>updatePoolEnabled(e.target.checked)}
     />
    </label>
   </div>
  </section>

  <section className="panel settings-section">
   <div className="section-title">
    <div>
     <p className="eyebrow">Activity lifecycle</p>
     <h2>Manage activities</h2>
    </div>
    <span className="settings-count">{acts.length}</span>
   </div>

   <p className="settings-explainer">
    Pause something temporarily, archive it while keeping earned history,
    restore it later, or permanently delete it.
   </p>

   <div className="settings-activity-list">
    {acts.map(a=>
     <article className={`settings-activity-row ${a.status}`} key={a.id}>
      <div className="settings-activity-info">
       <span className="activity-icon">{a.icon}</span>
       <div>
        <strong>{a.name}</strong>
        <small>{a.category} · {a.points} points · {a.recurrenceLabel||recurrenceLabel(a.recurrence)}</small>
        <span className={`status-tag ${a.status}`}>{a.status}</span>
       </div>
      </div>

      <div className="settings-activity-actions">
       {a.status==='archived'
        ? <button className="secondary" onClick={()=>setStatus(a,'open')}>
           Restore
          </button>
        : <>
           <button
            className="secondary"
            onClick={()=>setStatus(
             a,
             a.status==='paused' ? 'open' : 'paused'
            )}
           >
            {a.status==='paused' ? 'Resume' : 'Pause'}
           </button>
           <button
            className="secondary"
            onClick={()=>setStatus(a,'archived')}
           >
            Archive
           </button>
          </>
       }
       <button className="danger" onClick={()=>remove(a)}>
        Delete
       </button>
      </div>
     </article>
    )}
   </div>
  </section>
 </>
}

function Community({data,user,spaces,update,note,setScreen}:{data:AppData;user:Member;spaces:Space[];update:(d:AppData)=>void;note:(s:string)=>void;setScreen:(s:Screen)=>void}){
 const [target,setTarget]=useState(spaces[0]?.id||'')
 const [tab,setTab]=useState<'challenges'|'friends'>('challenges')

 useEffect(()=>{
  if(!target&&spaces[0]?.id) setTarget(spaces[0].id)
 },[target,spaces])

 const join=async(c:CommunityChallenge)=>{
  const s=data.spaces.find(x=>x.id===target)
  if(!s) return

  const {data:existing,error:existingError}=await supabase
   .from('challenge_joins')
   .select('id')
   .eq('challenge_id',c.id)
   .eq('user_id',user.id)
   .eq('space_id',s.id)
   .maybeSingle()

  if(existingError){
   console.error('Unable to check challenge join:',existingError)
   note('Unable to join challenge.')
   return
  }

  if(existing){
   note(`This challenge is already in ${s.name}.`)
   return
  }

  const activityId=crypto.randomUUID()
  const a:Activity={
   id:activityId,
   spaceId:s.id,
   name:c.title,
   icon:c.icon,
   category:c.category,
   points:c.points,
   recurrence:'One time',
   status:'open',
   visibility:'space',
   assignedTo:[user.id],
   completionMode:'per_member',
   approval:false,
   approverIds:[],
   proofMode:'None',
   contributesToGoals:true,
   pointDestination:'personal',
   version:1,
   createdBy:user.id,
   createdAt:new Date().toISOString(),
   periodProgress:0,
   periodTarget:1,
   periodLabel:'One time'
  }

  const {error:activityError}=await supabase
   .from('activities')
   .insert({
    id:activityId,
    space_id:s.id,
    name:a.name,
    icon:a.icon,
    category:a.category,
    points:a.points,
    recurrence:a.recurrence,
    completion_mode:'per_member',
    proof_mode:'none',
    require_approval:false,
    contributes_to_goals:true,
    status:'active',
    created_by:user.id,
    point_destination:'personal',
    visibility:'space'
   })

  if(activityError){
   console.error('Unable to create challenge activity:',activityError)
   note('Unable to join challenge.')
   return
  }

  const {error:assignmentError}=await supabase
   .from('activity_assignments')
   .insert({activity_id:activityId,user_id:user.id})

  if(assignmentError){
   console.error('Unable to assign challenge activity:',assignmentError)
   await supabase.from('activities').update({status:'archived'}).eq('id',activityId)
   note('Unable to join challenge.')
   return
  }

  const {error:joinError}=await supabase
   .from('challenge_joins')
   .insert({
    challenge_id:c.id,
    user_id:user.id,
    space_id:s.id,
    activity_id:activityId
   })

  if(joinError){
   console.error('Unable to save challenge join:',joinError)
   await supabase.from('activities').update({status:'archived'}).eq('id',activityId)
   note('Unable to join challenge.')
   return
  }

  update({
   ...data,
   activities:[a,...data.activities],
   challenges:data.challenges.map(challenge=>
    challenge.id===c.id
     ? {...challenge,joins:[...new Set([...challenge.joins,user.id])]}
     : challenge
   )
  })

  note(`Added to ${s.name}`)
 }

 const comment=async(c:CommunityChallenge,text:string)=>{
  if(!text.trim()) return

  const {data:saved,error}=await supabase
   .from('challenge_comments')
   .insert({challenge_id:c.id,user_id:user.id,comment:text.trim()})
   .select('id')
   .single()

  if(error){
   console.error('Unable to add challenge comment:',error)
   note('Unable to add comment.')
   return
  }

  update({
   ...data,
   challenges:data.challenges.map(challenge=>
    challenge.id===c.id
     ? {
        ...challenge,
        comments:[...challenge.comments,{id:saved.id,memberId:user.id,text:text.trim()}]
       }
     : challenge
   )
  })
 }

 const connected=data.friends.filter(friend=>friend.status==='connected')
 const pending=data.friends.filter(friend=>friend.status==='pending')

 return <>
  <section className="page-heading simple-heading community-heading">
   <div>
    <p className="eyebrow">Community</p>
    <h1>Shared wins, without the pressure.</h1>
    <p>Challenges and friends are here when they make Rally more fun.</p>
   </div>
  </section>

  <div className="segmented community-tabs">
   <button className={tab==='challenges'?'active':''} onClick={()=>setTab('challenges')}>Challenges</button>
   <button className={tab==='friends'?'active':''} onClick={()=>setTab('friends')}>Friends</button>
  </div>

  {tab==='friends'&&<>
   <section className="panel">
    <div className="section-title">
     <div><p className="eyebrow">Your circle</p><h2>Friends</h2></div>
     <button onClick={()=>setScreen('friends')}>Manage friends →</button>
    </div>

    {pending.length>0&&
     <div className="friend-request-summary">
      <strong>{pending.length} pending {pending.length===1?'request':'requests'}</strong>
      <button className="secondary" onClick={()=>setScreen('friends')}>Review</button>
     </div>
    }

    {connected.length===0
     ? <div className="empty friendly-empty">No connected friends yet. Rally still works perfectly on your own.</div>
     : <div className="community-friend-grid">
        {connected.map(friend=>{
         const member=data.members.find(m=>m.id===friend.memberId)
         if(!member) return null
         return <article className="community-friend-card" key={friend.memberId}>
          <Avatar member={member}/>
          <div><strong>{member.name}</strong><small>{member.tier} · {member.globalLifetime.toLocaleString()} lifetime pts</small></div>
         </article>
        })}
       </div>
    }
   </section>
  </>}

  {tab==='challenges'&&<>
   <label className="target community-target">
    <span>When you join, add it to</span>
    <select value={target} onChange={e=>setTarget(e.target.value)}>
     {spaces.map(s=><option value={s.id} key={s.id}>{s.icon} {s.name}</option>)}
    </select>
   </label>

   <section className="community-grid rally9-community-grid">
    {data.challenges.length===0&&
     <div className="empty friendly-empty">No challenges are live right now.</div>
    }
    {data.challenges.map(c=>
     <article className="challenge rally9-challenge" key={c.id}>
      <span className="huge">{c.icon}</span>
      <p className="eyebrow">{c.category}</p>
      <h2>{c.title}</h2>
      <p>{c.description}</p>
      <b>+{c.points} pts</b>
      <button className="primary" onClick={()=>join(c)}>
       {c.joins.includes(user.id)?'Add to another Rally':'Join challenge'}
      </button>
      {c.completedBy.includes(user.id)&&<span className="challenge-complete">🎉 You completed this challenge</span>}
      <details className="challenge-comments">
       <summary>{c.comments.length} {c.comments.length===1?'comment':'comments'}</summary>
       <div className="comments">
        {c.comments.map(cm=><p key={cm.id}><b>{memberName(data,cm.memberId)}:</b> {cm.text}</p>)}
        <CommentBox onSend={text=>comment(c,text)}/>
       </div>
      </details>
     </article>
    )}
   </section>
  </>}
 </>
}

function CommentBox({onSend}:{onSend:(t:string)=>void}){const [t,setT]=useState('');return <div className="comment-box"><input value={t} onChange={e=>setT(e.target.value)} placeholder="Add a comment"/><button onClick={()=>{onSend(t);setT('')}}>Send</button></div>}



function Profile({data,user,spaces,update,note,setSpaceId,setScreen,logout}:{data:AppData;user:Member;spaces:Space[];update:(d:AppData)=>void;note:(s:string)=>void;setSpaceId:(id:string)=>void;setScreen:(s:Screen)=>void;logout:()=>void|Promise<void>}){
 const totalBalance=spaces.reduce((sum,s)=>sum+(spaceMember(s,user.id)?.balance||0),0)
 const totalWeekly=spaces.reduce((sum,s)=>sum+(spaceMember(s,user.id)?.weekly||0),0)
 const totalCompleted=data.history.filter(h=>h.memberId===user.id&&h.kind==='earn').length
 const recentWins=data.history.filter(h=>h.memberId===user.id&&h.kind==='earn').slice(0,5)

 const upload=async(e:ChangeEvent<HTMLInputElement>)=>{
  const file=e.target.files?.[0]
  if(!file) return

  const path=`${user.id}/${safeFileName(file)}`
  const {error:uploadError}=await supabase.storage
   .from('avatars')
   .upload(path,file,{upsert:true})

  if(uploadError){
   console.error('Unable to upload profile photo:',uploadError)
   note('Unable to update profile photo.')
   return
  }

  const {data:publicUrlData}=supabase.storage
   .from('avatars')
   .getPublicUrl(path)

  const avatarUrl=publicUrlData.publicUrl

  const {error:profileError}=await supabase
   .from('profiles')
   .update({avatar_url:avatarUrl})
   .eq('id',user.id)

  if(profileError){
   console.error('Unable to save profile photo:',profileError)
   note('Photo uploaded, but the profile could not be updated.')
   return
  }

  update({
   ...data,
   members:data.members.map(member=>
    member.id===user.id ? {...member,avatar:avatarUrl} : member
   )
  })

  note('Profile photo updated.')
 }

 return <>
  <section className="profile-hero rally9-profile-hero">
   <div className="profile-photo-wrap">
    <Avatar member={user}/>
    <label className="photo-button">
     Change photo
     <input type="file" accept="image/*" onChange={upload}/>
    </label>
   </div>
   <div>
    <p className="eyebrow light">Your Rally profile</p>
    <h1>{user.name}</h1>
    <p>{user.tier} tier · {user.globalLifetime.toLocaleString()} lifetime points</p>
   </div>
  </section>

  <section className="profile-stat-grid rally9-profile-stats">
   <article><small>Points to use</small><strong>{totalBalance}</strong><span>across your Rallies</span></article>
   <article><small>This week</small><strong>{totalWeekly}</strong><span>points earned</span></article>
   <article><small>Your wins</small><strong>{totalCompleted}</strong><span>completed activities</span></article>
   <article><small>Rallies</small><strong>{spaces.length}</strong><span>spaces you’re in</span></article>
  </section>

  <section className="panel profile-menu-panel">
   <div className="section-title">
    <div><p className="eyebrow">Settings</p><h2>Your account</h2></div>
   </div>
   <div className="profile-menu-list">
    <button onClick={()=>setScreen('how-it-works')}><span>✦</span><div><strong>How Rally works</strong><small>Points, Goals, Treats, activities, and Rally Spaces explained</small></div><b>→</b></button>
    <button onClick={()=>setScreen('account-settings')}><span>⚙️</span><div><strong>Account & profile</strong><small>Name, defaults, privacy, and competition preferences</small></div><b>→</b></button>
    <button onClick={()=>setScreen('notifications')}><span>🔔</span><div><strong>Notifications</strong><small>What Rally tells you about and when</small></div><b>→</b></button>
    <button onClick={()=>setScreen('friends')}><span>👥</span><div><strong>Friends</strong><small>Requests and connected friends</small></div><b>→</b></button>
    <button onClick={()=>setScreen('plan')}><span>✦</span><div><strong>Plan & billing</strong><small>Your current Rally plan and space usage</small></div><b>→</b></button>
   </div>
  </section>

  <section className="panel">
   <div className="section-title">
    <div><p className="eyebrow">Your Rallies</p><h2>Spaces you belong to</h2></div>
   </div>
   <div className="profile-rally-list">
    {spaces.map(space=>{
     const sm=spaceMember(space,user.id)!
     return <button
      className="profile-rally-row"
      key={space.id}
      onClick={()=>{setSpaceId(space.id);setScreen('home')}}
     >
      <span className="space-icon">{space.icon}</span>
      <div>
       <strong>{space.name}</strong>
       <small>{sm.role} · {sm.weekly} pts this week</small>
      </div>
      <b>→</b>
     </button>
    })}
   </div>
  </section>

  {recentWins.length>0&&
   <section className="panel">
    <div className="section-title">
     <div><p className="eyebrow">Recent wins</p><h2>Your progress</h2></div>
    </div>
    {recentWins.map(history=>
     <div className="history-row" key={history.id}>
      <span>{data.spaces.find(s=>s.id===history.spaceId)?.icon||'✦'}</span>
      <div><strong>{history.title}</strong><small>{history.createdAt}</small></div>
      <b>+{history.points}</b>
     </div>
    )}
   </section>
  }

  <button className="profile-logout" onClick={()=>logout()}>Log out</button>
 </>
}

function HowRallyWorks({setScreen}:{setScreen:(s:Screen)=>void}){
 return <>
  <section className="how-rally-hero">
   <button className="how-rally-back" onClick={()=>setScreen('profile')}>← Profile</button>
   <span className="how-rally-hero-mark">✦</span>
   <p className="eyebrow light">How Rally works</p>
   <h1>Turn everyday effort into momentum.</h1>
   <p>Rally is a motivation tool for individuals, families, friends, and teams. Add what you want to get done, earn points when you do it, and use that progress to keep yourself moving.</p>
  </section>

  <section className="rally-explainer-grid">
   <article><span>1</span><b>✓</b><h2>Add what you want to get done</h2><p>Activities can be chores, habits, routines, projects, or anything else you want a little extra motivation to finish.</p></article>
   <article><span>2</span><b>+20</b><h2>Turn completions into points</h2><p>Points make effort visible. Bigger or harder activities can be worth more, and every valid completion adds to your progress.</p></article>
   <article><span>3</span><b>🎯</b><h2>Build toward Goals</h2><p>Goals give your points somewhere meaningful to build. Points move selected Goals forward, but reaching a Goal never uses those points up.</p></article>
   <article><span>4</span><b>🎁</b><h2>Give yourself a Treat</h2><p>Treats are rewards you choose because they motivate you. When you decide to use one, its point cost comes out of your points to use — not your lifetime progress.</p></article>
   <article><span>5</span><b>👥</b><h2>Rally together</h2><p>Create spaces for yourself, your household, friends, or a team. Encourage each other, work toward shared progress, or add friendly competition when it helps.</p></article>
  </section>

  <section className="goal-treat-compare">
   <article className="goal-side">
    <span>🎯</span>
    <div><p className="eyebrow">Goal</p><h2>Track progress</h2><p>“We want to build 1,000 points of healthy habits.”</p><strong>Points move the Goal forward and stay yours.</strong></div>
   </article>
   <article className="treat-side">
    <span>🎁</span>
    <div><p className="eyebrow">Treat</p><h2>Celebrate progress</h2><p>“At 500 points, I’m treating myself to dinner out.”</p><strong>You choose when to use the Treat and its points.</strong></div>
   </article>
  </section>

  <section className="panel rally-points-note">
   <span>✦</span>
   <div><h2>Rally points are for motivation.</h2><p>They have no cash or monetary value. They simply help make effort visible, make progress feel rewarding, and give you something concrete to work toward.</p></div>
  </section>
 </>
}

function AccountSettings({data,user,update,note}:{data:AppData;user:Member;update:(d:AppData)=>void;note:(s:string)=>void}){
 const prefs:AccountPreferences=data.accountPrefs||{
  competition:'Competitive',
  privatePersonal:true,
  askBeforeSharingName:true
 }

 const savePrefs=async(next:AccountPreferences)=>{
  const {error}=await supabase
   .from('profiles')
   .update({
    competition_preference:next.competition,
    private_personal_by_default:next.privatePersonal,
    ask_before_sharing_space_name:next.askBeforeSharingName
   })
   .eq('id',user.id)

  if(error){
   console.error('Unable to save account preferences:',error)
   note('Unable to update account preferences.')
   return
  }

  update({...data,accountPrefs:next})
 }

 const saveName=async(name:string)=>{
  if(!name||name===user.name) return

  const {error}=await supabase
   .from('profiles')
   .update({display_name:name})
   .eq('id',user.id)

  if(error){
   console.error('Unable to update display name:',error)
   note('Unable to update display name.')
   return
  }

  update({
   ...data,
   members:data.members.map(member=>
    member.id===user.id
     ? {...member,name}
     : member
   )
  })

  note('Display name updated.')
 }

 return <>
  <section className="account-settings-hero">
   <div>
    <p>⚙️ ACCOUNT SETTINGS</p>
    <h1>How Rally works for you</h1>
    <span>These settings follow your account rather than one specific Rally Space.</span>
   </div>
  </section>

  <section className="panel settings-section">
   <div className="section-title">
    <div>
     <p className="eyebrow">Motivation style</p>
     <h2>How do you like to Rally?</h2>
    </div>
   </div>

   <div className="segmented">
    {(['Competitive','Collaborative','Private'] as const).map(option=>
     <button
      className={prefs.competition===option?'active':''}
      key={option}
      onClick={()=>savePrefs({...prefs,competition:option})}
     >
      {option==='Competitive'?'🏆 Compete':option==='Collaborative'?'🤝 Together':'✨ Just me'}
     </button>
    )}
   </div>

   <p className="settings-explainer">
    This preference helps Rally emphasize the kind of motivation you like. Individual Rally Spaces can still use their own leaderboard settings.
   </p>
  </section>

  <section className="panel settings-section">
   <div className="section-title">
    <div>
     <p className="eyebrow">Privacy</p>
     <h2>Default sharing behavior</h2>
    </div>
   </div>

   <label className="switch-row">
    <span>
     <strong>Keep personal Rally activities private by default</strong>
     <small>Group Rally activities remain visible to the people in that Rally.</small>
    </span>
    <input
     type="checkbox"
     checked={prefs.privatePersonal}
     onChange={e=>savePrefs({
      ...prefs,
      privatePersonal:e.target.checked
     })}
    />
   </label>

   <label className="switch-row">
    <span>
     <strong>Ask before including a Rally name in shared accomplishments</strong>
     <small>Helps protect private household and work Rally names.</small>
    </span>
    <input
     type="checkbox"
     checked={prefs.askBeforeSharingName}
     onChange={e=>savePrefs({
      ...prefs,
      askBeforeSharingName:e.target.checked
     })}
    />
   </label>
  </section>

  <section className="panel settings-section">
   <div className="section-title">
    <div>
     <p className="eyebrow">Profile</p>
     <h2>Account information</h2>
    </div>
   </div>

   <label>
    Display name
    <input
     defaultValue={user.name}
     onBlur={e=>saveName(e.target.value.trim())}
    />
   </label>
  </section>
 </>
}

function ActivitySettingsIndex({data,user,spaces,setSpaceId,setScreen}:{data:AppData;user:Member;spaces:Space[];setSpaceId:(id:string)=>void;setScreen:(s:Screen)=>void}){
 const managed=spaces.filter(s=>['Owner','Admin'].includes(roleFor(s,user.id)||''))
 return <><section className="account-settings-hero activity-settings-hero"><div><p>✓ ACTIVITY SETTINGS</p><h1>Manage Rally activities</h1><span>Everyday completing stays simple. Administrative controls live here.</span></div></section><section className="panel"><div className="section-title"><div><p className="eyebrow">Your Rally Spaces</p><h2>Choose a Rally to manage</h2></div></div>{managed.length?managed.map(s=>{const active=data.activities.filter(a=>a.spaceId===s.id&&a.status!=='archived').length;const archived=data.activities.filter(a=>a.spaceId===s.id&&a.status==='archived').length;return <button className="settings-index-row" key={s.id} onClick={()=>{setSpaceId(s.id);setScreen('settings')}}><span className="space-icon">{s.icon}</span><div><strong>{s.name}</strong><small>{active} active · {archived} archived · {roleFor(s,user.id)}</small></div><span>Pause · Archive · Restore · Delete</span><b>→</b></button>}):<div className="empty">You aren't an admin of any Rally Spaces yet.</div>}</section></>
}

function PlanSettings({data,user,spaces,setSpaceId,setScreen}:{data:AppData;user:Member;spaces:Space[];setSpaceId:(id:string)=>void;setScreen:(s:Screen)=>void}){
 const managed=spaces.filter(s=>['Owner','Admin'].includes(roleFor(s,user.id)||''))
 const plan=data.subscription?.plan || 'free'
 const status=data.subscription?.status || 'active'

 return <>
  <section className="page-heading simple-heading plan-page-heading">
   <div>
    <p className="eyebrow">Plan & billing</p>
    <h1>{plan.charAt(0).toUpperCase()+plan.slice(1)} plan</h1>
    <p>Your plan is {status}. Rally only surfaces limits when they matter.</p>
   </div>
  </section>

  <section className="panel plan-summary-card">
   <div>
    <span className="plan-mark">✦</span>
    <div><strong>{plan.toUpperCase()}</strong><small>{status}</small></div>
   </div>
   {data.subscription?.currentPeriodEnd&&
    <small>Current period ends {formatTimestamp(data.subscription.currentPeriodEnd)}</small>
   }
  </section>

  {managed.length>0&&
   <details className="panel plan-usage-details">
    <summary>Rally usage</summary>
    <div className="profile-rally-list">
     {managed.map(space=>
      <button
       className="profile-rally-row"
       key={space.id}
       onClick={()=>{setSpaceId(space.id);setScreen('settings')}}
      >
       <span className="space-icon">{space.icon}</span>
       <div>
        <strong>{space.name}</strong>
        <small>
         {space.members.length} members · {data.activities.filter(a=>a.spaceId===space.id&&a.status!=='archived').length} activities · {data.treats.filter(t=>t.spaceId===space.id&&t.status==='locked').length} treats · {data.goals.filter(g=>g.spaceId===space.id&&g.status==='active').length} goals
        </small>
       </div>
       <b>Manage →</b>
      </button>
     )}
    </div>
   </details>
  }
 </>
}

function FriendsSettings({data,user,update,note}:{data:AppData;user:Member;update:(d:AppData)=>void;note:(s:string)=>void}){
 const connected=data.friends.filter(f=>f.status==='connected')
 const pending=data.friends.filter(f=>f.status==='pending')
 const [email,setEmail]=useState('')

 const addFriend=async(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault()
  const normalized=email.trim().toLowerCase()
  if(!normalized) return

  const {data:matches,error:findError}=await supabase
   .rpc('find_profile_by_email',{search_email:normalized})

  if(findError){
   console.error('Unable to find Rally user:',findError)
   note('Unable to search for that Rally user.')
   return
  }

  const target=matches?.[0]

  if(!target){
   note('No Rally account was found for that email.')
   return
  }

  const {data:existing,error:existingError}=await supabase
   .from('friendships')
   .select('id, requester_id, addressee_id, status')
   .or(`and(requester_id.eq.${user.id},addressee_id.eq.${target.id}),and(requester_id.eq.${target.id},addressee_id.eq.${user.id})`)
   .in('status',['pending','accepted'])
   .limit(1)

  if(existingError){
   console.error('Unable to check friendship:',existingError)
   note('Unable to add friend.')
   return
  }

  if(existing?.length){
   note(existing[0].status==='accepted'?'You are already friends.':'A friend request is already pending.')
   return
  }

  const {data:friendship,error}=await supabase
   .from('friendships')
   .insert({requester_id:user.id,addressee_id:target.id,status:'pending'})
   .select('id')
   .single()

  if(error){
   console.error('Unable to send friend request:',error)
   note('Unable to send friend request.')
   return
  }

  const targetMember:Member={
   id:target.id,
   name:target.display_name || 'Rally Member',
   avatar:target.avatar_url || undefined,
   globalLifetime:target.lifetime_points ?? 0,
   tier:tierFor(target.lifetime_points ?? 0)
  }

  update({
   ...data,
   members:data.members.some(member=>member.id===target.id)?data.members:[...data.members,targetMember],
   friends:[...data.friends,{memberId:target.id,status:'pending',friendshipId:friendship.id,requesterId:user.id}]
  })

  setEmail('')
  note('Friend request sent.')
 }

 const accept=async(friend:Friend)=>{
  if(!friend.friendshipId) return
  const {error}=await supabase.from('friendships').update({status:'accepted'}).eq('id',friend.friendshipId)
  if(error){console.error('Unable to accept friend request:',error);note('Unable to accept friend request.');return}
  update({...data,friends:data.friends.map(item=>item.friendshipId===friend.friendshipId?{...item,status:'connected'}:item)})
  note('Friend added.')
 }

 const decline=async(friend:Friend)=>{
  if(!friend.friendshipId) return
  const {error}=await supabase.from('friendships').update({status:'declined'}).eq('id',friend.friendshipId)
  if(error){console.error('Unable to decline friend request:',error);note('Unable to decline friend request.');return}
  update({...data,friends:data.friends.filter(item=>item.friendshipId!==friend.friendshipId)})
  note('Friend request declined.')
 }

 const remove=async(friend:Friend)=>{
  if(!friend.friendshipId) return
  if(!window.confirm(`Remove ${memberName(data,friend.memberId)} from your Rally friends?`)) return
  const {error}=await supabase.from('friendships').delete().eq('id',friend.friendshipId)
  if(error){console.error('Unable to remove friend:',error);note('Unable to remove friend.');return}
  update({...data,friends:data.friends.filter(item=>item.friendshipId!==friend.friendshipId)})
  note('Friend removed.')
 }

 return <>
  <section className="page-heading simple-heading friends-page-heading">
   <div>
    <p className="eyebrow">Friends</p>
    <h1>Your Rally circle</h1>
    <p>Friends can cheer you on without seeing private Rally Space data.</p>
   </div>
  </section>

  <form className="panel add-friend-form" onSubmit={addFriend}>
   <div><p className="eyebrow">Add a friend</p><h2>Find them by their Rally email</h2></div>
   <div className="friend-email-row">
    <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="friend@example.com" required/>
    <button className="primary">Send request</button>
   </div>
  </form>

  {pending.length>0&&
   <section className="panel">
    <div className="section-title"><div><p className="eyebrow">Pending</p><h2>Requests</h2></div></div>
    {pending.map(friend=>{
     const member=data.members.find(m=>m.id===friend.memberId)
     if(!member) return null
     const incoming=friend.requesterId!==user.id
     return <div className="friend-settings-row" key={friend.friendshipId||friend.memberId}>
      <Avatar member={member}/>
      <div><strong>{member.name}</strong><small>{incoming?'Wants to connect':'Request sent'}</small></div>
      {incoming&&<><button className="primary" onClick={()=>accept(friend)}>Accept</button><button className="secondary" onClick={()=>decline(friend)}>Decline</button></>}
     </div>
    })}
   </section>
  }

  <section className="panel">
   <div className="section-title"><div><p className="eyebrow">Connected</p><h2>{connected.length?`${connected.length} ${connected.length===1?'friend':'friends'}`:'No friends yet'}</h2></div></div>
   {connected.length===0
    ? <div className="empty friendly-empty">You don’t need friends to use Rally. Add people only when it makes the experience more fun.</div>
    : connected.map(friend=>{
       const member=data.members.find(m=>m.id===friend.memberId)
       if(!member) return null
       return <div className="friend-settings-row" key={friend.memberId}>
        <Avatar member={member}/>
        <div><strong>{member.name}</strong><small>{member.tier} · {member.globalLifetime.toLocaleString()} lifetime pts</small></div>
        <button className="danger" onClick={()=>remove(friend)}>Remove</button>
       </div>
      })
   }
  </section>
 </>
}

function PendingInvitationCard({invitation,respond}:{invitation:SpaceInvitation;respond:(invitation:SpaceInvitation,response:'accepted'|'declined')=>void|Promise<void>}){
 const [busy,setBusy]=useState<'accepted'|'declined'|null>(null)

 const choose=async(response:'accepted'|'declined')=>{
  if(busy) return
  setBusy(response)
  await respond(invitation,response)
  setBusy(null)
 }

 return <article className="space-invitation-card">
  <span className="space-invitation-icon">{invitation.spaceIcon}</span>
  <div className="space-invitation-copy">
   <p className="eyebrow">Rally invitation</p>
   <h3>{invitation.spaceName}</h3>
   <p>
    <b>{invitation.invitedByName}</b> invited you as a{' '}
    {invitation.role==='admin'
     ? 'Rally Admin'
     : invitation.role==='approver'
      ? 'Rally Approver'
      : 'Member'}.
   </p>
   <small>Invitation expires {formatTimestamp(invitation.expiresAt)}</small>
  </div>
  <div className="space-invitation-actions">
   <button
    className="secondary"
    disabled={!!busy}
    onClick={()=>choose('declined')}
   >
    {busy==='declined'?'Declining…':'Decline'}
   </button>
   <button
    className="primary"
    disabled={!!busy}
    onClick={()=>choose('accepted')}
   >
    {busy==='accepted'?'Joining…':'Accept invite'}
   </button>
  </div>
 </article>
}

function Notifications({data,user,update,respondToInvite,setSpaceId,setScreen}:{data:AppData;user:Member;update:(d:AppData)=>void;respondToInvite:(invitation:SpaceInvitation,response:'accepted'|'declined')=>void|Promise<void>;setSpaceId:(id:string)=>void;setScreen:(s:Screen)=>void}){
 const notes=data.notifications.filter(n=>n.recipientId===user.id)
 const pendingInvites=data.pendingInvites||[]

 const open=async(n:Notification)=>{
  if(!n.read){
   const {error}=await supabase
    .from('notifications')
    .update({is_read:true})
    .eq('id',n.id)
    .eq('user_id',user.id)

   if(error){
    console.error('Unable to mark notification read:',error)
   }else{
    update({
     ...data,
     notifications:data.notifications.map(item=>
      item.id===n.id ? {...item,read:true} : item
     )
    })
   }
  }

  if(n.spaceId) setSpaceId(n.spaceId)
  if(n.action) setScreen(n.action)
 }

 return <>
  <section className="page-heading simple-heading notifications-heading">
   <div><p className="eyebrow">Notifications</p><h1>Things worth noticing</h1><p>Actionable updates first. Everything else stays quiet.</p></div>
  </section>

  {pendingInvites.length>0&&
   <section className="panel notification-invitations">
    <div className="section-title">
     <div>
      <p className="eyebrow">Pending invitations</p>
      <h2>Rallies waiting for your response</h2>
     </div>
    </div>
    {pendingInvites.map(invitation=>
     <PendingInvitationCard
      key={invitation.id}
      invitation={invitation}
      respond={respondToInvite}
     />
    )}
   </section>
  }

  <section className="panel notification-feed">
   {notes.length===0&&pendingInvites.length===0&&<div className="empty friendly-empty">You’re all caught up.</div>}
   {notes.map(n=>
    <button
     className={`notification ${n.read?'':'unread'}`}
     key={n.id}
     onClick={()=>open(n)}
    >
     <span>🔔</span>
     <div>
      <strong>{n.title}</strong>
      <p>{n.body}</p>
      <small>{n.createdAt}</small>
     </div>
     <b>→</b>
    </button>
   )}
  </section>

  <details className="panel notification-settings-shell">
   <summary>Notification settings</summary>
   <NotificationSettings data={data} user={user} update={update}/>
  </details>
 </>
}

function NotificationSettings({data,user,update}:{data:AppData;user:Member;update:(d:AppData)=>void}){
 const prefs=data.notificationPrefs[user.id]||{
  leaderboard:true,
  approvals:true,
  milestones:true,
  tiers:true,
  daily:false,
  community:true
 }

 const setPref=async(key:keyof NotificationPref,value:boolean)=>{
  const next={...prefs,[key]:value}

  const {error}=await supabase
   .from('notification_preferences')
   .upsert({
    user_id:user.id,
    leaderboard_changes:next.leaderboard,
    approval_requests:next.approvals,
    point_milestones:next.milestones,
    tier_unlocks:next.tiers,
    daily_kickoff:next.daily,
    community_activity:next.community
   },{
    onConflict:'user_id'
   })

  if(error){
   console.error('Unable to save notification preferences:',error)
   return
  }

  update({
   ...data,
   notificationPrefs:{
    ...data.notificationPrefs,
    [user.id]:next
   }
  })
 }

 return <section className="panel">
  <h2>Notification preferences</h2>
  {Object.entries(prefs).map(([key,value])=>
   <label className="check" key={key}>
    <input
     type="checkbox"
     checked={value}
     onChange={e=>setPref(
      key as keyof NotificationPref,
      e.target.checked
     )}
    />
    {key==='daily'
     ? 'Daily kickoff'
     : key[0].toUpperCase()+key.slice(1)
    }
   </label>
  )}
 </section>
}

function CreateSpace({
 data,
 update,
 user,
 close,
 authUser
}:{
 data:AppData
 update:(d:AppData)=>void
 user:Member
 close:()=>void
 authUser:User|null
}){
 const submit=async(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault()

  if(!authUser){
   console.error('No authenticated user available.')
   return
  }

  const form=e.currentTarget
  const f=new FormData(form)
  const name=String(f.get('name')).trim()
  const icon=String(f.get('icon')||'🎯')
  const type=String(f.get('type')) as SpaceType
  const timezone=String(f.get('timezone')||'America/New_York')

  const {data:createdSpace,error}=await supabase
   .from('spaces')
   .insert({
    name,
    icon,
    type:spaceTypeToDb(type),
    timezone,
    created_by:authUser.id
   })
   .select()
   .single()

  if(error){
   console.error('Unable to create Rally Space:',error)
   return
  }

  const {error:memberError}=await supabase
   .from('space_members')
   .insert({
    space_id:createdSpace.id,
    user_id:authUser.id,
    role:'owner'
   })

  if(memberError){
   console.error('Unable to add owner to Rally Space:',memberError)
   return
  }

  const s:Space={
   id:createdSpace.id,
   name:createdSpace.name,
   icon:createdSpace.icon||'🎯',
   type:spaceTypeFromDb(createdSpace.type),
   timezone:createdSpace.timezone||timezone,
   weeklyLeaderboard:createdSpace.weekly_leaderboard ?? true,
   poolEnabled:createdSpace.pool_enabled ?? false,
   poolBalance:createdSpace.pool_balance ?? 0,
   members:[{
    memberId:user.id,
    role:'Owner',
    balance:0,
    lifetime:0,
    weekly:0,
    joinedAt:createdSpace.created_at||new Date().toISOString()
   }]
  }

  update({...data,spaces:[...data.spaces,s]})
  form.reset()
  close()
 }

 return <div className="modal-backdrop">
  <form className="modal create-space-modal" onSubmit={submit}>
   <button type="button" className="close" onClick={close} aria-label="Close">×</button>
   <p className="eyebrow">New Rally</p>
   <h2>What are you rallying around?</h2>
   <p className="modal-intro">Choose the kind of space that fits. You can keep it simple and change the details later.</p>

   <fieldset className="rally-type-fieldset">
    <legend>Rally type</legend>
    <div className="rally-type-grid">
     <label className="rally-type-option">
      <input type="radio" name="type" value="household" defaultChecked/>
      <span>🏠</span>
      <strong>Household</strong>
      <small>Chores, routines, goals, and shared wins.</small>
     </label>
     <label className="rally-type-option">
      <input type="radio" name="type" value="friends"/>
      <span>👥</span>
      <strong>Friends</strong>
      <small>Challenges, motivation, and friendly competition.</small>
     </label>
     <label className="rally-type-option">
      <input type="radio" name="type" value="work"/>
      <span>💼</span>
      <strong>Work</strong>
      <small>Team habits, learning, and accountable progress.</small>
     </label>
     <label className="rally-type-option">
      <input type="radio" name="type" value="personal"/>
      <span>✨</span>
      <strong>Just me</strong>
      <small>A separate private Rally for a focused goal.</small>
     </label>
    </div>
   </fieldset>

   <div className="two create-space-fields">
    <label>
     Rally name
     <input name="name" required placeholder="Williams-Hurt Home"/>
    </label>
    <label>
     Icon <small>optional</small>
     <input name="icon" placeholder="🏠"/>
    </label>
   </div>

   <details className="more-options create-space-more">
    <summary>More options</summary>
    <label>
     Timezone
     <input name="timezone" defaultValue="America/New_York"/>
    </label>
   </details>

   <button className="primary create-rally-submit">Create Rally</button>
  </form>
 </div>
}

