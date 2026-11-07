# Formatting Guide: the ElevenLabs Composition Plan

How to lay the song out as an ElevenLabs Music **composition plan**. The persona decides what to write; this guide decides how it is laid out so the generator sings it correctly. Several rules here come from test generations and are marked **Tested**.

---

## What a Composition Plan Is

A plan is an ordered list of **chunks**. Each chunk is one stretch of the song with its own text, duration and style lists.

| Field | What goes in it | Limits |
|-------|-----------------|--------|
| `text` | A section label in square brackets, the lyric lines, and short musical cues in curly braces | 30 lines, 200 characters per line |
| `duration_ms` | How long the chunk lasts | 3,000 to 120,000 |
| `positive_styles` | Descriptors of what should be heard | English only, up to 50 |
| `negative_styles` | Descriptors of what must not be heard | Up to 50 |
| `context_adherence` | How closely the chunk follows the ones around it: `high` (default), `medium`, `low` | |

A reel needs 3 to 6 chunks.

---

## The Opening: Sung From the First Second

The song must start with the full beat and the lead vocal together at 0:00.

- **Label the first chunk `[Verse 1]`, whatever it contains.** **Tested:** when the first chunk is labelled `[Hook]`, `[Chorus]` or `[Intro]`, the generator plays it as an instrumental intro and skips its lyrics, so the vocal arrives 6 to 14 seconds late and the opening lines are lost. The same lines under `[Verse 1]` are sung from 0:00. The opening is still written as the hook; only the label changes.
- **Number the labels in order:** `[Verse 1]`, `[Verse 2]`, and so on. A hook that returns later in the song can be labelled `[Hook]`.
- **The first line of the first chunk is a lyric line.** No cue, no spoken word, no signature, nothing before it. Never write `{beat drops}` or `{instrumental}` in the first chunk.
- **Never add an instrumental chunk** at the start. **Tested:** an instrumental lead-in chunk made the generator leave the whole song without vocals.
- Add these two styles to the first chunk's `positive_styles`, word for word: `song starts mid-energy as if already playing, full drums and 808 from the very first beat` and `vocal enters immediately at 0:00`.
- Add `intro`, `build-up`, `sparse opening` and `spoken intro` to the first chunk's `negative_styles`.

---

## The `text` Field

```
[Verse 1]
Tuesday, new high, record close
S and P, Nasdaq, both of those
```

- **Section label** on the first line, in square brackets. Keep it a plain name; delivery goes in the styles.
- **Lyrics** as plain lines, one bar per line.
- **Musical cues** in curly braces, kept short and never before the first lyric line of the song: `{beat cuts out}`, `{drums only}`, `{hard stop}`.
- **No vocal descriptions in the text.** "aggressive female rap" or "whispered" belongs in `positive_styles`, never in parentheses or braces among the lyrics.
- **Ad-libs:** leave them out, or keep at most one or two in parentheses at the end of a bar. They are not part of the captions.
- **Captions copy these words.** Each caption's `sung` text is copied from the lyric lines of its chunk, so write the lines once here and reuse them exactly.

### Numbers, names and the signature
- Spell numbers out as spoken: `seventy-eight hundred`, `five point three percent`
- Use company names, not tickers; spell letters out where needed: `S and P five hundred`, `A-M-D`
- Write the signature as `Mew-Zookie`. It appears once or twice in the whole plan, never more, and never in the first chunk's opening line.

---

## Styles

The first chunk's styles set the sound of the whole song, so make them the most complete. Give at least 6 or 7, and be specific; anything left unsaid comes out generic.

