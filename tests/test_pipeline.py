"""Run with:  .venv\\Scripts\\python.exe -m unittest discover tests"""
import copy
import datetime
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from pipeline import __main__ as runner  # noqa: E402
from pipeline import checks, elevenlabs, instagram, listen, news, settings, text, video  # noqa: E402
from pipeline.day import DONE, FAILED, REVIEW, Day, StageResult  # noqa: E402
from pipeline.stages import audio as audio_stage  # noqa: E402
from pipeline.stages import song as song_stage  # noqa: E402
from pipeline.stages import subtitles as subtitles_stage  # noqa: E402

NEWS = {
    "stories": [
        {
            "rank": 1,
            "headline": "S&P 500 and Nasdaq close at record highs",
            "summary": "US stocks rose on Tuesday.",
            "event_date": "2026-10-06",
            "key_facts": ["S&P 500 closed at 7,818.93, up 0.58% (record close)"],
            "entities": ["Nvidia"],
        },
        {
            "rank": 2,
            "headline": "US trade deficit jumps to $105.6 billion in August",
            "summary": "The deficit widened 13.7%.",
            "event_date": "2026-10-06",
            "key_facts": [],
            "entities": [],
        },
    ]
}
HOOK = ["S and P near seventy-eight hundred on Tuesday", "Record close and the chips led the way"]
VERSE = [f"bar number {w} of the verse" for w in "one two three four five six".split()]
STYLES = ["boom bap hip hop", "90 BPM", "dusty drums", "warm piano", "confident female rap vocal", "triumphant"]


def good_song():
    return {
        "news_date": "2026-10-06",
        "stories_used": [{"rank": 1, "headline": "S&P 500 and Nasdaq close at record highs", "status": "verified"}],
        "day_in_one_sentence": "Stocks hit records.",
        "mood": {"name": "triumphant", "reason": "records", "turn": ""},
        "vocal": "female",
        "bpm": 90,
        "hook": "S&P near 7,800 on Tuesday",
        "plan": {"chunks": [
            {"text": "[Verse 1]\n" + "\n".join(HOOK) + " (yeah)", "duration_ms": 6000,
             "positive_styles": STYLES, "negative_styles": ["pop"], "context_adherence": "high"},
            {"text": "[Verse 2]\n{drums only}\n" + "\n".join(VERSE), "duration_ms": 16000,
             "positive_styles": ["laid-back rap"], "negative_styles": []},
            {"text": "[Outro]\n{beat cuts out}\nThat's the tape, Mew-Zookie", "duration_ms": 4000,
             "positive_styles": ["spoken word"], "negative_styles": []},
        ]},
        "captions": (
            [{"section": 1, "text": "S&P near 7,800 on Tuesday", "sung": HOOK[0]},
             {"section": 1, "text": "Record close and the chips led the way", "sung": HOOK[1]}]
            + [{"section": 2, "text": line, "sung": line} for line in VERSE]
            + [{"section": 3, "text": "That's the tape, Mu-Zueki", "sung": "That's the tape, Mew-Zookie"}]
        ),
        "fact_map": [{"line": "S&P near 7,800", "claim": "S&P 500 closed near 7,800", "rank": 1,
                      "source_text": "S&P 500 closed at 7,818.93"}],
        "beat_notes": "dusty drums",
        "reel_notes": {"opening_grab": "a", "caption_bar": "b", "cut_points": "c", "loop_point": "d"},
        "post_caption": "Oct 6: record highs. Mu-Zueki. Not financial advice.",
        "hit_score": {"bars": 8, "flow": 8, "hook": 8, "production": 8, "reel": 8, "emotion": 8,
                      "structure": 8, "notes": ""},
    }


CFG = settings.validate({"length_seconds": 30})


def sung_words(song, start=0.0, step=0.4, skip_sections=()):
    """Word timings as Whisper would hear a clean take of the song."""
    words, t = [], start
    for n, chunk in enumerate(song["plan"]["chunks"], 1):
        if n in skip_sections:
            t += 5.0
            continue
        for tok in text.lyric_tokens(chunk["text"]):
            words.append((tok, round(t, 2), round(t + step * 0.8, 2)))
            t += step
    return words


class SettingsTests(unittest.TestCase):
    def test_defaults_and_help_keys_ignored(self):
        self.assertEqual(settings.validate({"_help": {"x": "y"}}), settings.DEFAULTS)

    def test_shipped_settings_file_is_valid(self):
        cfg = settings.load_settings()
        self.assertEqual((cfg["length_seconds"], cfg["max_takes"]), (45, 3))

    def test_invalid_values_name_the_field(self):
        cases = {
            "length_seconds": 50, "vocal": "robot", "news_date": "yesterday", "story_focus": [],
            "exclude_story_ranks": ["1"], "explicit": "yes", "avoid_repeating_last_n_days": -1,
            "claude_model": "", "elevenlabs_model": "music_v1", "max_takes": 0, "max_credits_per_song": 0,
        }
        for name, value in cases.items():
            with self.assertRaises(settings.SettingsError) as ctx:
                settings.validate({name: value})
            self.assertIn(name, str(ctx.exception))

    def test_unknown_field_rejected(self):
        with self.assertRaises(settings.SettingsError):
            settings.validate({"lenght_seconds": 45})

    def test_news_file_selection(self):
        with tempfile.TemporaryDirectory() as tmp:
            d = Path(tmp)
            for name in ("us_finance_news_2026-10-05.json", "us_finance_news_2026-10-06.json", "notes.json"):
                (d / name).write_text("{}")
            self.assertEqual(settings.find_news_file(d)[1], "2026-10-06")
            self.assertEqual(settings.find_news_file(d, "2026-10-05")[0].name, "us_finance_news_2026-10-05.json")
            with self.assertRaises(settings.RunError):
                settings.find_news_file(d, "2026-10-01")
            with self.assertRaises(settings.RunError):
                settings.find_news_file(d / "nope")


class TextTests(unittest.TestCase):
    def test_tokenize(self):
        self.assertEqual(text.tokenize("That's Mew-Zookie, 7,800!"), ["thats", "mew", "zookie", "7", "800"])

    def test_lyric_lines_drop_labels_cues_and_adlibs(self):
        chunk = "[Verse 2]\n{drums only}\nFirst bar (yeah)\n\nSecond bar {hard stop}"
        self.assertEqual(text.lyric_lines(chunk), ["First bar", "Second bar"])

    def test_srt(self):
        srt = text.render_srt([{"start": 0, "end": 2.4, "text": "a"}, {"start": 62.05, "end": 3661.5, "text": "b"}])
        self.assertEqual(srt, "1\n00:00:00,000 --> 00:00:02,400\na\n\n2\n00:01:02,050 --> 01:01:01,500\nb\n")


