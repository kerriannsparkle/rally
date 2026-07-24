import { FormEvent, useMemo, useState } from 'react'

type Screen =
  | 'home'
  | 'activities'
  | 'rewards'
  | 'goals'
  | 'profile'
  | 'create'
  | 'subscription'
  | 'admin'

type Frequency = 'Daily' | 'Weekly' | 'Monthly' | 'Seasonal' | 'One-time'

type Member = {
  id: string
  name: string
  initials: string
  balance: number
  weeklyPoints: number
  weeklyCompletions: number
}

type Activity = {
  id: string
  name: string
  points: number
  frequency: Frequency
  assignedTo: string | 'anyone'
  category: string
  requiresApproval: boolean
  multiContributor: boolean
  maxContributions: number
  completionCount: number
  completedBy: string[]
}

type Reward = {
  id: string
  name: string
  cost: number
  affiliateUrl?: string
}

type Goal = {
  id: string
  name: string
  current: number
  target: number
}

type HistoryItem = {
  id: string
  label: string
  detail: string
  amount: number
  type: 'earn' | 'spend'
  createdAt: string
}

const STORAGE_KEY = 'rally-mvp-foundation-v1'

const seed = {
  members: [
    { id: 'kerriann', name: 'KerriAnn', initials: 'KA', balance: 420, weeklyPoints: 125, weeklyCompletions: 8 },
    { id: 'zak', name: 'Zak', initials: 'Z', balance: 385, weeklyPoints: 140, weeklyCompletions: 9 },
  ] satisfies Member[],
  activities: [
    {
      id: 'a1',
      name: 'Make the bed',
      points: 5,
      frequency: 'Daily' as Frequency,
      assignedTo: 'anyone' as const,
      category: 'Home',
      requiresApproval: false,
      multiContributor: false,
      maxContributions: 1,
      completionCount: 0,
      completedBy: [],
    },
    {
      id: 'a2',
      name: 'Feed Harley dinner',
      points: 5,
      frequency: 'Daily' as Frequency,
      assignedTo: 'anyone' as const,
      category: 'Pets',
      requiresApproval: false,
      multiContributor: false,
      maxContributions: 1,
      completionCount: 0,
      completedBy: [],
    },
    {
      id: 'a3',
      name: 'Complete laundry',
      points: 20,
      frequency: 'Weekly' as Frequency,
      assignedTo: 'anyone' as const,
      category: 'Home',
      requiresApproval: false,
      multiContributor: false,
      maxContributions: 1,
      completionCount: 0,
      completedBy: [],
    },
    {
      id: 'a4',
      name: 'Deep clean hardwood floors',
      points: 45,
      frequency: 'Seasonal' as Frequency,
      assignedTo: 'anyone' as const,
      category: 'Home',
      requiresApproval: true,
      multiContributor: false,
      maxContributions: 1,
      completionCount: 0,
      completedBy: [],
    },
    {
      id: 'a5',
      name: 'Contribute to vacation goal',
      points: 10,
      frequency: 'Monthly' as Frequency,
      assignedTo: 'anyone' as const,
      category: 'Goals',
      requiresApproval: false,
      multiContributor: true,
      maxContributions: 4,
      completionCount: 0,
      completedBy: [],
    },
  ] satisfies Activity[],
  rewards: [
    { id: 'r1', name: 'Choose dinner', cost: 100 },
    { id: 'r2', name: 'Coffee run', cost: 150 },
    { id: 'r3', name: 'Amazon wishlist item', cost: 500, affiliateUrl: 'https://www.amazon.com/' },
  ] satisfies Reward[],
  goals: [
    { id: 'g1', name: 'Greece vacation', current: 1450, target: 3000 },
    { id: 'g2', name: 'New living room piece', current: 320, target: 1200 },
  ] satisfies Goal[],
  history: [] satisfies HistoryItem[],
}