**Cover these in the first chunk:**
1. **Genre:** `melodic trap`, `boom bap hip hop`, `dark drill`
2. **Tempo and key:** `130 BPM`, `in A minor`. State the BPM as a number; the model holds it.
3. **Drums and bass:** `bouncy saturated 808 bass`, `crisp trap hi-hats with rolls`, `dusty swung boom bap drums`
4. **Melodic bed:** `warm fingerpicked acoustic guitar loop`, `soft felt piano`, `mellow electric keys`
5. **Texture and era:** `lo-fi tape saturation`, `bedroom-produced`, `2020s underground hip hop`
6. **Lead vocal:** gender and delivery together: `confident female rap vocal`, `gritty male rap vocal`, `autotuned sung male hook`
7. **Mood:** `triumphant`, `tense`, `melancholic`
8. **Clarity:** `clear, well-enunciated lead vocal mixed up front`

**Rules:**
- **No artist names, song titles or label names** in any style. The API rejects them.
- **Always state the vocal gender and that it is rap,** or the model picks for itself and may sing everything.
- **English only** for styles.
- Use studio vocabulary where it helps: `close-mic'd`, `bone-dry vocal`, `plate reverb`, `sidechained bass`.
- Later chunks repeat the core styles (genre, BPM, vocal, clarity) and add what changes.

**Negative styles** are worth using in every chunk:
`pop`, `EDM`, `rock guitar`, `orchestral`, `intro`, `build-up`, `mumbled vocals`, `fade out`, and the opposite vocal gender when only one voice is wanted.

### Full beat under every sung hook
**Tested:** left alone, the generator arranges a sung hook softly, with almost no bass or drums. Every chunk that carries hook lines, including the first, must have these `positive_styles`:
- `heavy 808 sub bass and punchy kick drum playing under the vocal`
- `full loud energetic arrangement`
- `drums, bass and guitar all playing together` (name the song's own melodic instrument in place of guitar)

and these `negative_styles`: `a cappella`, `stripped back`, `quiet`, `soft ambient opening`, `drumless`, `no bass`.

The only exception is a hook the news mood calls to be bare, such as a grieving song, and even then the first second must not be silent.

---

## Flow Switches and Mood Turns

There are no flow tags, so each change of delivery gets its own chunk with styles that describe it.

| What changes | Add to that chunk's `positive_styles` | `context_adherence` |
|--------------|----------------------------------------|---------------------|
| Laid-back verse | `laid-back conversational rap`, `behind-the-beat delivery` | `high` |
| Locked-in verse | `tight syncopated rap flow with triplet pockets and internal rhymes`, `every syllable locked to the beat` | `high` |
| Building verse | `building, accelerating triplet flow, words stacking tighter every bar`, `growing intensity` | `high` |
| Aggressive switch | `aggressive rap delivery`, `hard consonants`, `full drums and 808` | `high` |
| Double time | `double-time rap`, `rapid-fire but clearly enunciated syllables`, `rolling hi-hats` | `high` |
| Half time | `half-time drums`, `heavy sparse kick`, `slow deliberate rap` | `high` |
| Mood turn or beat switch | the new palette, such as `low drone`, `ticking hi-hats only`, `filtered guitar` | `medium` |
| Sung hook | `melodic sung hook`, `autotuned vocal`, `stacked harmonies`, plus the full-beat styles above | `high` |

Do not use `low` adherence in a reel; the song is too short to survive a hard break in sound.

**Tested (The Unbowed, October 2026):** the locked-in triplet flow above, with multisyllabic internal rhymes in the lyrics themselves, gave the best-sounding rap, and every word was heard. A mid tempo of about 90 BPM kept that flow clear; faster tempos crowd it. Say the same voice in every chunk (`the same deep, controlled male rap voice, one consistent rapper throughout`) or later chunks may change singer.

**Tested:** fast, dense sections are where the words get lost. Keep double time to 2 bars, give it a chunk of its own with a little extra duration, and never put a key number in it.

---

## Durations

The model fits the lyrics into the time each chunk is given, so the durations control the pace.

- **Work from bars:** chunk duration in ms = bars in the chunk x 240,000 / BPM. Four bars at 130 BPM is 7,385 ms.
- **Whole bars only.** When every chunk is a whole number of bars, each section starts on a downbeat and every lyric lands on a predictable bar number, which the reel uses to cut and to time its characters' actions.
- **Minimum 3,000 ms per chunk.** Anything shorter must be merged into a neighbouring chunk.
- **The total of all chunks must not exceed the reel length,** and should end 2 to 5 seconds short of it.
- A chunk with too many words for its duration gets rushed or cut. If in doubt, give it a little more time.

---

## The Ending

- **End on a hook echo:** a final chunk of 2 bars (3 to 6 seconds): label `[Outro]`, the cue `{beat cuts out}`, the hook's last words again (with the signature if it has not been used twice), then `{hard stop}`. Styles: `the beat cuts out completely`, `a low whispered echo of the last line`, `choir chord held underneath` (or the song's own pad), `no drums`, `abrupt ending, no fade`. Negative styles: `new lyrics`, `spoken monologue`, `fade out`.
- Do not close on a spoken moral or summary line. It was tried and rejected: the echo loops better and does not preach.
- If there is no room for a separate outro chunk, end the final chunk on the hook line itself.

