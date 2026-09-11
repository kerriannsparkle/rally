import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import './styles.css'
import { supabase } from './supabase'
import Auth from './Auth'

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
 approval:boolean;approverIds:string[];proofMode:ProofMode;proofUrl?:string;completedBy?:string;completedAt?:string;
 contributesToGoals:boolean;pointDestination?:'personal'|'shared';version:number;createdBy:string;
 createdAt?:string;periodProgress?:number;periodTarget?:number;periodLabel?:string
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
type AppData={
 currentUserId:string;members:Member[];spaces:Space[];activities:Activity[];treats:Treat[];goals:Goal[];
 notifications:Notification[];friends:Friend[];challenges:CommunityChallenge[];history:History[];
 notificationPrefs:Record<string,NotificationPref>;accountPrefs?:AccountPreferences;
 subscription?:SubscriptionInfo;rewardIdeas?:RewardIdea[]
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

const recurrenceTarget=(recurrence:string)=>{
 const value=recurrence.toLowerCase()
 if(value==='3x/week') return 3
 if(value==='twice/month') return 2
 return 1
}

const periodKeyFor=(recurrence:string,date=new Date())=>{
 const value=recurrence.toLowerCase()

 if(value==='one time') return 'once'

 if(value==='every day'){
  return `day:${localDateKey(date)}`
 }

 if(value==='every week'||value==='3x/week'){
  const start=new Date(date)
  const daysSinceMonday=(start.getDay()+6)%7
  start.setHours(0,0,0,0)
  start.setDate(start.getDate()-daysSinceMonday)
  return `week:${localDateKey(start)}`
 }

 if(value==='every other week'){
  const start=new Date(date)
  const daysSinceMonday=(start.getDay()+6)%7
  start.setHours(0,0,0,0)
  start.setDate(start.getDate()-daysSinceMonday)
  const mondayNumber=Math.floor(start.getTime()/604800000)
  return `biweek:${Math.floor(mondayNumber/2)}`
 }

 if(value==='twice/month'){
  return `month2:${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`
 }

 if(value==='every 90 days'){
  const dayNumber=Math.floor(
   Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())/86400000
  )
  return `90-day:${Math.floor(dayNumber/90)}`
 }

 return `day:${localDateKey(date)}`
}

const periodKeyMatches=(recurrence:string,key:string,date=new Date())=>{
 const base=periodKeyFor(recurrence,date)
 const target=recurrenceTarget(recurrence)

 if(target===1) return key===base
 return key===base || key.startsWith(`${base}:`)
}

const nextPeriodKey=(recurrence:string,existingKeys:string[],date=new Date())=>{
 const base=periodKeyFor(recurrence,date)
 const target=recurrenceTarget(recurrence)

 if(target===1) return base

 const used=new Set(existingKeys)
 if(!used.has(base)) return base

 for(let slot=2;slot<=target;slot+=1){
  const key=`${base}:${slot}`
  if(!used.has(key)) return key
 }

 return `${base}:${target}`
}

const recurrenceProgressLabel=(recurrence:string,progress:number,target:number)=>{
 const value=recurrence.toLowerCase()
 if(target<=1) return recurrence
 if(value==='3x/week') return `${progress} of ${target} this week`
 if(value==='twice/month') return `${progress} of ${target} this month`
 return `${progress} of ${target}`
}

