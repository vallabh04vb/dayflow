const nodemailer = require('nodemailer');
const { getAllSettings, getTasksByDate, getCompletionStats, getToday, getTomorrow } = require('./db');

// --- Time-aware thoughts & energy ---

const MORNING_THOUGHTS = [
  { thought: "The day has just begun. A blank page, and you're holding the pen.", vibe: "Today is yours to write. Every task you knock out is a sentence in a story you'll be proud of tonight." },
  { thought: "Right now, you have something most people waste — a fresh start.", vibe: "Don't just plan the day. Attack it. The morning version of you is the most powerful one." },
  { thought: "While the world is still waking up, you're already moving.", vibe: "That head start? It compounds. By noon, you'll be miles ahead of yesterday." },
  { thought: "Coffee's hot. Mind's clear. Zero excuses.", vibe: "This is the golden hour. The tasks that scare you? Do those first. You'll feel unstoppable by 10 AM." },
  { thought: "Every master was once a disaster at mornings. But they showed up anyway.", vibe: "You don't need motivation. You need momentum. Just start the first task — the rest will follow." },
  { thought: "The sun doesn't negotiate with the night. It just rises. So should you.", vibe: "No overthinking. No delays. Open your list, pick the first one, and go." },
  { thought: "You slept on ideas. Now wake up and execute them.", vibe: "Dreams are plans without deadlines. Today, you give them deadlines. Let's go." },
  { thought: "Morning energy is compound interest. Invest it wisely.", vibe: "The first 3 hours of your day will determine the other 12. Make them count." },
  { thought: "Yesterday is done. Tomorrow doesn't exist yet. There's only now.", vibe: "And right now, you have a list and the will to crush it. That's all you've ever needed." },
  { thought: "Some people wish for a productive day. You're about to build one.", vibe: "Task by task, hour by hour. By tonight, you'll look back and think — yeah, I did that." },
  { thought: "Your alarm didn't wake you up. Your ambition did.", vibe: "Most people hit snooze on their goals. You're already reading your task list. That's a different breed." },
  { thought: "Today's tasks aren't obligations. They're opportunities wearing a checklist disguise.", vibe: "Every single one moves you closer to who you're becoming. Treat them like stepping stones, not chores." },
  { thought: "The world rewards people who start before they're ready.", vibe: "You don't need the perfect plan. You need the first step. Take it now — clarity comes from action, not thought." },
  { thought: "You woke up with more potential than you went to sleep with.", vibe: "Because yesterday taught you something. Today you apply it. That's how growth works — quietly, daily, relentlessly." },
  { thought: "Imagine your future self looking back at today. Make them proud.", vibe: "Six months from now, you'll either be glad you started or wish you had. This morning is that starting line." },
  { thought: "The first task is always the hardest. After that, it's just momentum.", vibe: "Don't stare at the whole list. Just pick one. Complete it. Feel that spark. Then ride it all morning." },
  { thought: "Somewhere right now, someone with your exact goals is outworking you. Fix that.", vibe: "Not with panic — with purpose. Calm focus beats frantic hustle every time. But you have to start." },
  { thought: "You're not just checking boxes today. You're building a life.", vibe: "Every gym session, every deep work block, every page read — it all stacks. Trust the process." },
  { thought: "Morning light doesn't ask permission to shine. Neither should you.", vibe: "Stop waiting for the right mood, the right moment, the right feeling. Just begin. The mood will catch up." },
  { thought: "A river cuts through rock not by force, but by persistence. Be the river.", vibe: "You don't need to crush everything today. You need to show up again. That's the real superpower." },
  { thought: "If today were the only day that mattered, what would you do differently?", vibe: "Probably nothing. Because you're already here, already planning, already moving. That's the answer." },
  { thought: "The gap between where you are and where you want to be? It's called today.", vibe: "Not someday. Not Monday. Today. And you've got 16 hours to close that gap a little more." },
  { thought: "Nobody's coming to do your push-ups. Nobody's coming to write your code.", vibe: "And that's the beautiful part — your results are 100% yours. Every win today has your name on it." },
  { thought: "Champions don't hit snooze. They hit the ground running.", vibe: "Your task list is your training ground. Every completed item is a rep. Let's get those reps in." },
  { thought: "Today is a limited edition. Only one copy exists. Don't waste it.", vibe: "There will never be another March morning exactly like this one. Fill it with things that make the highlight reel." },
  { thought: "Your brain is sharpest in the first 2 hours. Use that weapon wisely.", vibe: "Front-load the hard stuff. Coding challenges, deep work, big decisions — do them now while your mind is a blade." },
  { thought: "Consistency isn't glamorous. But results are.", vibe: "Nobody cheers for the 47th morning you showed up. But that 47th morning is why you're ahead of 99% of people." },
  { thought: "You've survived 100% of your worst days. Today won't be one of them.", vibe: "Because today, you're prepared. You've got a plan, a list, and the will to execute. Let's go." },
  { thought: "The best project you'll ever work on is yourself.", vibe: "Every task on your list today is a brick in that project. Lay them with intention." },
  { thought: "Small things done consistently create big results unexpectedly.", vibe: "That daily reading habit? That morning gym session? One day it clicks and people call it overnight success." },
];

