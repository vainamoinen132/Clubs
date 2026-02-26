/**
 * data_scenes.js
 * Massively expanded branching narrative scenes for Relationship Milestones.
 * Each category now has deep pools of scene variants — a random one is selected
 * at each milestone so repetition is greatly reduced across long playthroughs.
 */

window.RelationshipScenes = {
    getScene(f1, f2, milestoneNumber) {
        let cat = this._determineCategory(f1, f2);
        let pool = this.categories[cat];
        if (!pool) pool = this.categories['equal_rivals'];

        // Each milestone slot is an ARRAY of possible scenes — pick one at random
        let slot = pool[milestoneNumber - 1];
        if (!slot) return this._getDefaultScene(milestoneNumber);

        // If it's an array of variants, pick randomly
        if (Array.isArray(slot)) {
            return slot[Math.floor(Math.random() * slot.length)];
        }
        return slot;
    },

    _determineCategory(f1, f2) {
        let a1 = f1.personality.archetype;
        let a2 = f2.personality.archetype;
        let pair = [a1, a2].sort().join('_');

        if (pair === 'Alpha_Alpha' || pair === 'Alpha_Rebel' || pair === 'Rebel_Rebel') return 'dominant_dominant';
        if (pair === 'Alpha_Underdog' || pair === 'Ice Queen_Showboat' || pair === 'Alpha_Showboat') return 'dominant_submissive';
        if (pair === 'Ice Queen_Rebel' || pair === 'Alpha_Ice Queen' || pair === 'Rebel_Technician') return 'cold_volatile';
        if (pair === 'Technician_Technician' || pair === 'Strategist_Strategist' || pair === 'Strategist_Technician') return 'equal_rivals';
        if (pair === 'Technician_Underdog' || pair === 'Strategist_Underdog') return 'mentor_student';
        if (pair === 'Showboat_Showboat' || pair === 'Underdog_Underdog') return 'mirror_attraction';

        if (f1.personality.dominance_hunger > 70 && f2.personality.dominance_hunger > 70) return 'dominant_dominant';
        if (f1.personality.submissive_lean > 60 && f2.personality.submissive_lean > 60) return 'mirror_attraction';
        return 'equal_rivals';
    },

    _getDefaultScene(m) {
        const defaults = [
            {
                title: `First Contact`,
                text: "A strange tension fills the room. Sweaty bodies, heavy breathing, and a dangerous spark of competition ignite between the two women.",
                choices: [{ text: "Let it play out.", effect: (r) => r, result: "The dynamic continues to develop." }]
            },
            {
                title: `Escalation`,
                text: "Something has shifted between them. Every glance holds a little too much weight. Every sparring drill runs a little too long, a little too heated.",
                choices: [{ text: "Observe.", effect: (r) => r, result: "You decide to watch and see where this leads." }]
            },
            {
                title: `The Crossing`,
                text: "The professional boundary between them has quietly dissolved. Neither acknowledges it directly, but everyone in the gym knows something changed.",
                choices: [
                    { text: "Let it be.", effect: (r) => 'attraction', result: "You give them space to figure it out." },
                    { text: "Force a confrontation.", effect: (r) => 'rivalry', result: "You demand they address it directly — with predictably explosive results.", stress: 10 }
                ]
            },
            {
                title: `Depth`,
                text: "Whatever exists between these two fighters has roots now. It shows in how they move around each other — always aware, always calibrating.",
                choices: [{ text: "Acknowledge the bond.", effect: (r) => r, result: "The relationship deepens." }]
            },
            {
                title: `Locked In`,
                text: "This is permanent. The relationship between them has become a defining force in the gym — for better or worse.",
                choices: [{ text: "Accept it.", effect: (r) => r, result: "Relationship locked." }]
            }
        ];
        return defaults[Math.min(m - 1, defaults.length - 1)];
    },

    categories: {

        // ══════════════════════════════════════════════════════════════════════
        // DOMINANT × DOMINANT  (Alpha/Alpha, Alpha/Rebel, Rebel/Rebel)
        // ══════════════════════════════════════════════════════════════════════
        dominant_dominant: [
            // M1 — array of variants
            [
                {
                    title: "Alpha Standoff",
                    text: "The training mats are slick with sweat. {F1} and {F2} are grappling fiercely, neither willing to yield an inch. {F1} manages a deep reverse head scissors, trapping {F2}'s face tightly between her thighs. {F2} struggles, face flushed red, eyes locked furiously on {F1}'s smirking face above her.",
                    choices: [{ text: "Let them finish.", effect: (r) => 'aware', result: "They roll for another hour, the erotic tension palpable." }]
                },
                {
                    title: "Size Me Up",
                    text: "They meet in the corridor after training. {F1} slows her walk deliberately, forcing {F2} to either stop or squeeze past. {F2} stops. For a long moment, neither speaks. They simply assess each other — breathing, posture, hands, eyes. The whole corridor holds its breath.",
                    choices: [{ text: "Let it simmer.", effect: (r) => 'aware', result: "The assessment ends without a word. Both know what they found." }]
                },
                {
                    title: "Territory",
                    text: "{F1} walks into the weight room and finds {F2} using her preferred station. {F1} doesn't ask her to move. She sets up a rack six inches away and starts lifting. They work in furious, grinding silence for forty minutes, each set heavier than the last.",
                    choices: [{ text: "Let them compete.", effect: (r) => 'aware', result: "Neither stops first. They leave together, exhausted and somehow satisfied." }]
                },
                {
                    title: "The Look",
                    text: "Post-sparring, {F1} is wrapping her hands when {F2} drops a sweat-soaked towel on her lap and keeps walking without a word. {F1} looks up slowly. {F2} glances back over one shoulder, just once. The gym goes quiet.",
                    choices: [{ text: "Don't interfere.", effect: (r) => 'aware', result: "You sense it — whatever this is, it's just beginning." }]
                }
            ],

            // M2
            [
                {
                    title: "The Friction",
                    text: "A dispute over the premium sparring cage erupts. {F1} steps directly into {F2}'s personal space, their bare sweaty chests pressing together. {F1} whispers something highly degrading, challenging {F2}'s pride. The air is thick with aggressive sexual tension, mere seconds from exploding.",
                    choices: [
                        { text: "Order them to settle it on the mat.", effect: (r) => 'friction', result: "The rolling is vicious and deeply humiliating for the loser.", morale: 5, stress: 5 },
                        { text: "Separate them.", effect: (r) => 'friction', result: "You defuse it. The unresolved tension burns hotter.", morale: -5, stress: -5 }
                    ]
                },
                {
                    title: "Broken Equipment",
                    text: "A bag hook snaps during a session. Both fighters rush to grab the falling bag and end up chest-to-chest, hands tangled together around the leather. They hold it like that, two feet apart, neither letting go, breathing each other's exhale for a very long second.",
                    choices: [
                        { text: "Tell them to sort it out.", effect: (r) => 'friction', result: "They sort it out on the mat. Loudly.", stress: 10 },
                        { text: "Take the bag away.", effect: (r) => 'friction', result: "You remove the source of conflict. They are furious. At you. Together — for once.", morale: -5 }
                    ]
                },
                {
                    title: "Open Insults",
                    text: "{F2} makes a snide comment about {F1}'s last match in front of the whole team. {F1} goes very still — that specific, dangerous stillness of a predator about to move. She crosses the room in three steps, leans down to where {F2} is sitting, and says something low and precise that drains the color from {F2}'s face.",
                    choices: [
                        { text: "Let the dynamic run.", effect: (r) => 'friction', result: "The gym learned something today. So did {F2}.", stress: 15 },
                        { text: "Fine them both.", effect: (r) => 'friction', result: "They pay gladly. The respect is established regardless.", morale: -10 }
                    ]
                }
            ],

            // M3
            [
                {
                    title: "The Pivot",
                    text: "Late at night, the gym lights are dim. {F1} has {F2} pinned in a compromising mount, straddling her waist and squeezing her thighs tight. {F1}'s breath is heavy as she slowly traces {F2}'s jawline. The line between a violent fight and an intense submission is dangerously thin.",
                    choices: [
                        { text: "Tap into the violent rivalry.", effect: (r) => 'rivalry', result: "You remind them of their upcoming bouts. The grappling instantly turns hostile.", morale: 10, stress: 10 },
                        { text: "Let the attraction simmer.", effect: (r) => 'attraction', result: "You quietly leave. The physical dominance begins melting into lust.", morale: 0, stress: 15 }
                    ]
                },
                {
                    title: "Night Session",
                    text: "You come back for a forgotten phone. The lights are still on. {F1} and {F2} are on the mat — not sparring anymore. {F1} is on top, pinning {F2}'s wrists above her head, speaking quietly with her mouth very close to {F2}'s ear. {F2} is not struggling.",
                    choices: [
                        { text: "Leave quietly.", effect: (r) => 'attraction', result: "You never mention it. They both fight harder the next week.", morale: 10 },
                        { text: "Interrupt.", effect: (r) => 'rivalry', result: "They spring apart. Both are furious and suddenly all business.", stress: 15 }
                    ]
                },
                {
                    title: "The Bet",
                    text: "{F1} proposes a bet to {F2}: one submission-only round. Winner gets to make one demand of the other — anything. {F2} accepts without hesitation. They disappear into the back room. You don't hear anything for a long time. When they emerge, {F2} is wearing a different expression entirely.",
                    choices: [
                        { text: "Ask what the demand was.", effect: (r) => 'attraction', result: "Neither answers. But {F2} doesn't meet your eyes for a week.", morale: 5 },
                        { text: "Don't ask.", effect: (r) => 'rivalry', result: "Smart. Some things fuel better from the dark.", stress: 10 }
                    ]
                }
            ],

            // M4
            [
                {
                    title: "Declaration of Supremacy",
                    text: "During a tense press conference, {F1} loudly declares she will break {F2} and make her beg. {F2} kicks her chair away, steps up, and grabs {F1} by the throat — pulling her so close their lips brush. Flashbulbs explode. The room erupts. The whole world sees it.",
                    choices: [
                        { text: "Hype the erotic feud.", effect: (r) => r === 'attraction' ? 'obsession' : 'bitter_rivals', result: "Media eats it up. Fame skyrockets.", fame: 500, morale: -10 },
                        { text: "Fine them both.", effect: (r) => r, result: "They pay. Their private fixation burns hotter.", morale: -15 }
                    ]
                },
                {
                    title: "The Interview",
                    text: "A journalist asks {F1} what she thinks of {F2}. {F1} takes a long pause, looks directly into the camera, and says: 'She's the only person in this league I'd be afraid to face on a bad day. And I intend to find out what that feels like.' The clip goes viral within the hour.",
                    choices: [
                        { text: "Schedule the matchup immediately.", effect: (r) => 'bitter_rivals', result: "You announce it that afternoon. Social media melts.", fame: 400, stress: 10 },
                        { text: "Let the tension build longer.", effect: (r) => r, result: "You save the match for the season finale. The anticipation becomes its own spectacle.", fame: 200 }
                    ]
                },
                {
                    title: "The Fight That Wasn't",
                    text: "You schedule them as sparring partners. It lasts eleven minutes before you have to drag them apart — not because they were hurting each other, but because they weren't. They'd stopped fighting and were simply holding each other on the mat, foreheads touching, breathing together, completely unaware of anyone else in the room.",
                    choices: [
                        { text: "Use the footage.", effect: (r) => 'obsession', result: "You post it. The internet implodes. Worth it.", fame: 600, morale: 10 },
                        { text: "Delete it. Protect the privacy.", effect: (r) => 'attraction', result: "They never know you saw. The dynamic deepens in private.", morale: 15 }
                    ]
                }
            ],

            // M5
            [
                {
                    title: "Bonded in Dominance",
                    text: "{F1} and {F2} have reached a permanent understanding — volatile, intense, a combination of violent respect, brutal humiliation, and obsessive dominance. They will push each other to absolute breaking points. Nothing can be done about it now. You're not sure you'd want to if you could.",
                    choices: [{ text: "Acknowledge the bond.", effect: (r) => r === 'attraction' ? 'lovers' : 'bitter_rivals', result: "Relationship locked." }]
                },
                {
                    title: "Two Queens, One Kingdom",
                    text: "They've stopped competing for your attention. They've started competing for something larger — a private tournament of supremacy between just the two of them, with rules only they understand and stakes only they feel. The rest of the gym orbits them warily.",
                    choices: [{ text: "Let them reign.", effect: (r) => r === 'attraction' ? 'lovers' : 'bitter_rivals', result: "Relationship locked. The gym has never trained harder." }]
                }
            ]
        ],

        // ══════════════════════════════════════════════════════════════════════
        // DOMINANT × SUBMISSIVE  (Alpha/Underdog, Ice Queen/Showboat, Alpha/Showboat)
        // ══════════════════════════════════════════════════════════════════════
        dominant_submissive: [
            // M1
            [
                {
                    title: "Eager Submission",
                    text: "{F1} is holding court in the locker room. She casually rests her hand high on {F2}'s thigh while giving instructions. {F2} doesn't move it. Doesn't even look at it. Her chest heaves steadily under {F1}'s prolonged, predatory stare.",
                    choices: [{ text: "Continue.", effect: (r) => 'aware', result: "A subtle, deeply subservient dynamic takes root." }]
                },
                {
                    title: "The Correction",
                    text: "{F1} watches {F2} drill footwork and finds an excuse to step in. She physically takes {F2}'s hips in both hands to adjust her stance. She holds the grip much longer than necessary. {F2} goes completely still and breathes very carefully.",
                    choices: [{ text: "Observe.", effect: (r) => 'aware', result: "The correction takes four times longer than it needs to." }]
                },
                {
                    title: "First Acknowledgement",
                    text: "{F1} passes {F2} in the gym and says one quiet, specific compliment — not about her fighting. About something else entirely. {F2} stands in the same spot for thirty seconds after {F1} has gone, processing it.",
                    choices: [{ text: "Don't intervene.", effect: (r) => 'aware', result: "You recognize the shape of what's starting." }]
                }
            ],

            // M2
            [
                {
                    title: "The Breaking Point",
                    text: "{F1} traps {F2} in a suffocating camel clutch during sparring, bending her spine backward until {F2} moans. Instead of letting go when {F2} taps, {F1} holds it longer, rubbing against {F2}'s exposed back, demanding she verbally beg for release. {F2} is visibly torn between humiliation and a strange, desperate eagerness.",
                    choices: [
                        { text: "Let {F1} make her beg.", effect: (r) => 'friction', result: "You foster the dominance. {F2} submits completely.", morale: -5 },
                        { text: "Intervene and scold {F1}.", effect: (r) => 'friction', result: "{F1} sneers. {F2} looks almost disappointed the torment stopped.", morale: 5 }
                    ]
                },
                {
                    title: "Leash",
                    text: "{F1} starts giving {F2} orders outside of training hours. Small things at first — bring water, go get tape, hold this. {F2} complies every single time without hesitation. The other fighters have noticed. You've noticed.",
                    choices: [
                        { text: "Permit it.", effect: (r) => 'friction', result: "The hierarchy cements itself. {F2}'s performance in the ring improves strangely.", morale: 5 },
                        { text: "Shut it down.", effect: (r) => 'friction', result: "{F1} backs off publicly. Privately, nothing changes.", morale: 0 }
                    ]
                },
                {
                    title: "Sparring Turns Personal",
                    text: "{F1} pins {F2} face-down on the mat and sits on the small of her back, arms folded, as if resting. She stays there for a full minute while {F2} lies completely still and does not protest. The room has emptied. Nobody knows when that happened.",
                    choices: [
                        { text: "Walk away.", effect: (r) => 'friction', result: "You decide this is between them.", morale: 0 },
                        { text: "Break it up.", effect: (r) => 'friction', result: "You intervene. {F2} thanks you quietly. She doesn't look grateful.", morale: 5 }
                    ]
                }
            ],

            // M3
            [
                {
                    title: "Personal Property",
                    text: "{F1} explicitly orders {F2} to massage her muscles in the showers after training. {F2} kneels on the wet tiles, hands trembling slightly as she works. Her eyes are completely submissive and devoted. This has clearly happened more than once.",
                    choices: [
                        { text: "Exploit the dynamic.", effect: (r) => 'attraction', result: "You arrange private sessions. Attraction skyrockets.", morale: 15 },
                        { text: "Focus on wrestling.", effect: (r) => 'mentor', result: "You force {F1} to teach actual holds instead of just dominating.", morale: 5 }
                    ]
                },
                {
                    title: "The Uniform",
                    text: "{F1} brings {F2} a new training kit — tighter, more revealing than regulation. She tells {F2} to wear it. {F2} shows up the next morning wearing it. And the morning after. And the one after that.",
                    choices: [
                        { text: "Ignore it.", effect: (r) => 'attraction', result: "You pick your battles. This isn't one worth picking.", morale: 10 },
                        { text: "Intervene.", effect: (r) => 'mentor', result: "You issue standard kit. {F1} smirks. {F2} looks conflicted for a week.", morale: 0 }
                    ]
                },
                {
                    title: "At Her Feet",
                    text: "{F1} is taping her hands. Without being asked, {F2} crosses the room and crouches to retie {F1}'s boot. {F1} looks down at her with an expression that isn't exactly kindness. When {F2} finishes, {F1} puts a hand briefly on top of her head — just for a moment. {F2} closes her eyes.",
                    choices: [
                        { text: "Let it deepen.", effect: (r) => 'attraction', result: "You allow it. The bond forms on its own terms.", morale: 15 },
                        { text: "Address it.", effect: (r) => 'mentor', result: "You have a pointed conversation with {F1} about power dynamics. She listens. Agrees. Nothing changes.", morale: 0 }
                    ]
                }
            ],

            // M4
            [
                {
                    title: "Fierce Protection",
                    text: "During a photo shoot, an opponent shoves {F2}. Before anyone blinks, {F1} grabs the opponent by the hair and slams her against the wall. She snarls a threat that the photographers will later describe as 'genuinely terrifying,' then wraps a possessive hand around {F2}'s waist.",
                    choices: [
                        { text: "Reward the dark loyalty.", effect: (r) => r === 'attraction' ? 'obsession' : r, result: "{F1} feels vindicated. {F2} is entirely, dangerously dependent.", morale: 10 },
                        { text: "Punish the outburst.", effect: (r) => r, result: "{F1} pays the fine gladly. {F2} looks shaken in a way that isn't entirely bad.", morale: -5 }
                    ]
                },
                {
                    title: "The Public Claim",
                    text: "In a team interview, the journalist asks {F2} who she trains with most. {F2} answers instantly: '{F1}.' She's halfway through a sentence about technique when she glances at {F1} — and loses her entire train of thought. {F1} smiles slowly at the camera.",
                    choices: [
                        { text: "Encourage the PR angle.", effect: (r) => r === 'attraction' ? 'obsession' : r, result: "The internet ships them immediately. Fame +250.", fame: 250, morale: 5 },
                        { text: "Change the subject.", effect: (r) => r, result: "You redirect. But the clip circulates anyway.", fame: 100 }
                    ]
                }
            ],

            // M5
            [
                {
                    title: "Absolute Devotion",
                    text: "The dynamic is absolute. {F1} commands. {F2} obeys on her knees. The psychological tether between the dominant queen and her submissive cannot be severed by any external force. You're not sure it should be.",
                    choices: [{ text: "Acknowledge.", effect: (r) => r === 'attraction' ? 'lovers' : 'mentor', result: "Relationship locked in total submission." }]
                },
                {
                    title: "Collared",
                    text: "The whole gym has accepted it now. Where {F1} is, {F2} follows. What {F1} wants, {F2} provides. The dynamic has become so natural that it barely registers anymore. It simply is. And somehow, both fighters are performing at the peak of their careers.",
                    choices: [{ text: "Acknowledge.", effect: (r) => r === 'attraction' ? 'lovers' : 'mentor', result: "Relationship locked." }]
                }
            ]
        ],

        // ══════════════════════════════════════════════════════════════════════
        // COLD × VOLATILE  (Ice Queen/Rebel, Alpha/Ice Queen, Rebel/Technician)
        // ══════════════════════════════════════════════════════════════════════
        cold_volatile: [
            // M1
            [
                {
                    title: "Arctic Disdain",
                    text: "{F2} is screaming in frustration after a drill. {F1} leans against the cage, sipping water, her expression completely arctic. She slowly adjusts her sports bra, staring at {F2} with freezing condescension that makes {F2} instantly flush with rage... and something else.",
                    choices: [{ text: "Continue.", effect: (r) => 'aware', result: "Fire meets ice. The tension is incredibly thick." }]
                },
                {
                    title: "The Stare",
                    text: "{F1} doesn't acknowledge {F2}'s entrance into the room. Doesn't nod, doesn't speak, doesn't look up from her work. {F2} notices. Stands a little straighter. Works a little harder. Keeps looking over. {F1} never looks back.",
                    choices: [{ text: "Observe.", effect: (r) => 'aware', result: "The coldest possible acknowledgement. And yet." }]
                },
                {
                    title: "Dismissed",
                    text: "{F2} attempts to challenge {F1} to a practice round. {F1} simply says 'No' without looking up and turns a page in her notebook. {F2} stands there for ten seconds. Fifteen. Twenty. Then walks away. Her fists are clenched tight.",
                    choices: [{ text: "Let it play.", effect: (r) => 'aware', result: "The silence has done more damage than any insult could." }]
                }
            ],

            // M2
            [
                {
                    title: "Technical Humiliation",
                    text: "{F2} rushes {F1} in sparring. {F1} sidesteps, trips her, and mounts her face effortlessly. She sits heavily on {F2}'s mouth in a suffocating facesit, completely ignoring {F2}'s muffled screams of outrage while calmly explaining {F2}'s flawed footwork to the room.",
                    choices: [
                        { text: "Let {F1} break her pride.", effect: (r) => 'friction', result: "The degrading facesit lasts for minutes. {F2}'s stress spikes.", stress: 15 },
                        { text: "Force them to drill normally.", effect: (r) => 'friction', result: "They work together, fueled by contrasting energy.", morale: 5 }
                    ]
                },
                {
                    title: "Lesson Learned Badly",
                    text: "{F1} demonstrates a hold on {F2} — correctly, clinically, in front of everyone. Then she holds it for thirty seconds past the point of demonstration, her knee on {F2}'s spine, studying her reaction with scientific detachment. {F2}'s fury is extraordinary.",
                    choices: [
                        { text: "Demand {F1} release.", effect: (r) => 'friction', result: "The damage is done. The heat between them intensifies.", morale: 5 },
                        { text: "Let the lesson continue.", effect: (r) => 'friction', result: "{F2} endures it in silence. Comes back tomorrow absolutely furious.", stress: 10 }
                    ]
                },
                {
                    title: "Public Correction",
                    text: "In front of the full squad, {F1} quietly and precisely dismantles everything {F2} did wrong in her last match. Not cruelly. Not loudly. Just absolutely, completely, and specifically. {F2} turns a deep and sustained shade of crimson.",
                    choices: [
                        { text: "Let the critique stand.", effect: (r) => 'friction', result: "{F2} trains with savage focus for two weeks. She doesn't forgive.", stress: 15, morale: -5 },
                        { text: "Follow up with encouragement.", effect: (r) => 'friction', result: "You soften the blow. Neither of them thanks you.", morale: 0 }
                    ]
                }
            ],

            // M3
            [
                {
                    title: "The Dam Breaks",
                    text: "{F2} finally corners {F1} in the locker room, slamming her hand against the lockers. She demands to know why {F1} looks down on her. {F1} doesn't flinch. She steps intimately close, pressing her chest against {F2}'s, slides a hand down her stomach, and whispers something terribly filthy that leaves {F2} completely speechless.",
                    choices: [
                        { text: "Pair them in the Sexfight circuit.", effect: (r) => 'obsession', result: "The degrading contrast forces a deep psychological obsession.", morale: 10 },
                        { text: "Keep them separated.", effect: (r) => 'rivalry', result: "The separation breeds immense frustration and unresolved tension.", stress: 10 }
                    ]
                },
                {
                    title: "Proximity",
                    text: "The only available cage during peak hours forces them to train side-by-side, separated by a single chain-link. For ninety minutes they work in aggressive parallel, matching each other's pace perfectly. When {F2} throws a hook, {F1} mirrors it. When {F1} transitions, {F2} replicates it. By the end, they're grinning. Neither admits it.",
                    choices: [
                        { text: "Schedule joint sessions.", effect: (r) => 'obsession', result: "The forced proximity reveals an uncomfortable chemistry.", morale: 10 },
                        { text: "Separate them again.", effect: (r) => 'rivalry', result: "You remove the proximity. They lose something.", morale: -5 }
                    ]
                },
                {
                    title: "Unsolicited",
                    text: "{F1} drops training notes on {F2}'s bench without a word. Detailed, handwritten observations of {F2}'s technique — good and bad. {F2} reads every line twice. Then looks across the room to where {F1} is already ignoring her completely.",
                    choices: [
                        { text: "Encourage the exchange.", effect: (r) => 'obsession', result: "You start facilitating the odd dynamic. It works.", morale: 5 },
                        { text: "Stay out of it.", effect: (r) => 'rivalry', result: "They work it out themselves, on their own strange terms.", morale: 0 }
                    ]
                }
            ],

            // M4
            [
                {
                    title: "Public Evisceration",
                    text: "A massive public argument. {F2} accuses {F1} of holding back. {F1} coldly dismantles {F2}'s worth as a woman and a fighter in a few ruthless, precise sentences. The damage is extraordinary. Yet {F2} stares at {F1} with undeniable, obsessive hunger.",
                    choices: [
                        { text: "Publicize the drama.", effect: (r) => r, result: "Fame +300. Fans love the toxic dynamic.", fame: 300, morale: -10 },
                        { text: "Lock them in a room.", effect: (r) => r === 'obsession' ? 'lovers' : 'rivalry', result: "They scream. Then stop. Then tear each other's clothes off.", morale: 15 }
                    ]
                },
                {
                    title: "The Article",
                    text: "A major sports magazine runs a piece titled 'The Most Dangerous Chemistry in the League.' Half the article is about their fighting styles. The other half is clearly about something else entirely, written between careful professional lines. Both fighters read it. Neither comments. Both train twice as hard the next day.",
                    choices: [
                        { text: "Lean into the narrative.", effect: (r) => r, result: "You give the journalist a follow-up interview. Fame +200.", fame: 200, morale: 5 },
                        { text: "Decline further publicity.", effect: (r) => r, result: "The mystery makes it worse. Fame +150.", fame: 150 }
                    ]
                }
            ],

            // M5
            [
                {
                    title: "Toxic Magnetism",
                    text: "Explosive and magnetic. The volatile energy feeds the cold, degrading calculation. Fire and ice generating heat. It's a terrifyingly effective and deeply complicated bond built on sex, violence, and ruined pride.",
                    choices: [{ text: "Acknowledge.", effect: (r) => r, result: "Relationship locked." }]
                },
                {
                    title: "Perfect Antagonists",
                    text: "They need each other. The cold requires heat to mean anything. The fire needs something to burn against. Without this friction, both of them are slightly diminished. You've stopped trying to end it.",
                    choices: [{ text: "Acknowledge.", effect: (r) => r, result: "Relationship locked." }]
                }
            ]
        ],

        // ══════════════════════════════════════════════════════════════════════
        // EQUAL RIVALS  (Technician/Technician, Strategist/Strategist, etc.)
        // ══════════════════════════════════════════════════════════════════════
        equal_rivals: [
            // M1
            [
                {
                    title: "Mutual Assessment",
                    text: "{F1} and {F2} are watching tape together. They simultaneously pause to point out the same technical flaw. {F1}'s hand brushes {F2}'s thigh. A shared nod of deep, lingering respect is exchanged.",
                    choices: [{ text: "Continue.", effect: (r) => 'aware', result: "Mutual recognition and quiet heat." }]
                },
                {
                    title: "The Same Frequency",
                    text: "They start finishing each other's tactical sentences in team meetings. It happens three times in one session. The coach is delighted. Everyone else is slightly unsettled by the synchronicity.",
                    choices: [{ text: "Facilitate it.", effect: (r) => 'aware', result: "You realize they've already found their rhythm." }]
                },
                {
                    title: "Matched",
                    text: "{F1} and {F2} drill together and discover that every technique one knows, the other has an answer for. They spend two hours finding the edges of each other's game and return looking flushed and fascinated.",
                    choices: [{ text: "Pair them again.", effect: (r) => 'aware', result: "They've found a study partner unlike any other." }]
                }
            ],

            // M2
            [
                {
                    title: "Endless Rolling",
                    text: "During open mat they grapple for forty-five minutes straight. Every submission is countered. They are locked in an incredibly tight scissor hold, gasping for air, thighs crushing thighs, absolutely refusing to submit.",
                    choices: [
                        { text: "Break it up.", effect: (r) => 'friction', result: "They uncoil, panting heavily, eyes locked. (+Stats)", morale: 5 },
                        { text: "Let them go until one breaks.", effect: (r) => 'friction', result: "They push to absolute limits, gaining immense erotic respect.", stress: 10 }
                    ]
                },
                {
                    title: "The Scorecard",
                    text: "They start keeping a private tally — wins and losses in their unofficial training bouts, written in small neat numbers on a piece of tape stuck to the inside of their shared equipment locker. The current count: {F1} leads by one.",
                    choices: [
                        { text: "Let the competition continue.", effect: (r) => 'friction', result: "The tally becomes the most motivating thing in the gym.", morale: 10 },
                        { text: "Confiscate the tape.", effect: (r) => 'friction', result: "They start keeping the count in their phones instead.", morale: 0 }
                    ]
                }
            ],

            // M3
            [
                {
                    title: "Blurred Lines",
                    text: "They've begun sharing private stretching sessions. The relationship is professional, but spending hours a day tangled in each other's sweaty limbs is rapidly blurring the lines of purely platonic respect.",
                    choices: [
                        { text: "Support the intimacy.", effect: (r) => 'friendship', result: "They become an unbreakable duo.", morale: 15 },
                        { text: "Push them to compete violently.", effect: (r) => 'rivalry', result: "They turn the lust into competitive fuel.", morale: 5 }
                    ]
                },
                {
                    title: "Game Film",
                    text: "They stay in after everyone else has gone, watching each other's old fight footage on a laptop between them, shoulders touching, pointing out weaknesses they'd never admit to anyone else. It's the most intimate thing you've seen in this gym.",
                    choices: [
                        { text: "Give them the private space.", effect: (r) => 'attraction', result: "The trust deepens into something harder to name.", morale: 10 },
                        { text: "Assign it as a team exercise.", effect: (r) => 'rivalry', result: "They clam up immediately in front of others. The private dynamic contracts.", morale: -5 }
                    ]
                }
            ],

            // M4
            [
                {
                    title: "Twin Pillars",
                    text: "In a revealing interview, {F1} explicitly states that the only fighter she considers worthy to share a bed — or a ring — with is {F2}. The media dubs them the twin queens.",
                    choices: [{ text: "Embrace the PR.", effect: (r) => r, result: "Erotic hype generates Fame +400.", fame: 400 }]
                },
                {
                    title: "The Documentary",
                    text: "A streaming platform wants to make a short doc about the two of them. Three weeks following their training, their rivalry, their friendship. The director privately tells you the footage he has so far is 'extraordinary and not entirely suitable for broadcast in several regions.'",
                    choices: [
                        { text: "Let them make it.", effect: (r) => r, result: "The doc airs. Wins an award. Both fighters gain significant fame.", fame: 500, morale: 10 },
                        { text: "Decline on their behalf.", effect: (r) => r, result: "They're annoyed. But you protect the private thing.", morale: -5 }
                    ]
                }
            ],

            // M5
            [
                {
                    title: "Perfect Equals",
                    text: "Forged in identical work ethic and perfect physical understanding. They elevate each other constantly, driven by mutual domination, respect, and lust.",
                    choices: [{ text: "Acknowledge.", effect: (r) => r, result: "Relationship locked." }]
                },
                {
                    title: "The Mirror",
                    text: "At this point, watching one train without the other feels wrong — like a gear spinning without its pair. They've become interdependent. Efficient. Devastating. You wouldn't separate them if you could.",
                    choices: [{ text: "Acknowledge.", effect: (r) => 'lovers', result: "Relationship locked." }]
                }
            ]
        ],

        // ══════════════════════════════════════════════════════════════════════
        // MENTOR × STUDENT  (Technician/Underdog, Strategist/Underdog)
        // ══════════════════════════════════════════════════════════════════════
        mentor_student: [
            // M1
            [
                {
                    title: "The Starving Pupil",
                    text: "{F1} completely obliterates an opponent in a brutal Sexfight match, leaving her humiliated. {F2} watches from the cage side, biting her lip, her eyes wide with awe and lust. {F1} notices and gives a dark, knowing smirk.",
                    choices: [{ text: "Continue.", effect: (r) => 'aware', result: "The seed of hero-worship is planted." }]
                },
                {
                    title: "First Lesson",
                    text: "{F2} is struggling with a guard pass for the sixth consecutive session. {F1} walks over without being asked, takes {F2}'s arm, repositions her entire body with clinical precision, and says two words: 'Like that.' The technique works instantly. {F2} stares at her hands like they belong to someone else.",
                    choices: [{ text: "Facilitate their training.", effect: (r) => 'aware', result: "You schedule them together officially." }]
                }
            ],

            // M2
            [
                {
                    title: "Cruel Tutelage",
                    text: "{F2} begs {F1} to train her. {F1} accepts, then puts {F2} through absolute hell — locking her in humiliating submissions and slapping her thighs to correct form, pushing her to see if she'll quit or surrender entirely.",
                    choices: [
                        { text: "Intervene.", effect: (r) => 'friction', result: "{F2} resents your intervention. She wanted the pain.", morale: -5 },
                        { text: "Let {F2} endure it.", effect: (r) => 'friction', result: "{F2} survives the degrading session, earning {F1}'s dark respect.", morale: 10 }
                    ]
                },
                {
                    title: "Push Through",
                    text: "{F1} refuses to let {F2} stop a drill when she's exhausted. She stands over {F2} — who is on her hands and knees, gasping — and calmly, quietly, tells her to get up. And keep going. {F2} does. Three more times.",
                    choices: [
                        { text: "Let {F1} push.", effect: (r) => 'friction', result: "{F2} breaks through something. She's different after today.", morale: 15 },
                        { text: "Call time.", effect: (r) => 'friction', result: "You stop the session. {F2} looks relieved and disappointed simultaneously.", morale: 5 }
                    ]
                }
            ],

            // M3
            [
                {
                    title: "Hands-On",
                    text: "The training sessions are intimate, private affairs. {F1}'s corrections of {F2}'s form are becoming lingering, wandering down her waist and between her thighs. {F2} completely surrenders to the extremely intimate touches.",
                    choices: [
                        { text: "Demand they focus on combat.", effect: (r) => 'mentor', result: "The relationship stays hierarchical and violent.", morale: 5 },
                        { text: "Exploit the erotic dynamic.", effect: (r) => 'attraction', result: "The power dynamic fuels romantic attraction.", morale: 15 }
                    ]
                },
                {
                    title: "The Gift",
                    text: "{F1} gives {F2} an old pair of her own competition gloves. She doesn't make a speech about it. Just sets them on {F2}'s bench before she arrives. {F2} puts them on immediately, doesn't take them off until lights-out, and trains harder than anyone in the room.",
                    choices: [
                        { text: "Recognize the moment.", effect: (r) => 'attraction', result: "You acknowledge the gesture in the team meeting. Both of them go quiet.", morale: 15 },
                        { text: "Don't mention it.", effect: (r) => 'mentor', result: "You let it remain theirs.", morale: 10 }
                    ]
                }
            ],

            // M4
            [
                {
                    title: "Devotion",
                    text: "{F2} wins her first major match and leaps over the cage wall to embrace {F1}, wrapping her legs around {F1}'s waist and pressing their chests together in front of millions of viewers. {F1} catches her without hesitation.",
                    choices: [{ text: "Celebrate the public intimacy.", effect: (r) => r, result: "Massive morale boost for both.", morale: 20 }]
                },
                {
                    title: "The Coach Watches",
                    text: "{F2} executes the exact technique {F1} drilled into her for three weeks — perfectly — to win her match. She looks directly at {F1} in the corner. {F1} gives one small nod. {F2} starts crying immediately and then stops, embarrassed. The crowd doesn't understand what they witnessed. You do.",
                    choices: [{ text: "Honor the moment.", effect: (r) => r, result: "Something permanent passed between them just now.", morale: 25 }]
                }
            ],

            // M5
            [
                {
                    title: "The Master and The Pet",
                    text: "The veteran and the prodigy. Their bond is unbreakable, defined by legacy, protection, and a deep devoted physical surrender.",
                    choices: [{ text: "Acknowledge.", effect: (r) => r === 'attraction' ? 'lovers' : 'mentor', result: "Relationship locked." }]
                },
                {
                    title: "Inheritance",
                    text: "{F1} has given {F2} everything she knows. The technique, the hunger, the discipline. And something else — something private that can't be drilled or demonstrated. {F2} carries it now. Both of them know it.",
                    choices: [{ text: "Acknowledge.", effect: (r) => r === 'attraction' ? 'lovers' : 'mentor', result: "Relationship locked." }]
                }
            ]
        ],

        // ══════════════════════════════════════════════════════════════════════
        // MIRROR ATTRACTION  (Showboat/Showboat, Underdog/Underdog)
        // ══════════════════════════════════════════════════════════════════════
        mirror_attraction: [
            // M1
            [
                {
                    title: "The Crush",
                    text: "{F1} and {F2} bump into each other in the changing room, grabbing for the same towel. Their bare sweaty skin brushes, and they both flush crimson, apologizing profusely before scurrying away, constantly sneaking peeks at each other's bodies.",
                    choices: [{ text: "Continue.", effect: (r) => 'aware', result: "Intense, giggly high-school crush energy detected." }]
                },
                {
                    title: "Clumsy",
                    text: "{F1} attempts to give {F2} a post-sparring compliment and fumbles it spectacularly. The sentence starts as praise and ends as a complete non-sequitur. {F2} looks at her for three full seconds before bursting out laughing. {F1} turns the color of her training gear.",
                    choices: [{ text: "Don't embarrass either of them further.", effect: (r) => 'aware', result: "You look away. They're both grinning." }]
                },
                {
                    title: "Synchronised",
                    text: "They show up to the gym wearing matching colors on a day they didn't coordinate. Both notice simultaneously. Both try to look casual about it. Neither succeeds. The whole team sees.",
                    choices: [{ text: "Make a joke about it.", effect: (r) => 'aware', result: "They laugh. The ice breaks." }]
                }
            ],

            // M2
            [
                {
                    title: "Playful Grappling",
                    text: "They are pulling punches, giggling when they grapple, turning practice into a flirtatious sequence of light rolling, soft caresses, and straddling.",
                    choices: [
                        { text: "Tell them to fight dirty.", effect: (r) => 'friction', result: "They apologize but keep flirting.", morale: 5 },
                        { text: "Make them do cardio in tight gear.", effect: (r) => 'friction', result: "They openly check each other out the whole time.", morale: 0 }
                    ]
                },
                {
                    title: "Inside Jokes",
                    text: "They've developed a private vocabulary — shorthand jokes and references that make the rest of the team feel like outsiders. You've heard them whisper-laugh about something three times this week and you're fairly certain you're involved.",
                    choices: [
                        { text: "Foster the team bonding.", effect: (r) => 'attraction', result: "Their good mood is infectious. Morale lifts across the whole squad.", morale: 15 },
                        { text: "Insist on professional boundaries.", effect: (r) => 'friction', result: "They go quiet. The laughter doesn't stop — it just goes underground.", morale: -5 }
                    ]
                },
                {
                    title: "Corner Work",
                    text: "{F1} volunteers to work {F2}'s corner for a training bout. Her instructions are technically sound but she keeps telling {F2} she looks amazing while she's saying them. {F2} wins the round, then sits down and lets {F1} tend to a cut she definitely doesn't have.",
                    choices: [
                        { text: "Rotate corner staff.", effect: (r) => 'friction', result: "They're annoyed. But the professionalism is cleaner.", morale: -5 },
                        { text: "Leave them to it.", effect: (r) => 'attraction', result: "Their communication sharpens into something excellent.", morale: 10 }
                    ]
                }
            ],

            // M3
            [
                {
                    title: "The Secret",
                    text: "You catch them holding hands under the table during a club meeting, {F1}'s thumb softly tracing {F2}'s knuckles. It's obvious to everyone in the room that they are completely infatuated and almost certainly sleeping together.",
                    choices: [{ text: "Support the romance.", effect: (r) => 'attraction', result: "Love blooms in the club.", morale: 20 }]
                },
                {
                    title: "Overnight",
                    text: "Hotel room assignments for the away match come back wrong. {F1} and {F2} are doubled up in one room. They don't complain. They don't ask to switch. When you pass their door at midnight you can hear laughing. In the morning they are both completely focused and extremely professional.",
                    choices: [
                        { text: "Leave the assignment.", effect: (r) => 'attraction', result: "You don't fix what isn't broken.", morale: 20 },
                        { text: "Correct the booking.", effect: (r) => 'friction', result: "You move them apart. They comply without complaint. They are visibly disappointed.", morale: -5 }
                    ]
                }
            ],

            // M4
            [
                {
                    title: "Public Display",
                    text: "They walk to the ring together for a tag-team exhibition, wearing matching revealing gear. They share a very public, deep, wet kiss before the bell. The crowd completely loses its mind.",
                    choices: [{ text: "Capitalize on the erotica.", effect: (r) => 'lovers', result: "Sponsors love the angle. Fame +500.", fame: 500, morale: 10 }]
                },
                {
                    title: "The Photo",
                    text: "A fan photograph goes viral. {F1} and {F2}, post-match, foreheads together, eyes closed, hands intertwined inside their gloves. Neither of them knew anyone was watching. The internet caption writes itself.",
                    choices: [
                        { text: "Let it run.", effect: (r) => 'lovers', result: "Fame +400. They're both embarrassed and glowing.", fame: 400, morale: 15 },
                        { text: "Try to suppress it.", effect: (r) => 'attraction', result: "Too late. Fame +200 regardless. You wasted effort.", fame: 200, morale: 5 }
                    ]
                }
            ],

            // M5
            [
                {
                    title: "Lovers in the Ring",
                    text: "Pure romance and unshakeable attraction. They fight beautifully together, drawing immense strength, confidence, and arousal from each other's presence.",
                    choices: [{ text: "Acknowledge.", effect: (r) => 'lovers', result: "Relationship locked." }]
                },
                {
                    title: "Each Other's Best",
                    text: "They make each other better. In every measurable way. You would never have believed that at the start of this season. You believe it completely now.",
                    choices: [{ text: "Acknowledge.", effect: (r) => 'lovers', result: "Relationship locked." }]
                }
            ]
        ]
    }
};