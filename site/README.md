# ES Check Documentation Site

This is the documentation site for ES Check, built with Astro.

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Deployment

The site is automatically deployed to GitHub Pages when changes are pushed to the `main` branch.

### Manual Deployment

To manually trigger a deployment:

1. Go to the Actions tab in the GitHub repository
2. Select "Deploy ES Check Documentation Site" workflow
3. Click "Run workflow"

### GitHub Pages Configuration

The site is configured to be deployed at: https://yowainwright.github.io/es-check/

Make sure GitHub Pages is enabled in the repository settings:

1. Go to Settings > Pages
2. Source: Deploy from a branch
3. Branch: gh-pages / (root)

## Structure

- `/src/pages` - Page routes
- `/src/content/docs` - Documentation content (MDX files)
- `/src/components` - Reusable components
- `/src/layouts` - Page layouts
- `/public` - Static assets

## Adding Documentation

To add new documentation pages:

1. Create a new `.mdx` file in `/src/content/docs/`
2. Add frontmatter with `title` and `description`
3. Update the sidebar configuration in `/src/constants/sidebar.ts`

## Themes

The site supports light and dark themes with custom blue colors:

- Light mode: White background with #4486c6 blue accents
- Dark mode: Dark blue background with lighter blue accents