class CheckTests(unittest.TestCase):
    def issues(self, cfg=CFG, **changes):
        song = good_song()
        song.update(copy.deepcopy(changes))
        return checks.check_song(song, NEWS, cfg)

    def one(self, needle, **changes):
        issues = self.issues(**changes)
        self.assertEqual(len(issues), 1, issues)
        self.assertIn(needle, issues[0])

    def plan(self, index=0, **changes):
        plan = copy.deepcopy(good_song()["plan"])
        plan["chunks"][index].update(changes)
        return plan

    def test_good_song_passes(self):
        self.assertEqual(self.issues(), [])

    def test_first_chunk_must_be_a_verse_label(self):
        for label in ("[Hook]", "[Chorus]", "[Intro]"):
            body = good_song()["plan"]["chunks"][0]["text"].replace("[Verse 1]", label)
            self.one("must be labelled [Verse 1]", plan=self.plan(0, text=body))

    def test_first_chunk_must_open_with_a_lyric(self):
        body = "[Verse 1]\n{beat drops}\n" + "\n".join(HOOK)
        self.one("must open with a lyric line", plan=self.plan(0, text=body))

    def test_chunk_and_total_durations(self):
        plan = self.plan(0, duration_ms=10000)
        plan["chunks"][2]["duration_ms"] = 2000
        self.one("chunk 3 lasts 2000 ms", plan=plan)
        self.one("the reel is 30s", plan=self.plan(1, duration_ms=30000))
        self.one("lasts only", plan=self.plan(1, duration_ms=4000))

    def test_styles(self):
        self.one("at least 6 positive_styles", plan=self.plan(0, positive_styles=["trap"] * 5))
        self.one("names real artists", plan=self.plan(2, negative_styles=["Eminem style"]))

    def test_line_length_limit(self):
        body = "[Outro]\nThat's the tape, Mew-Zookie {" + "x" * 200 + "}"
        self.one("over 200 characters", plan=self.plan(2, text=body))

    def test_bar_budget_and_bpm(self):
        body = "[Verse 2]\n" + "\n".join(VERSE + [f"extra bar {i}" for i in range(6)])
        issues = self.issues(plan=self.plan(1, text=body))
        self.assertTrue(any("only about 11 fit" in i for i in issues), issues)
        self.one("outside the usable range", bpm=300)

    def test_signature_once_or_twice(self):
        body = "[Outro]\nThat's the tape, Mew-Zookie (Mew-Zookie, Mew-Zookie)"
        self.one("appears 3 times in the plan", plan=self.plan(2, text=body))
        caps = good_song()["captions"]
        caps[-1]["text"] = "Mu-Zueki, Mu-Zueki, Mu-Zueki"
        self.one("appears 3 times in the captions", captions=caps)
        caps[-1]["text"] = "That's the tape"
        self.one("appears 0 times in the captions", captions=caps)

    def test_captions_must_cover_each_section(self):
        caps = [c for c in good_song()["captions"] if c["section"] != 2]
        self.one("captions for section 2", captions=caps)
        caps = good_song()["captions"]
        caps[0]["section"] = 9
        self.one("sections 1 to 3", captions=caps)
        caps = good_song()["captions"]
        caps[0], caps[-1] = caps[-1], caps[0]
        self.assertTrue(any("sung order" in i for i in self.issues(captions=caps)))

    def test_fact_map_source_must_be_verbatim(self):
        row = dict(good_song()["fact_map"][0], source_text="S&P 500 closed at 9,000")
        self.one("not found word for word", fact_map=[row])
        row = dict(row, source_text="s&p  500 CLOSED at 7,818.93", rank=7)
        self.one("cites rank 7", fact_map=[row])

    def test_caption_numbers_must_be_near_source_figures(self):
        caps = good_song()["captions"]
        caps[0]["text"] = "S&P near 9,000 on Tuesday"
        self.one("9000", captions=caps)
        caps[0]["text"] = "Deficit at $105.6 billion"  # a real figure, but from a story the song did not use
        self.one("105.6", captions=caps)

    def test_stories_and_post_caption(self):
        used = [{"rank": 9, "headline": "x", "status": "verified"}, {"rank": 1, "headline": "x", "status": "verified"}]
        self.one("not in the news file", stories_used=used)
        cfg = settings.validate({"length_seconds": 30, "exclude_story_ranks": [1]})
        self.assertTrue(any("excluded" in i for i in self.issues(cfg=cfg)))
        self.one("must include 'Mu-Zueki'", post_caption="Records. Not financial advice.")
        self.one("must end with", post_caption="Mu-Zueki. Buy now!")


