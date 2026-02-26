/**
 * narrative_generator.js
 * Massively expanded fight narrative system.
 * Includes hundreds of unique lines across all styles, severities,
 * archetypes, relationship types, and post-match punishment sequences.
 */

window.NarrativeGenerator = {

    // ── HELPERS ──────────────────────────────────────────────────────────────

    _pick(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },

    _nameTag(fighter, isWinner) {
        const gs = window.GameState;
        const club = gs?.getClub(fighter.club_id);
        const color = club?.color || (isWinner ? '#FF3366' : '#3366FF');
        return `<span style="padding: 0 4px; background: ${color}; color: #fff; border-radius: 3px; text-shadow:1px 1px 2px #000;"><strong>${fighter.name}</strong></span>`;
    },

    _plain(fighter) {
        return `<strong>${fighter.name}</strong>`;
    },

    // ── GENERATE HIT ─────────────────────────────────────────────────────────

    generateHit(attacker, defender, style, delta) {
        const severity = delta > 15 ? 'brutal' : delta > 8 ? 'heavy' : delta > 3 ? 'solid' : 'light';
        const aName = this._nameTag(attacker, true);
        const dName = this._plain(defender);

        const pool = (this.hitLines[style] || this.hitLines['boxing'])[severity];
        let line = this._pick(pool);
        line = line.replace(/\[A\]/g, aName).replace(/\[D\]/g, dName);

        // 20% chance to append dialogue
        if (Math.random() < 0.20) {
            line += `<br/>` + this.generateDialogue(attacker, true);
        }

        // 8% chance for a crowd reaction
        if (Math.random() < 0.08) {
            line += `<br/><span style="color:var(--text-muted); font-size:0.85rem; font-style:italic;">${this._pick(this.crowdReactions)}</span>`;
        }

        return line;
    },

    // ── HIT LINES ────────────────────────────────────────────────────────────

    hitLines: {
        boxing: {
            brutal: [
                "[A] unloads a terrifying 8-punch flurry, trapping [D] against the ropes with no escape!",
                "[A] drops [D] to her knees with a devastating hook to the jaw — the crowd erupts!",
                "[A] lands a sickening crushing body blow that visibly folds [D] completely in half.",
                "[A] explodes off the back foot with a murderous overhand right that catches [D] flush on the temple!",
                "[A] backs [D] into the corner and starts dismantling her with brutal, clinical combinations!",
                "[A] pins [D] to the ropes with a relentless body attack, her liver shot making [D]'s legs buckle!",
                "[A] lands a perfectly-timed right hook that snaps [D]'s head so hard her mouthpiece flies out!",
                "[A] walks [D] down, then fires a short, vicious uppercut that lifts [D] off her feet!",
                "[A] feints twice, then unloads a blinding left straight directly to [D]'s nose — blood splatters!",
                "[A] digs a savage right hand under [D]'s guard and into her stomach, doubling her over in agony.",
                "[A] unleashes a six-punch combination that has [D] clinching desperately just to survive!",
                "[A] launches a stunning left hook that catches [D] walking in — her eyes go glassy instantly!"
            ],
            heavy: [
                "[A] breaks through [D]'s high guard with a heavy thudding straight punch.",
                "[A] corners [D] and lands a stiff damaging uppercut that snaps her head back sharply.",
                "[A] lands a powerful cross, immediately creating swelling on [D]'s cheekbone.",
                "[A] catches [D] leaning in with a well-timed right hand that rocks her on her heels.",
                "[A] works [D]'s body viciously before switching upstairs to sting her with a left hook.",
                "[A] times [D]'s jab and fires a short right hand over the top that shakes her visibly.",
                "[A] drives [D] to the ropes with a heavy right-left-right sequence that has the crowd buzzing.",
                "[A] slides under a wild swing and digs a hard hook to [D]'s ribs — she winces badly.",
                "[A] catches [D] with a perfectly placed overhand that causes her knees to wobble for a moment.",
                "[A] punishes [D]'s body with four consecutive hooks that have her gasping for breath.",
                "[A] tags [D] with a sharp right hand that gets through the guard and rings her bell.",
                "[A] lands a clean left hook-right uppercut combination that jolts [D] backward into the ropes."
            ],
            solid: [
                "[A] cracks [D] with a clean hard jab during an open exchange.",
                "[A] easily penetrates [D]'s defense with a stinging 1-2 combination.",
                "[A] hits [D] with a solid punishing hook to the body.",
                "[A] slips outside [D]'s jab and catches her with a sharp counter right.",
                "[A] stings [D] with a quick double jab that snaps her head back twice.",
                "[A] drives a stiff straight left into [D]'s face during a chaotic scramble.",
                "[A] catches [D] mid-punch with a solid check hook that spins her sideways.",
                "[A] plants her feet and cracks [D] with a compact left hook to the ear.",
                "[A] fires a straight right hand that splits [D]'s guard and lands on her nose.",
                "[A] uses excellent head movement to step in and land a solid right to the jaw.",
                "[A] drops down behind a jab and comes up with a scooping uppercut that rattles [D].",
                "[A] tags [D] twice in the same sequence — jab to the nose, right cross to the cheek."
            ],
            light: [
                "[A] lands a quick stinging jab that snaps [D]'s attention back.",
                "[A] grazes [D] with a glancing straight punch from the outside.",
                "[A] touches [D]'s shoulder quickly during a clinch break.",
                "[A] flicks out a teasing jab that bounces off [D]'s forehead.",
                "[A] pecks [D] with a left jab as she retreats to reset the distance.",
                "[A] catches [D] with a light slapping overhand as their heads clash.",
                "[A] finds [D]'s face with a quick, probing right that keeps her honest.",
                "[A] snaps a short jab into [D]'s nose during a brief exchange — minor but effective.",
                "[A] tags [D]'s ear with a flicking backhand during a scramble.",
                "[A] manages a short, half-power body shot through [D]'s elbow.",
                "[A] lands a grazing hook to [D]'s shoulder as she tries to spin away.",
                "[A] clips [D]'s chin with a soft right hand — more a statement than damage."
            ]
        },

        naked_wrestling: {
            brutal: [
                "[A] executes a breathtaking suplex, launching [D] through the air and slamming her violently into the mat!",
                "[A] achieves full mount, pinning [D]'s wrists and raining down vicious unrestricted elbows!",
                "[A] traps [D] in a suffocating triangle choke, pressing her bare thighs mercilessly against [D]'s throat!",
                "[A] wrenches [D]'s arm in a brutal kimura, forcing her shoulder to the absolute limit of its socket!",
                "[A] drives [D] into the canvas with a pile-driver slam, then immediately locks in a crushing rear-naked choke!",
                "[A] mounts [D]'s back in a dominant slapping body scissors, squeezing the air from her lungs with her powerful thighs!",
                "[A] throws [D] overhead in a stunning German suplex, adding insult to injury by keeping the grip for a bridge pin!",
                "[A] sinks a deep arm-triangle choke, trapping [D]'s own arm against her neck and ratcheting down until she turns purple!",
                "[A] flips [D] with an inside heel-hook attempt, torquing the knee viciously while [D] screams and scrambles!",
                "[A] explodes into a takedown, driving [D]'s spine into the canvas, then immediately passes to full mount to rain punishment!",
                "[A] catches [D] off-balance and drills her with a spinning hip throw, landing in perfect side control before [D] can recover!",
                "[A] isolates [D]'s back, sinks both hooks in, and begins cranking a neck crank that has [D] writhing in agony!"
            ],
            heavy: [
                "[A] secures a deep double-leg takedown, driving [D] hard into the canvas.",
                "[A] cleanly passes [D]'s guard and locks in a painful americana attempt.",
                "[A] establishes a smothering top position, raining down heavy ground-and-pound.",
                "[A] sweeps [D] cleanly from guard, reversing the position to take full mount.",
                "[A] sinks a body triangle from behind and starts stretching [D] with a painful rear-naked choke attempt.",
                "[A] catches [D]'s kick and dumps her to the mat with a stunning single-leg takedown.",
                "[A] wins a brutal scramble and ends up in dominant north-south position, pressing her body weight down.",
                "[A] passes to knee-on-belly, digging her knee into [D]'s solar plexus while posturing up for strikes.",
                "[A] snaps [D] down by the neck into a standing guillotine, cranking the pressure step by step.",
                "[A] slips behind [D] in the clinch and drives her to the canvas with a powerful trip, landing in full back mount.",
                "[A] forces [D] against the cage wall and executes a perfect hip toss, depositing her on the mat.",
                "[A] threads her arm through [D]'s guard and cranks an armbar, forcing [D] to roll and scramble desperately."
            ],
            solid: [
                "[A] wins the clinch battle, tripping [D] to the mat with a slick judo throw.",
                "[A] secures back control and starts hunting for the rear-naked choke.",
                "[A] forces [D] to her knees with a powerful snap-down.",
                "[A] shoots a sharp single-leg, pressuring [D] into the cage and controlling the exchange.",
                "[A] catches a sloppy guard and passes to half-guard with fluid technical movement.",
                "[A] pins [D] briefly in side control, using her weight to grind and tire her out.",
                "[A] sweeps from bottom guard and ends up in [D]'s guard — positive momentum shift.",
                "[A] locks up a tight overhook in the clinch and trips [D] to her back with a slick hip throw.",
                "[A] catches [D] standing and snaps her down to the mat with a sharp double collar tie.",
                "[A] transitions from a failed guillotine attempt directly to a tight anaconda squeeze.",
                "[A] uses a frame escape to create space and stand up, then immediately re-shoots for a takedown.",
                "[A] maintains pressure in the scramble, ending up in a dominant side-control position."
            ],
            light: [
                "[A] initiates a collar tie, muscling [D] around the center of the ring.",
                "[A] shoots for a single leg, pushing [D] back into the ropes.",
                "[A] briefly establishes dominant positioning in a grinding clinch.",
                "[A] uses a push to break [D]'s posture, disrupting her base.",
                "[A] slaps on a loose front headlock, creating momentary control.",
                "[A] forces a clinch, tying [D] up to prevent her from setting.",
                "[A] pulls guard briefly to reset the grappling range.",
                "[A] pushes [D] to the mat from behind with a quick shove, gaining top position for a moment.",
                "[A] goes for a leg entanglement, momentarily disrupting [D]'s base before being shaken off.",
                "[A] snatches a wrist briefly, forcing [D] to defend and buying [A] better positioning.",
                "[A] uses a short push-kick to disrupt [D]'s stance and prevent her from engaging properly.",
                "[A] grabs [D] behind the neck and drags her briefly into a controlling over-under clinch."
            ]
        },

        catfight: {
            brutal: [
                "[A] grabs [D]'s hair with both fists, dragging her across the canvas then driving a savage knee into her face!",
                "[A] pins [D] against the cage wall and rakes her nails aggressively down [D]'s ribs, drawing blood and shrieks!",
                "[A] mounts a frantic [D], slapping her brutally side-to-side in a sheer display of violent, unhinged dominance!",
                "[A] grabs [D] by the throat with one hand, slapping her face repeatedly with the other while screaming obscenities!",
                "[A] wraps [D]'s own hair around her fist and uses it as a leash, dragging her across the mat face-first!",
                "[A] sinks her teeth into [D]'s shoulder, latching on like a pit bull while [D] shrieks and claws at the mat!",
                "[A] yanks [D] by the ankle and spins her into the cage post, then launches herself on top in a wild mount!",
                "[A] drives her elbow viciously down into [D]'s chest from above, a brutal move that has the crowd gasping!",
                "[A] gets [D] in a headscissor and squeezes with everything she has, twisting savagely while [D]'s face goes crimson!",
                "[A] shoves two fingers into [D]'s mouth, yanking her head back by the cheek like a fish hook — utterly vicious!",
                "[A] double-slaps [D] across the ears simultaneously, the shock dropping [D] instantly to her hands and knees!",
                "[A] gets [D]'s head between her knees standing up, then sits down hard — a savage piledriver that shakes the ring!"
            ],
            heavy: [
                "[A] launches into a wild tackle, turning the exchange into a brutal back-alley brawl on the floor.",
                "[A] yanks [D] off-balance by the hair and lands a sickening unrefined right hook to the jaw.",
                "[A] buries a knee deep into [D]'s stomach during a chaotic clinch, making her collapse to all fours.",
                "[A] grabs a double handful of [D]'s hair, using it to control her head while unloading hard slaps.",
                "[A] scratches her nails down [D]'s back viciously during a grapple, leaving angry red welts.",
                "[A] gets [D] in a headlock and drops to the mat, applying vicious pressure to [D]'s windpipe.",
                "[A] mounts [D] and clamps her thighs over [D]'s ears, applying a brutal squeezing headscissor.",
                "[A] grabs [D] by the scruff of the neck and slams her face-first into the mat with real force.",
                "[A] bites down hard on [D]'s ear, making [D] shriek in pain before [A] shoves her away triumphantly.",
                "[A] catches [D]'s arm and twists it behind her back in a chicken wing, wrenching until [D] screams.",
                "[A] drives her forearm under [D]'s chin in a clothesline that drops her flat on her back.",
                "[A] wraps both hands around [D]'s throat and squeezes, only letting go when [D] starts fading."
            ],
            solid: [
                "[A] pushes [D] hard against the ropes and unloads a flurry of wild slapping hooks.",
                "[A] stomps viciously on [D]'s arch during a tangle, causing her to limp backward.",
                "[A] lands a sharp scraping elbow in the chaotic close-quarters scrap.",
                "[A] pulls [D]'s hair sharply to one side, exposing her ribs for a nasty open-palm strike.",
                "[A] shoves [D] backward with both hands and immediately rushes in with a wild body attack.",
                "[A] gets a fistful of [D]'s shorts, yanking her off balance before landing a stinging palm slap.",
                "[A] manages to rake her nails over [D]'s face, leaving [D] momentarily stunned and blinking.",
                "[A] catches [D] in a headlock and scrubs her face against the canvas while they're down.",
                "[A] uses [D]'s own momentum against her, side-stepping and shoving her into the cage hard.",
                "[A] smacks [D]'s butt hard in a humiliating open-palm slap, then grabs her hair before she can react.",
                "[A] reaches up from beneath to yank [D] down by the throat into a surprise clinch.",
                "[A] pulls guard and immediately bites down on [D]'s forearm — illegal but effective."
            ],
            light: [
                "[A] shoves [D] backward in a sudden burst of spiteful aggression.",
                "[A] manages to scratch [D]'s shoulder in a frantic scramble.",
                "[A] throws a looping imprecise strike that grazes [D]'s guard.",
                "[A] flicks [D]'s ear spitefully during a clinch, more of a taunt than an attack.",
                "[A] steps on [D]'s foot deliberately, drawing a yelp and a glare.",
                "[A] yanks a strand of [D]'s hair on the break — petty but intentional.",
                "[A] shoves [D]'s face sideways with her palm during a messy clinch.",
                "[A] snaps a light slap to [D]'s cheek as they separate, purely to disrespect.",
                "[A] catches [D]'s reaching wrist and twists it briefly just to annoy her.",
                "[A] flings [D] backward by her collar, establishing a brief distance advantage.",
                "[A] pinches [D]'s thigh viciously in the tangle, drawing a hiss of pain.",
                "[A] rakes her thumb along [D]'s collarbone on the break — a subtle but nasty move."
            ]
        },

        sexfight: {
            brutal: [
                "[A] traps [D] in a punishing scissor hold, grinding her hips rhythmically while forcing [D] to moan helplessly into the microphone!",
                "[A] completely overpowers [D], stripping away her dignity in a spread-eagle submission that leaves her totally exposed to the roaring crowd!",
                "[A] bites down hard on [D]'s sensitive neck, holding her in a suffocating erotic clinch until [D] is completely flushed and shaking!",
                "[A] pins [D]'s wrists above her head, uses her chest to smother [D]'s face completely, and rides out [D]'s frantic thrashing with contemptuous ease!",
                "[A] locks [D] into a body triangle from behind and begins grinding mercilessly, her lips pressed to [D]'s ear as she whispers filthy things!",
                "[A] pulls [D]'s hips upward into an inverted pin, leaving [D] on display for the crowd while completely robbing her of mobility!",
                "[A] sinks a deep facesit, settling her full weight down and forcing [D] to endure the humiliation until her struggles die completely!",
                "[A] wraps [D] in a standing bear hug from behind, pinning her arms, and uses her entire body to grind [D] down into submission!",
                "[A] straddles [D]'s chest, pins her arms under her knees, and leans forward to press her body against [D]'s face — inescapable and humiliating!",
                "[A] gets [D] in a reverse facesit, adding insult to injury by lazily leafing through [D]'s game plan card while [D] suffocates beneath her!",
                "[A] secures a grapevine pin, pressing her body full-length against [D]'s, forcing eye contact while [D] writhes helplessly beneath the weight!",
                "[A] traps [D] in a lotus-position scissorhold and simply leans back, putting [D] on full display for the crowd while she screams into the mat!"
            ],
            heavy: [
                "[A] rides [D]'s back, whispering degrading taunts into her ear while sinking a suffocating sensual chokehold.",
                "[A] achieves dominant mount, purposefully running her hands over [D]'s struggling body to completely shatter her composure.",
                "[A] locks [D] in a punishing body triangle, squeezing the breath from her while maintaining intense predatory eye contact.",
                "[A] pins [D]'s thighs down in a school-girl pin, sitting heavily on [D]'s stomach and gazing down at her with contemptuous amusement.",
                "[A] pulls [D] into a tight rear-naked clinch, using her body heat as a weapon, grinding against [D] until she whimpers.",
                "[A] drives [D] against the ropes in a pressing clinch, using her body as a wall to trap and exhaust [D].",
                "[A] sinks her nails into [D]'s hips, holding her firmly in place while rolling them in a dominant grinding motion.",
                "[A] achieves face-to-face mount and uses her forearms to pin [D]'s biceps, breathing heavily into [D]'s flushed face.",
                "[A] catches [D] in a full-body grapevine and rolls them over, using the momentum to trap [D] on her back.",
                "[A] traps [D]'s head between her thighs while reaching back to yank [D]'s leg in an uncomfortable, degrading stretch hold.",
                "[A] pins both of [D]'s arms above her head with just one hand, using the free hand to trail up [D]'s side with agonising slowness.",
                "[A] forces [D] into a standing headlock, pressing [D]'s face against her chest while denying her the ability to move or escape."
            ],
            solid: [
                "[A] uses a slick sensual grapple to trip [D], ending up perfectly positioned between her thighs.",
                "[A] pins [D]'s arms above her head gracefully, stealing a dominating moment to humiliate her.",
                "[A] strokes [D]'s cheek mockingly after slipping a strike, infuriating and flustering her.",
                "[A] grabs [D] around the waist from behind and forces a standing submission attempt, her grip iron-tight.",
                "[A] plants her hand firmly on [D]'s chest and shoves her backward, maintaining dominant positioning.",
                "[A] catches [D] off-guard with a sweep, ending up straddling [D]'s hips before [D] can recover.",
                "[A] grabs [D]'s wrist and yanks her forward, spinning behind her into a controlling back-take.",
                "[A] uses the clinch to roll her hips deliberately against [D]'s, breaking her concentration completely.",
                "[A] drops suddenly, wrapping both arms around [D]'s thighs and lifting to drive her back into the ropes.",
                "[A] catches [D]'s outstretched arm and uses it to spin her into a dominant chest-to-back position.",
                "[A] plants her palm on [D]'s lower back and uses the contact to steer [D] exactly where she wants her.",
                "[A] gains wrist control and uses it to maneuver [D] against the ropes, controlling the pace entirely."
            ],
            light: [
                "[A] slaps [D]'s rear playfully yet forcefully during a clinch break.",
                "[A] winks at the crowd while easily shrugging off [D]'s frantic takedown attempt.",
                "[A] presses her sweating body flush against [D] in the clinch, establishing physical dominance.",
                "[A] trails a fingertip along [D]'s jaw on the break — a fleeting taunt that leaves [D] flustered.",
                "[A] grinds her knee between [D]'s thighs briefly during a grapple, clearly deliberate.",
                "[A] lets her hand linger on [D]'s hip for two seconds longer than necessary after a reset.",
                "[A] leans in during a clinch and breathes deliberately against [D]'s neck, a sensory taunt.",
                "[A] catches [D]'s wrist and twirls her slowly, like a dance partner, before releasing her dismissively.",
                "[A] presses her forehead against [D]'s and holds it there for a long, charged moment before pushing off.",
                "[A] reaches up and adjusts [D]'s hair patronizingly, smoothing it behind her ear with a smirk.",
                "[A] drags the back of her hand slowly across [D]'s collarbone on the break, eyes never leaving hers.",
                "[A] runs both palms down [D]'s sides as they separate from a clinch — slow, deliberate, impossible to ignore."
            ]
        }
    },

    // ── GENERATE BLOCK ───────────────────────────────────────────────────────

    generateBlock(attacker, defender, style) {
        const aName = this._plain(attacker);
        const dName = this._nameTag(defender, false);

        const pool = this.blockLines[style] || this.blockLines['boxing'];
        let line = this._pick(pool);
        line = line.replace(/\[A\]/g, aName).replace(/\[D\]/g, dName);

        if (Math.random() < 0.12) {
            line += `<br/>` + this.generateDialogue(defender, false);
        }

        return line;
    },

    blockLines: {
        boxing: [
            "[D] keeps a razor-tight high guard, absorbing [A]'s combination effortlessly.",
            "[D] slips gracefully out of range, making [A] hit nothing but air.",
            "[D] rolls under the hook and resets to perfect punching range.",
            "[D] steps offline at the last second, letting [A]'s best shot sail harmlessly past.",
            "[D] catches the punch on her forearm and shoves [A]'s arm away contemptuously.",
            "[D] ducks cleanly under the hook and circles to the outside.",
            "[D] reads the right hand and leans back just enough to let it graze her chin harmlessly.",
            "[D] smothers [A]'s punch before it can develop, tying her up in a tight clinch.",
            "[D] parries the jab sharply aside and resets her guard with quiet confidence.",
            "[D] pivots gracefully off the back foot, stealing [A]'s angle completely.",
            "[D] rolls with the punch, taking the impact on the crown of her head and absorbing the power.",
            "[D] drops under the swinging hook and slips to the outside — textbook defense.",
            "[D] catches the cross on her shoulder and pushes through into a tight clinch.",
            "[D] steps inside [A]'s range, negating the power completely before tying up.",
            "[D] uses her footwork to make [A] miss by inches, then resets patiently.",
            "[D] leans away from the uppercut, just barely letting it pass under her chin."
        ],
        naked_wrestling: [
            "[D] sprawls beautifully, crushing [A]'s desperate takedown attempt.",
            "[D] bridges powerfully to escape bottom position, showing immense core strength.",
            "[D] frames effectively, preventing [A] from advancing her grapple.",
            "[D] anticipates the double-leg and stuffs the shot with a sharp sprawl and whizzer combination.",
            "[D] catches [A]'s arm during the guard pass and immediately threatens an armbar.",
            "[D] hip-escapes out of side control and re-establishes her guard with excellent timing.",
            "[D] locks her legs around [A]'s neck from a scramble, threatening a triangle from nowhere.",
            "[D] uses a slick reversal to flip [A] onto her back and take top position.",
            "[D] catches [A] overextending and snatches a deep darce choke attempt of her own.",
            "[D] times the throw attempt and steps around it, pulling [A]'s back and threatening a rear-naked.",
            "[D] catches the arm submission attempt early and hitchhiker-rolls clear before [A] can finish.",
            "[D] uses a strong frame to keep [A] at bay, denying her any progress toward pass.",
            "[D] shrimps out of the tight side control and immediately fights back to her knees.",
            "[D] catches [A] mid-transition and sweeps her cleanly to reverse the position.",
            "[D] wraps her legs around [A]'s waist from guard and controls the space patiently.",
            "[D] sits up sharply and catches [A] in a guillotine as she pressures in."
        ],
        catfight: [
            "[D] bites down on her mouthpiece and aggressively shoves [A] away.",
            "[D] weathers the chaotic storm, refusing to back down from the brawl.",
            "[D] catches [A]'s wrist mid-swing, halting her momentum entirely.",
            "[D] blocks the wild hair grab and yanks [A]'s arm down hard, breaking her grip.",
            "[D] ducks under the slap and tackles [A] into the ropes, wrestling for control.",
            "[D] grabs [A]'s scratching hand and bends the fingers back sharply — a warning.",
            "[D] kicks [A]'s knee as she rushes in, stopping the charge cold.",
            "[D] uses [A]'s own momentum to spin her into the cage wall face-first.",
            "[D] grabs both of [A]'s wrists and holds them apart, snarling into her face.",
            "[D] pulls her head aside just as [A]'s nails rake across the air where she was.",
            "[D] steps back and hammers a straight slap into [A]'s chest before she can close the distance.",
            "[D] traps [A]'s arm and twists, forcing [A] to the mat to avoid the joint lock.",
            "[D] headbutts [A]'s charge, stopping her dead and sending them both staggering backward.",
            "[D] ducks behind [A] with a quick spin, stealing her back before [A] can turn.",
            "[D] catches [A]'s flying arm and uses it to hip-toss her hard to the mat.",
            "[D] drops her chin, takes the slap on the forehead, and shoves [A] away with contempt."
        ],
        sexfight: [
            "[D] turns the sensual clinch around, reversing the position and reclaiming her dignity.",
            "[D] forcefully rejects [A]'s dominating advance with a scornful push.",
            "[D] controls [A]'s wrist and strips the grip, spinning away from the dominant position.",
            "[D] arches her back dramatically, breaking [A]'s hold and creating enough space to scramble free.",
            "[D] bridges and rolls, reversing the mount and briefly taking top position.",
            "[D] locks her legs around [A]'s waist, turning defense into a constricting counter.",
            "[D] catches [A]'s hand mid-grope and bends the fingers back firmly — a clear message.",
            "[D] shimmies her hips out of [A]'s grasp and pops back to her feet defiantly.",
            "[D] plants her forearm across [A]'s chest and pushes up, separating herself from the clinch.",
            "[D] wraps [A] in a sudden standing grapevine, matching the body-to-body pressure tit-for-tat.",
            "[D] hooks one leg behind [A]'s and pushes, sweeping her backward onto the mat.",
            "[D] grabs [A]'s wrists and controls them, using strength alone to deny [A] any access.",
            "[D] presses her palms to [A]'s shoulders and shoves, creating space and regaining her stance.",
            "[D] rolls sideways out of the exposed pin before [A] can capitalize on the position.",
            "[D] catches [A]'s head between her thighs and applies a quick counter-scissor before releasing.",
            "[D] bites [A]'s earlobe sharply on the break — aggressive, surprising, and effective."
        ]
    },

    // ── DIALOGUE ─────────────────────────────────────────────────────────────

    generateDialogue(fighter, isAttacking) {
        const arch = fighter.personality?.archetype || 'Alpha';
        const color = window.GameState?.getClub(fighter.club_id)?.color || '#fff';

        const pool = (this.dialogueLines[arch] || this.dialogueLines['Alpha'])[isAttacking ? 'atk' : 'def'];
        const line = this._pick(pool);

        return `<span class="dialogue" style="color:#fff; text-shadow: 0 0 5px ${color}, 1px 1px 2px #000; font-style:italic; font-weight:bold;">${fighter.name}: ${line}</span>`;
    },

    dialogueLines: {
        "Ice Queen": {
            atk: [
                '"Is that truly the best you can offer?"',
                '"Stop struggling. It only makes you look pathetic."',
                '"I expected a challenge. This is just... sad."',
                '"You\'re outclassed and you know it."',
                '"I\'ve broken better women than you before breakfast."',
                '"Every time you try, you remind me why I never lose."',
                '"Scream if you like. No one\'s coming to help you."',
                '"Does it hurt? Good. Remember this feeling."',
                '"You\'re not a fighter. You\'re a lesson."',
                '"I will take everything from you. Slowly."',
                '"You should have stayed home."',
                '"Adorable. Keep trying."'
            ],
            def: [
                '"You\'re wasting your energy."',
                '"Predictable."',
                '"Such poor form."',
                '"I felt nothing."',
                '"Is that supposed to intimidate me?"',
                '"You telegraph every single move."',
                '"I\'ve seen amateurs with more composure."',
                '"Finished already?"',
                '"I haven\'t even begun."',
                '"Keep going. You\'re just tiring yourself out."',
                '"So... that\'s all you have."',
                '"You\'re boring me."'
            ]
        },
        "Rebel": {
            atk: [
                '"Yeah?! How does that feel, bitch?!"',
                '"I\'m gonna break you in half!"',
                '"Bleed for me!"',
                '"Come on! Come ON! Is that all you\'ve got?!"',
                '"I\'ve wanted to do this for SO long!"',
                '"You had this coming!"',
                '"Stay DOWN!"',
                '"Don\'t you dare get up!"',
                '"I\'m just getting started!"',
                '"This is my ring. MY ring!"',
                '"Shut your face and take it!"',
                '"I\'ll drag you to hell if I have to!"'
            ],
            def: [
                '"Is that a punch or a caress?!"',
                '"Come on, hit me harder!"',
                '"You hit like a child!"',
                '"That\'s the best you\'ve got? Pathetic."',
                '"I\'ve been hit harder by fans at the bar!"',
                '"Try again. And this time, put your back into it."',
                '"Do you even lift?"',
                '"Haha! Is that it?!"',
                '"Is your arm okay? That looked really sad."',
                '"You can\'t hurt me. Nothing can."',
                '"More! MORE!"',
                '"I barely felt that, sweetheart."'
            ]
        },
        "Alpha": {
            atk: [
                '"Bow down!"',
                '"Know your place!"',
                '"I own this ring. I own you."',
                '"You\'re mine now."',
                '"Submit to me."',
                '"This is what dominance looks like."',
                '"Look at you. You\'re already broken."',
                '"I could do this all day."',
                '"You serve at my pleasure."',
                '"Every fighter here knows I\'m the best."',
                '"I don\'t just beat you. I erase you."',
                '"Yield. It\'s the only thing left for you."'
            ],
            def: [
                '"I am immovable."',
                '"You can\'t break me."',
                '"I will outlast you."',
                '"Nice try."',
                '"I\'ve survived worse than you."',
                '"I don\'t feel pain. I feel data."',
                '"You\'re a speed bump."',
                '"Try harder. I\'m not impressed."',
                '"I won\'t fall. Not today. Not ever."',
                '"That tickled."',
                '"Keep hitting. You\'ll get tired before I do."',
                '"Everything you have is not enough."'
            ]
        },
        "Showboat": {
            atk: [
                '"Did you catch that camera angle?!"',
                '"Smile for the flashing lights, honey!"',
                '"You\'re just my stepping stone!"',
                '"I look incredible right now!"',
                '"The crowd loves this! Can you feel it?!"',
                '"This is art, baby. You\'re just the canvas."',
                '"They didn\'t come to see you. They came to see ME."',
                '"Every second of this is going on my highlight reel!"',
                '"Don\'t bleed too much — you\'ll ruin my outfit."',
                '"I could sell this moment to a magazine RIGHT NOW."',
                '"Gorgeous, aren\'t I? Even while ending your career."',
                '"Wave to the cameras! Last chance before I put you down."'
            ],
            def: [
                '"Don\'t ruin my face!"',
                '"I\'m still looking gorgeous!"',
                '"The crowd loves me more, anyway!"',
                '"You almost messed up my hair. Almost."',
                '"Not the face! NEVER the face!"',
                '"I literally just fixed my makeup."',
                '"Do I look rattled? I literally never look rattled."',
                '"You can\'t touch me. You\'re not on my level."',
                '"The cameras are on me. I can\'t afford to lose here."',
                '"Rude. Very rude."',
                '"I\'m not even sweating."',
                '"Try that again and I\'ll make you regret it for the cameras."'
            ]
        },
        "Strategist": {
            atk: [
                '"I mapped this out three rounds ago."',
                '"Predictable. Exactly as I expected."',
                '"Your left side is wide open. Has been all match."',
                '"You\'ve thrown that same combination four times. Fourth time hurts."',
                '"I\'ve been setting this up since round one."',
                '"You\'re fighting MY fight. How does that feel?"',
                '"Every opening you think you see? I put it there."',
                '"Check. And mate."',
                '"I know your next five moves. Do you?"',
                '"You played right into it. Every time."',
                '"I don\'t fight with strength. I fight with knowledge."',
                '"Adapt. You can\'t. I already closed every door."'
            ],
            def: [
                '"I anticipated that."',
                '"Already accounted for."',
                '"That\'s the third time. I was waiting."',
                '"Your pattern is obvious."',
                '"I\'ve seen this before. Many times."',
                '"You\'re fighting a script you don\'t know you\'re reading."',
                '"Neutralized."',
                '"I\'ve already planned my response to your next attempt."',
                '"Nothing you do will surprise me."',
                '"Interesting choice. Wrong, but interesting."',
                '"You\'ve revealed everything I needed."',
                '"My defense isn\'t reaction. It\'s preparation."'
            ]
        },
        "Technician": {
            atk: [
                '"There. That\'s the proper application of leverage."',
                '"Your elbow is weak on the inside. Notice that."',
                '"Every joint has its limit. I\'m finding yours."',
                '"Technique beats raw strength. Lesson one."',
                '"I could explain what I\'m doing, but you\'d need to survive first."',
                '"That hold was invented in 1954. It still works."',
                '"Your guard breaks down under sustained pressure. I noticed in round one."',
                '"Kinetic chain. Hip rotation. Follow through. Done."',
                '"The body does not lie."',
                '"Properly executed, this is unstoppable."',
                '"Don\'t fight the physics. You\'ll lose."',
                '"Perfect form. As always."'
            ],
            def: [
                '"Your angle was wrong."',
                '"Insufficient force vector."',
                '"I saw the telegraphing from two seconds out."',
                '"Mechanically unsound."',
                '"You overextended. Classic mistake."',
                '"Correct your weight distribution. You\'re wasting energy."',
                '"That\'s not how that submission works."',
                '"You favour your right side. I noticed."',
                '"Interesting attempt. Poor execution."',
                '"Your hips were out of alignment."',
                '"Force without technique is just noise."',
                '"I\'ve studied your game film. You always do that."'
            ]
        },
        "Underdog": {
            atk: [
                '"I won\'t give up!"',
                '"This is for everyone who doubted me!"',
                '"I can DO this!"',
                '"I\'ve worked too hard to lose here!"',
                '"Nobody believed in me. Doesn\'t matter!"',
                '"GET UP COME ON GET UP!"',
                '"I\'m not going away! I\'m not going AWAY!"',
                '"You\'re gonna have to KILL me!"',
                '"I\'ve got nothing to lose! NOTHING!"',
                '"Every punch I\'ve ever taken led to this moment!"',
                '"This is my moment! MY MOMENT!"',
                '"DO YOU SEE THIS?! DO YOU ALL SEE THIS?!"'
            ],
            def: [
                '"Just keep breathing..."',
                '"I\'ve survived worse!"',
                '"Not today!"',
                '"I can take it... I can take it..."',
                '"I\'ve been hit harder in practice."',
                '"I\'m still HERE!"',
                '"You\'re not finishing me. Not like this."',
                '"I\'ve got more."',
                '"I. Will. Not. Quit."',
                '"C\'mon legs. C\'mon."',
                '"I won\'t fall. Not to her."',
                '"Hurt me more. I like it."'
            ]
        }
    },

    // ── CROWD REACTIONS ──────────────────────────────────────────────────────

    crowdReactions: [
        "The crowd erupts into a deafening roar!",
        "The arena shakes with thunderous applause!",
        "The audience gasps collectively in shock!",
        "Wild cheering breaks out in all sections!",
        "The ringside press scrambles for their cameras!",
        "A stunned silence falls before the crowd finds its voice!",
        "Flashbulbs strobe around the arena like a lightning storm!",
        "The commentators are completely speechless!",
        "Half the crowd is on its feet!",
        "The entire arena is chanting someone's name!",
        "Referee takes a long look, but the action continues!",
        "The sold-out crowd is absolutely losing their minds!",
        "The venue fills with a mix of cheers and horrified gasps!",
        "Someone in the front row drops their drink in shock!",
        "Even the security team is distracted by what they just witnessed!"
    ],

    // ── ARCHETYPE EVENTS ─────────────────────────────────────────────────────

    generateArchetypeEvent(fighter, eventType, opponentName) {
        const color = window.GameState?.getClub(fighter.club_id)?.color || '#ffeb3b';
        const name = `<span style="color:${color}; font-weight:bold; text-shadow: 0 0 1px #fff, 0 0 2px rgba(255,255,255,0.8);">${fighter.name}</span>`;

        const pools = {
            SHOWBOAT: [
                `${name} pauses the assault, blowing a mocking kiss to the roaring crowd and milking the moment to perfection.`,
                `${name} breaks from the action to pose for the cameras, running a hand through her hair while ${opponentName || 'her opponent'} tries to recover.`,
                `${name} winks at the ringside judges and mouths "Was that good?" before turning back to continue the destruction.`,
                `${name} does a slow, deliberate spin for the crowd, arms wide, fully aware she's in complete control.`,
                `${name} leans casually against the ropes, checking her nails while ${opponentName || 'her opponent'} struggles to stand.`,
                `${name} makes the crowd wait, holding her dominant position and letting the cameras capture every angle.`,
                `${name} cups her ear to the crowd, feeding off the roar, the fight momentarily forgotten in the adulation.`
            ],
            TILT: [
                `${name} screams in sheer frustration, completely abandoning her gameplan and swinging with blind desperate rage!`,
                `${name} slams her fist into the mat and unleashes a string of profanity that gets muffled by the crowd noise!`,
                `Something snaps behind ${name}'s eyes. She surges forward with no technique, just fury!`,
                `${name} tears at her own hair in frustration before lunging at ${opponentName || 'her opponent'} with reckless abandon!`,
                `${name}'s composure shatters. She's fighting on pure, unfiltered emotion now — and it shows!`,
                `${name} starts screaming mid-exchange, her focus completely gone, throwing wild and desperate!`,
                `The cool exterior cracks. ${name} is losing it completely — her footwork gone, her guard forgotten!`
            ],
            SURGE: [
                `A dangerous fire ignites in ${name}'s eyes. She bites her mouthpiece and surges forward with terrifying aggression!`,
                `${name} unleashes a primal scream and shifts into another gear — the crowd roars as she takes the fight to ${opponentName || 'her opponent'}!`,
                `Something clicked. ${name} stops thinking and starts hunting, and the difference is immediate and terrifying!`,
                `${name}'s body language transforms completely. She stops running and starts chasing!`,
                `The desperation is gone. ${name} has found something deep in her reserve and she's using every last drop!`,
                `${name} charges forward with a roar that echoes through the entire arena — zero hesitation, pure aggression!`,
                `${name} snaps. But not in the bad way. In the very, very dangerous way!`
            ],
            RALLY: [
                `Against all odds, ${name} finds a second wind! She wipes the blood from her lip and mounts an incredible comeback!`,
                `The crowd rallies behind ${name} as she digs deeper than anyone thought she could!`,
                `${name} refuses to stay down. For the third time. The fourth. She keeps getting up!`,
                `Somehow, impossibly, ${name} is fighting back. Harder than before!`,
                `The underdog stands. ${name} is not done — she's just getting angry!`,
                `${name} pulls from reserves nobody knew existed. The entire arena is on its feet for her!`,
                `This is what heart looks like. ${name} is running on pure will power now and the crowd knows it!`
            ],
            DIRTY_MOVE: [
                `${name} blatantly ignores the referee, digging a cheap thumb into ${opponentName || 'her opponent'}'s eye during the break!`,
                `${name} catches ${opponentName || 'her opponent'} with a concealed hair pull, yanking her face-first into the canvas — dirty, but effective!`,
                `${name} uses the clinch to land a sneaky headbutt that has ${opponentName || 'her opponent'} blinking stars!`,
                `${name} deliberately steps on ${opponentName || 'her opponent'}'s ankle on the break — vicious and calculated!`,
                `${name} sinks a half-hidden choke between the rounds, cutting off blood flow just long enough to scramble ${opponentName || 'her opponent'}'s senses!`,
                `${name} thumbs ${opponentName || 'her opponent'}'s face in the clinch — the referee misses it completely!`,
                `${name} lands a forearm across ${opponentName || 'her opponent'}'s throat on the break, disguised as a block — blatantly illegal!`
            ],
            SUSTAINED_PRESSURE: [
                `${name} refuses to give an inch, breaking ${opponentName || 'her opponent'}'s spirit with suffocating unending pressure!`,
                `${name} methodically cuts off every escape route, pressing ${opponentName || 'her opponent'} into a tighter and tighter corner!`,
                `The pressure is relentless. ${name} is taking away every option, one by one, systematically!`,
                `${name} hunts ${opponentName || 'her opponent'} around the entire ring, never letting her breathe, never letting her set!`,
                `There is nowhere to go. ${name} has established absolute ring control and she's using it to maximum effect!`,
                `${name} walls off every exit, walking ${opponentName || 'her opponent'} down with cold, mechanical efficiency!`,
                `The sustained pressure from ${name} is visible on ${opponentName || 'her opponent'}'s face — she's wilting under it!`
            ]
        };

        const text = this._pick(pools[eventType] || [`${name} makes a significant move!`]);

        return `<div style="background: rgba(255, 235, 59, 0.1); border-left: 3px solid #ffeb3b; padding: 10px; margin: 5px 0; font-style: italic;">
                    <strong style="color: #ffeb3b;">[ ${eventType.replace(/_/g, ' ')} ]</strong> ${text}
                </div>`;
    },

    // ── FINISH ───────────────────────────────────────────────────────────────

    generateFinish(winner, loser, style, round) {
        const cW = window.GameState?.getClub(winner.club_id)?.color || '#00e676';
        const cL = window.GameState?.getClub(loser.club_id)?.color || '#ff5252';
        const wN = `<span style="color:${cW}; font-weight:bold; text-shadow: 0 0 1px #fff, 0 0 2px rgba(255,255,255,0.8);">${winner.name}</span>`;
        const lN = `<span style="color:${cL}; font-weight:bold; text-shadow: 0 0 1px #fff, 0 0 2px rgba(255,255,255,0.8);">${loser.name}</span>`;

        const pools = {
            boxing: [
                `${wN} unleashes a devastating skull-rattling combination against the ropes! ${lN}'s eyes roll back — the referee dives in to wave it off! It's OVER!`,
                `A picture-perfect uppercut from ${wN} separates ${lN} from her senses! She collapses to the canvas in a crumpled heap!`,
                `${wN}'s right hook connects flush — ${lN} is out on her feet, prompting an immediate TKO stoppage!`,
                `${wN} backs ${lN} into the corner and unleashes a torrent of unanswered punches — the referee has seen enough!`,
                `A perfectly timed counter right hand from ${wN} turns out the lights on ${lN} — she drops straight down, legs completely gone!`,
                `${wN} opens a cut over ${lN}'s eye with a sharp elbow on the break — the doctor is waved over and the fight is stopped!`,
                `A thunderous left hook catches ${lN} walking in — she hits the canvas before her brain even registers the impact!`,
                `${wN} pins ${lN} in the corner and unloads a furious combination that sees the referee dive in to save her from further punishment!`
            ],
            naked_wrestling: [
                `${wN} flattens ${lN} completely with a suffocating chokehold! ${lN} turns purple and taps frantically before fading!`,
                `Absolute dominance! ${wN} isolates an arm and cranks it past the breaking point — ${lN} screams and taps out!`,
                `${wN} raining down vicious unanswered blows forces a merciful referee stoppage!`,
                `${wN} sinks a rear-naked choke so deep and tight that ${lN}'s hand taps three times before she goes completely limp!`,
                `A textbook triangle choke from ${wN} — ${lN} fights it for ten agonizing seconds before her hand drops and she passes out!`,
                `${wN} takes the back, slides her hooks in, and cranks a neck crank that has ${lN} screaming and slapping the mat in desperation!`,
                `${wN} rolls through into a perfect armbar — ${lN} tries to roll free but the angle is wrong and she's forced to tap loudly!`,
                `${wN} achieves full mount and rains down elbows — ${lN} covers up but has no answers, and the referee stops the punishment!`
            ],
            catfight: [
                `${wN} gets on top and simply doesn't stop. The referee pulls her off a barely-conscious ${lN} after five unanswered blows!`,
                `${wN} locks in a savage hair-assisted choke that has ${lN} flailing helplessly until her strength gives out completely!`,
                `${wN} grabs ${lN} by the throat with both hands — the referee dives in before the situation becomes genuinely dangerous!`,
                `A vicious headscissor from ${wN} compresses until ${lN} stops struggling entirely — medical team rushes in immediately!`,
                `${wN} slams ${lN}'s head into the mat three times in quick succession — the referee stops it on the third impact!`,
                `${wN} mounts ${lN} and batters her with two-handed slaps until ${lN}'s arms drop and she simply stares at the ceiling!`,
                `${wN} locks in a chokehold from behind and squeezes until ${lN}'s body goes completely limp — an emphatic finish!`,
                `${wN} wraps ${lN}'s own arm around her neck in a crucifix choke — the pressure builds until ${lN} taps out desperately!`
            ],
            sexfight: [
                `The exhibition reaches its climax! ${wN} forces the completely exhausted ${lN} into a deeply humiliating submission — a quivering, helpless mess!`,
                `Total submission! ${wN} pins ${lN} down and asserts complete erotic dominance until ${lN} begs for the match to end!`,
                `${wN} completely breaks ${lN}'s spirit with an incredibly intimate punishing hold — the crowd erupts as ${lN} finally taps!`,
                `${wN} locks in a face-smothering mount that ${lN} cannot escape — she eventually taps after what feels like an eternity!`,
                `The scissorhold from ${wN} is absolute. ${lN} writhes, bucks, scratches — but ultimately her hand slaps the mat in surrender!`,
                `${wN} finishes with a dominant full-body press that leaves ${lN} fully exposed and unable to move — she is forced to submit!`,
                `${lN} breaks. She simply breaks. Her body goes limp in ${wN}'s hold and she verbally submits to a roaring crowd!`,
                `${wN} overpowers ${lN} in a clinch so complete it's almost tender — then she tightens everything and ${lN} submits instantly!`
            ]
        };

        const pool = pools[style] || pools['boxing'];
        const txt = this._pick(pool);

        return `<div style="background: rgba(255, 61, 0, 0.15); border-left: 4px solid #ff3d00; padding: 15px; margin: 15px 0; font-size: 1.15em; text-align: center;">
                    <strong>[ EARLY FINISH — ROUND ${round} ]</strong><br>
                    <em style="color:#fff;">${txt}</em>
                </div>`;
    },

    // ── POST-MATCH PUNISHMENT ─────────────────────────────────────────────────
    // Called from ui_match.js runPostMatch() based on dominance_hunger and relationship

    generatePunishment(winner, loser, style, relationship, roundDiff) {
        const gs = window.GameState;
        const cW = gs?.getClub(winner.club_id)?.color || '#FF3366';
        const wN = `<span style="color:${cW}; font-weight:bold; text-shadow: 0 0 1px #fff, 0 0 2px rgba(255,255,255,0.8);">${winner.name}</span>`;
        const lN = `<strong>${loser.name}</strong>`;
        const isBlowout = roundDiff >= 4;
        const pHunger = winner.personality?.dominance_hunger || 50;
        const sLean = loser.personality?.submissive_lean || 40;
        const hasNoBoundary = !loser.personality?.boundaries?.includes('no_public_degradation');

        // Sportsmanship (low dominance)
        if (pHunger < 35) {
            return this._pick([
                `${wN} kneels beside the battered ${lN}, offering a hand to pull her up. A rare and genuine display of sportsmanship that draws warm applause.`,
                `${wN} sits down next to ${lN} on the mat, puts an arm around her, and says something softly into her ear. ${lN} nods slowly.`,
                `${wN} helps ${lN} to her feet and raises her hand alongside her own to the crowd — the consummate professional.`,
                `${wN} gestures for the medical team immediately, kneeling by ${lN} with genuine concern on her face.`,
                `${wN} presses her forehead to ${lN}'s in a gesture of deep competitive respect before helping her up.`,
                `${wN} applauds ${lN} to the crowd — acknowledging the effort, even in defeat.`
            ]);
        }

        // Moderate dominance (40-70)
        if (pHunger >= 35 && pHunger <= 65) {
            if (isBlowout) {
                return this._pick([
                    `${wN} stands victorious over the completely broken ${lN}. She places a foot squarely on ${lN}'s chest, raising her arms to the screaming crowd!`,
                    `${wN} leans down and grabs ${lN}'s chin, tilting her face up toward the cameras. "Smile. You're on television." The crowd loses it.`,
                    `${wN} does a slow lap around the ring, stepping over ${lN}'s prone form twice like she's not even worth navigating around.`,
                    `${wN} grabs the ring announcer's microphone before anyone can stop her and makes a speech directly over ${lN}'s body.`,
                    `${wN} crouches over ${lN} and holds her face up to the crowd — a trophy moment that will be on every front page tomorrow.`,
                    `${wN} plants her boot on ${lN}'s back like a big-game hunter. She'll pay the fine. It was worth it.`,
                    `${wN} plucks ${lN}'s corner towel from the floor and tosses it dismissively back onto ${lN}'s face. "Use it. You need it more."`,
                    `${wN} stands over ${lN} and slowly, deliberately, counts to ten on her fingers — mocking the referee who nearly had to do it for real.`
                ]);
            } else {
                return this._pick([
                    `${wN} struts around the ring, soaking in the cheers while ignoring the groaning ${lN} on the mat.`,
                    `${wN} gives ${lN} a light, dismissive pat on the head before walking to her corner.`,
                    `${wN} steps over ${lN}'s legs without breaking stride, making it clear the fight ended the moment she decided it did.`,
                    `${wN} poses in the neutral corner while ${lN} slowly picks herself up — she doesn't bother to look back.`,
                    `${wN} blows a kiss to her fans, then glances at ${lN} on the mat with polite indifference.`,
                    `${wN} accepts congratulations from her corner over the ropes, pointedly with her back to ${lN}.`,
                    `${wN} crouches and murmurs something to ${lN} that makes ${lN}'s expression flicker — then stands and walks away.`
                ]);
            }
        }

        // High dominance (>65) — check relationship type
        if (relationship === 'lovers' || relationship === 'attraction' || relationship === 'obsession') {
            if (sLean > 45 && hasNoBoundary) {
                return this._pick([
                    `${wN} crawls over the exhausted ${lN}, pinning her down. She leans in close, pressing her lips to ${lN}'s ear and whispering something filthy that makes ${lN} flush crimson from neck to forehead.`,
                    `${wN} grabs ${lN}'s face in both hands and stares down at her. Then, slowly, she presses a deep and dominating kiss to ${lN}'s lips in front of everyone. ${lN} is completely unable to resist.`,
                    `${wN} drapes herself over ${lN}'s body, trailing her fingers from ${lN}'s chin down to her stomach while the crowd goes absolutely wild.`,
                    `${wN} pulls ${lN} up by the wrist, spins her around, and wraps both arms around her from behind — pressing her lips to ${lN}'s neck. "Mine," she says clearly into the microphone.`,
                    `${wN} sits on ${lN}'s thighs and holds her face, thumbs tracing her jawline. She whispers something. ${lN}'s eyes widen, then soften. Then close.`,
                    `${wN} unclips ${lN}'s hair, letting it fall loose, then runs her fingers through it possessively while ${lN} lies too exhausted to protest — or too willing.`,
                    `${wN} traces the outline of ${lN}'s lips with one finger, then her collarbone, slowly. "Beautiful, even now," she says to the cameras. ${lN} shivers.`,
                    `${wN} tips ${lN}'s chin up with two fingers and holds her gaze for a long, loaded moment. Then she smiles and licks her own lips very deliberately.`,
                    `${wN} settles fully onto ${lN}'s hips, pins her wrists, and grinds slowly. The crowd erupts. ${lN}'s body responds before her pride can stop it.`,
                    `${wN} slides her hand behind ${lN}'s neck, leans down, and bites her lower lip gently. Then harder. ${lN} gasps and the arena absolutely loses control.`
                ]);
            } else {
                return this._pick([
                    `${wN} pulls ${lN} to her feet and holds her close — too close for just sport — before releasing her with a smirk.`,
                    `${wN} presses her palm flat against ${lN}'s chest to feel her heartbeat, then raises an eyebrow as if confirming something private.`,
                    `${wN} fixes ${lN}'s hair gently, with surprising tenderness — then whispers something that makes ${lN} look away.`,
                    `${wN} hooks a finger under ${lN}'s chin and lifts her face. A long look. Then a quiet smile. Then she walks away.`,
                    `${wN} sits beside ${lN} on the canvas and says nothing. They lean against each other, breathing hard. The crowd doesn't know what to make of it.`
                ]);
            }
        }

        // High dominance + rival/bitter relationship
        if (relationship === 'bitter_rivals' || relationship === 'rivalry') {
            return this._pick([
                `${wN} refuses to back off! She grabs a handful of ${lN}'s hair and brutally slams her face back into the canvas long after the bell — officials literally have to tear her away!`,
                `${wN} cranks a submission hold even tighter despite the match being over, forcing ${lN} to scream in agony until security intervenes!`,
                `${wN} kicks ${lN}'s ribs hard while she's still down. Once. Twice. The referee physically pushes her back.`,
                `${wN} grabs ${lN}'s head in both hands and screams directly into her face — a primal, vicious declaration of dominance.`,
                `${wN} yanks ${lN} upright by the hair and forces her to face the camera. "Look at you," she snarls. "Look at what I did to you."`,
                `${wN} digs her knee into ${lN}'s back while she's face-down and leans on her like a piece of furniture. Security is jogging in from the corners.`,
                `${wN} steps onto ${lN}'s hair, then slowly walks over her. The crowd is half booing, half cheering. ${lN} screams.`,
                `${wN} pins ${lN}'s arms behind her back and forces her head down into the canvas. "Say it," she growls. The microphone catches everything.`,
                `${wN} tears off ${lN}'s corner towel and uses it to wipe her own face before dropping it on ${lN}'s head dismissively.`,
                `${wN} hauls ${lN} up by the scruff and shoves her into the ropes, then gets in her face with four inches of space and a torrent of profanity.`
            ]);
        }

        // Default high dominance (no specific relationship)
        if (pHunger > 65) {
            return this._pick([
                `${wN} stands over the fallen ${lN}, hands on hips, breathing hard. She lets the moment hang. The crowd knows who just won the night.`,
                `${wN} grabs ${lN}'s ankle and drags her to the center of the ring before releasing it. "Stay there. I want everyone to see you."`,
                `${wN} crouches next to ${lN} and speaks quietly into her ear. ${lN}'s expression crumbles. Whatever was said stays between them.`,
                `${wN} raises her own arm — not waiting for the official. She knows. Everyone knows.`,
                `${wN} walks the full perimeter of the ring, arms raised, while ${lN} slowly tries to piece herself back together behind her.`,
                `${wN} gives ${lN} one last look — cold, complete, dismissive — then turns away to celebrate with her corner.`,
                `${wN} takes her mouthpiece out and drops it on ${lN}'s chest. A final, contemptuous punctuation mark.`
            ]);
        }

        // Fallback
        return `${wN} takes a victory lap around the ring while ${lN} recovers on the canvas.`;
    }
};