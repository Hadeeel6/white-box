# Design layer

`index.html` already contains everything below, inlined. These files are the sources, kept here so the theme can be read, changed or rebuilt.

- `m3.css`: Material Design 3 tokens and components (color roles, type scale, shape, elevation, buttons, chips, fields, switches, navigation, dialog, snackbar).
- `mono.css`: the White Box theme on top of it: black and white, with sun (`#FFC845`) as the only accent. Also the opening animation, the contrast fixes and the spacing fixes.
- `logo.css`: the line-art box logo and its hover animation.
- `build.py`: applies the layers to a plain `index.html` (fonts, Material Symbols icons, the opening splash, smooth screen updates with morphdom, and the neutral palette for the lessons).

To rebuild from the version before the redesign (commit `8f36ec4`):

```bash
git show 8f36ec4:index.html > /tmp/base.html
WB_BASE=/tmp/base.html WB_OUT=.. python3 build.py m3
```

Run it from this folder. It overwrites `../index.html`, so only do this if you want to redo the whole layer, and check `git diff` afterwards.
