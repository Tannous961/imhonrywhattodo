// Curated English content. No network or user data.
  const plans = {
    solo: {
      low: [
        ['Romance your own evening.', 'Fresh sheets. Your favourite playlist. Something delicious. Congratulations: you are now your own excellent date.'],
        ['The phone goes in time-out.', 'Put it away for 20 minutes. Take a warm shower, stretch, and pick a film you would defend in court. No scrolling required.'],
        ['Make a tiny pleasure menu.', 'Write down five things that make you feel good. Pick one you can enjoy tonight. Yes, fancy toast counts. We checked.']
      ],
      high: [
        ['Take yourself out. Properly.', 'Choose a café, a bookshop, or a local gig. Wear the outfit. You do not need a plus-one to be the main event.'],
        ['Dance like the rent is paid.', 'Make a three-song playlist and dance it out. Add a walk afterwards if you still have plot left in you.'],
        ['Say yes to a tiny adventure.', 'Pick a nearby place you have never visited. Set a budget, tell someone where you are going, and take yourself on a curiosity date.']
      ]
    },
    crush: {
      low: [
        ['Send a little signal.', 'Try: “Saw something that made me think of you. How’s your day going?” Then give them space to reply. Your phone is not a life-support machine.'],
        ['Flirt in playlist form.', 'Ask: “Want to trade one song that sums up your mood?” Low stakes. Excellent material for your imaginary rom-com.'],
        ['Be charmingly specific.', 'Offer one real compliment about their humour, taste, or something they made. Keep it kind. Let the conversation breathe.']
      ],
      high: [
        ['Make an actual little plan.', 'Try: “Coffee and a walk this weekend? I know a spot.” A public place, a clear invitation, and room for a no. Attractive logistics.'],
        ['Invite a little friendly rivalry.', 'Suggest mini golf, a board-game café, or a quiz. Ask what they would enjoy. Your flirting can have a side quest.'],
        ['Trade hints for clarity.', 'Try: “I like talking with you. Would you be up for a date?” Bold? Yes. A hostage situation? Absolutely not. Respect their answer.']
      ]
    },
    partner: {
      low: [
        ['Schedule absolutely nothing.', 'Ask your person if they fancy a phone-free hour: snacks, a shared playlist, and no agenda. Closeness does not need a production budget.'],
        ['Bring back the first-date questions.', 'Each ask one thing you have never asked before. “What’s your oddly specific dream day?” is a strong start. Listen like there is a sequel.'],
        ['Order a tiny surprise.', 'Each choose a song, a snack, or a film for the other. Agree on a budget first. Small gestures, suspiciously good chemistry.']
      ],
      high: [
        ['Take your favourite person somewhere new.', 'Each pick one nearby spot. Flip a coin for the first stop. Keep the plan flexible and make sure you both actually want to go.'],
        ['Make dinner mildly competitive.', 'Choose three ingredients together and invent something edible. Award ridiculous names. Teamwork is hot; food poisoning is not the plot.'],
        ['Reboot date night.', 'Ask each other for one “always wanted to try” date idea. Find the overlap and plan it together. Mutual excitement gets the final vote.']
      ]
    }
  };
  const extraPlans={
    solo:{low:[['Make a comfort ritual.','A warm drink, a clean corner, and one album from start to finish. Your evening does not need a productivity report.'],['Treat your senses.','Pick a favourite scent, a soft outfit, and something good to eat. Yes, this counts as a plan.'],['Try a tiny screen detox.','Set a 15-minute timer. Draw something terrible, stretch, or read a few pages. Give your brain an interesting commercial break.']],high:[['Follow your curiosity.','Find a local exhibition or public event within your budget. Take yourself there. A solo date still gets a main character.'],['Go on a photo hunt.','Take a daylight walk and photograph five oddly beautiful things. Avoid photographing strangers without permission.'],['Learn one ridiculous skill.','Try a beginner dance, a card trick, or a new recipe. Twenty minutes. No audition. Enthusiasm is the whole qualification.']]},
    crush:{low:[['Send a low-stakes hello.','Ask about something they mentioned last time. Remembering a detail is charming; demanding a reply is not.'],['Offer a tiny recommendation.','Share a song or a film you think they might like. One message, room to respond, and absolutely no follow-up interrogation.'],['Make the conversation playful.','Try: “Would you rather have perfect coffee or perfect weather forever?” Silly questions are excellent icebreakers.']] ,high:[['Find a shared-interest date.','Suggest a public bookshop, gallery, or café linked to something you both like. Ask what suits them and respect their answer.'],['Try a snack-sized date.','Ask: “Want to grab an ice cream and take a short walk?” A small plan can still have excellent chemistry.'],['Name your intention kindly.','Try: “I’d love to take you on a date. Interested?” Give them space to decide. Clarity is a surprisingly good accessory.']]},
    partner:{low:[['Trade tiny appreciations.','Each name one thing the other did recently that you liked. Phones away. Specific kindness is a strong opening act.'],['Build an absurd dream day.','Take turns adding one detail to an imaginary perfect day together. No booking, budget, or logistics required tonight.'],['Ask for the kind of closeness you want.','A chat, a cuddle, or a little space? Ask your person what feels good for both of you. Mind-reading remains tragically unavailable.']],high:[['Create a two-stop date.','Each choose one stop within an agreed budget. A café and a park count. Take turns being the surprisingly competent tour guide.'],['Make a shared challenge.','Learn a short dance or cook a new dish together. The goal is a fun hour, not becoming professionally insufferable.'],['Try an agreed little surprise.','Ask your partner which kind of date they would enjoy, then plan one detail as a surprise. Boundaries first; theatrical reveal second.']]}
  };
  for(const company of Object.keys(extraPlans))for(const energy of Object.keys(extraPlans[company]))plans[company][energy].push(...extraPlans[company][energy]);
  const outcomes = [
    ['Reset', 'Hot shower. Cold drink. Fresh perspective.', 'Give yourself 20 screen-free minutes. Stretch, hydrate, and put on something comfortable. Sometimes the plot twist is feeling human again.'],
    ['Adventure', 'Go find a tiny plot twist.', 'Visit a nearby café, exhibition, or park you have not tried. Pick something within your budget. Curiosity looks good on you.'],
    ['Flirt', 'One honest compliment. Zero performance.', 'If there is someone you already talk with, send a kind, specific compliment. No pressure to reply. Charm is an invitation, not an invoice.'],
    ['Create', 'Turn the energy into something weird.', 'Make a ridiculous playlist, doodle your alter ego, or invent a midnight snack. Art school may not call. Your mood might thank you.'],
    ['Connect', 'A little human connection, please.', 'Ask someone you trust if they are up for a call or a walk. Friends count. So does admitting you could use a little company.'],
    ['Wildcard', 'Let your future self pick.', 'Write down three things you would enjoy doing, fold them up, and choose one. You can veto it. This is roulette, not a legally binding contract.']
  ];
  const lines = {
    opener: {
      playful: ['Important research: what’s your most defensible terrible movie opinion?', 'You seem like someone with excellent snack opinions. Care to prove me right?'],
      sweet: ['You caught my attention. I’d like to get to know you — how’s your week going?', 'What’s one small thing that made your day better?'],
      bold: ['I was going to play it cool, but curiosity won. Want to chat?', 'You seem interesting. I’d like to find out if I’m right. How’s your day?']
    },
    date: {
      playful: ['Want to grab coffee this week and judge the pastries like we’re qualified?', 'Fancy a walk and a wildly unnecessary debate about the best snack?'],
      sweet: ['I’ve really enjoyed talking with you. Would you like to go for coffee sometime?', 'I’d love to spend some time together. Is there a day you’d be up for a date?'],
      bold: ['I like our vibe. Want to go on a date this weekend? No pressure if not.', 'I’d like to take you out. Coffee this week, if you’re interested?']
    },
    followup: {
      playful: ['I had a lovely time. A suspiciously good time, actually. Fancy a sequel?', 'Our last conversation deserves another episode. Up for a coffee sometime?'],
      sweet: ['I enjoyed seeing you. I’d be happy to do it again if you feel the same.', 'Just wanted to say I had a really nice time. Hope your week is treating you kindly.'],
      bold: ['I’d like to see you again. Want to make a plan?', 'I had a good time with you, and I’m interested in another date. How do you feel?']
    }
  };