function loadState() {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value ? JSON.parse(value) : seed
  } catch {
    return seed
  }
}

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [loggedIn, setLoggedIn] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [data, setData] = useState(loadState)
  const [activeMemberId, setActiveMemberId] = useState('kerriann')
  const [toast, setToast] = useState('')
  const [createType, setCreateType] = useState<'activity' | 'reward' | 'goal'>('activity')

  const persist = (next: typeof data) => {
    setData(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const activeMember = data.members.find((m: Member) => m.id === activeMemberId) ?? data.members[0]

  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2400)
  }

  const completeActivity = (activity: Activity) => {
    const alreadyCompleted = activity.completedBy.includes(activeMember.id)
    const householdComplete = !activity.multiContributor && activity.completionCount >= 1
    const contributorLimitReached = activity.multiContributor && activity.completionCount >= activity.maxContributions

    if (alreadyCompleted || householdComplete || contributorLimitReached) {
      notify('This activity is already complete for the current period.')
      return
    }

    const updatedActivities = data.activities.map((item: Activity) =>
      item.id === activity.id
        ? {
            ...item,
            completionCount: item.completionCount + 1,
            completedBy: [...item.completedBy, activeMember.id],
          }
        : item,
    )

    const updatedMembers = data.members.map((member: Member) =>
      member.id === activeMember.id
        ? {
            ...member,
            balance: member.balance + activity.points,
            weeklyPoints: member.weeklyPoints + activity.points,
            weeklyCompletions: member.weeklyCompletions + 1,
          }
        : member,
    )

    const nextHistory: HistoryItem = {
      id: crypto.randomUUID(),
      label: activity.name,
      detail: `${activeMember.name} completed a ${activity.frequency.toLowerCase()} activity`,
      amount: activity.points,
      type: 'earn',
      createdAt: new Date().toLocaleString(),
    }

    persist({ ...data, activities: updatedActivities, members: updatedMembers, history: [nextHistory, ...data.history] })
    notify(`${activeMember.name} earned ${activity.points} points.`)
  }

  const redeemReward = (reward: Reward) => {
    if (activeMember.balance < reward.cost) {
      notify('Not enough points for this reward yet.')
      return
    }

    const updatedMembers = data.members.map((member: Member) =>
      member.id === activeMember.id ? { ...member, balance: member.balance - reward.cost } : member,
    )

    const nextHistory: HistoryItem = {
      id: crypto.randomUUID(),
      label: reward.name,
      detail: `${activeMember.name} redeemed a reward`,
      amount: reward.cost,
      type: 'spend',
      createdAt: new Date().toLocaleString(),
    }

    persist({ ...data, members: updatedMembers, history: [nextHistory, ...data.history] })
    notify(`${reward.name} redeemed.`)
  }

  const resetDemo = () => {
    persist(seed)
    notify('Demo data reset.')
  }

  if (!loggedIn) {
    return (
      <AuthScreen
        mode={authMode}
        setMode={setAuthMode}
        onSubmit={() => {
          setLoggedIn(true)
          notify(authMode === 'login' ? 'Welcome back to Rally.' : 'Your Rally account is ready.')
        }}
      />
    )
  }

  const titles: Record<Screen, string> = {
    home: 'Home',
    activities: 'Activities',
    rewards: 'Rewards',
    goals: 'Goals',
    profile: 'Profile',
    create: 'Create',
    subscription: 'Subscription',
    admin: 'Admin',
  }

  return (
    <div className="app-shell">
      {toast && <div className="toast">{toast}</div>}

      <header className="topbar">
        <button className="brand" onClick={() => setScreen('home')} aria-label="Go home">
          <span className="brand-mark">✦</span>
          <span>Rally</span>
        </button>
        <div className="top-actions">
          <select
            aria-label="Active member"
            value={activeMemberId}
            onChange={(event) => setActiveMemberId(event.target.value)}
          >
            {data.members.map((member: Member) => (
              <option key={member.id} value={member.id}>
                Acting as {member.name}
              </option>
            ))}
          </select>
          <button className="icon-button" onClick={() => setScreen('create')} title="Create something">
            +
          </button>
        </div>
      </header>

      <main>
        <section className="page-heading">
          <div>
            <p className="eyebrow">Williams-Hurt Household</p>
            <h1>{titles[screen]}</h1>
          </div>
          {screen !== 'create' && (
            <button className="primary-button" onClick={() => setScreen('create')}>
              + Create something
            </button>
          )}
        </section>

        {screen === 'home' && (
          <Home
            members={data.members}
            activities={data.activities}
            goals={data.goals}
            activeMember={activeMember}
            completeActivity={completeActivity}
            goTo={setScreen}
          />
        )}

        {screen === 'activities' && (
          <Activities
            activities={data.activities}
            members={data.members}
            activeMember={activeMember}
            completeActivity={completeActivity}
          />
        )}

        {screen === 'rewards' && (
          <Rewards rewards={data.rewards} activeMember={activeMember} redeemReward={redeemReward} />
        )}

        {screen === 'goals' && <Goals goals={data.goals} />}

        {screen === 'profile' && (
          <Profile
            member={activeMember}
            history={data.history}
            onSubscription={() => setScreen('subscription')}
            onAdmin={() => setScreen('admin')}
            onLogout={() => setLoggedIn(false)}
          />
        )}

        {screen === 'create' && (
          <CreateCenter
            type={createType}
            setType={setCreateType}
            data={data}
            persist={persist}
            notify={notify}
          />
        )}

        {screen === 'subscription' && (
          <Subscription activePlan="Free" notify={notify} />
        )}

        {screen === 'admin' && (
          <Admin data={data} persist={persist} notify={notify} resetDemo={resetDemo} />
        )}
      </main>

      <nav className="bottom-nav" aria-label="Primary navigation">
        {[
          ['home', '⌂', 'Home'],
          ['activities', '✓', 'Activities'],
          ['rewards', '🎁', 'Rewards'],
          ['goals', '◎', 'Goals'],
          ['profile', '☺', 'Profile'],
        ].map(([id, icon, label]) => (
          <button
            key={id}
            className={screen === id ? 'active' : ''}
            onClick={() => setScreen(id as Screen)}
          >
            <span>{icon}</span>
            <small>{label}</small>
          </button>
        ))}
      </nav>
    </div>
  )
}