const recurrencePriority=(recurrence:string)=>{
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

  // 2. Automatically accept any valid Rally invitations for this email
  if(authUser.email){
   const {data:pendingInvites,error:inviteLoadError}=await supabase
    .from('space_invitations')
    .select('id, space_id, role')
    .ilike('email',authUser.email)
    .eq('status','pending')
    .gt('expires_at',new Date().toISOString())

   if(inviteLoadError){
    console.error('Unable to load Rally invitations:',inviteLoadError)
   }else{
    for(const invitation of pendingInvites||[]){
     const {error:joinError}=await supabase
      .from('space_members')
      .upsert({
       space_id:invitation.space_id,
       user_id:authUser.id,
       role:invitation.role || 'member'
      },{
       onConflict:'space_id,user_id',
       ignoreDuplicates:true
      })

     if(joinError){
      console.error('Unable to accept Rally invitation:',joinError)
      continue
     }

     const {error:inviteUpdateError}=await supabase
      .from('space_invitations')
      .update({status:'accepted'})
      .eq('id',invitation.id)

     if(inviteUpdateError){
      console.error(
       'Unable to mark Rally invitation accepted:',
       inviteUpdateError
      )
     }
    }
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

   const target=recurrenceTarget(activity.recurrence || 'One time')
   const periodCompletions=activityCompletions.filter(
    completion=>
     completion.activity_id===activity.id &&
     periodKeyMatches(
      activity.recurrence || 'One time',
      completion.period_key
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

   const pendingForApproval=approverIds.includes(authUser.id)
    ? periodCompletions.find(
       completion=>completion.approval_status==='pending'
      )
    : undefined

   const latestEarned=earnedCompletions[0]
   const latestCompletion=
    pendingForApproval || ownPending || latestEarned

   const progress=Math.min(target,earnedCompletions.length)

   const completionStatus:ActivityStatus=
    activity.status==='paused'||activity.status==='archived'
     ? activity.status as ActivityStatus
     : pendingForApproval||ownPending
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
    rewardIdeas
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
},[authUser])

console.log('Supabase connected:', supabase)
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
 const unread=myNotifications.filter(n=>!n.read).length

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

  const target=recurrenceTarget(a.recurrence)
  const basePeriodKey=periodKeyFor(a.recurrence)

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
   liveCompletions.map(completion=>completion.period_key)
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
        )
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
  const target=a.periodTarget || recurrenceTarget(a.recurrence)
  const basePeriodKey=periodKeyFor(a.recurrence)

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
  if(a.status!=='pending'||!a.approverIds.includes(user.id)) return

  const target=a.periodTarget || recurrenceTarget(a.recurrence)
  const basePeriodKey=periodKeyFor(a.recurrence)

  let completionQuery=supabase
   .from('activity_completions')
   .select('id, completed_by, completed_at, period_key')
   .eq('activity_id',a.id)
   .eq('approval_status','pending')

  completionQuery=target>1
   ? completionQuery.like('period_key',`${basePeriodKey}%`)
   : completionQuery.eq('period_key',basePeriodKey)

  const {data:completion,error:completionError}=await completionQuery
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
  if(a.status!=='pending'||!a.approverIds.includes(user.id)) return

  const target=a.periodTarget || recurrenceTarget(a.recurrence)
  const basePeriodKey=periodKeyFor(a.recurrence)

  let completionQuery=supabase
   .from('activity_completions')
   .select('id, completed_by, period_key')
   .eq('activity_id',a.id)
   .eq('approval_status','pending')

  completionQuery=target>1
   ? completionQuery.like('period_key',`${basePeriodKey}%`)
   : completionQuery.eq('period_key',basePeriodKey)

  const {data:completion,error:completionError}=await completionQuery
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
 return <div className="app rally9-app">
  {toast&&<div className="toast">{toast}</div>}

  <header className="topbar rally9-topbar">
   <button
    className="brand"
    onClick={()=>{setSpaceId('all');setScreen('home')}}
    aria-label="Go to Rally home"
   >
    <span>{BRAND.logo}</span><b>{BRAND.name}</b>
   </button>

   <div className="top-context">
    {activeSpace
     ? <button
        className="context-space-pill"
        onClick={()=>{setSpaceId('all');setScreen('home')}}
       >
        <span>←</span> {activeSpace.icon} {activeSpace.name}
       </button>
     : <span className="context-home-copy">Make progress feel good.</span>
    }
   </div>

   <div className="top-actions">
    <button
     className="top-create-button"
     onClick={()=>setInviteOpen(true)}
     title="Create a Rally"
    >
     ＋ <span>New Rally</span>
    </button>

    <button
     className="bell"
     title="Notifications"
     aria-label="Notifications"
     onClick={()=>{setSpaceId('all');setScreen('notifications')}}
    >
     🔔{unread>0&&<b>{unread}</b>}
    </button>

    <button
     className="profile-shortcut"
     onClick={()=>{setSpaceId('all');setScreen('profile')}}
     aria-label="Profile"
    >
     <Avatar member={user}/>
    </button>
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

   {!['notifications','community','profile','account-settings','plan','friends','activity-settings'].includes(screen)&&spaceId==='all'&&
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
         setSpaceId={setSpaceId}
         setScreen={setScreen}
        />
     }
    </>
   }

   {!['notifications','community','profile','account-settings','plan','friends','activity-settings'].includes(screen)&&spaceId!=='all'&&activeSpace&&
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
   <NavButton
    active={spaceId==='all'&&screen==='home'}
    icon="⌂"
    label="Home"
    go={()=>{setSpaceId('all');setScreen('home')}}
   />
   <NavButton
    active={spaceId==='all'&&screen==='activities'}
    icon="✓"
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
    active={['profile','account-settings','plan','friends','activity-settings'].includes(screen)}
    icon="☺"
    label="Profile"
    go={()=>{setSpaceId('all');setScreen('profile')}}
   />
  </nav>
 </div>
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
 return <section className={`space-header rally9-space-header ${space.type}`}>
  <button className="space-back" onClick={backHome}>← Home</button>
  <div className="space-title-lockup">
   <span className="space-hero-icon">{space.icon}</span>
   <div>
    <p>{space.type==='personal'?'PERSONAL RALLY':`${space.type.toUpperCase()} RALLY`}</p>
    <h1>{space.name}</h1>
    <span>{space.members.length} {space.members.length===1?'member':'members'} · {role}</span>
   </div>
  </div>
  {canManage&&
   <button className="space-settings-button" onClick={openSettings}>
    ⚙️ Settings
   </button>
  }
 </section>
}

function RallyTabs({screen,space,setScreen}:{screen:Screen;space:Space;setScreen:(s:Screen)=>void}){
 const tabs:{screen:Screen;label:string}[]=[
  {screen:'home',label:'Overview'},
  {screen:'activities',label:'Activities'},
  {screen:'goals',label:'Goals'},
  {screen:'treats',label:'Treats'},
  {screen:'members',label:'Members'},
  {screen:'stats',label:'Insights'}
 ]

 return <nav className="rally-tabs" aria-label={`${space.name} navigation`}>
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

function GlobalHome({data,user,spaces,activities,complete,approve,sendBack,setSpaceId,setScreen}:{data:AppData;user:Member;spaces:Space[];activities:Activity[];complete:(a:Activity)=>void;approve:(a:Activity)=>void;sendBack:(a:Activity)=>void;setSpaceId:(id:string)=>void;setScreen:(s:Screen)=>void}){
 const ready=activities
  .filter(a=>
   a.status==='open' &&
   (a.assignedTo.length===0||a.assignedTo.includes(user.id))
  )
  .sort((a,b)=>
   recurrencePriority(a.recurrence)-recurrencePriority(b.recurrence) ||
   b.points-a.points
  )

 const approvals=activities.filter(a=>
  a.status==='pending'&&a.approverIds.includes(user.id)
 )

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
   const aBalance=spaceMember(
    spaces.find(space=>space.id===a.spaceId)!,user.id
   )?.balance||0
   const bBalance=spaceMember(
    spaces.find(space=>space.id===b.spaceId)!,user.id
   )?.balance||0
   return Math.max(0,a.points-aBalance)-Math.max(0,b.points-bBalance)
  })[0]

 const topGoal=data.goals
  .filter(goal=>goal.status==='active'||goal.status==='reached')
  .sort((a,b)=>
   (b.progress/Math.max(1,b.target))-(a.progress/Math.max(1,a.target))
  )[0]

 const motivationSpace=topTreat
  ? spaces.find(space=>space.id===topTreat.spaceId)
  : topGoal
   ? spaces.find(space=>space.id===topGoal.spaceId)
   : undefined

 const recentWins=data.history
  .filter(history=>history.memberId===user.id&&history.kind==='earn')
  .slice(0,5)

 const hasAnyActivities=activities.some(a=>
  a.assignedTo.includes(user.id)||a.createdBy===user.id
 )

 return <>
  <section className="rally9-welcome">
   <div>
    <p className="eyebrow">HOME</p>
    <h1>Hey {user.name.split(' ')[0]} 👋</h1>
    <p>Ready for a small win?</p>
   </div>
   <div className="welcome-score">
    <strong>{totalWeekly}</strong>
    <span>points this week</span>
   </div>
  </section>

  {approvals.length>0&&
   <section className="attention-panel">
    <div className="section-title compact-title">
     <div>
      <p className="eyebrow">Needs your attention</p>
      <h2>{approvals.length} {approvals.length===1?'completion needs':'completions need'} you</h2>
     </div>
    </div>
    {approvals.slice(0,3).map(activity=>
     <ActivityCard
      key={activity.id}
      a={activity}
      data={data}
      user={user}
      complete={complete}
      approve={approve}
      sendBack={sendBack}
      showSpace
     />
    )}
   </section>
  }

  <section className="panel home-up-next">
   <div className="section-title">
    <div>
     <p className="eyebrow">Up next</p>
     <h2>{ready.length?`${ready.length} ready for you`:'You’re all caught up 🎉'}</h2>
    </div>
    {ready.length>4&&
     <button onClick={()=>setScreen('activities')}>See all →</button>
    }
   </div>

   {!hasAnyActivities&&
    <div className="first-win-empty">
     <span>✦</span>
     <div>
      <h3>Your first win starts here</h3>
      <p>Add one small thing you’d like to make progress on.</p>
     </div>
     <button className="primary" onClick={()=>setScreen('activities')}>
      + Add your first activity
     </button>
    </div>
   }

   {hasAnyActivities&&ready.length===0&&
    <div className="empty friendly-empty">
     Nothing needs your attention right now. Enjoy the win.
    </div>
   }

   {ready.slice(0,4).map(activity=>
    <ActivityCard
     key={activity.id}
     a={activity}
     data={data}
     user={user}
     complete={complete}
     approve={approve}
     sendBack={sendBack}
     showSpace
    />
   )}
  </section>

  <section className="home-rallies-section">
   <div className="section-title">
    <div>
     <p className="eyebrow">Your Rallies</p>
     <h2>{spaces.length===1?'Your Rally':'Your spaces'}</h2>
    </div>
   </div>

   <div className="rally-card-grid">
    {spaces.map(space=>{
     const sm=spaceMember(space,user.id)!
     const readyCount=data.activities.filter(a=>
      a.spaceId===space.id&&
      a.status==='open'&&
      (a.assignedTo.length===0||a.assignedTo.includes(user.id))
     ).length
     const rank=space.members.length>1
      ? [...space.members]
        .sort((a,b)=>b.weekly-a.weekly)
        .findIndex(member=>member.memberId===user.id)+1
      : 0

     return <button
      className={`rally-card ${space.type}`}
      key={space.id}
      onClick={()=>{setSpaceId(space.id);setScreen('home')}}
     >
      <span className="rally-card-icon">{space.icon}</span>
      <div className="rally-card-main">
       <strong>{space.name}</strong>
       <small>{readyCount} ready{rank?` · #${rank} this week`:''}</small>
      </div>
      <div className="rally-card-points">
       <b>{sm.weekly}</b>
       <small>this week</small>
      </div>
      <span className="rally-card-arrow">→</span>
     </button>
    })}
   </div>
  </section>

  {(topTreat||topGoal)&&
   <section className="motivation-card">
    {topTreat?<>
     <div className="motivation-icon">{topTreat.icon}</div>
     <div className="motivation-copy">
      <p className="eyebrow">Your next reward</p>
      <h2>{topTreat.name}</h2>
      <small>{motivationSpace?.icon} {motivationSpace?.name}</small>
      <Progress
       value={spaceMember(motivationSpace!,user.id)?.balance||0}
       max={topTreat.points}
      />
      <b>{Math.max(0,topTreat.points-(spaceMember(motivationSpace!,user.id)?.balance||0))} points away</b>
     </div>
    </>:<>
     <div className="motivation-icon">{topGoal!.icon}</div>
     <div className="motivation-copy">
      <p className="eyebrow">You’re building toward</p>
      <h2>{topGoal!.name}</h2>
      <small>{motivationSpace?.icon} {motivationSpace?.name}</small>
      <Progress value={topGoal!.progress} max={topGoal!.target}/>
      <b>{Math.max(0,topGoal!.target-topGoal!.progress)} points to go</b>
     </div>
    </>}
   </section>
  }

  <section className="weekly-strip">
   <div><strong>{totalWeekly}</strong><span>points</span></div>
   <div><strong>{weeklyWins.length}</strong><span>wins this week</span></div>
   <div><strong>{activeDays}</strong><span>active {activeDays===1?'day':'days'}</span></div>
  </section>

  {recentWins.length>0&&
   <section className="panel recent-wins-panel">
    <div className="section-title">
     <div><p className="eyebrow">Recent wins</p><h2>Keep it going</h2></div>
    </div>
    {recentWins.map(history=>
     <div className="history-row" key={history.id}>
      <span>{data.spaces.find(s=>s.id===history.spaceId)?.icon||'✦'}</span>
      <div>
       <strong>{history.title}</strong>
       <small>{data.spaces.find(s=>s.id===history.spaceId)?.name} · {history.createdAt}</small>
      </div>
      <b>+{history.points}</b>
     </div>
    )}
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
   if(statusFilter==='ready'){
    return activity.status==='open'&&(
     activity.assignedTo.length===0||activity.assignedTo.includes(user.id)
    )
   }
   if(statusFilter==='waiting') return activity.status==='pending'
   if(statusFilter==='done') return activity.status==='complete'
   return activity.status!=='archived'
  })
  .sort((a,b)=>
   recurrencePriority(a.recurrence)-recurrencePriority(b.recurrence)||
   b.points-a.points
  )

 const createSpace=spaces.find(space=>space.id===createSpaceId)||spaces[0]

 return <>
  <section className="page-heading simple-heading">
   <div>
    <p className="eyebrow">Activities</p>
    <h1>What’s worth doing next?</h1>
    <p>Everything assigned to you, across every Rally.</p>
   </div>
  </section>

  <section className="activity-toolbar">
   <div className="segmented activity-segments">
    {([
     ['ready','Ready'],
     ['waiting','Waiting'],
     ['done','Done'],
     ['all','All']
    ] as const).map(([value,label])=>
     <button
      key={value}
      className={statusFilter===value?'active':''}
      onClick={()=>setStatusFilter(value)}
     >
      {label}
     </button>
    )}
   </div>

   <label className="inline-filter">
    <span>Rally</span>
    <select value={rallyFilter} onChange={e=>setRallyFilter(e.target.value)}>
     <option value="all">All Rallies</option>
     {spaces.map(space=><option value={space.id} key={space.id}>{space.icon} {space.name}</option>)}
    </select>
   </label>
  </section>

  <section className="panel global-activity-list">
   {filtered.length===0
    ? <div className="empty friendly-empty">
       {statusFilter==='ready'
        ? 'Nothing is waiting on you right now 🎉'
        : 'Nothing to show here yet.'
       }
      </div>
    : filtered.map(activity=>
       <ActivityCard
        key={activity.id}
        a={activity}
        data={data}
        user={user}
        complete={complete}
        approve={approve}
        sendBack={sendBack}
        showSpace
       />
      )
   }
  </section>

  {createSpace&&
   <details className="panel create-activity-shell">
    <summary>＋ Add activity</summary>
    <div className="create-rally-picker">
     <label>
      Which Rally?
      <select value={createSpace.id} onChange={e=>setCreateSpaceId(e.target.value)}>
       {spaces.map(space=><option value={space.id} key={space.id}>{space.icon} {space.name}</option>)}
      </select>
     </label>
    </div>
    <AddActivityForm
     key={createSpace.id}
     data={data}
     space={createSpace}
     user={user}
     update={update}
     note={note}
    />
   </details>
  }
 </>
}

