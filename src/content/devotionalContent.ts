/**
 * Tea With God - 40-Day Devotional Content
 * Author: Lani Butler
 * Copyright: 2025-2026
 *
 * This file contains all 40 days of devotional content for the Tea With God app.
 * Content is structured for offline-first access with no external dependencies.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type Phase = 'valley' | 'waiting' | 'rising' | 'becoming';

export interface DayContent {
  dayNumber: number;
  title: string;
  phase: Phase;
  reflection: string;
  scripture: {
    text: string;
    reference: string;
  };
  thoughtOfDay: string;
  prayer: string;
  journalPrompt: string;
}

export interface FrontMatter {
  dedication: string;
  openingLetter: string;
  aboutAuthor: string;
  introduction: string;
  howToUse: string;
  whyFortyDays: string;
}

export interface ClosingContent {
  finalPrayer: string;
  author: string;
}

// ============================================================================
// FRONT MATTER
// ============================================================================

export const FRONT_MATTER: FrontMatter = {
  dedication: `To the woman reading this —
may God meet you gently.
May these pages be a soft place to land,
a quiet place to breathe,
a sacred place to remember
that you have never walked alone.`,

  openingLetter: `There was a time when my heart was whole — a clear, unbroken crystal.

A heart that still believed in goodness, still trusted easily, still carried the innocence only a child can hold.

But life... life has a way of reaching into your chest and pulling your heart out with its bare hands.

The first tear came long before I understood pain. Before I had words for grief. Before I knew what it meant to lose safety, to lose childhood innocence, to lose the people who were supposed to stay.

As the years unfolded, the breaks kept coming. Loss after loss. Disappointment after disappointment.

The quiet kind of rejection that teaches you to shrink yourself. Being overlooked in rooms where you gave everything.

Moments where life pulled the rug from under your feet so violently that you wondered if you would ever stand straight again.

Each time, my crystal heart was torn out and thrown to the floor, shattering into smaller pieces than before.

And like so many women do, I gathered the fragments with trembling hands — trying to hold myself together, trying to look strong, trying to keep going.

But there comes a moment when life hits you so deeply, so repeatedly, so painfully, that your heart no longer breaks into pieces... it turns into powder.

And that was me. After 53 years of loss, grief, exhaustion, and being knocked down, my heart wasn't a heart anymore. It was dust. The kind you can't glue back together. The kind that slips through your fingers no matter how tightly you hold it. The kind of breaking you don't come back from on your own.

But that — that exact place of ruin — is where God met me. He knelt in my undoing. He gathered the powder in His hands as if every grain mattered. And He began to restore what life tried to erase. Not into the clear, flawless crystal I once was — but into something stronger, deeper, and beautifully changed.

A sandblasted crystal heart: still whole, still shining, but with a softness that comes from being remade by God Himself.

A heart that allows light to enter in ways it never could before — glowing from within, not because it is perfect, but because it survived.

This book — Tea With God — is for every woman whose heart has been torn out again and again by the weight of living.

The losses no one talks about. The grief you carry quietly. The exhaustion that feels endless. The fear of the future. The shattered innocence. The loneliness of being strong for too long.

This is not a book about romance. This is a book about life — and the God who meets you in the middle of your collapse.

For the next 40 days, I invite you to sit with God every morning — with your cup of tea, your tears, your honesty, your silence, your exhaustion.

Let Him hold your broken places. Let Him speak into your quiet. Let Him rebuild what life has torn apart.

Because if He can take a heart that has been broken into powder and make it shine again — He can do the same for you.

Welcome to your remembering.
Welcome to your soft return.
Welcome to Tea With God.

— Lani`,

  aboutAuthor: `Tea With God began as something quiet — a personal daily practice, a small space where I sat with God in the middle of my unraveling.

My heart had been ripped out of my chest more times than I can count — not by one moment, not by one wound, but by a lifetime of losses. I had it all. Then I lost it all. Grief came. Rejection came. The breaking of innocence came. Life happened in ways I never expected or felt prepared for.

And little by little, my heart went from cracking... to shattering... to becoming nothing but powder.

But it was there — in what felt like the very end of me — that God met me.

Not when I was strong. Not when I was whole. Not when I had answers.

He met me when my heart was dust. And when I felt Him gently gathering that powder in His hands, I realised something: If God could meet me in that place — He can meet any woman in hers.

My story is not unique. My brokenness is not special. I am not famous, or extraordinary, or different from the women who will pick up this book. I simply felt God's presence in my most undone state... and I knew I had to share that experience.

This book is not about expertise. It is not about being qualified. It is not about teaching.

It is simply an invitation — to pause, to breathe, to sit with God, and to let Him meet you in your own quiet place. He is waiting for every woman. He was waiting for me.

And He will be waiting for you — in every cup of tea, in every whispered prayer, in every moment you choose to sit with Him.`,

  introduction: `Growth doesn't begin with strength.
It begins with honesty — the moment you finally exhale and whisper, "God... I don't know how to keep going."

This devotional is not for the neat moments of your life.
It is for the days you wake up tired, the evenings that feel heavy, the seasons when loss stacked itself over loss until joy became a distant memory.

Here, in these pages, you will not pretend. You will not shrink. You will not silence your own heart.
Here — you will sit with God exactly as you are.`,

  howToUse: `Each day offers:

• Reflection — raw, tender, honest.
• Scripture — grounding and steady.
• Thought of the Day — a truth to carry.
• Prayer — gentle words to reconnect.
• Journal Prompt — a space for your voice.

You do not need to come perfect.
You do not need to come strong.
Just come.`,

  whyFortyDays: `Forty days has always carried meaning far deeper than numbers on a calendar. Throughout Scripture, 40 marks a sacred period of transformation — a stretch of time where God meets His people in their weakness, their wandering, their uncertainty, and their becoming.

• For Moses, 40 days on the mountain.
• For Elijah, 40 days walking exhausted into God's presence.
• For the Israelites, 40 years shaping identity.
• For Jesus, 40 days in the wilderness.

Forty is the number of transition — not rushed, not forced, formed gently with God.
These days are not about fixing yourself.
They are about showing up — with your tea, your honesty, your heart — and letting God meet you where you truly are.

This is your 40-day remembering.`,
};

// ============================================================================
// 40-DAY DEVOTIONAL CONTENT
// ============================================================================

export const DEVOTIONAL_DAYS: DayContent[] = [
  // ========================================
  // VALLEY PHASE (Days 1-14)
  // ========================================
  {
    dayNumber: 1,
    title: 'When Life Brings You to Your Knees',
    phase: 'valley',
    reflection: `There comes a day when the weight becomes too much to hide. When years of being strong crash into a single moment you can no longer outrun. When your heart whispers, "I can't do this anymore."

This is not weakness.
This is where God meets you.

Not at the polished edges of your life — but in the unraveling.
You are not too broken for Him. You are exactly where His tenderness begins.`,
    scripture: {
      text: 'The Lord is close to the brokenhearted and saves those who are crushed in spirit.',
      reference: 'Psalm 34:18',
    },
    thoughtOfDay: 'Your breaking point is often God\'s meeting point.',
    prayer: 'God, I place the pieces I cannot hold into Your hands. Meet me here, in the truth of my exhaustion. Amen.',
    journalPrompt: 'What feels too heavy for you to carry today?',
  },
  {
    dayNumber: 2,
    title: 'The Quiet Where God Waits',
    phase: 'valley',
    reflection: `Life teaches us to rush — to outrun pain, to silence fear, to stay busy enough to avoid feeling.

But God waits in the quiet.
In the pause.
In the breath.
In the moment you finally slow down enough to feel your own heartbeat.
He meets you gently, like warm tea cupped in trembling hands.`,
    scripture: {
      text: 'Be still, and know that I am God.',
      reference: 'Psalm 46:10',
    },
    thoughtOfDay: 'Stillness is not the absence of strength — it is where strength returns.',
    prayer: 'Lord, settle the storm inside me. Quiet my thoughts until I can hear You again. Amen.',
    journalPrompt: 'What do you avoid feeling when life gets too loud?',
  },
  {
    dayNumber: 3,
    title: 'When You Walk Through a Valley You Didn\'t Choose',
    phase: 'valley',
    reflection: `Some valleys you entered without warning — a diagnosis, a loss, a sudden emptiness where safety used to live. Some valleys broke parts of you you didn't know could break.

Yet God does not watch from the mountaintop.
He walks the valley floor with you.
Step by trembling step.
Breath by shaking breath.`,
    scripture: {
      text: 'Even though I walk through the valley of the shadow of death, I will fear no evil, for You are with me.',
      reference: 'Psalm 23:4',
    },
    thoughtOfDay: 'You are not walking this valley alone.',
    prayer: 'God, walk beside me through this valley. Be my steady ground when everything else shifts. Amen.',
    journalPrompt: 'Which valley are you walking through right now? Write without holding back.',
  },
  {
    dayNumber: 4,
    title: 'The Wounds You Don\'t Speak About',
    phase: 'valley',
    reflection: `Some wounds don't bleed — they hide.
Deep inside the spaces you've learned to guard.
The losses you never grieved out loud.
The disappointments you whispered only to yourself.
The memories that still sting when no one is looking.
God sees what your silence tries to protect.
He meets you in the unspoken, the buried, the forgotten.`,
    scripture: {
      text: 'Pour out your heart before Him; God is a refuge for us.',
      reference: 'Psalm 62:8',
    },
    thoughtOfDay: 'What you hide cannot heal — and God sees it anyway.',
    prayer: 'Lord, shine light into the places I\'ve kept hidden for too long. Meet me where words have failed. Amen.',
    journalPrompt: 'What is the one wound you\'ve never spoken aloud?',
  },
  {
    dayNumber: 5,
    title: 'The Day You Realise You\'re Still Here',
    phase: 'valley',
    reflection: `There is a morning — soft, unexpected — where you wake up and realise... You survived.

Not because you had perfect faith.
Not because you were unbreakable.
But because God carried you through moments you didn't even feel Him in.

This is not just another morning.
This is mercy — quietly continuing.`,
    scripture: {
      text: 'Because of the Lord\'s great love we are not consumed, for His mercies never fail. They are new every morning.',
      reference: 'Lamentations 3:22-23',
    },
    thoughtOfDay: 'Your survival is a testimony, not an accident.',
    prayer: 'God, thank You for holding me through the nights that felt endless. Breathe gentle life into me today. Amen.',
    journalPrompt: 'What have you survived that you once feared you wouldn\'t?',
  },
  {
    dayNumber: 6,
    title: 'When Life Has Taken Too Much From You',
    phase: 'valley',
    reflection: `There are seasons where loss stacks itself inside your chest — layer after layer — until breathing feels like effort.

Loss of people.
Loss of stability.
Loss of innocence.
Loss of parts of yourself.

But God fills what life emptied.
He restores what grief hollowed out.
He rebuilds what was taken.`,
    scripture: {
      text: 'He restores my soul.',
      reference: 'Psalm 23:3',
    },
    thoughtOfDay: 'Loss does not have the final word — God does.',
    prayer: 'Lord, meet me in the places hollowed out by grief. Restore the parts of me that feel missing. Amen.',
    journalPrompt: 'Which loss feels heaviest today?',
  },
  {
    dayNumber: 7,
    title: 'When You\'re Tired of Being Strong',
    phase: 'valley',
    reflection: `Strength was never meant to be worn like armour every day — yet life forced you into it.

You became the one who keeps going.
The one who holds everything together.
The one who doesn't fall apart.
But strength without rest becomes a burden.
God whispers, "You may put it down now."`,
    scripture: {
      text: 'Come to Me... and I will give you rest.',
      reference: 'Matthew 11:28',
    },
    thoughtOfDay: 'You were never meant to carry everything alone.',
    prayer: 'God, I\'m tired. Teach me how to rest in You. Hold what I can\'t anymore. Amen.',
    journalPrompt: 'Where do you pretend you\'re strong when you\'re actually exhausted?',
  },
  {
    dayNumber: 8,
    title: 'When Your Dreams Didn\'t Unfold',
    phase: 'valley',
    reflection: `There is grief that comes from losing something you once held — and then there is grief that comes from losing something that never had a chance to live.

Dreams that faded quietly.
Plans that dissolved.
Visions of your life that never materialised.
God is not finished when a dream is.
He writes beyond endings.`,
    scripture: {
      text: 'For I know the plans I have for you...',
      reference: 'Jeremiah 29:11',
    },
    thoughtOfDay: 'A closed door is not a closed future.',
    prayer: 'Lord, comfort the places where disappointment still stings. Reveal the path You are unfolding. Amen.',
    journalPrompt: 'Which dream still aches inside you?',
  },
  {
    dayNumber: 9,
    title: 'When the World Feels Too Loud',
    phase: 'valley',
    reflection: `Some days the world presses in too tightly — too much noise, too much responsibility, too many expectations.

You shrink inside yourself, not because you lack strength, but because you carry too much.

But God sees you.
He notices when you're overwhelmed.
He gathers you into quiet spaces.
He whispers peace into the loud places.`,
    scripture: {
      text: 'Under His wings you will find refuge.',
      reference: 'Psalm 91:4',
    },
    thoughtOfDay: 'God hears even the quiet cries.',
    prayer: 'God, quiet the noise around me and within me. Let me feel Your shelter today. Amen.',
    journalPrompt: 'Where in your life do you feel most overwhelmed?',
  },
  {
    dayNumber: 10,
    title: 'When the Future Feels Fragile',
    phase: 'valley',
    reflection: `Fear doesn't always come from weakness — often it comes from surviving more than most people know. When you've endured so much, tomorrow can feel uncertain.

But God goes before you.
Into every unknown.
Into every possibility.
Into every chapter yet to unfold.`,
    scripture: {
      text: 'Let not your heart be troubled... My peace I give to you.',
      reference: 'John 14:27',
    },
    thoughtOfDay: 'Nothing ahead of you is stronger than the God beside you.',
    prayer: 'Lord, calm my fears about tomorrow. Walk ahead of me, lighting the path. Amen.',
    journalPrompt: 'What part of the future do you want to place fully in God\'s hands?',
  },
  {
    dayNumber: 11,
    title: 'When Your Heart Feels Too Tired to Hope',
    phase: 'valley',
    reflection: `There are days when your heart feels worn thin — not just tired, but hollowed. Days where hope feels like a weight too heavy to lift. When you've had loss layered over loss, blow after blow, disappointment after disappointment... and you whisper, "God, I don't know if I can hope again."

But God never asked you to supply your own hope.
He is the God who breathes hope into dust.
When your heart is too tired to rise, He leans close.
He holds the pieces steady. He whispers strength back into your bones.`,
    scripture: {
      text: 'My flesh and my heart may fail, but God is the strength of my heart.',
      reference: 'Psalm 73:26',
    },
    thoughtOfDay: 'God meets you even when your hope doesn\'t.',
    prayer: 'Lord, my heart feels worn and empty. Restore the hope I cannot create myself. Breathe life where I feel numb. Amen.',
    journalPrompt: 'Where has hope grown quiet inside you?',
  },
  {
    dayNumber: 12,
    title: 'When You Don\'t Recognise Yourself Anymore',
    phase: 'valley',
    reflection: `Life reshapes you.
Loss reshapes you.
Grief, exhaustion, responsibility — all of it changes the woman in the mirror.
Sometimes you wake up and realise you don't know who you are anymore.

You've been the strong one, the responsible one, the survivor... for so long.
But God is not trying to bring back the old you.
He is forming someone deeper, rooted, steadier — a woman shaped by grace, not by wounds.

You are not lost.
You are becoming.`,
    scripture: {
      text: 'Behold, I am doing a new thing... do you not perceive it?',
      reference: 'Isaiah 43:19',
    },
    thoughtOfDay: 'Becoming is not losing — it is transforming.',
    prayer: 'Lord, help me trust who I am becoming. Meet me as I grow, shift, and rediscover myself. Amen.',
    journalPrompt: 'What parts of yourself do you miss? Which new parts do you sense God forming?',
  },
  {
    dayNumber: 13,
    title: 'When Life Has Broken Pieces You Didn\'t Know Existed',
    phase: 'valley',
    reflection: `There are breaks that come quietly.
They tear through childhood memories, stolen innocence, lost safety, and years of disappointments that were never spoken.

Not all wounds have names.
Not all losses have funerals.
Some breaking happens inside, silently.

But God sees every fracture.
He is gentle with broken things.
He does not rush you.
He gathers you.
Piece by piece.
Shatter by shatter.

What feels ruined to you is sacred in His hands.`,
    scripture: {
      text: 'He heals the broken in heart, and binds up their wounds.',
      reference: 'Psalm 147:3',
    },
    thoughtOfDay: 'Nothing in you is too broken for God to touch.',
    prayer: 'Lord, reach into the deep places of me — the wounds I don\'t have words for. Hold what hurts. Heal what I cannot carry. Amen.',
    journalPrompt: 'What hidden wound do you want God to see today?',
  },
  {
    dayNumber: 14,
    title: 'When You Feel You\'ve Failed Yourself',
    phase: 'valley',
    reflection: `Sometimes the heaviest pain comes from within.
When you feel you should have known better, done better, been stronger, left sooner, spoken up...
When you feel responsible for what life did to you.

But God does not condemn you.
He sees the battles you fought silently, the burdens you lifted alone, the moments you tried when no one noticed.
He honours the woman who kept going when everything inside her was collapsing.

You did not fail yourself. You survived yourself.`,
    scripture: {
      text: 'There is now no condemnation for those who are in Christ Jesus.',
      reference: 'Romans 8:1',
    },
    thoughtOfDay: 'God does not judge your survival — He honours it.',
    prayer: 'God, silence the voice that tells me I failed. Let Your truth speak louder than my shame. Amen.',
    journalPrompt: 'What do you need to forgive yourself for?',
  },

  // ========================================
  // WAITING PHASE (Days 15-21)
  // ========================================
  {
    dayNumber: 15,
    title: 'When You Can\'t Feel God at All',
    phase: 'waiting',
    reflection: `There are seasons when God feels absent.
Your prayers feel flat.
Your spirit feels numb.
Your faith feels thin.
But silence is not abandonment.
Distance is not rejection.

God has not moved — your pain has simply grown loud.
Even when you cannot feel Him, He surrounds you.
Even when you cannot hear Him, He speaks gently into the cracks.
Even when you cannot sense Him, He carries you.
Your inability to feel Him does not diminish His nearness.`,
    scripture: {
      text: 'I will never leave you nor forsake you.',
      reference: 'Hebrews 13:5',
    },
    thoughtOfDay: 'God\'s presence is constant even when your awareness is not.',
    prayer: 'Lord, I cannot feel You — but I choose to believe You are here. Anchor my heart in Your nearness. Amen.',
    journalPrompt: 'When was the last time you felt distant from God? What was happening in your life then?',
  },
  {
    dayNumber: 16,
    title: 'When You Feel Emptied Beyond Words',
    phase: 'waiting',
    reflection: `There comes a point where you don't just feel tired — you feel emptied.

By loss.
By grief.
By responsibilities that were never meant for your shoulders.
By years that took more than they gave.

But emptiness is not the end.
It is the space where God pours Himself in.
He rebuilds what loss hollowed.
He breathes life where grief drained everything dry.

You have lost much — but God never lets loss have the final word.`,
    scripture: {
      text: 'I will restore to you the years that the locust has eaten.',
      reference: 'Joel 2:25',
    },
    thoughtOfDay: 'God fills the places life emptied.',
    prayer: 'Restore what feels stripped and silent in me, Lord. Amen.',
    journalPrompt: 'What part of you feels most emptied by life?',
  },
  {
    dayNumber: 17,
    title: 'When Strength Has Cost You Too Much',
    phase: 'waiting',
    reflection: `You learned to hold everything together — for everyone.

You became the steady one.
The reliable one.
The strong one.

But God never asked you to carry the world alone. He invites you to put the weight down — even for a moment.
To breathe. To soften. To rest.`,
    scripture: {
      text: 'Yes, my soul, find rest in God; my hope comes from Him. Truly He is my rock and my salvation.',
      reference: 'Psalm 62:5-6',
    },
    thoughtOfDay: 'Rest is holy.',
    prayer: 'Lord, I\'m tired of being strong. Hold me where I cannot hold myself. Amen.',
    journalPrompt: 'Where are you pretending to be strong when you are longing to rest?',
  },
  {
    dayNumber: 18,
    title: 'When the Life You Imagined Never Arrived',
    phase: 'waiting',
    reflection: `There is a grief that comes from doors that never opened.
From futures that dissolved.
From dreams that faded without warning.
You wonder if you misheard God.
If you failed.
If you missed your chance.

But God is not confused by detours.
What slipped through your fingers was not the end.
God writes beyond endings.`,
    scripture: {
      text: 'The Lord directs the steps of the godly. He delights in every detail of their lives.',
      reference: 'Psalm 37:23',
    },
    thoughtOfDay: 'Lost dreams make space for God\'s new ones.',
    prayer: 'God, comfort the grief of dreams that never unfolded. Guide my steps into what You are unfolding now. Amen.',
    journalPrompt: 'Which dream still aches — and where might God be gently leading you instead?',
  },
  {
    dayNumber: 19,
    title: 'When You Feel Invisible in the Noise',
    phase: 'waiting',
    reflection: `Life can overwhelm even the bravest heart.
Noise everywhere.
Expectations.
Responsibilities.
The pressure to keep going while feeling unseen, unheard, overlooked.

You begin to shrink inside yourself — wondering if your voice matters, if your presence matters.

But you matter deeply to God.
He sees you.
He knows where the weight sits.
He steps into the overwhelm and stays.`,
    scripture: {
      text: 'You have searched me, Lord, and You know me. You know when I sit and when I rise.',
      reference: 'Psalm 139:1-3',
    },
    thoughtOfDay: 'You are not small to God.',
    prayer: 'God, when everything feels too loud, remind me that You see me. Let me feel safe in Your knowing. Amen.',
    journalPrompt: 'Where do you feel unseen — and what would it mean to believe God sees you there?',
  },
  {
    dayNumber: 20,
    title: 'When Tomorrow Feels Unsafe',
    phase: 'waiting',
    reflection: `After everything you've survived, it makes sense that the future feels fragile.
Unpredictable.
Uncertain.

Fear whispers: "What if it happens again?"
God answers: "I go before you."

You don't walk into tomorrow alone.
You don't step into the unknown unsupported.
God is already in every future moment — steadying you before you arrive.`,
    scripture: {
      text: 'The Lord Himself goes before you and will be with you; He will never leave you nor forsake you.',
      reference: 'Deuteronomy 31:8',
    },
    thoughtOfDay: 'God is already standing in your tomorrow.',
    prayer: 'Lord, calm the fears that rise when I think of the future. Steady me in Your presence. Amen.',
    journalPrompt: 'What fear about the future do you want to place in God\'s hands?',
  },
  {
    dayNumber: 21,
    title: 'When You\'re Afraid to Hope Again',
    phase: 'waiting',
    reflection: `Hope is frightening when life has disappointed you more than once.
You learn not to expect anything good, because expecting feels dangerous.
You learn to brace for impact.
You learn to flinch at the thought of good news.

But God does not ask you to hope with the part of you that is bruised.
He asks you to hope with the part of you that is His.
Hope isn't pretending.
Hope is trusting that God is doing something even when you see nothing.`,
    scripture: {
      text: 'May Your unfailing love be my comfort.',
      reference: 'Psalm 119:76',
    },
    thoughtOfDay: 'Hope is not naive. Hope is courage.',
    prayer: 'Lord, hope scares me. Teach my heart how to trust again — gently, slowly, safely. Stay with me in the uncertainty. Amen.',
    journalPrompt: 'What part of hope feels unsafe to you right now?',
  },

  // ========================================
  // RISING PHASE (Days 22-33)
  // ========================================
  {
    dayNumber: 22,
    title: 'When You Feel Like You\'ve Lost Yourself',
    phase: 'rising',
    reflection: `Life changes you.
Loss changes you.
Hard seasons reshape your identity until you barely recognise the woman in the mirror.
But God does not mourn who you used to be.
He honours who you are becoming.
You are not losing yourself — you are shedding the layers life forced on you.`,
    scripture: {
      text: 'You hem me in — behind and before.',
      reference: 'Psalm 139:5',
    },
    thoughtOfDay: 'You are not lost. You are in transition.',
    prayer: 'God, I feel unfamiliar to myself. Anchor me in Who You are so I can rediscover who I am. Amen.',
    journalPrompt: 'Write down the parts of yourself you feel disconnected from. Ask God to reintroduce you to yourself.',
  },
  {
    dayNumber: 23,
    title: 'When Rest Feels Impossible',
    phase: 'rising',
    reflection: `You have lived in survival mode for so long that rest feels foreign.
Even when your body stops, your mind keeps running.
Even when you sit down, your spirit stays braced.
But rest is not laziness.
Rest is worship.

Rest is trusting God enough to stop holding everything up with your own hands.`,
    scripture: {
      text: 'In quietness and trust is your strength.',
      reference: 'Isaiah 30:15',
    },
    thoughtOfDay: 'Rest is not earned — it is given.',
    prayer: 'Lord, teach me how to unwind what life has wound tightly inside me. Let Your presence become my rest. Amen.',
    journalPrompt: 'What keeps your heart from resting, even when your body is still?',
  },
  {
    dayNumber: 24,
    title: 'When You Feel Like You\'re Starting Over Too Many Times',
    phase: 'rising',
    reflection: `Starting over is exhausting.
It breaks your confidence.
It makes you question your worth.
It makes you feel behind — even when you're doing the best you can.

But God builds foundations in places where old ones have collapsed.
Nothing you lost disqualifies you from what God is building.`,
    scripture: {
      text: 'He who began a good work in you will carry it on to completion.',
      reference: 'Philippians 1:6',
    },
    thoughtOfDay: 'Starting over is not failure — it is formation.',
    prayer: 'God, give me courage for the new beginning I didn\'t ask for. Strengthen what feels unsteady inside me. Amen.',
    journalPrompt: 'Where are you beginning again? How does it feel? Be honest.',
  },
  {
    dayNumber: 25,
    title: 'When You\'re Learning to Breathe Again',
    phase: 'rising',
    reflection: `There are seasons when breathing feels like work.
Grief tightens the chest.
Fear squeezes the lungs.
Anxiety sits heavy on the ribs.
But breath is God's first gift to the human soul.
And He restores what He gave.
You don't have to breathe deeply today.
Just breathe.
God is in the inhale.
God is in the exhale.`,
    scripture: {
      text: 'The breath of the Almighty gives me life.',
      reference: 'Job 33:4',
    },
    thoughtOfDay: 'Even shallow breaths matter — they still count.',
    prayer: 'Lord, breathe Your peace into the parts of me that feel tight and strained. Fill me with life again. Amen.',
    journalPrompt: 'Where in your body do you feel tension right now? Invite God into that space.',
  },
  {
    dayNumber: 26,
    title: 'When You\'re Afraid to Trust Again',
    phase: 'rising',
    reflection: `Trust feels dangerous when life has disappointed you repeatedly.
You start expecting the worst — even from God.
Not because you doubt Him, but because you've been shaken too many times to stand steady.
But trust is not a leap — it is a leaning.
A gentle lean of your tired heart into the One who hasn't moved.`,
    scripture: {
      text: 'When I am afraid, I put my trust in You.',
      reference: 'Psalm 56:3',
    },
    thoughtOfDay: 'Trust begins with one small lean, not a giant step.',
    prayer: 'God, I don\'t know how to trust right now, but I can lean. Hold me steady as I learn. Amen.',
    journalPrompt: 'What makes trust feel risky to you?',
  },
  {
    dayNumber: 27,
    title: 'When You\'re Learning to Feel Again',
    phase: 'rising',
    reflection: `Life can numb you.
You become functional.
Efficient.
Capable.
But disconnected from your own heart.

Feeling again is frightening — but necessary.
God does not awaken emotion to hurt you.
He awakens it to restore you.`,
    scripture: {
      text: 'I will give them a heart of flesh.',
      reference: 'Ezekiel 11:19',
    },
    thoughtOfDay: 'Numbness protects, but it also withholds growth.',
    prayer: 'Lord, gently awaken what life has shut down in me. Teach me to feel safely again. Amen.',
    journalPrompt: 'What emotion have you avoided facing? Why?',
  },
  {
    dayNumber: 28,
    title: 'When You\'re Afraid of Losing More',
    phase: 'rising',
    reflection: `When you've already lost much, every new chapter feels fragile.
You start holding things loosely because you don't trust the ground beneath your feet.

But God is the Keeper of what is truly yours.
Nothing He ordains for your life can slip through your fingers.`,
    scripture: {
      text: 'The Lord will keep you from all harm.',
      reference: 'Psalm 121:7',
    },
    thoughtOfDay: 'Fear exaggerates loss. God protects what matters.',
    prayer: 'God, calm the fear that waits for something to go wrong. Anchor me in Your protection. Amen.',
    journalPrompt: 'What loss are you afraid of repeating?',
  },
  {
    dayNumber: 29,
    title: 'When You Are Tired of Waiting',
    phase: 'rising',
    reflection: `Waiting wears the strongest hearts thin.
You wait for clarity.
You wait for strength.
You wait for direction.
You wait for life to stop hurting.

Waiting is not wasted time — it is a womb where God grows what you cannot yet see.`,
    scripture: {
      text: 'Those who wait on the Lord shall renew their strength.',
      reference: 'Isaiah 40:31',
    },
    thoughtOfDay: 'Waiting is not empty — God is working in the unseen.',
    prayer: 'Lord, I am weary of waiting. Renew my strength as only You can. Amen.',
    journalPrompt: 'What are you waiting for that feels overdue?',
  },
  {
    dayNumber: 30,
    title: 'When You Begin to Sense a Shift',
    phase: 'rising',
    reflection: `The valley does not end suddenly.
It ends slowly — quietly — with a subtle rise in your spirit.

Not joy.
Not clarity.
Not strength.

Just a small, surprising softness.
A tiny flicker that whispers, "Maybe I won't feel like this forever."

This flicker is not from you — it is from God.
It is the first light after a long night.`,
    scripture: {
      text: 'Weeping may endure for a night, but joy comes in the morning.',
      reference: 'Psalm 30:5',
    },
    thoughtOfDay: 'The shift begins long before the sunrise.',
    prayer: 'Lord, thank You for even the smallest movement of light. Strengthen it. Let it grow. Amen.',
    journalPrompt: 'What is the smallest sign of change you\'ve noticed lately?',
  },
  {
    dayNumber: 31,
    title: 'When You Reach the End of Yourself',
    phase: 'rising',
    reflection: `There comes a day when your chest feels too tight to breathe, when anxiety claws at your ribs, when fear sits heavy in your throat, and you realise you cannot outrun life anymore.

This is the day you reach the end of yourself.
It is the day your strength shatters into dust.
The day your courage feels like a thin thread about to snap.
The day you look at all you've lost — people, safety, stability, pieces of yourself — and whisper, "God... I can't do this."

And yet, even here — in the trembling, the overwhelm, the fear — God kneels beside you.
He does not ask you to rise. He does not ask you to be brave. He simply stays.`,
    scripture: {
      text: 'When my spirit grows faint within me, it is You who know my way.',
      reference: 'Psalm 142:3',
    },
    thoughtOfDay: 'The end of yourself is not the end — it is where God takes over.',
    prayer: 'God, I cannot carry this. Sit with me here in the place I never wanted to be. Hold my shaking heart. Be my breath when fear steals it. Amen.',
    journalPrompt: 'What fear feels the loudest today? Let God see it.',
  },
  {
    dayNumber: 32,
    title: 'When Loneliness Feels Like a Second Skin',
    phase: 'rising',
    reflection: `There is a loneliness that does not come from being alone — but from feeling unseen while surrounded by people.
A loneliness that grows from years of being the strong one, the reliable one, the one who never falls apart in front of others.

But inside, something is collapsing.
You look around and wonder, "Does anyone see what I'm carrying?" "Does anyone hear my silence?" "Does anyone notice I am disappearing?"

Loneliness feels like a cold room with no door.
But God enters even the rooms no one else knows exist.
He sits beside you in the quiet.
He fills the space no one else stepped into.
He whispers, "You are not invisible to Me."`,
    scripture: {
      text: 'I will not leave you as orphans; I will come to you.',
      reference: 'John 14:18',
    },
    thoughtOfDay: 'You may feel unseen, but God\'s eyes have never left you.',
    prayer: 'Lord, this loneliness is heavy. Come close. Wrap Yourself around the places that ache the most. Let me feel Your presence where people have been absent. Amen.',
    journalPrompt: 'Where in your life do you feel most unseen?',
  },
  {
    dayNumber: 33,
    title: 'When Anxiety Shakes the Foundations',
    phase: 'rising',
    reflection: `Some storms roar on the inside. No one sees the trembling hands, the racing mind, the nights you lie awake staring into the dark, afraid to close your eyes because fear follows you there too.

Anxiety steals your breath.
It makes the future look dangerous, the present feel unsafe, and your own thoughts feel like enemies.

But here is the truth anxiety hides from you:
God has not abandoned you to the storm within.
Even when your pulse is racing, even when your thoughts spiral, even when your fear is louder than your faith — God's hand rests steady on your shaking.
His presence is not shaken by your fear.`,
    scripture: {
      text: 'When anxiety was great within me, Your consolation brought me joy.',
      reference: 'Psalm 94:19',
    },
    thoughtOfDay: 'Your anxiety does not scare God. He holds you through it.',
    prayer: 'God, my mind is loud and my heart is trembling. Quiet the storm inside me. Lay Your peace over me like a warm blanket. Stay near. Amen.',
    journalPrompt: 'Write down the anxious thought that keeps returning. Place it in God\'s hands.',
  },

  // ========================================
  // BECOMING PHASE (Days 34-40)
  // ========================================
  {
    dayNumber: 34,
    title: 'When Grief Becomes Your Shadow',
    phase: 'becoming',
    reflection: `Grief doesn't always come with sobbing.
Sometimes it comes as tears that slip out before you can stop them.
Tears you didn't plan.
Tears you don't understand.
Tears that fall even when you're trying to be strong.

Some tears come late at night.
Some come in silence.
Some come when your body remembers what your mind tries to forget.

You grieve people.
You grieve moments.
You grieve the life that ended without warning.
Grief is heavy.
And some days, the tears are the only proof of it.

But God does not turn away from tears.
He sees each one.
He gathers them carefully.
He keeps them — as if every tear matters... because it does.`,
    scripture: {
      text: 'You keep track of all my sorrows. You collect all my tears in Your bottle. You record each one in Your book.',
      reference: 'Psalm 56:8',
    },
    thoughtOfDay: 'Grief is not a sign of weakness — it is proof of love, and God honours both. Sometimes the tears keep coming because love had nowhere else to go.',
    prayer: 'Lord, the tears keep falling. I don\'t always know why. I don\'t always know how to stop them. Please hold them for me. Please hold me too. Amen.',
    journalPrompt: 'What do your tears know that your words cannot say yet?',
  },
  {
    dayNumber: 35,
    title: 'When You Fear You Will Never Rise Again',
    phase: 'becoming',
    reflection: `This is the lowest point — the place where your soul whispers, "What if this is where I stay?"
What if the fear never settles?
What if the grief never softens?
What if I never feel like myself again?
What if life has taken too much?

This fear is real. It comes from exhaustion, from carrying too much for too long, from standing in the ruins of what used to be your life.

But here — right here, in the lowest place — God places His hand beneath your chin.
He lifts your face gently toward light you can't yet see.
He whispers, "You will rise — not because you are strong, but because I am."

This is not the end.
This is the ground floor of your becoming.`,
    scripture: {
      text: 'Though he fall, he shall not be cast down; for the Lord upholds him with His hand.',
      reference: 'Psalm 37:24',
    },
    thoughtOfDay: 'You may feel finished, but God has already planned your rising.',
    prayer: 'God, I am afraid I will never stand again. Hold me until strength returns. Guide me toward the light I cannot yet see. Lift me in Your time. Amen.',
    journalPrompt: 'What is the deepest fear you hold about your future? Write it honestly before God.',
  },
  {
    dayNumber: 36,
    title: 'When a New Breath Finds You',
    phase: 'becoming',
    reflection: `Somewhere after the breaking, after the fear, after the exhaustion — something shifts.
It is small.
It is quiet.
It is easy to miss.
A breath comes easier.
A morning feels less heavy.
A thought of hope flickers like a weak flame.
This is not the full rising — it is the first inhale.
And God is in it.
He is the one steadying your breath, loosening the tightness, planting the first seeds of renewal.`,
    scripture: {
      text: 'Do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with My righteous right hand.',
      reference: 'Isaiah 41:10',
    },
    thoughtOfDay: 'Hope often returns as a whisper, not a shout.',
    prayer: 'God, thank You for this small breath of relief. Let it grow. Strengthen the light You\'re placing within me. Amen.',
    journalPrompt: 'What feels slightly lighter today than it did a month ago?',
  },
  {
    dayNumber: 37,
    title: 'When Strength Begins to Return',
    phase: 'becoming',
    reflection: `It happens slowly — the rise.
Not all at once, not in a dramatic moment, but in tiny shifts that gather themselves inside your bones.

You wake up and realise you didn't dread the day.
You step into a moment without trembling.
You feel yourself standing a little taller, a little steadier.

This is God strengthening what life tried to weaken.`,
    scripture: {
      text: 'He gives strength to the weary and increases the power of the weak.',
      reference: 'Isaiah 40:29',
    },
    thoughtOfDay: 'Renewal rarely arrives loudly — but it always arrives.',
    prayer: 'Lord, build my strength in ways I cannot yet see. Let Your power settle gently into my weakness. Amen.',
    journalPrompt: 'Where do you feel a small but real return of strength?',
  },
  {
    dayNumber: 38,
    title: 'When You Believe You Are Worth Rising',
    phase: 'becoming',
    reflection: `Growth begins when you realise you are worthy of standing again — not because of what you've done, but because of who God is.

You begin to see yourself with softer eyes.
You speak to yourself with more kindness.
You allow yourself to hope — not because life is perfect, but because God is present.
Worthiness returns slowly but powerfully.`,
    scripture: {
      text: 'You are precious in My sight... and I love you.',
      reference: 'Isaiah 43:4',
    },
    thoughtOfDay: 'Your worth is not determined by what broke you.',
    prayer: 'Lord, help me believe what You say about me. Teach my heart to trust Your voice over every lie. Amen.',
    journalPrompt: 'What truth about your worth do you want to hold onto today?',
  },
  {
    dayNumber: 39,
    title: 'When You Feel God Rising Within You',
    phase: 'becoming',
    reflection: `There is a moment — unmistakable — where you realise the strength you feel is not your own.
It is quieter.
Wiser.
Steadier.
It is God, rising within you.
The fear begins to loosen.
The grief softens at the edges.
The anxiety loses its grip.
The loneliness begins to break open into connection — with Him first.
This is the rise.
This is the becoming.
This is the rebuilding.`,
    scripture: {
      text: 'Greater is He who is in you...',
      reference: '1 John 4:4',
    },
    thoughtOfDay: 'The strength you feel now is the same God who held you in the darkest moments.',
    prayer: 'God, fill every part of me. Rise in me. Live in me. Lead me into the fullness of who You made me to be. Amen.',
    journalPrompt: 'Where do you sense God strengthening you?',
  },
  {
    dayNumber: 40,
    title: 'When You Stand Again',
    phase: 'becoming',
    reflection: `This is the day you look back and realise:
You rose.
Not in one moment, not perfectly, not without shaking — but you rose.
You are not who you were when this began.
You are steadier.
Softer.
Stronger.
More rooted in God than ever before.
You survived the valley.
You breathed through the fear.
You stood in the grief.
You endured the loneliness.
And God met you in every moment.
This is not the end of your story — it is the beginning of your becoming.`,
    scripture: {
      text: 'He makes all things new.',
      reference: 'Revelation 21:5',
    },
    thoughtOfDay: 'Your rising is holy — and it has only begun.',
    prayer: 'God, thank You for carrying me through these forty days. Continue the work You have begun in me. Lead me forward with courage, softness, and renewed strength. Amen.',
    journalPrompt: 'What has changed within you over these forty days? Name it as your testimony.',
  },
];

// ============================================================================
// CLOSING CONTENT
// ============================================================================

export const CLOSING_CONTENT: ClosingContent = {
  finalPrayer: `Dear God,

For the woman who reached the end of this book, I ask You to meet her now — in the very place where her strength trembles and her heart whispers for peace.

Gather every broken piece she carries.
The pieces life scattered.
The pieces grief hollowed out.
The pieces she hid because she thought no one would understand.
The pieces she feared were lost forever.

Hold them in Your hands the way only You can — tenderly, intentionally, lovingly.

Remind her that she was never too shattered for You.
Never too tired.
Never too lost.
Never too far gone.

Let her feel the truth settle deep inside her:
That You were there in every tear,
in every valley,
in every quiet breaking.

That not once did You loosen Your grip on her soul.
And now, as she steps into whatever comes next,
place Your light in the cracks she once tried to hide.

Let her carry a heart rebuilt by Your mercy —
a heart that may no longer be clear crystal,
but shines with a beauty only the remaking of God can give.

Cover her with Your peace.
Steady her with Your presence.
And remind her, again and again,
that she is loved, held, seen, and carried
by the God who gathers dust and turns it into glory.

Amen.`,
  author: 'Lani',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getDayContent(dayNumber: number): DayContent | undefined {
  return DEVOTIONAL_DAYS.find((d) => d.dayNumber === dayNumber);
}

export function getDaysByPhase(phase: Phase): DayContent[] {
  return DEVOTIONAL_DAYS.filter((d) => d.phase === phase);
}

export function getPhaseForDay(dayNumber: number): Phase {
  if (dayNumber <= 14) return 'valley';
  if (dayNumber <= 21) return 'waiting';
  if (dayNumber <= 33) return 'rising';
  return 'becoming';
}

export function getPhaseInfo(phase: Phase): { name: string; days: string; description: string } {
  const phases = {
    valley: {
      name: 'The Valley',
      days: 'Days 1-14',
      description: 'Acknowledging pain, brokenness, grief. The descent before rising.',
    },
    waiting: {
      name: 'The Waiting',
      days: 'Days 15-21',
      description: 'Transition, silence, learning to trust in the unseen.',
    },
    rising: {
      name: 'The Rising',
      days: 'Days 22-33',
      description: 'Emergence, identity reformation, learning to feel again.',
    },
    becoming: {
      name: 'The Becoming',
      days: 'Days 34-40',
      description: 'Integration, hope, strength, the new self.',
    },
  };
  return phases[phase];
}

export default {
  FRONT_MATTER,
  DEVOTIONAL_DAYS,
  CLOSING_CONTENT,
  getDayContent,
  getDaysByPhase,
  getPhaseForDay,
  getPhaseInfo,
};