function AuthScreen({
  mode,
  setMode,
  onSubmit,
}: {
  mode: 'login' | 'signup'
  setMode: (mode: 'login' | 'signup') => void
  onSubmit: () => void
}) {
  const submit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit()
  }

  return (
    <div className="auth-page">
      <section className="auth-hero">
        <div className="auth-logo"><span>✦</span> Rally</div>
        <p className="eyebrow">Accomplish more. Together.</p>
        <h1>Turn everyday effort into shared progress.</h1>
        <p>
          Activities, points, rewards, shared goals, and friendly accountability for households and teams.
        </p>
        <div className="hero-stack">
          <div>✓ Flexible daily, weekly, monthly, seasonal, and one-time activities</div>
          <div>✓ Shared rewards and group goals</div>
          <div>✓ Designed for families, couples, roommates, and teams</div>
        </div>
      </section>
      <section className="auth-card">
        <div className="segmented">
          <button className={mode === 'login' ? 'selected' : ''} onClick={() => setMode('login')}>Log in</button>
          <button className={mode === 'signup' ? 'selected' : ''} onClick={() => setMode('signup')}>Sign up</button>
        </div>
        <h2>{mode === 'login' ? 'Welcome back' : 'Create your Rally account'}</h2>
        <form onSubmit={submit}>
          {mode === 'signup' && <label>Full name<input required placeholder="KerriAnn Williams-Hurt" /></label>}
          <label>Email<input required type="email" placeholder="you@example.com" /></label>
          <label>Password<input required type="password" minLength={6} placeholder="••••••••" /></label>
          <button className="primary-button full" type="submit">
            {mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>
        <button className="text-button" onClick={() => alert('Password reset email would be sent here.')}>
          Forgot password?
        </button>
        <p className="helper">Demo mode: any valid email and 6-character password will work.</p>
      </section>
    </div>
  )
}