plans.bored={
 low:[
 ['Build your anti-boredom menu.','Write three things you can do without leaving the sofa. Pick the one that sounds fun, not the one that sounds impressive.'],
 ['Become a terrible film critic.','Choose a gloriously silly movie and invent an award for its weirdest moment. Snacks get a supporting role.'],
 ['Create a tiny alter ego.','Give your inner chaos a name, a theme song, and an unnecessarily dramatic backstory. No acting qualifications required.'],
 ['Make a snack flight.','Try three small snacks or drinks you already have. Rate them with ridiculous tasting notes. Your kitchen is now a very exclusive venue.'],
 ['Find something delightfully strange.','Open a book to a random page or explore a new music genre. Give it ten minutes of actual curiosity.'],
 ['Write a two-line comedy.','Describe your current mood as a movie title and its terrible review. Bonus points if it makes you laugh at yourself kindly.']
 ],
 high:[
 ['Take a curiosity walk.','Choose a safe daylight route and look for five things you normally miss. Your neighbourhood has side quests.'],
 ['Learn an extremely unnecessary skill.','Try a card trick, a dance step, or drawing a cartoon face. Twenty minutes. Talent is optional; commitment to the bit is encouraged.'],
 ['Make your own mini challenge.','Set a timer for ten minutes and tidy, dance, or create something. Pick a task you can finish before your motivation files a complaint.'],
 ['Go on a colour hunt.','Pick a colour and photograph five things in it during a short walk. Respect people’s privacy and keep your phone away when crossing roads.'],
 ['Turn up the living room.','Queue three favourite songs and invent your own choreography. The audience is imaginary and already deeply impressed.'],
 ['Cook a tiny plot twist.','Try a simple recipe with ingredients you have, or make a familiar dish a new way. Culinary chaos, with basic food safety.']
 ]};

