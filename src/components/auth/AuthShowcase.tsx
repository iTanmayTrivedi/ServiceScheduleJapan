import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Clock, Star, Bell, Users, TrendingUp, Check, ChevronRight, Sparkles, Calendar, X } from 'lucide-react';

const TABS = ['Overview', 'Schedule', 'Insights'] as const;
type Tab = typeof TABS[number];

const APPOINTMENTS = [
  { name: 'Dr. Sarah Chen', time: '10:00 AM', status: 'confirmed', color: 'hsl(152,60%,42%)' },
  { name: 'Mike Johnson', time: '11:30 AM', status: 'pending', color: 'hsl(38,92%,50%)' },
  { name: 'Team Sync', time: '2:00 PM', status: 'confirmed', color: 'hsl(210,92%,55%)' },
  { name: 'Jane Smith', time: '3:30 PM', status: 'new', color: 'hsl(270,60%,60%)' },
];

const CHECKLIST = [
  { label: 'Set up business hours', done: true },
  { label: 'Add team members', done: true },
  { label: 'Configure services', done: true },
  { label: 'Enable notifications', done: false },
  { label: 'Launch booking page', done: false },
];

export default function AuthShowcase() {
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [checklist, setChecklist] = useState(CHECKLIST);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [selectedAppt, setSelectedAppt] = useState<number | null>(null);

  const toggleCheck = (idx: number) => {
    setChecklist(prev => prev.map((item, i) => i === idx ? { ...item, done: !item.done } : item));
  };

  const completedCount = checklist.filter(c => c.done).length;

  return (
    <div className="hidden md:flex flex-1 items-center justify-center relative overflow-hidden bg-[hsl(220,25%,9%)] border-l border-[hsl(220,20%,14%)]">
      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(hsl(210,20%,96%) 1px, transparent 1px), linear-gradient(90deg, hsl(210,20%,96%) 1px, transparent 1px)',
        backgroundSize: '48px 48px'
      }} />

      {/* Glow orb */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-[hsl(175,70%,42%)] opacity-[0.04] blur-[100px]" />

      <div className="relative w-full max-w-[540px] px-6">
        {/* Tab switcher */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex rounded-xl border border-[hsl(220,20%,16%)] bg-[hsl(220,25%,10%)] p-1 mb-6 w-fit mx-auto"
        >
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setExpandedCard(null); }}
              className={`relative rounded-lg px-4 py-1.5 text-xs font-medium transition-all ${
                activeTab === tab
                  ? 'text-white'
                  : 'text-[hsl(220,10%,50%)] hover:text-[hsl(210,20%,80%)]'
              }`}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="activeShowcaseTab"
                  className="absolute inset-0 rounded-lg bg-[hsl(220,20%,16%)]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab}</span>
            </button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          {activeTab === 'Overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 gap-3"
            >
              {/* Stats */}
              <InteractiveCard
                id="stats"
                expanded={expandedCard}
                onToggle={setExpandedCard}
                icon={<BarChart3 className="h-4 w-4 text-[hsl(175,70%,42%)]" />}
                iconBg="hsl(175,70%,42%)"
                title="Analytics"
                preview={
                  <>
                    <p className="text-xl font-bold text-[hsl(210,20%,96%)]">2,847</p>
                    <p className="text-[10px] text-[hsl(220,10%,50%)]">Appointments this month</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3 text-[hsl(152,60%,42%)]" />
                      <span className="text-[10px] text-[hsl(152,60%,42%)]">+12.5%</span>
                    </div>
                  </>
                }
                detail={
                  <div className="space-y-2 mt-2">
                    {[{ label: 'Completed', value: 2341, pct: 82 }, { label: 'Cancelled', value: 198, pct: 7 }, { label: 'No-show', value: 89, pct: 3 }].map(s => (
                      <div key={s.label}>
                        <div className="flex justify-between text-[10px] mb-0.5">
                          <span className="text-[hsl(220,10%,55%)]">{s.label}</span>
                          <span className="text-[hsl(210,20%,80%)]">{s.value}</span>
                        </div>
                        <div className="h-1 rounded-full bg-[hsl(220,20%,16%)] overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${s.pct}%` }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className="h-full rounded-full bg-[hsl(175,70%,42%)]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                }
              />

              {/* Rating - interactive stars */}
              <InteractiveCard
                id="rating"
                expanded={expandedCard}
                onToggle={setExpandedCard}
                icon={<Star className="h-4 w-4 text-[hsl(38,92%,50%)]" />}
                iconBg="hsl(38,92%,50%)"
                title="Ratings"
                preview={
                  <>
                    <div className="flex items-baseline gap-1.5">
                      <p className="text-xl font-bold text-[hsl(210,20%,96%)]">4.9</p>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className="h-3 w-3 fill-[hsl(38,92%,50%)] text-[hsl(38,92%,50%)]" />
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] text-[hsl(220,10%,50%)]">1,284 reviews</p>
                  </>
                }
                detail={
                  <div className="mt-2">
                    <p className="text-[10px] text-[hsl(220,10%,55%)] mb-2">Try rating:</p>
                    <div className="flex gap-1 justify-center">
                      {[1,2,3,4,5].map(s => (
                        <button
                          key={s}
                          onMouseEnter={() => setHoveredStar(s)}
                          onMouseLeave={() => setHoveredStar(0)}
                          onClick={() => setSelectedRating(s)}
                          className="transition-transform hover:scale-125"
                        >
                          <Star className={`h-5 w-5 transition-colors ${
                            s <= (hoveredStar || selectedRating)
                              ? 'fill-[hsl(38,92%,50%)] text-[hsl(38,92%,50%)]'
                              : 'text-[hsl(220,20%,20%)]'
                          }`} />
                        </button>
                      ))}
                    </div>
                    {selectedRating > 0 && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[10px] text-[hsl(175,70%,42%)] text-center mt-1.5"
                      >
                        {selectedRating === 5 ? '⭐ Excellent!' : selectedRating >= 4 ? '👍 Great!' : selectedRating >= 3 ? '😊 Good' : '🙏 Thanks for feedback'}
                      </motion.p>
                    )}
                  </div>
                }
              />

              {/* Team */}
              <InteractiveCard
                id="team"
                expanded={expandedCard}
                onToggle={setExpandedCard}
                icon={<Users className="h-4 w-4 text-[hsl(270,60%,60%)]" />}
                iconBg="hsl(270,60%,50%)"
                title="Team"
                preview={
                  <div className="flex -space-x-2 mt-1">
                    {[
                      { bg: 'bg-[hsl(175,70%,42%)]', initials: 'SC' },
                      { bg: 'bg-[hsl(38,92%,50%)]', initials: 'MJ' },
                      { bg: 'bg-[hsl(210,92%,55%)]', initials: 'JD' },
                      { bg: 'bg-[hsl(270,60%,50%)]', initials: 'AK' },
                    ].map((m, i) => (
                      <div key={i} className={`h-7 w-7 rounded-full ${m.bg} border-2 border-[hsl(220,25%,11%)] flex items-center justify-center text-[9px] font-bold text-white`}>
                        {m.initials}
                      </div>
                    ))}
                    <div className="h-7 w-7 rounded-full bg-[hsl(220,20%,16%)] border-2 border-[hsl(220,25%,11%)] flex items-center justify-center text-[9px] text-[hsl(220,10%,50%)]">+5</div>
                  </div>
                }
                detail={
                  <div className="space-y-1.5 mt-2">
                    {['Sarah Chen — Admin', 'Mike Johnson — Staff', 'Jane Doe — Staff', 'Alex Kim — Staff'].map((m, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-md bg-[hsl(220,25%,14%)] px-2 py-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-[hsl(152,60%,42%)]" />
                        <span className="text-[10px] text-[hsl(210,20%,80%)]">{m}</span>
                      </div>
                    ))}
                  </div>
                }
              />

              {/* Notifications */}
              <InteractiveCard
                id="notifs"
                expanded={expandedCard}
                onToggle={setExpandedCard}
                icon={<Bell className="h-4 w-4 text-[hsl(152,60%,42%)]" />}
                iconBg="hsl(152,60%,42%)"
                title="Activity"
                preview={
                  <div className="space-y-1.5 mt-1">
                    {['Booking confirmed', 'Rating ★★★★★', 'Badge earned'].map((n, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <div className={`h-1.5 w-1.5 rounded-full ${i === 0 ? 'bg-[hsl(175,70%,42%)]' : i === 1 ? 'bg-[hsl(38,92%,50%)]' : 'bg-[hsl(152,60%,42%)]'}`} />
                        <span className="text-[10px] text-[hsl(210,20%,80%)]">{n}</span>
                      </div>
                    ))}
                  </div>
                }
                detail={
                  <div className="space-y-1.5 mt-2">
                    {[
                      { text: 'New booking from Jane Smith', time: '2 min ago', color: 'hsl(175,70%,42%)' },
                      { text: '5-star review received', time: '15 min ago', color: 'hsl(38,92%,50%)' },
                      { text: 'Gold badge unlocked', time: '1 hr ago', color: 'hsl(270,60%,60%)' },
                      { text: 'Staff schedule updated', time: '3 hrs ago', color: 'hsl(210,92%,55%)' },
                    ].map((n, i) => (
                      <div key={i} className="flex items-start gap-2 rounded-md bg-[hsl(220,25%,14%)] px-2 py-1.5">
                        <div className="h-1.5 w-1.5 rounded-full mt-1 shrink-0" style={{ background: n.color }} />
                        <div>
                          <p className="text-[10px] text-[hsl(210,20%,80%)]">{n.text}</p>
                          <p className="text-[9px] text-[hsl(220,10%,40%)]">{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                }
              />
            </motion.div>
          )}

          {activeTab === 'Schedule' && (
            <motion.div
              key="schedule"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-[hsl(220,20%,16%)] bg-[hsl(220,25%,11%)] p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[hsl(175,70%,42%)]" />
                  <span className="text-sm font-medium text-[hsl(210,20%,96%)]">Today's Schedule</span>
                </div>
                <span className="text-[10px] text-[hsl(220,10%,50%)]">{APPOINTMENTS.length} appointments</span>
              </div>
              <div className="space-y-2">
                {APPOINTMENTS.map((appt, i) => (
                  <motion.button
                    key={i}
                    onClick={() => setSelectedAppt(selectedAppt === i ? null : i)}
                    className={`w-full text-left rounded-xl border transition-all ${
                      selectedAppt === i
                        ? 'border-[hsl(175,70%,42%)/0.4] bg-[hsl(220,25%,13%)]'
                        : 'border-[hsl(220,20%,16%)] bg-[hsl(220,25%,14%)] hover:bg-[hsl(220,25%,15%)]'
                    } p-3`}
                    layout
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full shrink-0" style={{ background: appt.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[hsl(210,20%,96%)]">{appt.name}</p>
                        <p className="text-[10px] text-[hsl(220,10%,50%)]">{appt.time}</p>
                      </div>
                      <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full ${
                        appt.status === 'confirmed' ? 'bg-[hsl(152,60%,42%)/0.15] text-[hsl(152,60%,42%)]'
                        : appt.status === 'pending' ? 'bg-[hsl(38,92%,50%)/0.15] text-[hsl(38,92%,50%)]'
                        : 'bg-[hsl(210,92%,55%)/0.15] text-[hsl(210,92%,55%)]'
                      }`}>
                        {appt.status}
                      </span>
                      <ChevronRight className={`h-3 w-3 text-[hsl(220,10%,40%)] transition-transform ${selectedAppt === i ? 'rotate-90' : ''}`} />
                    </div>
                    <AnimatePresence>
                      {selectedAppt === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-2.5 mt-2.5 border-t border-[hsl(220,20%,18%)] grid grid-cols-2 gap-2">
                            <div className="rounded-lg bg-[hsl(220,25%,11%)] p-2 text-center">
                              <p className="text-[9px] text-[hsl(220,10%,50%)]">Service</p>
                              <p className="text-[10px] text-[hsl(210,20%,90%)] font-medium">Consultation</p>
                            </div>
                            <div className="rounded-lg bg-[hsl(220,25%,11%)] p-2 text-center">
                              <p className="text-[9px] text-[hsl(220,10%,50%)]">Duration</p>
                              <p className="text-[10px] text-[hsl(210,20%,90%)] font-medium">30 min</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'Insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              {/* Progress checklist */}
              <div className="rounded-2xl border border-[hsl(220,20%,16%)] bg-[hsl(220,25%,11%)] p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[hsl(175,70%,42%)]" />
                    <span className="text-sm font-medium text-[hsl(210,20%,96%)]">Setup Progress</span>
                  </div>
                  <span className="text-[10px] font-medium text-[hsl(175,70%,42%)]">{completedCount}/{checklist.length}</span>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 rounded-full bg-[hsl(220,20%,16%)] mb-3 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[hsl(175,70%,42%)] to-[hsl(175,70%,52%)]"
                    animate={{ width: `${(completedCount / checklist.length) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  />
                </div>
                <div className="space-y-1.5">
                  {checklist.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => toggleCheck(i)}
                      className="flex items-center gap-2.5 w-full rounded-lg px-2 py-1.5 hover:bg-[hsl(220,25%,14%)] transition-colors group text-left"
                    >
                      <div className={`h-4 w-4 rounded-full border flex items-center justify-center transition-all ${
                        item.done
                          ? 'bg-[hsl(175,70%,42%)] border-[hsl(175,70%,42%)]'
                          : 'border-[hsl(220,20%,25%)] group-hover:border-[hsl(175,70%,42%)/0.5]'
                      }`}>
                        {item.done && <Check className="h-2.5 w-2.5 text-white" />}
                      </div>
                      <span className={`text-[11px] transition-colors ${
                        item.done ? 'text-[hsl(220,10%,45%)] line-through' : 'text-[hsl(210,20%,80%)]'
                      }`}>
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mini bar chart */}
              <div className="rounded-2xl border border-[hsl(220,20%,16%)] bg-[hsl(220,25%,11%)] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="h-4 w-4 text-[hsl(210,92%,55%)]" />
                  <span className="text-sm font-medium text-[hsl(210,20%,96%)]">Weekly Bookings</span>
                </div>
                <div className="flex items-end gap-2 h-24">
                  {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 4 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: 0.1 * i, duration: 0.6, ease: 'easeOut' }}
                      style={{ minHeight: 8 }}
                      className="flex-1 rounded-md cursor-pointer relative group transition-colors"
                    >
                      <div className="absolute inset-0 rounded-md" style={{
                        background: `linear-gradient(to top, hsl(175,70%,42%), hsla(175,70%,42%,0.3))`
                      }} />
                      <div className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity" style={{
                        background: `linear-gradient(to top, hsl(175,70%,52%), hsla(175,70%,52%,0.5))`
                      }} />
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-[hsl(210,20%,96%)] font-semibold whitespace-nowrap bg-[hsl(220,25%,15%)] px-2 py-0.5 rounded-md shadow-lg">
                        {Math.round(h * 0.35)}
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="flex justify-between mt-1.5">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                    <span key={i} className="flex-1 text-center text-[9px] text-[hsl(220,10%,40%)]">{d}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Reusable interactive card ── */
function InteractiveCard({
  id, expanded, onToggle, icon, iconBg, title, preview, detail
}: {
  id: string;
  expanded: string | null;
  onToggle: (id: string | null) => void;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  preview: React.ReactNode;
  detail: React.ReactNode;
}) {
  const isOpen = expanded === id;
  return (
    <motion.button
      onClick={() => onToggle(isOpen ? null : id)}
      layout
      className={`rounded-2xl border text-left p-4 transition-all w-full ${
        isOpen
          ? 'border-[hsl(175,70%,42%)/0.3] bg-[hsl(220,25%,12%)] col-span-2'
          : 'border-[hsl(220,20%,16%)] bg-[hsl(220,25%,11%)] hover:border-[hsl(220,20%,22%)] hover:bg-[hsl(220,25%,12%)]'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: `${iconBg}15` }}>
            {icon}
          </div>
          <span className="text-[11px] font-medium text-[hsl(220,10%,55%)]">{title}</span>
        </div>
        {isOpen && (
          <X className="h-3 w-3 text-[hsl(220,10%,40%)]" />
        )}
      </div>
      {preview}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {detail}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