function ActivityCard({a,data,user,complete,approve,sendBack,showSpace=false}:{a:Activity;data:AppData;user:Member;complete:(a:Activity)=>void;approve?:(a:Activity)=>void;sendBack?:(a:Activity)=>void;showSpace?:boolean}){
 const space=data.spaces.find(s=>s.id===a.spaceId)
 const canApprove=a.status==='pending'&&a.approverIds.includes(user.id)
 const isAssigned=a.assignedTo.length===0||a.assignedTo.includes(user.id)
 const mySpaceRole=space?.members.find(m=>m.memberId===user.id)?.role

 const canUndo=
  a.status==='complete'&&(
   a.completedBy===user.id||
   mySpaceRole==='Admin'||
   mySpaceRole==='Owner'
  )

 const assignedNames=a.assignedTo
  .map(id=>memberName(data,id))
  .filter(Boolean)

 const target=a.periodTarget||1
 const progress=a.periodProgress||0
 const completionText=a.approval
  ? 'Submit completion'
  : a.proofMode==='Required photo'
   ? 'Add proof & complete'
   : `Complete +${a.points}`

 return <article className={`activity rally9-activity ${a.status}`}>
  <span className="activity-icon">{a.icon}</span>
  <div className="activity-copy">
   <div className="activity-title-row">
    <strong>{a.name}</strong>
    {showSpace&&space&&<span className="space-badge">{space.icon} {space.name}</span>}
   </div>
   <small>{a.category} · {a.points} pts</small>
   <small className="activity-period">
    {target>1?a.periodLabel:a.recurrence}
   </small>
   {target>1&&
    <div className="mini-progress-wrap">
     <Progress value={progress} max={target}/>
    </div>
   }
   {!isAssigned&&a.status==='open'&&assignedNames.length>0&&
    <small className="assignment-note">For {assignedNames.join(', ')}</small>
   }
   {a.status==='complete'&&a.completedBy&&space&&space.members.length>1&&
    <small>Completed by {memberName(data,a.completedBy)}</small>
   }
  </div>

  <div className="activity-actions">
   {a.status==='open'&&isAssigned&&
    <button className="primary completion-button" onClick={()=>complete(a)}>
     {completionText}
    </button>
   }

   {canApprove&&<>
    <button className="primary completion-button" onClick={()=>approve?.(a)}>
     Approve +{a.points}
    </button>
    {a.proofUrl&&
     <button className="secondary" onClick={()=>window.open(a.proofUrl,'_blank')}>
      View proof
     </button>
    }
    <button className="secondary" onClick={()=>sendBack?.(a)}>
     Send back
    </button>
   </>}

   {a.status==='pending'&&!canApprove&&
    <span className="pending">Waiting for approval</span>
   }

   {a.status==='complete'&&<>
    {a.proofUrl&&
     <button className="secondary" onClick={()=>window.open(a.proofUrl,'_blank')}>
      View proof
     </button>
    }
    {canUndo
     ? <button className="secondary subtle-action" onClick={()=>complete(a)}>
        Undo
       </button>
     : <span className="complete">✓ Done</span>
    }
   </>}
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
 const points=suggestedPoints(name,category)

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

  const activityId=crypto.randomUUID()
  const a:Activity={
   id:activityId,
   spaceId:space.id,
   name:String(f.get('name')),
   icon:String(f.get('icon')||'✨'),
   category:String(f.get('category')||'Other'),
   points:Number(f.get('points')),
   recurrence:String(f.get('recurrence')),
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
   periodTarget:recurrenceTarget(String(f.get('recurrence'))),
   periodLabel:recurrenceProgressLabel(
    String(f.get('recurrence')),
    0,
    recurrenceTarget(String(f.get('recurrence')))
   )
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

  <div className="two">
   <label>
    How often?
    <select name="recurrence" defaultValue="Every day">
     <option>Every day</option>
     <option>Every week</option>
     <option>3x/week</option>
     <option>Every other week</option>
     <option>Twice/month</option>
     <option>Every 90 days</option>
     <option>One time</option>
    </select>
   </label>
   <label>
    Points
    <select name="points" defaultValue={String(points)} key={points}>
     {POINT_OPTIONS.map(point=><option value={point} key={point}>{point} points</option>)}
    </select>
   </label>
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

    <label className="check">
     <input type="checkbox" name="goals" defaultChecked/>
     Let these points contribute to this Rally’s active goals
    </label>
   </div>
  </details>

  <button className="primary add-activity-button">Add activity</button>
 </form>
}

function Activities({data,space,user,activities,complete,approve,sendBack,update,note}:{data:AppData;space:Space;user:Member;activities:Activity[];complete:(a:Activity)=>void;approve:(a:Activity)=>void;sendBack:(a:Activity)=>void;update:(d:AppData)=>void;note:(s:string)=>void}){
 const [filter,setFilter]=useState<'ready'|'waiting'|'done'|'all'>('ready')
 const canManage=['Owner','Admin'].includes(roleFor(space,user.id)||'')

 const filtered=activities.filter(activity=>{
  if(filter==='ready') return activity.status==='open'
  if(filter==='waiting') return activity.status==='pending'
  if(filter==='done') return activity.status==='complete'
  return activity.status!=='archived'
 })

 return <>
  <section className="page-heading simple-heading rally-page-heading">
   <div>
    <p className="eyebrow">Activities</p>
    <h1>Keep this Rally moving</h1>
    <p>Complete what’s yours. Everything else stays out of the way.</p>
   </div>
  </section>

  <div className="segmented activity-segments local-activity-filter">
   {([
    ['ready','Ready'],
    ['waiting','Waiting'],
    ['done','Done'],
    ['all','All']
   ] as const).map(([value,label])=>
    <button
     key={value}
     className={filter===value?'active':''}
     onClick={()=>setFilter(value)}
    >
     {label}
    </button>
   )}
  </div>

  <section className="panel">
   {filtered.length
    ? filtered.map(activity=>
       <ActivityCard
        key={activity.id}
        a={activity}
        data={data}
        user={user}
        complete={complete}
        approve={approve}
        sendBack={sendBack}
       />
      )
    : <div className="empty friendly-empty">Nothing to show here right now.</div>
   }
  </section>

  <details className="panel create-activity-shell">
   <summary>＋ Add activity</summary>
   <AddActivityForm
    data={data}
    space={space}
    user={user}
    update={update}
    note={note}
   />
  </details>

  {canManage&&
   <p className="admin-note">
    Need to pause, archive, restore, or delete something? Use Rally Settings.
   </p>
  }
 </>
}

function SpaceHome({data,space,user,activities,complete,approve,sendBack,setScreen}:{data:AppData;space:Space;user:Member;activities:Activity[];complete:(a:Activity)=>void;approve:(a:Activity)=>void;sendBack:(a:Activity)=>void;setScreen:(s:Screen)=>void}){
 const sm=spaceMember(space,user.id)!
 const leaders=[...space.members].sort((a,b)=>b.weekly-a.weekly)
 const ready=activities
  .filter(activity=>
   activity.status==='open'&&
   (activity.assignedTo.length===0||activity.assignedTo.includes(user.id))
  )
  .sort((a,b)=>recurrencePriority(a.recurrence)-recurrencePriority(b.recurrence))
  .slice(0,4)
 const approvals=activities.filter(activity=>
  activity.status==='pending'&&activity.approverIds.includes(user.id)
 )
 const priorityTreat=data.treats.find(treat=>
  treat.spaceId===space.id&&
  treat.status==='locked'&&
  treat.priorityFor.includes(user.id)
 )
 const activeGoal=data.goals
  .filter(goal=>goal.spaceId===space.id&&goal.status!=='archived'&&goal.status!=='celebrated')
  .sort((a,b)=>(b.progress/b.target)-(a.progress/a.target))[0]

 return <>
  <section className="space-overview-grid">
   <article className="overview-stat-card primary-stat">
    <small>Your points</small>
    <strong>{sm.balance}</strong>
    <span>{sm.weekly} earned this week</span>
   </article>
   <article className="overview-stat-card">
    <small>Ready now</small>
    <strong>{ready.length}</strong>
    <span>{ready.length===1?'activity':'activities'} for you</span>
   </article>
   {space.poolEnabled&&
    <article className="overview-stat-card">
     <small>Shared pool</small>
     <strong>{space.poolBalance}</strong>
     <span>Rally points</span>
    </article>
   }
  </section>

  {approvals.length>0&&
   <section className="attention-panel">
    <div className="section-title">
     <div><p className="eyebrow">Needs your attention</p><h2>Review a completion</h2></div>
    </div>
    {approvals.slice(0,2).map(activity=>
     <ActivityCard
      key={activity.id}
      a={activity}
      data={data}
      user={user}
      complete={complete}
      approve={approve}
      sendBack={sendBack}
     />
    )}
   </section>
  }

  <section className="panel">
   <div className="section-title">
    <div><p className="eyebrow">Up next</p><h2>{ready.length?'Ready for you':'All caught up 🎉'}</h2></div>
    <button onClick={()=>setScreen('activities')}>See activities →</button>
   </div>
   {ready.length
    ? ready.map(activity=>
       <ActivityCard
        key={activity.id}
        a={activity}
        data={data}
        user={user}
        complete={complete}
        approve={approve}
        sendBack={sendBack}
       />
      )
    : <div className="empty friendly-empty">Nothing else is waiting on you in this Rally.</div>
   }
  </section>

  {space.members.length>1&&space.weeklyLeaderboard&&
   <section className="panel compact-leaderboard">
    <div className="section-title">
     <div><p className="eyebrow">Weekly race</p><h2>Leaderboard 🏁</h2></div>
     <button onClick={()=>setScreen('leaderboard')}>Full leaderboard →</button>
    </div>
    {leaders.slice(0,4).map((member,index)=>
     <div className="compact-leader-row" key={member.memberId}>
      <span>{index===0?'👑':`#${index+1}`}</span>
      <Avatar member={data.members.find(item=>item.id===member.memberId)!}/>
      <strong>{memberName(data,member.memberId)}{member.memberId===user.id?' · You':''}</strong>
      <b>{member.weekly} pts</b>
     </div>
    )}
   </section>
  }

  <section className="overview-motivation-grid">
   {activeGoal&&
    <button className="overview-motivation-card goal-card" onClick={()=>setScreen('goals')}>
     <span>{activeGoal.icon}</span>
     <div>
      <p className="eyebrow">Goal</p>
      <h3>{activeGoal.name}</h3>
      <Progress value={activeGoal.progress} max={activeGoal.target}/>
      <small>{Math.max(0,activeGoal.target-activeGoal.progress)} points to go</small>
     </div>
     <b>→</b>
    </button>
   }

   {priorityTreat&&
    <button className="overview-motivation-card treat-card" onClick={()=>setScreen('treats')}>
     <span>{priorityTreat.icon}</span>
     <div>
      <p className="eyebrow">Top treat</p>
      <h3>{priorityTreat.name}</h3>
      <Progress value={sm.balance} max={priorityTreat.points}/>
      <small>{Math.max(0,priorityTreat.points-sm.balance)} points away</small>
     </div>
     <b>→</b>
    </button>
   }
  </section>

  {!activeGoal&&!priorityTreat&&
   <section className="panel gentle-prompt">
    <div>
     <p className="eyebrow">Make it motivating</p>
     <h2>Give these wins somewhere to go.</h2>
     <p>Add a goal or a treat when you want a little extra motivation.</p>
    </div>
    <div>
     <button className="secondary" onClick={()=>setScreen('goals')}>Add a goal</button>
     <button className="secondary" onClick={()=>setScreen('treats')}>Add a treat</button>
    </div>
   </section>
  }
 </>
}

function Leaderboard({data,space,user}:{data:AppData;space:Space;user:Member}){
 const leaders=[...space.members].sort((a,b)=>b.weekly-a.weekly);const max=Math.max(1,...leaders.map(x=>x.weekly));const me=leaders.find(x=>x.memberId===user.id)!;const leader=leaders[0];const catchup=Math.max(0,leader.weekly-me.weekly+1);const suggestion=data.activities.filter(a=>a.spaceId===space.id&&a.status==='open'&&a.assignedTo.includes(user.id)).sort((a,b)=>b.points-a.points)[0]
 return <><section className="race-hero"><div><p>🏁 WEEKLY RACE</p><h1>{leader.memberId===user.id?'You’re in first!':'Catch the leader'}</h1><span>{leader.memberId===user.id?`You’re ${leader.weekly-(leaders[1]?.weekly||0)} points ahead.`:`You need ${catchup} more points to take #1.`}</span></div><span className="trophy">🏆</span></section><section className="leaderboard">{leaders.map((m,i)=><article key={m.memberId} className={i===0?'winner':''}><span className="rank">{i===0?'👑':`#${i+1}`}</span><Avatar member={data.members.find(x=>x.id===m.memberId)!}/><div className="who"><strong>{memberName(data,m.memberId)}{m.memberId===user.id?' · You':''}</strong><small>{data.members.find(x=>x.id===m.memberId)?.tier} · {m.lifetime} space lifetime</small></div><div className="track"><i style={{width:`${Math.max(7,m.weekly/max*100)}%`}}/></div><b>{m.weekly} pts</b></article>)}</section>{leader.memberId!==user.id&&suggestion&&<section className="catchup"><span>⚡</span><div><strong>Fastest way to catch up</strong><p>Complete <b>{suggestion.name}</b> for +{suggestion.points} points.</p></div><button>Let’s go</button></section>}</>
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
  <section className="page-heading simple-heading rally-page-heading">
   <div>
    <p className="eyebrow">Goals</p>
    <h1>Build toward something that matters.</h1>
    <p>Activities that contribute to goals move these forward automatically.</p>
   </div>
  </section>

  {active.length===0
   ? <section className="panel empty-goal-state">
      <span>🎯</span>
      <div><h2>Nothing you’re building toward yet</h2><p>Add a goal when you want your everyday wins to add up to something bigger.</p></div>
     </section>
   : <section className="cards rally9-goal-grid">
      {active.map(g=>
       <article className={`goal rally9-goal ${g.status}`} key={g.id}>
        <span>{g.icon}</span>
        <div className="goal-copy">
         <p className="eyebrow">{g.status==='reached'?'You did it 🎉':'In progress'}</p>
         <h2>{g.name}</h2>
         <Progress value={g.progress} max={g.target}/>
         <div className="goal-progress-copy">
          <b>{g.progress.toLocaleString()} / {g.target.toLocaleString()}</b>
          <small>{Math.max(0,g.target-g.progress).toLocaleString()} points to go</small>
         </div>
         {g.status==='reached'&&
          <button className="primary" onClick={()=>celebrate(g)}>Celebrate this goal 🎉</button>
         }
        </div>
       </article>
      )}
     </section>
  }

  <details className="panel create-activity-shell goal-create-shell">
   <summary>＋ New goal</summary>
   <form className="form rally9-create-form" onSubmit={add}>
    <div className="two">
     <label>What are you working toward?<input name="name" required placeholder="Weekend getaway"/></label>
     <label>Icon<input name="icon" placeholder="🌴"/></label>
    </div>
    <label>
     Target
     <select name="target" defaultValue="1000">
      {[250,500,750,1000,1500,2000,2500,3000,5000].map(p=><option key={p} value={p}>{p.toLocaleString()} points</option>)}
     </select>
    </label>
    <button className="primary">Create goal</button>
   </form>
  </details>

  {celebrated.length>0&&
   <section className="panel celebration-shelf">
    <div className="section-title"><div><p className="eyebrow">Celebrated</p><h2>Goals you reached</h2></div></div>
    {celebrated.map(g=><div className="history-row" key={g.id}><span>{g.icon}</span><div><strong>{g.name}</strong><small>{g.target.toLocaleString()} point goal</small></div><b>✓</b></div>)}
   </section>
  }
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

  if(!window.confirm(`Get "${t.name}" for ${t.points} points?`)) return

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

  note('Treat obtained! 🎁')
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
  <section className="page-heading simple-heading rally-page-heading treat-page-heading">
   <div>
    <p className="eyebrow">Treat Yourself 🎁</p>
    <h1>Give your progress something fun to unlock.</h1>
    <p>Available points can be spent here without changing your lifetime progress.</p>
   </div>
   <div className="page-balance-badge">
    <strong>{sm.balance}</strong><span>available points</span>
   </div>
  </section>

  {locked.length===0
   ? <section className="panel empty-goal-state"><span>🎁</span><div><h2>No treats yet</h2><p>Add something small or big that would feel worth working toward.</p></div></section>
   : <section className="cards rally9-treat-grid">
      {[...locked]
       .sort((a,b)=>Number(b.priorityFor.includes(user.id))-Number(a.priorityFor.includes(user.id)))
       .map(t=>{
        const isPriority=t.priorityFor.includes(user.id)
        const canAfford=sm.balance>=t.points
        return <article className={`treat rally9-treat ${isPriority?'priority':''}`} key={t.id}>
         <span className="huge">{t.icon}</span>
         {isPriority&&<em>⭐ Top treat</em>}
         <h2>{t.name}</h2>
         {t.description&&<p>{t.description}</p>}
         {space.members.length>1&&t.assignedTo.length>0&&
          <small>For {t.assignedTo.map(id=>memberName(data,id)).join(', ')}</small>
         }
         <Progress value={sm.balance} max={t.points}/>
         <div className="treat-progress-copy">
          <b>{t.points} pts</b>
          <small>{canAfford?'Ready when you are 🎉':`${t.points-sm.balance} points away`}</small>
         </div>
         <div className="treat-actions">
          {!isPriority&&<button className="secondary" onClick={()=>priority(t)}>☆ Make top treat</button>}
          <button className="primary" disabled={!canAfford} onClick={()=>obtain(t)}>
           {canAfford?'Get this treat 🎉':'Keep going'}
          </button>
         </div>
        </article>
       })}
     </section>
  }

  <details className="panel create-activity-shell treat-create-shell">
   <summary>＋ New treat</summary>
   <form className="form rally9-create-form" onSubmit={add}>
    <div className="two">
     <label>Treat name<input name="name" required placeholder="Dinner out"/></label>
     <label>Icon<input name="icon" placeholder="🍝"/></label>
    </div>
    <label>Description<textarea name="description" placeholder="A fun thing to work toward."/></label>
    <label>
     Unlock at
     <select name="points" defaultValue="500">
      {[100,150,200,250,300,400,500,750,1000,1500,2000].map(p=><option key={p} value={p}>{p.toLocaleString()} points</option>)}
     </select>
    </label>
    {space.members.length>1&&
     <fieldset>
      <legend>Who is it for?</legend>
      <div className="people-options">
       {space.members.map(member=>
        <label className="check" key={member.memberId}>
         <input type="checkbox" name="assignedTo" value={member.memberId} defaultChecked={member.memberId===user.id}/>
         {member.memberId===user.id?'Me':memberName(data,member.memberId)}
        </label>
       )}
      </div>
     </fieldset>
    }
    <label className="check"><input type="checkbox" name="priority"/> Make this my top treat</label>
    <button className="primary">Create treat</button>
   </form>
  </details>

  {(data.rewardIdeas||[]).length>0&&
   <details className="panel inspiration-panel">
    <summary>Need inspiration?</summary>
    <div className="cards">
     {(data.rewardIdeas||[]).slice(0,6).map(idea=>
      <article className="treat inspiration-card" key={idea.id}>
       <p className="eyebrow">{idea.category}</p>
       <h2>{idea.title}</h2>
       <p>{idea.description}</p>
       {idea.suggestedPoints&&<small>Suggested: {idea.suggestedPoints} points</small>}
       <button className="secondary" onClick={()=>window.open(idea.destinationUrl,'_blank')}>Explore idea ↗</button>
      </article>
     )}
    </div>
   </details>
  }

  {obtained.length>0&&
   <section className="obtained celebration-shelf">
    <h2>Celebration shelf 🎉</h2>
    {obtained.map(t=><article key={t.id}><span>{t.icon}</span><div><strong>{t.name}</strong><small>{formatTimestamp(t.obtainedAt)}</small></div><b>✓</b></article>)}
   </section>
  }
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
  note('Invitation created. They’ll join when they sign in with that email.')
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
        <small>{a.category} · {a.points} points · {a.recurrence}</small>
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
   <article><small>Available</small><strong>{totalBalance}</strong><span>across Rallies</span></article>
   <article><small>This week</small><strong>{totalWeekly}</strong><span>points earned</span></article>
   <article><small>Your wins</small><strong>{totalCompleted}</strong><span>completed activities</span></article>
   <article><small>Rallies</small><strong>{spaces.length}</strong><span>spaces you’re in</span></article>
  </section>

  <section className="panel profile-menu-panel">
   <div className="section-title">
    <div><p className="eyebrow">Settings</p><h2>Your account</h2></div>
   </div>
   <div className="profile-menu-list">
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
     <p className="eyebrow">Competition</p>
     <h2>Default point experience</h2>
    </div>
   </div>

   <div className="segmented">
    {(['Competitive','Collaborative','Private'] as const).map(option=>
     <button
      className={prefs.competition===option?'active':''}
      key={option}
      onClick={()=>savePrefs({...prefs,competition:option})}
     >
      {option}
     </button>
    )}
   </div>

   <p className="settings-explainer">
    Individual Rally Spaces can still have their own leaderboard rules.
    This is your preferred account experience.
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

function Notifications({data,user,update,setSpaceId,setScreen}:{data:AppData;user:Member;update:(d:AppData)=>void;setSpaceId:(id:string)=>void;setScreen:(s:Screen)=>void}){
 const notes=data.notifications.filter(n=>n.recipientId===user.id)

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

  <section className="panel notification-feed">
   {notes.length===0&&<div className="empty friendly-empty">You’re all caught up.</div>}
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