const MIDDAY_THOUGHTS = [
  { thought: "The day is NOT over. Not even close.", vibe: "You've still got hours of firepower left. That task you've been avoiding? Now's the time. Knock it out and feel the weight lift." },
  { thought: "Afternoon slump? Nah. This is your second wind.", vibe: "Winners don't stop at lunch. Grab some water, take a breath, and come back swinging. You've got this." },
  { thought: "Half the day down, and look — you've already made progress.", vibe: "Don't lose momentum now. The finish line is closer than you think. One more push." },
  { thought: "Right now, most people are coasting. You? You're still building.", vibe: "That's the difference. While they scroll, you ship. While they nap, you create. Keep going." },
  { thought: "The afternoon is where discipline beats motivation.", vibe: "Motivation got you started this morning. But discipline? That's what finishes the job. Be the person who finishes." },
  { thought: "You're not tired. You're just at the part where it gets interesting.", vibe: "Push through this stretch and you'll unlock that end-of-day satisfaction that nothing else can give you." },
  { thought: "Every task you complete now is a gift to your evening self.", vibe: "Imagine tonight — feet up, everything checked off, that deep exhale. You're building that moment right now." },
  { thought: "The best part of your day might still be ahead.", vibe: "Some of the most productive hours are between 2 PM and 5 PM. Don't let them slip. Own them." },
  { thought: "You didn't come this far to only come this far.", vibe: "Look at what you've already done today. Now imagine adding 2-3 more wins. That's a day you'll remember." },
  { thought: "Afternoon you is tougher than morning you. Prove it.", vibe: "Morning energy is easy. Afternoon grit is earned. This is where you separate yourself from the crowd." },
  { thought: "Lunch is over. Time to eat your tasks alive.", vibe: "That post-lunch fog? Walk through it. The fog lifts the moment you start moving. One task — that's all it takes." },
  { thought: "The scoreboard is still live. The game isn't over.", vibe: "You can still turn a 30% day into an 80% day. All it takes is one focused afternoon sprint." },
  { thought: "Your morning self set you up. Your afternoon self finishes the job.", vibe: "Think of it as a relay race. The baton's been passed. Now run your leg hard." },
  { thought: "3 PM is where average people quit and exceptional people double down.", vibe: "Which one are you today? The answer is in what you do in the next 60 minutes." },
  { thought: "The task you're avoiding? It's probably the one that matters most.", vibe: "That resistance you feel is a signal, not a stop sign. Lean into it. The relief on the other side is incredible." },
  { thought: "Think about how good it'll feel at 6 PM to see a full progress bar.", vibe: "That satisfaction isn't luck. It's built right now, one checkbox at a time. Keep clicking." },
  { thought: "Your brain says 'rest.' Your goals say 'not yet.'", vibe: "Compromise: work for 25 more minutes, then take a real break. That's how you trick resistance into losing." },
  { thought: "An unfinished task list at 3 PM is not a failure — it's an invitation.", vibe: "You've still got runway. Use it. Land this day properly." },
  { thought: "The afternoon separates the talkers from the doers.", vibe: "Anyone can make a morning to-do list. But executing after lunch when Netflix is calling? That's rare. Be rare." },
  { thought: "Momentum isn't gone — it's just waiting for you to take one more step.", vibe: "Start the next task. Don't think about all of them. Just the next one. That's how marathons are won." },
  { thought: "Somewhere, your competition is still grinding at this hour.", vibe: "Not to scare you — to remind you. The people who win aren't more talented. They just don't stop at 2 PM." },
  { thought: "Water. Stretch. Then destroy that next task.", vibe: "A 2-minute reset is all your body needs. Then come back like it's 9 AM again. Your tasks won't know the difference." },
  { thought: "The afternoon is the bridge between planning and achieving.", vibe: "The morning was the blueprint. Right now is construction time. Build something you're proud of by sunset." },
  { thought: "Half your day is in the bank. Now invest the other half.", vibe: "What you do between now and dinner is the difference between 'meh' and 'what a day.' Choose wisely." },
  { thought: "Every pro athlete has a second half. So do you.", vibe: "The first half built the lead. The second half protects it. Stay locked in." },
  { thought: "In 3 hours, you'll either be proud or making excuses. Pick one now.", vibe: "Not later. Now. The decision to push through is made in this exact moment." },
  { thought: "The hardest part of the afternoon is the first 5 minutes back at work.", vibe: "After that? You're in the zone again. Just survive those 5 minutes. Set a timer if you have to." },
  { thought: "Your future self is watching. They're either cheering or cringing.", vibe: "Give them something to cheer about. Knock out 2 more tasks and you're golden." },
  { thought: "Tired is temporary. 'I wish I'd done more' lasts all evening.", vibe: "Push now, rest later. That evening satisfaction is earned between 3 and 6 PM." },
  { thought: "Plot twist: the afternoon is actually the most productive part of the day.", vibe: "Studies show creative problem-solving peaks when you're slightly tired. Use that weird brain energy." },
];