class SongStageTests(unittest.TestCase):
    def test_prompt_carries_settings_news_hooks_and_issues(self):
        cfg = settings.validate({"vocal": "female", "explicit": False, "exclude_story_ranks": [7],
                                 "extra_instructions": "hook about oil"})
        prompt = song_stage.user_prompt(cfg, "n.json", '{"stories": []}', ["old hook"], {"hook": "x"}, ["too long"])
        for needle in ('Vocal: "female"', "Mood: decide from the news", "[7]", "no profanity", "hook about oil",
                       "'old hook'", '{"stories": []}', "- too long", "PREVIOUS ATTEMPT"):
            self.assertIn(needle, prompt)

    def test_system_prompt_is_persona_plus_format_guide(self):
        prompt = song_stage.system_prompt()
        for needle in ("Mu-Zueki", "composition plan", "[Verse 1]"):
            self.assertIn(needle, prompt)
        self.assertNotIn("Suno", prompt)

    def test_schema_requires_what_the_checks_read(self):
        schema = json.loads(song_stage.SCHEMA_PATH.read_text(encoding="utf-8"))
        self.assertEqual(set(schema["required"]), set(good_song()) - {"news_date"})

    def test_hit_total(self):
        self.assertAlmostEqual(sum(song_stage.HIT_WEIGHTS.values()), 1.0)
        self.assertEqual(song_stage.hit_total(good_song()["hit_score"]), 8.0)

    def test_recent_hooks_newest_first_and_before_date(self):
        with tempfile.TemporaryDirectory() as tmp:
            for date, hook in (("2026-10-03", "h3"), ("2026-10-04", "h4"), ("2026-10-05", "h5"), ("2026-10-06", "h6")):
                (Path(tmp) / date).mkdir()
                (Path(tmp) / date / "song.json").write_text(json.dumps({"hook": hook}))
            self.assertEqual(song_stage.recent_hooks(Path(tmp), "2026-10-06", 2), ["h5", "h4"])
            self.assertEqual(song_stage.recent_hooks(Path(tmp), "2026-10-06", 0), [])

    def run_stage(self, replies):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        news = Path(tmp.name) / "us_finance_news_2026-10-06.json"
        news.write_text(json.dumps(NEWS), encoding="utf-8")
        day = Day(Path(tmp.name) / "out", "2026-10-06", news)
        calls = []

        def ask(system, user, schema, model, timeout=900):
            calls.append(user)
            return copy.deepcopy(next(replies))

        with mock.patch.object(song_stage, "log", lambda m: None), \
                mock.patch.object(song_stage, "OUTPUT_DIR", Path(tmp.name) / "out"):
            return song_stage.run(day, CFG, ask=ask), day, calls

    def test_clean_song_is_written(self):
        result, day, calls = self.run_stage(iter([good_song(), {"pass": True, "issues": []}]))
        self.assertEqual((result.state, len(calls)), (DONE, 2))
        self.assertEqual(day.read_json(day.song_json)["length_seconds"], 30)
        self.assertIn("Mu-Zueki", day.caption_txt.read_text(encoding="utf-8"))
        self.assertNotIn("NEEDS REVIEW", day.song_md.read_text(encoding="utf-8"))

    def test_one_repair_then_fails_so_no_audio_is_made(self):
        bad = good_song()
        bad["post_caption"] = "Buy now!"
        verdict = {"pass": False, "issues": ["line X is unsupported"]}
        result, day, calls = self.run_stage(iter([bad, verdict, bad, verdict]))
        self.assertEqual(result.state, FAILED)
        self.assertIn("line X is unsupported", result.notes)
        self.assertIn("YOUR PREVIOUS ATTEMPT FAILED REVIEW", calls[2])
        self.assertIn("NEEDS REVIEW", day.song_md.read_text(encoding="utf-8"))


class BeatTests(unittest.TestCase):
    def click_track(self, bpm, first, accent_phase, seconds=20, rate=22050):
        import numpy as np
        audio = np.zeros(rate * seconds)
        for i, t in enumerate(np.arange(first, seconds - 0.1, 60 / bpm)):
            accent = i % 4 == accent_phase
            k = int(t * rate)
            audio[k:k + 200] += np.hanning(200) * np.sin(np.arange(200) * 2 * np.pi * (60 if accent else 2000) / rate)
        return audio, rate

    def test_tempo_offset_and_downbeat_are_found(self):
        from pipeline import beats
        audio, rate = self.click_track(bpm=124, first=0.21, accent_phase=2)
        grid = beats.find_beats(audio, rate, bpm_hint=120)
        self.assertAlmostEqual(grid["bpm"], 124, delta=0.2)
        self.assertAlmostEqual(grid["beats"][0], 0.21, delta=0.02)
        self.assertAlmostEqual(grid["downbeats"][0], 0.21 + 2 * 60 / 124, delta=0.03)
        self.assertAlmostEqual(grid["beats"][1] - grid["beats"][0], 60 / 124, delta=0.002)

    def test_section_energy_is_relative_to_the_loudest(self):
        import numpy as np
        from pipeline import beats
        rate = 22050
        t = np.arange(rate * 2) / rate
        audio = np.concatenate([0.2 * np.sin(2 * np.pi * 2000 * t), 0.8 * np.sin(2 * np.pi * 60 * t)])
        quiet, loud, missing = beats.section_energy(audio, rate, [(0, 2), (2, 4), (None, None)])
        self.assertEqual((quiet["loudness"], loud["loudness"], missing), (0.25, 1.0, None))
        self.assertLess(quiet["bass"], 0.05)
        self.assertGreater(loud["bass"], 0.95)


class ElevenLabsTests(unittest.TestCase):
    PLAN = good_song()["plan"]

    def test_api_key_from_env_file_or_environment(self):
        with tempfile.TemporaryDirectory() as tmp, mock.patch.dict(os.environ, {}, clear=False):
            for name in elevenlabs.KEY_NAMES:
                os.environ.pop(name, None)
            env = Path(tmp) / ".env"
            self.assertIsNone(elevenlabs.load_api_key(env))
            for line in ("ELEVEN_LABS_API_KEY=file-key", 'OTHER=1\nELEVENLABS_API_KEY = "file-key" ',
                         "export ELEVENLABS_API_KEY='file-key'"):
                env.write_text(line + "\n")
                self.assertEqual(elevenlabs.load_api_key(env), "file-key", line)
            os.environ["ELEVEN_LABS_API_KEY"] = "env-key"
            self.assertEqual(elevenlabs.load_api_key(env), "env-key")

    def test_estimate_and_request_plan(self):
        self.assertEqual(elevenlabs.plan_seconds(self.PLAN), 26.0)
        self.assertEqual(elevenlabs.estimate_credits(self.PLAN), 195)
        sent = elevenlabs.request_plan(self.PLAN)
        self.assertNotIn("negative_styles", sent["chunks"][1])  # empty optional fields are not sent
        self.assertEqual(sent["chunks"][0]["context_adherence"], "high")

    def test_compose_sends_plan_and_model(self):
        sent = []
        audio = elevenlabs.compose("k", self.PLAN, "music_v2", http_post=lambda k, b: sent.append((k, b)) or b"ID3")
        self.assertEqual(audio, b"ID3")
        self.assertEqual((sent[0][0], sent[0][1]["model_id"], len(sent[0][1]["composition_plan"]["chunks"])),
                         ("k", "music_v2", 3))

    def test_compose_retries_once_with_the_suggested_plan(self):
        suggestion = {"chunks": [{"text": "x", "duration_ms": 3000, "positive_styles": ["trap"]}]}
        calls = []

        def fake_post(key, body):
            calls.append(body["composition_plan"])
            if len(calls) == 1:
                raise elevenlabs.AudioError("bad_composition_plan", suggestion=suggestion)
            return b"ID3"

        self.assertEqual(elevenlabs.compose("k", self.PLAN, "music_v2_5", http_post=fake_post), b"ID3")
        self.assertEqual(calls[1], suggestion)

    def test_compose_raises_without_a_suggestion(self):
        def fake_post(key, body):
            raise elevenlabs.AudioError("HTTP 401")

        with self.assertRaises(elevenlabs.AudioError):
            elevenlabs.compose("k", self.PLAN, "music_v2_5", http_post=fake_post)


