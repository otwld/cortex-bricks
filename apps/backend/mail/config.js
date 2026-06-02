/** @type {import('@maizzle/framework').Config} */
module.exports = {
  css: {
    inline: true,
    tailwind: require('./tailwind.config.js'),
  },
  build: {
    content: ['src/templates/**/*.html'],
    output: {
      path: 'build',
      extension: 'html',
      from: 'src/templates',
    },
  },
};