const rouletteVariants=[
 [outcomes[0].slice(1),['Give your evening a soft reset.','Put on a favourite album, make a warm drink, and spend ten minutes away from your phone. Your nervous scrolling can take the night off.'],['Make the room feel different.','Change the lighting, open a window if it is comfortable, and put one small mess away. New scene, same excellent protagonist.']],
 [outcomes[1].slice(1),['Take yourself on a curiosity date.','Pick a nearby public café, bookshop or exhibition you have not visited. Set a budget and a return time. A plus-one is optional.'],['Find a new corner of your neighbourhood.','Take a short daylight walk to a public spot you usually skip. Notice five interesting things. Avoid sharing your live location publicly.']],
 [outcomes[2].slice(1),['Ask one delightfully silly question.','Try: “What snack would you defend with your life?” Ask someone you already talk with, and leave space for them to reply.'],['Offer a low-pressure invitation.','Try: “Fancy coffee and a walk sometime?” Keep it simple and accept their answer. Flirting works better without a sales funnel.']],
 [outcomes[3].slice(1),['Make a wildly specific playlist.','Give it an overdramatic title and exactly five songs. A soundtrack for making toast like it is the final scene of a movie? Excellent.'],['Draw your inner little menace.','Give it horns, a ridiculous accessory and an oddly specific superpower. Artistic skill is optional. Commitment to the joke is encouraged.']],
 [outcomes[4].slice(1),['Send a small appreciation.','Tell someone you trust one specific thing you appreciate about them. No demand for a reply. A little kindness can carry an entire evening.'],['Invite a very low-stakes catch-up.','Ask a friend if they have ten minutes for a call or a walk. If not, make your own plan. Connection is an invitation, not an obligation.']],
 [outcomes[5].slice(1),['Pick the opposite of your default.','Usually scroll? Read a page. Usually stay silent? Send a kind hello. Choose one small change that fits your boundaries and energy.'],['Let a coin choose the side quest.','Write down two things you would enjoy. Flip a coin, notice which result you hoped for, and choose freely. The coin is an adviser, not your boss.']]
];
export {plans,outcomes,lines,rouletteVariants};