---

## Full Example

```json
{
  "chunks": [
    {
      "text": "[Verse 1]\nTuesday, new high, record close\nS and P, Nasdaq, both of those\nChips in the lead, that's how it goes\nNew high, new high, record close",
      "duration_ms": 7400,
      "positive_styles": [
        "melodic trap", "130 BPM", "bouncy saturated 808 bass", "crisp trap hi-hats with rolls",
        "warm fingerpicked acoustic guitar loop", "lo-fi tape saturation", "confident female rap vocal",
        "melodic sung hook with autotune", "triumphant", "clear, well-enunciated lead vocal mixed up front",
        "heavy 808 sub bass and punchy kick drum playing under the vocal", "full loud energetic arrangement",
        "drums, bass and guitar all playing together",
        "song starts mid-energy as if already playing, full drums and 808 from the very first beat",
        "vocal enters immediately at 0:00"
      ],
      "negative_styles": ["pop", "EDM", "rock guitar", "orchestral", "intro", "build-up", "sparse opening",
        "spoken intro", "a cappella", "stripped back", "quiet", "drumless", "no bass", "mumbled vocals", "male vocals"],
      "context_adherence": "high"
    },
    {
      "text": "[Verse 2]\nNasdaq back to back, second record in a row\nYields eased off, oil steady, now it's earnings for the show\nReporting season coming, estimates revised\nGrowth near thirty percent, that's a number on the rise",
      "duration_ms": 7400,
      "positive_styles": [
        "melodic trap", "130 BPM", "confident female rap vocal", "laid-back conversational rap",
        "behind-the-beat delivery", "clear, well-enunciated lead vocal mixed up front",
        "warm fingerpicked acoustic guitar loop"
      ],
      "negative_styles": ["sung melody", "mumbled vocals", "male vocals"],
      "context_adherence": "high"
    },
    {
      "text": "[Outro]\n{beat cuts out}\nThat's the tape. Mew-Zookie.\n{hard stop}",
      "duration_ms": 3000,
      "positive_styles": ["spoken word", "female voice", "no drums", "abrupt ending, no fade"],
      "negative_styles": ["fade out", "singing"],
      "context_adherence": "medium"
    }
  ]
}
```

---

## Checklist
✅ First chunk is labelled `[Verse 1]` and its first line is a lyric line
✅ No instrumental or intro chunk anywhere at the start
✅ First chunk has the two opening styles and at least 6 specific styles, including BPM, vocal gender, "rap" and clarity
✅ Every chunk with hook lines carries the three full-beat styles and the soft-arrangement negatives
✅ 3 to 6 chunks; every chunk is 3,000 ms or longer; durations add up to no more than the reel length
✅ No artist names in any style
✅ Each flow switch or mood turn is its own chunk with styles that describe it
✅ Numbers spelled out; `Mew-Zookie` once or twice in the whole plan
✅ Ending is a hard stop, not a fade