const EVENING_THOUGHTS = [
  { thought: "The day is winding down, but your story today isn't finished yet.", vibe: "If there's one more thing you can close out — do it. That final push is what separates a good day from a great one." },
  { thought: "Look back at today. You showed up. That matters more than you think.", vibe: "Not every day will be perfect. But every day you try is a day that counts. Be proud of the effort." },
  { thought: "Tonight, rest. Tomorrow, reload. The streak continues.", vibe: "Recovery is part of the process. You've earned this evening. Recharge so tomorrow's version of you is even sharper." },
  { thought: "Some days you conquer the list. Some days the list humbles you. Both are progress.", vibe: "What didn't get done today gets another chance tomorrow. No guilt — just momentum." },
  { thought: "You did what you could with the hours you had. That's enough.", vibe: "Stop measuring yourself against perfection. Measure against yesterday. If you moved forward at all — you won." },
  { thought: "The fact that you're reviewing your day means you care. Most people don't.", vibe: "That awareness alone puts you ahead. Keep tracking, keep pushing, keep growing." },
  { thought: "Every completed task today was a small promise kept to yourself.", vibe: "And self-trust is built exactly like that — one kept promise at a time. Well done." },
  { thought: "Close the laptop. Open something that feeds your soul tonight.", vibe: "You've been productive. Now be present. Read, walk, laugh — tomorrow's tasks will be there. Tonight, just breathe." },
  { thought: "Today's done. And you know what? Tomorrow's already being set up for success.", vibe: "Because you planned, you tracked, you cared. That's the compound effect in action." },
  { thought: "Not every day is a 100% day. But showing up? That's always 100%.", vibe: "You showed up today. That's the hardest part. Everything else is just details." },
  { thought: "The gym was hard. The code was harder. But you did both.", vibe: "That's not normal. That's not average. That's someone building something real, one difficult day at a time." },
  { thought: "Tonight, let the progress sink in. You moved the needle today.", vibe: "It might feel small. But zoom out a month and you'll see a completely different person forming." },
  { thought: "Rest isn't the opposite of productivity. It's the other half of it.", vibe: "A sharp axe cuts faster than a dull one swung harder. Sleep well tonight. Tomorrow needs you sharp." },
  { thought: "You made it through another day. Not everyone did. Respect that.", vibe: "Gratitude isn't soft — it's perspective. You're alive, you're growing, and you're building. That's a good day." },
  { thought: "The scoreboard doesn't lie. But it also doesn't define you.", vibe: "Whether you hit 100% or 40%, the act of tracking already puts you in the top 5% of intentional people." },
  { thought: "Your pillow is earned tonight. You put in the work.", vibe: "Not everyone can say that. But you can. And tomorrow? You'll do it again. That's the habit forming." },
  { thought: "Today's incomplete tasks aren't failures. They're tomorrow's priorities.", vibe: "The system works. What rolls over gets a fresh shot. Nothing is lost — it's just rescheduled." },
  { thought: "If someone filmed your day, would you be proud of the footage?", vibe: "Most of us would say 'mostly yes, some parts no.' And that honesty? That's growth talking." },
  { thought: "The world got a little better today because you put in effort.", vibe: "Your code, your ideas, your learning — it all ripples outward. Even when you can't see it." },
  { thought: "Three things to do before sleep: reflect, plan, let go.", vibe: "Reflect on today's wins. Plan tomorrow's moves. Let go of what didn't happen. Then sleep like a champion." },
  { thought: "You started today with a list and ended it with results. That's the whole game.", vibe: "Not perfect results. Not Instagram results. Real results. The kind that compound quietly over months." },
  { thought: "Your streak isn't just a number. It's proof you can be relied on — by yourself.", vibe: "Every day you show up for your own goals is a day you prove you're worth betting on." },
  { thought: "The night belongs to dreamers. Tomorrow belongs to doers. You're both.", vibe: "Dream big tonight. Then wake up and do the next small thing. That's the formula." },
  { thought: "You can't control outcomes. But you crushed the inputs today.", vibe: "The right habits, the right effort, the right intention. Outcomes follow eventually. Trust the lag." },
  { thought: "Don't carry today's stress into tonight. Drop it at the door.", vibe: "What's done is done. What's undone will wait. Right now, your only job is to decompress." },
  { thought: "Somewhere, the version of you from a year ago would be stunned by today.", vibe: "You've come further than you realize. The daily grind makes it invisible. But zoom out — it's dramatic." },
  { thought: "Read a page. Just one. Let your brain shift from doing to absorbing.", vibe: "The evening is for input, not output. Feed your mind something good before sleep." },
  { thought: "The best days don't always feel like the best days until you look back.", vibe: "Today might have felt ordinary. But ordinary days stacked consistently create extraordinary lives." },
  { thought: "Goodnight to the person who showed up today. See you tomorrow, same time, same fire.", vibe: "The consistency is the flex. Not the single big day — the 30th consecutive okay day. That's mastery." },
  { thought: "One day or day one? You already chose day one. And today was another day of proof.", vibe: "Keep going. The results are coming. They always come for people who refuse to stop." },
];

