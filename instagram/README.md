# Instagram

What goes on the Mu-Zueki Instagram account.

```
profile_picture/muzueki.jpg   the account's profile picture (kept locally, not in git)
posts/WEEK/                   one folder per reel (kept locally, not in git)
  reel.mp4                    the video as posted (a copy of output/WEEK/reel.mp4)
  caption.txt                 the description; edit this file to change it before posting
  post.json                   "draft" until posted, then "posted" with the post id, link and time; "archived" for a
                              reel kept but not to be posted (posting it then needs --again).
                              "cover_at_seconds" picks the frame used as the cover (default: the first frame)
```

- A post folder is created as a draft whenever a reel is rendered through Claude
  (`python -m pipeline.instagram WEEK --draft` does the same by hand). Nothing is sent.
- Posting happens only after you approve the reel and then the description:
  `python -m pipeline.instagram WEEK`.
- To post, the reel is put on the Vercel Blob store `mu-zueki-reels` so Instagram can fetch it, and
  deleted from there as soon as the post is done.
- The access token is not kept here. It is in `config/.env` (see "Posting to Instagram" in the main README).
