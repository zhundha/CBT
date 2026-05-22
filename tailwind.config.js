module.exports = {
  content: ['./index.html'],
  safelist: [
    {
      pattern: /^(bg|text|border|from|to|ring)-(slate|gray|red|rose|orange|amber|yellow|green|emerald|teal|cyan|sky|blue|indigo|purple|fuchsia|pink)-(50|100|200|300|400|500|600|700|800|900)$/,
      variants: ['hover', 'focus', 'group-hover']
    },
    {
      pattern: /^grid-cols-(1|2|3|4|5|6)$/,
      variants: ['sm', 'md', 'lg', 'xl']
    }
  ]
};