function getThought(timeOfDay) {
  const pool = timeOfDay === 'morning' ? MORNING_THOUGHTS
    : timeOfDay === 'afternoon' ? MIDDAY_THOUGHTS
    : EVENING_THOUGHTS;
  return pool[Math.floor(Math.random() * pool.length)];
}

function thoughtBlockHtml(thought, accentColor = '#D97706', bgColor = '#FFFBEB') {
  return `
    <div style="background:${bgColor};border-radius:12px;padding:20px;margin-bottom:20px;border-left:4px solid ${accentColor};">
      <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#1C1917;">${escapeHtml(thought.thought)}</p>
      <p style="margin:0;font-size:14px;color:#78716C;line-height:1.5;">${escapeHtml(thought.vibe)}</p>
    </div>`;
}

// Resend API (HTTP-based, no SMTP needed)
// Falls back to Gmail SMTP for local development

function getAppUrl() {
  return process.env.APP_URL || 'http://localhost:3000';
}

function taskListHtml(tasks, showStatus = false) {
  if (!tasks.length) return '<p style="color:#78716C;">No tasks for this day.</p>';

  return tasks.map(t => {
    const icon = showStatus
      ? (t.completed ? '✅' : '⬜')
      : (t.carried_over ? '🔄 ' : '');
    const style = t.completed
      ? 'text-decoration:line-through;color:#A8A29E;'
      : 'color:#1C1917;';
    return `<li style="padding:8px 0;border-bottom:1px solid #F5F5F4;font-size:16px;">
      <span>${icon}</span>
      <span style="${style}">${escapeHtml(t.title)}</span>
    </li>`;
  }).join('');
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function emailTemplate({ greeting, subtitle, bodyHtml, userName }) {
  const appUrl = getAppUrl();
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#FAF8F5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:20px auto;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#D97706,#F59E0B);padding:28px 32px;">
      <h1 style="margin:0;color:#FFFFFF;font-size:24px;font-weight:700;">DayFlow</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">${userName ? escapeHtml(userName) + ' · ' : ''}${new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
    </div>
    <div style="padding:28px 32px;">
      <h2 style="margin:0 0 4px;color:#1C1917;font-size:20px;">${greeting}</h2>
      ${subtitle ? `<p style="margin:0 0 20px;color:#78716C;font-size:15px;">${subtitle}</p>` : ''}
      ${bodyHtml}
    </div>
    <div style="padding:20px 32px;text-align:center;border-top:1px solid #F5F5F4;">
      <a href="${appUrl}" style="display:inline-block;background:#D97706;color:#FFFFFF;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;">Mark Tasks →</a>
    </div>
  </div>
</body>
</html>`;
}

function progressBarHtml(done, total) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return `
    <div style="margin:20px 0;">
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
        <span style="font-size:14px;color:#78716C;">Progress</span>
        <span style="font-size:14px;font-weight:600;color:#D97706;">${done}/${total} (${pct}%)</span>
      </div>
      <div style="background:#F5F5F4;border-radius:99px;height:10px;overflow:hidden;">
        <div style="background:linear-gradient(90deg,#D97706,#F59E0B);height:100%;width:${pct}%;border-radius:99px;transition:width 0.3s;"></div>
      </div>
    </div>`;
}

async function sendEmail(subject, html) {
  const recipient = process.env.RECIPIENT_EMAIL || process.env.EMAIL_USER;
  if (!recipient) {
    console.warn('[Mailer] No recipient email configured.');
    return;
  }

  console.log(`[Mailer] Attempting to send "${subject}" to ${recipient}...`);

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    // Use Resend HTTP API (works on Railway)
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'DayFlow <onboarding@resend.dev>',
          to: [recipient],
          subject,
          html
        })
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`[Mailer] Sent via Resend: ${subject} (id: ${data.id})`);
      } else {
        console.error(`[Mailer] Resend error:`, data);
      }
    } catch (err) {
      console.error(`[Mailer] Resend failed:`, err.message);
    }
  } else {
    // Fallback to Gmail SMTP (local dev)
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    if (!user || !pass) {
      console.warn('[Mailer] No RESEND_API_KEY or EMAIL_USER/PASS set. Emails disabled.');
      return;
    }
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass }
      });
      await transporter.sendMail({
        from: `"DayFlow" <${user}>`,
        to: recipient,
        subject,
        html
      });
      console.log(`[Mailer] Sent via Gmail: ${subject}`);
    } catch (err) {
      console.error(`[Mailer] Gmail failed:`, err.message);
    }
  }
}

// --- Email types ---

async function sendMorningEmail() {
  const settings = getAllSettings();
  const tasks = getTasksByDate(getToday());
  const thought = getThought('morning');
  const html = emailTemplate({
    greeting: `Good morning, ${settings.user_name || 'champ'}! ☀️`,
    subtitle: 'The day has just begun — here\'s what you\'re conquering today',
    bodyHtml: `
      ${thoughtBlockHtml(thought, '#D97706', '#FFFBEB')}
      <ul style="list-style:none;padding:0;margin:0;">${taskListHtml(tasks)}</ul>`,
    userName: settings.user_name
  });
  await sendEmail(`☀️ Good morning! Your tasks for today`, html);
}

async function sendReminderEmail() {
  const settings = getAllSettings();
  const tasks = getTasksByDate(getToday());
  const thought = getThought('morning');
  const html = emailTemplate({
    greeting: 'Let\'s go, ' + (settings.user_name || 'champ') + '! 🚀',
    subtitle: 'Your day is in motion — zero excuses, full send',
    bodyHtml: `
      ${thoughtBlockHtml(thought, '#F59E0B', '#FEF3C7')}
      <ul style="list-style:none;padding:0;margin:0;">${taskListHtml(tasks)}</ul>`,
    userName: settings.user_name
  });
  await sendEmail(`🚀 Let's go! Your day is in motion`, html);
}

async function sendAfternoonEmail() {
  const settings = getAllSettings();
  const tasks = getTasksByDate(getToday());
  const stats = getCompletionStats(getToday());
  const thought = getThought('afternoon');
  const remaining = stats.total - stats.done;

  const statusLine = stats.percentage >= 75
    ? `You're crushing it — ${stats.done}/${stats.total} done! Finish strong 💪`
    : stats.percentage >= 50
    ? `Solid progress — ${stats.done}/${stats.total} done. The afternoon is yours to own.`
    : `${remaining} task${remaining !== 1 ? 's' : ''} waiting. The day is NOT over — you've got this.`;

  const html = emailTemplate({
    greeting: 'Afternoon check-in ☀️',
    subtitle: statusLine,
    bodyHtml: `
      ${thoughtBlockHtml(thought, '#F97316', '#FFF7ED')}
      ${progressBarHtml(stats.done, stats.total)}
      <ul style="list-style:none;padding:0;margin:0;">${taskListHtml(tasks, true)}</ul>`,
    userName: settings.user_name
  });
  await sendEmail(`☀️ Afternoon — ${stats.percentage}% done, keep pushing!`, html);
}

async function sendEveningEmail() {
  const settings = getAllSettings();
  const tasks = getTasksByDate(getToday());
  const stats = getCompletionStats(getToday());
  const tomorrowTasks = getTasksByDate(getTomorrow());
  const allDone = stats.total > 0 && stats.done === stats.total;

  const thought = getThought('evening');

  const celebrationOrNudge = allDone
    ? `<div style="background:#F0FDF4;border-radius:12px;padding:18px;text-align:center;margin-bottom:20px;">
        <p style="font-size:28px;margin:0;">🎉</p>
        <p style="margin:8px 0 0;color:#16A34A;font-weight:600;">Every single task — done. You're a machine, ${settings.user_name || 'legend'}!</p>
        <p style="margin:6px 0 0;color:#15803D;font-size:14px;">This is what consistency looks like. Tomorrow, you go again.</p>
       </div>`
    : `<div style="background:#FFFBEB;border-radius:12px;padding:18px;text-align:center;margin-bottom:20px;">
        <p style="margin:0;color:#92400E;font-weight:500;">${stats.total - stats.done} task${stats.total - stats.done !== 1 ? 's' : ''} didn't make it today — and that's okay.</p>
        <p style="margin:6px 0 0;color:#92400E;font-size:14px;">They'll carry over to tomorrow. No guilt, just momentum.</p>
       </div>`;

  const tomorrowSection = tomorrowTasks.length > 0
    ? `<div style="margin-top:20px;padding-top:20px;border-top:1px solid #F5F5F4;">
        <h3 style="margin:0 0 12px;color:#1C1917;font-size:16px;">Tomorrow's Preview</h3>
        <ul style="list-style:none;padding:0;margin:0;">${taskListHtml(tomorrowTasks)}</ul>
       </div>`
    : '';

  const html = emailTemplate({
    greeting: 'Evening wrap-up 🌙',
    subtitle: `Today's final score: ${stats.done}/${stats.total}`,
    bodyHtml: `
      ${thoughtBlockHtml(thought, '#7C3AED', '#F5F3FF')}
      ${progressBarHtml(stats.done, stats.total)}
      ${celebrationOrNudge}
      <ul style="list-style:none;padding:0;margin:0;">${taskListHtml(tasks, true)}</ul>
      ${tomorrowSection}`,
    userName: settings.user_name
  });
  await sendEmail(`🌙 Evening wrap-up — ${stats.percentage}% complete`, html);
}

async function sendTestEmail() {
  const settings = getAllSettings();
  const html = emailTemplate({
    greeting: 'Test email successful! 🎉',
    subtitle: 'Your DayFlow email setup is working correctly.',
    bodyHtml: `<p style="color:#78716C;">You'll receive 4 daily emails with your task updates. Configure the timing in Settings.</p>`,
    userName: settings.user_name
  });
  await sendEmail('✅ DayFlow test email', html);
}

module.exports = {
  sendMorningEmail,
  sendReminderEmail,
  sendAfternoonEmail,
  sendEveningEmail,
  sendTestEmail
};
