module.exports = {
  content: ['./index.html'],
  safelist: [
    // Warna dinamis yang dipakai via template string (lihat health/tone di index.html).
    {
      pattern: /^(bg|text|border|from|to|ring)-(slate|rose|amber|emerald|blue|purple|fuchsia)-(50|100|200|400|500|600|700)$/,
      variants: ['hover']
    },
    {
      pattern: /^grid-cols-(1|2|3|4|5|6)$/,
      variants: ['sm', 'md', 'lg', 'xl']
    }
  ]
};