function Home({
  members,
  activities,
  goals,
  activeMember,
  completeActivity,
  goTo,
}: {
  members: Member[]
  activities: Activity[]
  goals: Goal[]
  activeMember: Member
  completeActivity: (activity: Activity) => void
  goTo: (screen: Screen) => void
}) {
  return (
    <>
      <section className="member-grid">
        {members.map((member) => (
          <article className="member-card" key={member.id}>
            <div className="avatar">{member.initials}</div>
            <div>
              <strong>{member.name}</strong>
              <p>{member.balance} available points</p>
            </div>
            <div className="member-stats">
              <span>+{member.weeklyPoints} this week</span>
              <span>{member.weeklyCompletions} completed</span>
            </div>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="panel wide">
          <div className="panel-heading">
            <div><p className="eyebrow">Current period</p><h2>Activities</h2></div>
            <button className="text-button" onClick={() => goTo('activities')}>View all</button>
          </div>
          <div className="activity-list">
            {activities.slice(0, 5).map((activity) => {
              const complete = !activity.multiContributor
                ? activity.completionCount >= 1
                : activity.completionCount >= activity.maxContributions
              return (
                <button
                  className={`activity-row ${complete ? 'completed' : ''}`}
                  key={activity.id}
                  onClick={() => completeActivity(activity)}
                >
                  <span className="check">{complete ? '✓' : ''}</span>
                  <span className="activity-copy">
                    <strong>{activity.name}</strong>
                    <small>{activity.frequency} · {activity.category} · {activity.assignedTo === 'anyone' ? 'Anyone' : activity.assignedTo}</small>
                  </span>
                  <span className="points">+{activity.points}</span>
                </button>
              )
            })}
          </div>
        </article>

        <article className="panel">
          <p className="eyebrow">Your balance</p>
          <h2>{activeMember.balance} points</h2>
          <p>Keep completing activities or choose a reward.</p>
          <button className="secondary-button full" onClick={() => goTo('rewards')}>Browse rewards</button>
        </article>

        <article className="panel">
          <p className="eyebrow">Shared goal</p>
          <h2>{goals[0].name}</h2>
          <Progress value={goals[0].current} max={goals[0].target} />
          <p>${goals[0].current.toLocaleString()} of ${goals[0].target.toLocaleString()}</p>
          <button className="secondary-button full" onClick={() => goTo('goals')}>View goals</button>
        </article>
      </section>
    </>
  )
}

function Activities({
  activities,
  members,
  activeMember,
  completeActivity,
}: {
  activities: Activity[]
  members: Member[]
  activeMember: Member
  completeActivity: (activity: Activity) => void
}) {
  const [frequency, setFrequency] = useState<'All' | Frequency>('All')
  const filtered = frequency === 'All' ? activities : activities.filter((a) => a.frequency === frequency)

  return (
    <section className="panel">
      <div className="filter-row">
        {(['All', 'Daily', 'Weekly', 'Monthly', 'Seasonal', 'One-time'] as const).map((item) => (
          <button key={item} className={frequency === item ? 'chip selected' : 'chip'} onClick={() => setFrequency(item)}>
            {item}
          </button>
        ))}
      </div>
      <div className="activity-list">
        {filtered.map((activity) => {
          const assignedName =
            activity.assignedTo === 'anyone'
              ? 'Anyone'
              : members.find((m) => m.id === activity.assignedTo)?.name ?? 'Member'
          const doneForHousehold = !activity.multiContributor && activity.completionCount >= 1
          const doneForMember = activity.completedBy.includes(activeMember.id)
          const fullyDone = doneForHousehold || activity.completionCount >= activity.maxContributions

          return (
            <article className={`activity-row static ${fullyDone ? 'completed' : ''}`} key={activity.id}>
              <button className="check" onClick={() => completeActivity(activity)}>{fullyDone ? '✓' : ''}</button>
              <div className="activity-copy">
                <strong>{activity.name}</strong>
                <small>
                  {activity.frequency} · {assignedName} · {activity.requiresApproval ? 'Approval required' : 'No approval'}
                </small>
                {activity.multiContributor && (
                  <small>{activity.completionCount}/{activity.maxContributions} contributions this period{doneForMember ? ' · You contributed' : ''}</small>
                )}
              </div>
              <span className="points">+{activity.points}</span>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function Rewards({
  rewards,
  activeMember,
  redeemReward,
}: {
  rewards: Reward[]
  activeMember: Member
  redeemReward: (reward: Reward) => void
}) {
  return (
    <>
      <div className="balance-banner">
        <span>{activeMember.name}'s available balance</span>
        <strong>{activeMember.balance} points</strong>
      </div>
      <section className="card-grid">
        {rewards.map((reward) => (
          <article className="reward-card" key={reward.id}>
            <div className="reward-icon">{reward.affiliateUrl ? '🛍️' : '🎁'}</div>
            <h2>{reward.name}</h2>
            <p>{reward.cost} points</p>
            <div className="button-stack">
              <button className="primary-button full" onClick={() => redeemReward(reward)}>Redeem</button>
              {reward.affiliateUrl && (
                <button
                  className="secondary-button full"
                  onClick={() => window.open(reward.affiliateUrl, '_blank', 'noopener,noreferrer')}
                >
                  Shop affiliate link
                </button>
              )}
            </div>
          </article>
        ))}
      </section>
    </>
  )
}

function Goals({ goals }: { goals: Goal[] }) {
  return (
    <section className="card-grid">
      {goals.map((goal) => (
        <article className="goal-card" key={goal.id}>
          <div className="goal-icon">◎</div>
          <h2>{goal.name}</h2>
          <Progress value={goal.current} max={goal.target} />
          <p>${goal.current.toLocaleString()} of ${goal.target.toLocaleString()}</p>
          <button className="secondary-button full" onClick={() => alert('Goal details opened.')}>View details</button>
        </article>
      ))}
    </section>
  )
}

function Profile({
  member,
  history,
  onSubscription,
  onAdmin,
  onLogout,
}: {
  member: Member
  history: HistoryItem[]
  onSubscription: () => void
  onAdmin: () => void
  onLogout: () => void
}) {
  return (
    <section className="profile-grid">
      <article className="panel profile-card">
        <div className="avatar large">{member.initials}</div>
        <h2>{member.name}</h2>
        <p>{member.balance} available points</p>
        <button className="secondary-button full" onClick={() => alert('Profile editor opened.')}>Edit profile</button>
        <button className="secondary-button full" onClick={onSubscription}>Manage subscription</button>
        <button className="secondary-button full" onClick={onAdmin}>Household admin</button>
        <button className="danger-button full" onClick={onLogout}>Log out</button>
      </article>

      <article className="panel">
        <div className="panel-heading"><h2>Recent history</h2></div>
        {history.length === 0 ? (
          <p className="empty">Complete an activity or redeem a reward to create history.</p>
        ) : (
          <div className="history-list">
            {history.slice(0, 8).map((item) => (
              <div className="history-item" key={item.id}>
                <div><strong>{item.label}</strong><small>{item.detail}<br />{item.createdAt}</small></div>
                <span className={item.type === 'earn' ? 'earn' : 'spend'}>
                  {item.type === 'earn' ? '+' : '-'}{item.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  )
}

function CreateCenter({
  type,
  setType,
  data,
  persist,
  notify,
}: {
  type: 'activity' | 'reward' | 'goal'
  setType: (type: 'activity' | 'reward' | 'goal') => void
  data: any
  persist: (data: any) => void
  notify: (message: string) => void
}) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)

    if (type === 'activity') {
      const activity: Activity = {
        id: crypto.randomUUID(),
        name: String(form.get('name')),
        points: Number(form.get('points')),
        frequency: form.get('frequency') as Frequency,
        assignedTo: String(form.get('assignedTo')),
        category: String(form.get('category')),
        requiresApproval: form.get('requiresApproval') === 'on',
        multiContributor: form.get('multiContributor') === 'on',
        maxContributions: Number(form.get('maxContributions') || 1),
        completionCount: 0,
        completedBy: [],
      }
      persist({ ...data, activities: [...data.activities, activity] })
    }

    if (type === 'reward') {
      const reward: Reward = {
        id: crypto.randomUUID(),
        name: String(form.get('name')),
        cost: Number(form.get('cost')),
        affiliateUrl: String(form.get('affiliateUrl') || ''),
      }
      persist({ ...data, rewards: [...data.rewards, reward] })
    }

    if (type === 'goal') {
      const goal: Goal = {
        id: crypto.randomUUID(),
        name: String(form.get('name')),
        current: Number(form.get('current') || 0),
        target: Number(form.get('target')),
      }
      persist({ ...data, goals: [...data.goals, goal] })
    }

    event.currentTarget.reset()
    notify(`${type[0].toUpperCase() + type.slice(1)} created.`)
  }

  return (
    <section className="create-layout">
      <aside className="create-menu">
        <button className={type === 'activity' ? 'selected' : ''} onClick={() => setType('activity')}>✓ Activity</button>
        <button className={type === 'reward' ? 'selected' : ''} onClick={() => setType('reward')}>🎁 Reward</button>
        <button className={type === 'goal' ? 'selected' : ''} onClick={() => setType('goal')}>◎ Shared goal</button>
      </aside>
      <form className="panel form-card" onSubmit={submit}>
        <h2>Create {type}</h2>
        <label>Name<input name="name" required placeholder={`Name your ${type}`} /></label>

        {type === 'activity' && (
          <>
            <div className="two-column">
              <label>Points<input name="points" type="number" min="1" required defaultValue="10" /></label>
              <label>Frequency
                <select name="frequency" defaultValue="Daily">
                  <option>Daily</option><option>Weekly</option><option>Monthly</option><option>Seasonal</option><option>One-time</option>
                </select>
              </label>
            </div>
            <div className="two-column">
              <label>Category<input name="category" required defaultValue="Home" /></label>
              <label>Assigned to
                <select name="assignedTo" defaultValue="anyone">
                  <option value="anyone">Anyone</option>
                  {data.members.map((member: Member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                </select>
              </label>
            </div>
            <label className="checkbox"><input type="checkbox" name="requiresApproval" /> Requires approval</label>
            <label className="checkbox"><input type="checkbox" name="multiContributor" /> Allow multiple contributors</label>
            <label>Maximum contributions per period<input name="maxContributions" type="number" min="1" defaultValue="1" /></label>
          </>
        )}

        {type === 'reward' && (
          <>
            <label>Point cost<input name="cost" type="number" min="1" required defaultValue="100" /></label>
            <label>Affiliate URL<input name="affiliateUrl" type="url" placeholder="https://www.amazon.com/..." /></label>
          </>
        )}

        {type === 'goal' && (
          <>
            <div className="two-column">
              <label>Current amount<input name="current" type="number" min="0" defaultValue="0" /></label>
              <label>Target amount<input name="target" type="number" min="1" required defaultValue="1000" /></label>
            </div>
          </>
        )}

        <button className="primary-button" type="submit">Create {type}</button>
      </form>
    </section>
  )
}

function Subscription({ activePlan, notify }: { activePlan: string; notify: (message: string) => void }) {
  const plans = [
    { name: 'Free', price: '$0', features: ['1 household', '2 members', 'Core activities and rewards'] },
    { name: 'Plus', price: '$7/mo', features: ['Unlimited members', 'Photo proof', 'Advanced goals and history'] },
    { name: 'Family', price: '$12/mo', features: ['Multiple households', 'Challenges', 'Premium reward marketplace'] },
  ]
  return (
    <section className="card-grid pricing">
      {plans.map((plan) => (
        <article className={`pricing-card ${plan.name === activePlan ? 'current' : ''}`} key={plan.name}>
          <p className="eyebrow">{plan.name === activePlan ? 'Current plan' : 'Upgrade option'}</p>
          <h2>{plan.name}</h2>
          <div className="price">{plan.price}</div>
          <ul>{plan.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul>
          <button
            className={plan.name === activePlan ? 'secondary-button full' : 'primary-button full'}
            onClick={() => notify(plan.name === activePlan ? 'You are already on this plan.' : `${plan.name} checkout would open through Stripe.`)}
          >
            {plan.name === activePlan ? 'Current plan' : `Choose ${plan.name}`}
          </button>
        </article>
      ))}
    </section>
  )
}

function Admin({
  data,
  persist,
  notify,
  resetDemo,
}: {
  data: any
  persist: (data: any) => void
  notify: (message: string) => void
  resetDemo: () => void
}) {
  const deleteActivity = (id: string) => {
    persist({ ...data, activities: data.activities.filter((a: Activity) => a.id !== id) })
    notify('Activity deleted.')
  }

  return (
    <section className="admin-grid">
      <article className="panel">
        <div className="panel-heading"><h2>Household members</h2><button className="text-button" onClick={() => alert('Invitation flow opened.')}>Invite member</button></div>
        {data.members.map((member: Member) => (
          <div className="admin-row" key={member.id}>
            <span><strong>{member.name}</strong><small>{member.balance} points</small></span>
            <button className="text-button" onClick={() => alert(`Editing ${member.name}`)}>Edit</button>
          </div>
        ))}
      </article>
      <article className="panel">
        <div className="panel-heading"><h2>Activity controls</h2></div>
        {data.activities.map((activity: Activity) => (
          <div className="admin-row" key={activity.id}>
            <span><strong>{activity.name}</strong><small>{activity.frequency} · {activity.points} points</small></span>
            <div>
              <button className="text-button" onClick={() => alert(`Editing ${activity.name}`)}>Edit</button>
              <button className="danger-text" onClick={() => deleteActivity(activity.id)}>Delete</button>
            </div>
          </div>
        ))}
      </article>
      <article className="panel">
        <h2>Demo controls</h2>
        <p>Reset all browser-stored prototype data to the original sample.</p>
        <button className="danger-button" onClick={resetDemo}>Reset demo data</button>
      </article>
    </section>
  )
}

function Progress({ value, max }: { value: number; max: number }) {
  const percentage = Math.min(100, Math.round((value / max) * 100))
  return <div className="progress"><span style={{ width: `${percentage}%` }} /></div>
}

export default App