class ListenTests(unittest.TestCase):
    CAPS = [
        {"section": 1, "text": "7,800 on the board", "sung": "seventy-eight hundred on the board"},
        {"section": 1, "text": "Chips led the way", "sung": "Chips led the way"},
        {"section": 2, "text": "That's the tape", "sung": "That's the tape"},
    ]

    @staticmethod
    def words(sentence, start=0.0, step=0.5):
        return [(tok, start + i * step, start + (i + 1) * step) for i, tok in enumerate(text.tokenize(sentence))]

    def test_match_and_coverage(self):
        expected = text.tokenize("record close on the board")
        heard = self.words("thanks for watching record clothes on the board")
        matched = listen.match(expected, heard)
        self.assertEqual(matched, [3, None, 5, 6, 7])
        self.assertEqual(listen.coverage(matched), 0.8)
        self.assertIsNone(listen.vocal_onset(listen.match(expected, []), []))

    def test_vocal_onset_keeps_misheard_opening_words_but_not_stray_sounds(self):
        expected = text.tokenize("tuesday closed with a record on the board")
        # "choose day" is the opening word misheard, right before the matched lyrics: part of the vocal
        heard = self.words("choose day", 4.0) + self.words("closed with a record on the board", 5.0)
        self.assertEqual(listen.vocal_onset(listen.match(expected, heard), heard), 4.0)
        # "thanks for watching" seconds earlier is a stray sound, not the vocal
        heard = self.words("thanks for watching", 0.0) + self.words("closed with a record on the board", 5.0)
        self.assertEqual(listen.vocal_onset(listen.match(expected, heard), heard), 5.0)

    def test_exact_match_uses_audio_times(self):
        caps, interp = listen.align(self.CAPS, self.words("seventy eight hundred on the board chips led the way thats the tape", 2.0))
        self.assertEqual(interp, [])
        self.assertEqual([(c["start"], c["end"]) for c in caps], [(2.0, 5.0), (5.0, 7.0), (7.0, 8.5)])
        self.assertEqual(caps[0]["text"], "7,800 on the board")

    def test_misheard_words_still_anchor_the_caption(self):
        caps, interp = listen.align(self.CAPS, self.words("7800 on the board chips led the way thats the tape", 1.0))
        self.assertEqual(interp, [])
        self.assertEqual((caps[0]["start"], caps[0]["end"]), (1.5, 3.0))

    def test_unheard_caption_is_interpolated_between_neighbours(self):
        heard = self.words("seventy eight hundred on the board", 0.0) + self.words("thats the tape", 10.0)
        caps, interp = listen.align(self.CAPS, heard)
        self.assertEqual(interp, [2])
        self.assertEqual((caps[1]["start"], caps[1]["end"]), (3.0, 10.0))

    def test_captions_never_overlap(self):
        caps, _ = listen.align(self.CAPS, self.words("seventy eight hundred on the board chips led the way thats the tape", step=0.05))
        for a, b in zip(caps, caps[1:]):
            self.assertLessEqual(a["end"], b["start"])
            self.assertGreater(a["end"], a["start"])

    def test_display_words_follow_the_sung_timing(self):
        cap = {"text": "S&P near 7,800 on Tuesday", "sung": "S and P near seventy-eight hundred on Tuesday",
               "start": 10.0, "end": 14.0}
        # Whisper heard "smp" and "7800": neither the written nor the sung form
        heard = [("smp", 10.0, 10.6), ("near", 10.8, 11.2), ("7800", 11.4, 12.4), ("on", 12.6, 12.8), ("tuesday", 13.0, 13.9)]
        shown = listen.display_words(cap, heard)
        self.assertEqual([w["text"] for w in shown], ["S&P", "near", "7,800", "on", "Tuesday"])
        starts = [w["start"] for w in shown]
        self.assertEqual((starts[0], starts[1], starts[3], starts[4]), (10.0, 10.8, 12.6, 13.0))
        self.assertTrue(10.8 < starts[2] < 12.6)  # the number sits between its heard neighbours
        self.assertEqual(shown[-1]["end"], 14.0)
        for a, b in zip(shown, shown[1:]):
            self.assertEqual(a["end"], b["start"])

    def test_display_words_with_nothing_heard_are_spread_evenly(self):
        cap = {"text": "one two", "sung": "one two", "start": 2.0, "end": 4.0}
        self.assertEqual(listen.display_words(cap, []), [
            {"text": "one", "start": 2.0, "end": 3.0}, {"text": "two", "start": 3.0, "end": 4.0}])

    def test_mp3_round_trip_and_trim(self):
        import numpy as np
        rate = 44100
        tone = (np.sin(np.arange(rate * 3) * 2 * np.pi * 440 / rate) * 12000).astype("int16")
        samples = np.stack([tone, tone])
        samples[:, :rate] = 0  # one second of silence, then two seconds of tone
        with tempfile.TemporaryDirectory() as tmp:
            src, dst = Path(tmp) / "src.mp3", Path(tmp) / "dst.mp3"
            listen.write_mp3(src, samples, rate)
            self.assertAlmostEqual(listen.duration(src), 3.0, delta=0.1)
            self.assertAlmostEqual(listen.trim_start(src, dst, 1.0), 2.0, delta=0.1)
            trimmed, _ = listen.read_audio(dst)
            self.assertAlmostEqual(trimmed.shape[1] / rate, 2.0, delta=0.1)
            self.assertGreater(abs(trimmed[:, rate // 4: rate // 2]).mean(), 3000)  # tone, not silence, near the start


class AudioStageTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.day = Day(Path(self.tmp.name), "2026-10-06")
        self.day.write_json(self.day.song_json, good_song())
        self.ledger = Path(self.tmp.name) / "usage.csv"
        self.trims = []
        for target, replacement in (
            (audio_stage, {"log": lambda m: None}),
            (elevenlabs, {"load_api_key": lambda: "k"}),
            (listen, {"duration": lambda path: 25.0,
                      "trim_start": lambda src, dst, seconds: self.trims.append(seconds) or dst.write_bytes(b"cut")}),
        ):
            for name, value in replacement.items():
                patcher = mock.patch.object(target, name, value)
                patcher.start()
                self.addCleanup(patcher.stop)

    def run_stage(self, heard, cfg=None, balance=((0, 50000), (300, 50000)), compose=None):
        """heard: one list of word timings per take, in order."""
        heard, balance, made = iter(heard), iter(balance), []

        def fake_compose(key, plan, model):
            made.append(model)
            return f"take{len(made)}".encode()

        result = audio_stage.run(
            self.day, cfg or settings.validate({"length_seconds": 30}), compose=compose or fake_compose,
            transcribe=lambda path: next(heard), get_credits=lambda key: next(balance, None), ledger=self.ledger)
        return result, made

    def test_spoken_numbers_and_letters_do_not_count_against_a_take(self):
        tokens = text.tokenize("Past seventy-eight hundred on the S and P, five point three percent, A-M-D record")
        self.assertEqual(audio_stage.scorable(tokens), ["past", "on", "the", "record"])
        self.assertEqual(audio_stage.scorable(["five", "percent"]), ["five", "percent"])  # never left with nothing
        song = good_song()
        heard = [(t, i * 0.4, i * 0.4 + 0.3) for i, t in enumerate(text.tokenize(
            "smp near 7800 on tuesday record close and the chips led the way"))]
        self.assertEqual(audio_stage.assess(song, heard)["section_coverage"][0], 1.0)

    def test_clean_first_take_is_kept(self):
        result, made = self.run_stage([sung_words(good_song())])
        self.assertEqual((result.state, made), (DONE, ["music_v2_5"]))
        self.assertEqual(self.day.audio_mp3.read_bytes(), b"take1")
        report = self.day.read_json(self.day.audio_json)
        self.assertEqual((report["coverage"], report["first_lyric_seconds"], report["trimmed_seconds"]), (1.0, 0.0, 0.0))
        self.assertFalse((self.day.dir / "takes").exists())
        (row,) = audio_stage.read_usage(self.ledger)
        self.assertEqual((row["takes"], row["estimated_credits"], row["measured_credits"]), ("1", "195", "300"))

    def test_take_with_skipped_opening_is_retaken_on_the_fallback_model(self):
        skipped = sung_words(good_song(), skip_sections=(1,))
        result, made = self.run_stage([skipped, sung_words(good_song())])
        self.assertEqual((result.state, made), (DONE, ["music_v2_5", "music_v2"]))
        self.assertEqual(self.day.audio_mp3.read_bytes(), b"take2")
        self.assertEqual(self.day.read_json(self.day.audio_json)["takes_made"], 2)

    def test_best_take_is_kept_and_flagged_when_none_passes(self):
        nothing = [("thanks", 9.0, 9.2), ("for", 9.2, 9.4), ("watching", 9.4, 9.8)]
        skipped = sung_words(good_song(), skip_sections=(1,))
        result, made = self.run_stage([nothing, skipped, nothing])
        self.assertEqual((result.state, len(made)), (REVIEW, 3))
        self.assertEqual(self.day.read_json(self.day.audio_json)["take"], 2)
        self.assertEqual(self.trims, [4.9])  # its instrumental lead-in is still cut off
        self.assertTrue(any("opening lines were not sung" in n for n in result.notes), result.notes)

    def test_late_but_complete_take_is_trimmed(self):
        result, _ = self.run_stage([sung_words(good_song(), start=2.0)])
        self.assertEqual(result.state, DONE)
        self.assertEqual(self.trims, [1.9])
        report = self.day.read_json(self.day.audio_json)
        self.assertEqual((report["trimmed_seconds"], report["first_lyric_seconds"], report["words"][0][1]), (1.9, 0.1, 0.1))

    def test_credit_cap_stops_takes(self):
        cfg = settings.validate({"length_seconds": 30, "max_credits_per_song": 400})
        skipped = sung_words(good_song(), skip_sections=(1,))
        result, made = self.run_stage([skipped, skipped, skipped], cfg=cfg)
        self.assertEqual(len(made), 2)  # a third take at 195 credits would pass the 400 cap
        self.assertTrue(any("credit cap" in n for n in result.notes), result.notes)

    def test_earlier_spending_on_the_same_song_counts(self):
        audio_stage.record_usage(self.ledger, dict.fromkeys(audio_stage.USAGE_FIELDS, "") | {
            "news_date": "2026-10-06", "estimated_credits": 195, "measured_credits": 4900})
        result, made = self.run_stage([sung_words(good_song())])
        self.assertEqual((result.state, made), (FAILED, []))

    def test_not_enough_credits_or_api_failure(self):
        result, made = self.run_stage([], balance=((49900, 50000),))
        self.assertEqual((result.state, made), (FAILED, []))
        self.assertIn("Not enough ElevenLabs credits", result.notes[0])

        def failing(key, plan, model):
            raise elevenlabs.AudioError("ElevenLabs returned HTTP 429 (rate limit or quota reached)")

        result, _ = self.run_stage([], compose=failing)
        self.assertEqual(result.state, FAILED)
        self.assertIn("429", result.notes[0])
        self.assertEqual(audio_stage.read_usage(self.ledger), [])

    def test_estimate_counts_when_the_balance_does_not_move(self):
        self.run_stage([sung_words(good_song())], balance=((0, 50000), (0, 50000)))
        (row,) = audio_stage.read_usage(self.ledger)
        self.assertEqual((row["measured_credits"], audio_stage.credits_charged(row)), ("", 195))


class SubtitlesStageTests(unittest.TestCase):
    def make_day(self, words):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        day = Day(Path(tmp.name), "2026-10-06")
        day.write_json(day.song_json, good_song())
        day.write_json(day.audio_json, {"duration_seconds": 25.0, "words": [list(w) for w in words]})
        def analyse(day, bpm, sections):
            return ({"bpm": 120.0, "beats": [0.0, 0.5, 1.0], "downbeats": [0.0]},
                    [{"loudness": 1.0, "bass": 0.5}] * len(sections))

        with mock.patch.object(subtitles_stage, "log", lambda m: None):
            return subtitles_stage.run(day, CFG, analyse=analyse), day

    def test_srt_and_timeline(self):
        result, day = self.make_day(sung_words(good_song()))
        self.assertEqual(result.state, DONE)
        self.assertTrue(day.subtitles_srt.read_text(encoding="utf-8").startswith(
            "1\n00:00:00,000 --> 00:00:03,520\nS&P near 7,800 on Tuesday\n"))
        timeline = day.read_json(day.timeline_json)
        self.assertEqual((timeline["audio"], timeline["bpm"], timeline["seconds_per_bar"]), ("audio.mp3", 120.0, 2.0))
        self.assertEqual([s["label"] for s in timeline["sections"]], ["[Verse 1]", "[Verse 2]", "[Outro]"])
        first, second = timeline["sections"][:2]
        self.assertEqual(first["start"], 0.0)
        self.assertLessEqual(first["end"], second["start"])
        self.assertEqual(len(timeline["captions"]), 9)
        self.assertEqual({c["timing"] for c in timeline["captions"]}, {"heard"})
        self.assertEqual((timeline["beats"], timeline["downbeats"], timeline["seconds_per_beat"]),
                         ([0.0, 0.5, 1.0], [0.0], 0.5))
        self.assertEqual(timeline["sections"][0]["energy"], {"loudness": 1.0, "bass": 0.5})
        shown = timeline["captions"][0]["words"]
        self.assertEqual([w["text"] for w in shown], ["S&P", "near", "7,800", "on", "Tuesday"])
        self.assertEqual(shown[0]["start"], 0.0)
        self.assertEqual(shown[-1]["end"], timeline["captions"][0]["end"])

    def test_many_unheard_captions_need_review(self):
        result, day = self.make_day(sung_words(good_song(), skip_sections=(2,)))
        self.assertEqual(result.state, REVIEW)
        self.assertIn("6 of 9 captions", result.notes[0])


def researched(date="2026-10-08", count=10):
    """A well-formed answer from the news researcher."""
    stories = [{
        "rank": n, "headline": f"Story {n} headline", "category": "Markets", "event_date": date,
        "summary": "Something happened.", "key_facts": [f"fact {n}a", f"fact {n}b", f"fact {n}c"],
        "entities": [], "tickers": [],
        "fact_check": {"status": "verified", "notes": "", "references": [
            {"source": "AP", "title": "t", "url": "https://apnews.com/a"},
            {"source": "Reuters", "title": "t", "url": "https://reuters.com/b"}]},
    } for n in range(1, count + 1)]
    return {"ready": True, "not_ready_reason": "", "ranking_basis": "impact", "limitations": [], "stories": stories}


class NewsTests(unittest.TestCase):
    NOW = datetime.datetime(2026, 10, 8, 18, 0, tzinfo=news.EASTERN)

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.dir = Path(self.tmp.name)
        patcher = mock.patch.object(news, "log", lambda m: None)
        patcher.start()
        self.addCleanup(patcher.stop)

    def gather(self, answers, date="2026-10-08"):
        calls = []

        def ask(system, user, schema, model, timeout=0, tools=""):
            calls.append({"user": user, "tools": tools})
            return answers[len(calls) - 1]
        return news.gather(date, self.dir, "opus", ask=ask, now=self.NOW), calls

    def test_good_research_passes_the_shape_check(self):
        self.assertEqual(news.check_news(researched(), "2026-10-08"), [])

    def test_shape_problems_are_reported(self):
        bad = researched()
        bad["stories"][2]["event_date"] = "2026-10-07"
        bad["stories"][3]["key_facts"] = ["only one"]
        bad["stories"][4]["fact_check"]["references"] = [{"source": "x", "title": "t", "url": "made up"}]
        bad["stories"][5]["fact_check"]["references"].pop()
        problems = "\n".join(news.check_news(bad, "2026-10-08"))
        self.assertIn("Story 3: event_date is 2026-10-07", problems)
        self.assertIn("Story 4: needs at least two key facts", problems)
        self.assertIn("Story 5: needs at least one reference with a real URL", problems)
        self.assertIn("Story 6: 'verified' needs two references", problems)
        self.assertIn("9 stories", news.check_news(researched(count=9), "2026-10-08")[0])

    def test_verdicts_remove_wrong_facts_and_unsupported_stories(self):
        stories = researched()["stories"]
        kept, changes = news.apply_verdicts(stories, [
            {"rank": 1, "verdict": "confirmed", "wrong_facts": [], "notes": ""},
            {"rank": 2, "verdict": "partly", "wrong_facts": ["fact 2b"], "notes": "2b not in source"},
            {"rank": 3, "verdict": "unsupported", "wrong_facts": [], "notes": "happened on Tuesday"},
            {"rank": 4, "verdict": "partly", "wrong_facts": ["fact 4a", "fact 4b"], "notes": "two wrong"},
        ])
        self.assertEqual([s["headline"] for s in kept][:3], ["Story 1 headline", "Story 2 headline", "Story 5 headline"])
        self.assertEqual([s["rank"] for s in kept], list(range(1, 9)))
        self.assertEqual(kept[1]["key_facts"], ["fact 2a", "fact 2c"])
        self.assertEqual(kept[1]["fact_check"]["status"], "partially_verified")
        # Stories 5 to 10 were not in the verdicts, so they cannot stay "verified".
        self.assertEqual(kept[2]["fact_check"]["status"], "partially_verified")
        self.assertTrue(any("happened on Tuesday" in c for c in changes))
        self.assertTrue(any("too few supported facts" in c for c in changes))

    def test_gather_writes_the_file_after_both_passes(self):
        verdicts = {"stories": [{"rank": n, "verdict": "confirmed", "wrong_facts": [], "notes": ""} for n in range(1, 11)]}
        path, calls = self.gather([researched(), verdicts])
        self.assertEqual(path.name, "us_finance_news_2026-10-08.json")
        self.assertEqual([c["tools"] for c in calls], ["WebSearch,WebFetch"] * 2)
        self.assertIn("Thursday, October 8, 2026", calls[0]["user"])
        data = json.loads(path.read_text(encoding="utf-8"))
        self.assertEqual(data["metadata"]["story_count"], 10)
        self.assertEqual(len(data["stories"]), 10)
        self.assertEqual(settings.find_news_file(self.dir, "2026-10-08")[0], path)

    def test_bad_research_is_repaired_once(self):
        bad = researched()
        bad["stories"][0]["event_date"] = "2026-10-07"
        verdicts = {"stories": [{"rank": n, "verdict": "confirmed", "wrong_facts": [], "notes": ""} for n in range(1, 11)]}
        path, calls = self.gather([bad, researched(), verdicts])
        self.assertEqual(len(calls), 3)
        self.assertIn("Story 1: event_date is 2026-10-07", calls[1]["user"])
        self.assertTrue(path.exists())

    def test_gather_refuses_an_unfinished_day_a_future_day_and_a_gutted_file(self):
        with self.assertRaises(settings.RunError) as caught:
            self.gather([dict(researched(), ready=False, not_ready_reason="the market is still open")])
        self.assertIn("the market is still open", str(caught.exception))
        with self.assertRaises(settings.RunError) as caught:
            self.gather([], date="2026-10-09")
        self.assertIn("in the future", str(caught.exception))
        verdicts = {"stories": [{"rank": n, "verdict": "unsupported", "wrong_facts": [], "notes": "no"} for n in range(1, 4)]}
        with self.assertRaises(settings.RunError) as caught:
            self.gather([researched(), verdicts])
        self.assertIn("Only 7 stories", str(caught.exception))
        self.assertFalse(news.news_path(self.dir, "2026-10-08").exists())


class InstagramTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.reel = Path(self.tmp.name) / "reel.mp4"
        self.reel.write_bytes(b"video-bytes")
        patcher = mock.patch.object(instagram, "log", lambda m: None)
        patcher.start()
        self.addCleanup(patcher.stop)

    def fake_http(self, statuses):
        calls = []

        def http(url, method="GET", params=None, headers=None, body=None, timeout=0):
            calls.append({"url": url, "method": method, "params": params or {}, "headers": headers or {}, "body": body})
            if url.endswith("/42/media"):
                return {"id": "900"}
            if "rupload" in url:
                return {"success": True}
            if url.endswith("/900"):
                return {"status_code": statuses.pop(0)}
            if url.endswith("/media_publish"):
                return {"id": "777"}
            return {"permalink": "https://www.instagram.com/reel/abc/"}
        return http, calls

    def test_credentials_come_from_the_env_file_and_are_required(self):
        env_file = Path(self.tmp.name) / ".env"
        env_file.write_text("ELEVEN_LABS_API_KEY=x\nINSTAGRAM_ACCESS_TOKEN='tok'\nINSTAGRAM_USER_ID=42\n", encoding="utf-8")
        with mock.patch.dict(os.environ, {}, clear=True):
            env = instagram.read_env(env_file)
        self.assertEqual(env, {"INSTAGRAM_ACCESS_TOKEN": "tok", "INSTAGRAM_USER_ID": "42"})
        self.assertEqual(instagram.credentials(env), ("tok", "42", "graph.instagram.com"))
        self.assertEqual(instagram.credentials({"INSTAGRAM_ACCESS_TOKEN": "tok"}), ("tok", "me", "graph.instagram.com"))
        with self.assertRaises(settings.RunError) as caught:
            instagram.credentials({"INSTAGRAM_USER_ID": "42"})
        self.assertIn("INSTAGRAM_ACCESS_TOKEN is missing", str(caught.exception))

    def test_publish_uploads_waits_and_publishes(self):
        http, calls = self.fake_http(["IN_PROGRESS", "FINISHED"])
        waits = []
        post = instagram.publish(self.reel, "a caption", "tok", "42", "graph.instagram.com", http=http, wait=waits.append)
        self.assertEqual(post, {"id": "777", "permalink": "https://www.instagram.com/reel/abc/"})
        create, upload = calls[0], calls[1]
        self.assertEqual(create["params"]["media_type"], "REELS")
        self.assertEqual(create["params"]["upload_type"], "resumable")
        self.assertEqual(create["params"]["caption"], "a caption")
        self.assertNotIn("thumb_offset", create["params"])
        self.assertEqual(upload["url"], "https://rupload.facebook.com/ig-api-upload/v25.0/900")
        self.assertEqual(upload["headers"], {"Authorization": "OAuth tok", "offset": "0", "file_size": "11"})
        self.assertEqual(upload["body"], b"video-bytes")
        self.assertEqual(waits, [10])
        self.assertEqual(calls[4]["params"]["creation_id"], "900")

    def test_publish_from_a_link_sends_the_link_and_uploads_nothing(self):
        http, calls = self.fake_http(["FINISHED"])
        instagram.publish(self.reel, "c", "tok", "42", "graph.instagram.com", http=http, wait=lambda s: None, video_url="https://x.public.blob.vercel-storage.com/reels/a.mp4")
        self.assertEqual(calls[0]["params"]["video_url"], "https://x.public.blob.vercel-storage.com/reels/a.mp4")
        self.assertNotIn("upload_type", calls[0]["params"])
        self.assertFalse(any("rupload" in c["url"] for c in calls))

    def test_hosting_reads_the_link_and_keeps_the_token_off_the_command_line(self):
        seen = {}

        def run(cmd, **kwargs):
            seen["cmd"], seen["env"] = cmd, kwargs["env"]
            return mock.Mock(returncode=0, stderr="", stdout="Success! https://abc.public.blob.vercel-storage.com/reels/2026-10-06-Xy12.mp4\n")
        with mock.patch.object(instagram.shutil, "which", lambda name: "vercel"):
            url = instagram.host_video(self.reel, "2026-10-06", "secret-token", run=run)
            self.assertEqual(url, "https://abc.public.blob.vercel-storage.com/reels/2026-10-06-Xy12.mp4")
            self.assertNotIn("secret-token", " ".join(seen["cmd"]))
            self.assertEqual(seen["env"]["BLOB_READ_WRITE_TOKEN"], "secret-token")
            with self.assertRaises(settings.RunError):
                instagram.host_video(self.reel, "d", "t", run=lambda cmd, **k: mock.Mock(returncode=1, stdout="", stderr="denied"))

    def test_cover_frame_is_sent_in_milliseconds(self):
        http, calls = self.fake_http(["FINISHED"])
        instagram.publish(self.reel, "c", "tok", "42", "graph.instagram.com", http=http, cover_at=37.5)
        self.assertEqual(calls[0]["params"]["thumb_offset"], "37500")

    def test_failed_processing_is_not_published(self):
        http, calls = self.fake_http(["ERROR"])
        with self.assertRaises(settings.RunError) as caught:
            instagram.publish(self.reel, "c", "tok", "42", "graph.instagram.com", http=http, wait=lambda s: None)
        self.assertIn("could not process", str(caught.exception))
        self.assertFalse(any(c["url"].endswith("/media_publish") for c in calls))

    def test_stage_fills_the_post_folder_and_keeps_an_edited_caption(self):
        root = Path(self.tmp.name)
        day = Day(root / "output", "2026-10-08")
        day.write_text(day.caption_txt, "From the song.")
        with self.assertRaises(settings.RunError):
            instagram.stage(day, root / "posts")
        (day.dir / "reel.mp4").write_bytes(b"first cut")
        folder = instagram.stage(day, root / "posts")
        self.assertEqual((folder / "reel.mp4").read_bytes(), b"first cut")
        self.assertEqual((folder / "caption.txt").read_text(encoding="utf-8"), "From the song.\n")
        self.assertEqual(json.loads((folder / "post.json").read_text(encoding="utf-8")), {"date": "2026-10-08", "status": "draft"})
        # The approved description is written into the folder; a new render must not wipe it.
        (folder / "caption.txt").write_text("Approved text.", encoding="utf-8")
        (day.dir / "reel.mp4").write_bytes(b"second, longer cut")
        instagram.stage(day, root / "posts")
        self.assertEqual((folder / "reel.mp4").read_bytes(), b"second, longer cut")
        self.assertEqual((folder / "caption.txt").read_text(encoding="utf-8"), "Approved text.")

    def test_over_long_caption_is_refused_before_anything_is_sent(self):
        http, calls = self.fake_http([])
        with self.assertRaises(settings.RunError):
            instagram.publish(self.reel, "x" * 2201, "tok", "42", "graph.instagram.com", http=http)
        self.assertEqual(calls, [])


class ReelCheckTests(unittest.TestCase):
    VIDEO = {"codec_type": "video", "width": 1080, "height": 1920, "r_frame_rate": "60/1", "pix_fmt": "yuv420p"}
    GOOD = {"streams": [VIDEO, {"codec_type": "audio"}], "format": {"duration": "40.97"}}

    def test_good_reel_passes(self):
        self.assertEqual(video.check_reel(self.GOOD, 40.96), [])

    def test_missing_audio_wrong_size_and_wrong_length_are_reported(self):
        silent = {"streams": [self.VIDEO], "format": {"duration": "40.97"}}
        self.assertIn("no audio stream", video.check_reel(silent, 40.96)[0])
        wide = {"streams": [dict(self.VIDEO, width=1920, height=1080), {"codec_type": "audio"}],
                "format": {"duration": "40.97"}}
        self.assertIn("1920x1080", video.check_reel(wide, 40.96)[0])
        self.assertIn("lasts 45.00s", video.check_reel(dict(self.GOOD, format={"duration": "45"}), 40.96)[0])
        self.assertEqual(len(video.check_reel({"streams": [], "format": {}}, 40.96)), 3)

    def test_wrong_frame_rate_and_pixel_format_are_reported(self):
        slow = {"streams": [dict(self.VIDEO, r_frame_rate="30/1", pix_fmt="yuvj420p"), {"codec_type": "audio"}],
                "format": {"duration": "40.97"}}
        problems = video.check_reel(slow, 40.96)
        self.assertEqual(len(problems), 2)
        self.assertIn("30/1", problems[0])
        self.assertIn("yuvj420p", problems[1])


class ReelPrepareTests(unittest.TestCase):
    INDEX = (
        '<div id="root" data-duration="1">\n<audio id="song" data-duration="1"></audio>\n</div>\n'
        '    <!-- day:start (scenes) -->\n    <script src="days/2026-01-01/old.js"></script>\n    <!-- day:end -->\n'
    )

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        root = Path(self.tmp.name)
        self.reel = root / "reel"
        self.reel.mkdir()
        (self.reel / "index.html").write_text(self.INDEX, encoding="utf-8")
        self.day = Day(root / "output", "2026-10-06")
        self.day.write_json(self.day.timeline_json, {"duration_seconds": 40.96, "captions": []})
        self.day.dir.joinpath("audio.mp3").write_bytes(b"song")

    def test_day_without_scenes_is_refused(self):
        with self.assertRaises(settings.RunError) as caught:
            video.prepare(self.day, self.reel)
        self.assertIn("No scenes for 2026-10-06", str(caught.exception))

    def test_prepare_points_the_project_at_the_day(self):
        scenes = self.reel / "days" / "2026-10-06"
        scenes.mkdir(parents=True)
        for name in ("2-verse.js", "1-hook.js"):
            (scenes / name).write_text("", encoding="utf-8")
        video.prepare(self.day, self.reel)
        html = (self.reel / "index.html").read_text(encoding="utf-8")
        self.assertEqual(html.count('data-duration="40.96"'), 2)
        self.assertNotIn("old.js", html)
        self.assertLess(html.index("days/2026-10-06/1-hook.js"), html.index("days/2026-10-06/2-verse.js"))
        self.assertIn("<!-- day:end -->", html)
        self.assertEqual((self.reel / "audio.mp3").read_bytes(), b"song")
        self.assertTrue((self.reel / "data" / "timeline.js").read_text(encoding="utf-8").startswith("window.TIMELINE = {"))


class RunnerTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.day = Day(Path(self.tmp.name), "2026-10-06")
        self.ran = []
        patcher = mock.patch.object(runner, "log", lambda m: None)
        patcher.start()
        self.addCleanup(patcher.stop)

    def stage(self, name, outcome=DONE):
        def run(day, cfg):
            self.ran.append(name)
            if isinstance(outcome, Exception):
                raise outcome
            return StageResult(outcome, [f"{name} note"] if outcome != DONE else [])
        return mock.Mock(NAME=name, run=run)

    def test_runs_in_order_then_skips_when_done(self):
        stages = [self.stage("song"), self.stage("audio"), self.stage("subtitles")]
        self.assertEqual(runner.run_stages(self.day, CFG, stages), 0)
        self.assertEqual(self.ran, ["song", "audio", "subtitles"])
        self.assertEqual(runner.run_stages(self.day, CFG, stages), 0)
        self.assertEqual(self.ran, ["song", "audio", "subtitles"])

    def test_failure_stops_later_stages_and_is_retried_next_run(self):
        stages = [self.stage("song", FAILED), self.stage("audio")]
        self.assertEqual(runner.run_stages(self.day, CFG, stages), 1)
        self.assertEqual(self.ran, ["song"])
        self.assertEqual(self.day.status()["song"], {"state": FAILED, "notes": ["song note"]})
        self.assertEqual(runner.run_stages(self.day, CFG, [self.stage("song"), self.stage("audio")]), 0)
        self.assertEqual(self.ran, ["song", "song", "audio"])

    def test_review_continues_and_is_reported(self):
        stages = [self.stage("song"), self.stage("audio", REVIEW), self.stage("subtitles")]
        self.assertEqual(runner.run_stages(self.day, CFG, stages), 2)
        self.assertEqual(self.ran, ["song", "audio", "subtitles"])
        self.assertEqual(runner.run_stages(self.day, CFG, stages), 2)  # still flagged, nothing rerun
        self.assertEqual(len(self.ran), 3)

    def test_exception_in_a_stage_is_a_failure(self):
        self.assertEqual(runner.run_stages(self.day, CFG, [self.stage("song", ValueError("boom")), self.stage("audio")]), 1)
        self.assertIn("boom", self.day.status()["song"]["notes"][0])

    def test_reset_reruns_from_that_stage(self):
        stages = [self.stage("song"), self.stage("audio"), self.stage("subtitles")]
        runner.run_stages(self.day, CFG, stages)
        self.day.reset(["audio", "subtitles"])  # what --from audio does
        runner.run_stages(self.day, CFG, stages)
        self.assertEqual(self.ran, ["song", "audio", "subtitles", "audio", "subtitles"])


if __name__ == "__main__":
    unittest.main()
