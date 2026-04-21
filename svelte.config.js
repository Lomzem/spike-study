import adapter from '@sveltejs/adapter-vercel'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  compilerOptions: {
    // Keep new app code in runes mode by default.
    runes: ({ filename }) =>
      filename.split(/[/\\]/).includes('node_modules') ? undefined : true,
  },
  kit: {
    adapter: adapter({
      runtime: 'nodejs22.x',
    }),
    typescript: {
      config: (config) => ({
        ...config,
        include: [...config.include, '../drizzle.config.ts'],
      }),
    },
  },
}

export default config
