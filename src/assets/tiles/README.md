# Tile artwork folder

Drop the 63 square PNG files for the Cambodian board into this folder.

Use these exact names:

```text
tile-01.png
tile-02.png
...
tile-63.png
```

The game automatically discovers any matching files. Missing PNGs safely keep the current numbered PLACEHOLDER tile, so you can add the artwork gradually.

Recommended image format:

- PNG
- Square 1:1 ratio
- 1024 x 1024 recommended (512 x 512 also works)
- Keep important text and icons away from the outer edge
- Restart `npm run dev` after adding new files if Vite does not detect them immediately

## Visual board order

The filename is the gameplay tile number, while the printed board uses the snake layout:

```text
Row 1:  01 02 03 04 05 06 07
Row 2:  14 13 12 11 10 09 08
Row 3:  15 16 17 18 19 20 21
Row 4:  28 27 26 25 24 23 22
Row 5:  29 30 31 32 33 34 35
Row 6:  42 41 40 39 38 37 36
Row 7:  43 44 45 46 47 48 49
Row 8:  56 55 54 53 52 51 50
Row 9:  57 58 59 60 61 62 63
```

START is generated separately by the game and does not need a PNG.
