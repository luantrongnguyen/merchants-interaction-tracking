# Deployment Guide

This document explains how to deploy the Merchants Interaction Tracking frontend application.

## Deployment Options

### 1. GitHub Pages (Recommended)

The project is configured for automatic deployment to GitHub Pages using GitHub Actions.

#### Setup GitHub Pages

1. Go to your repository settings on GitHub
2. Navigate to "Pages" section
3. Set source to "GitHub Actions"
4. The deployment will be triggered automatically when you push to main/master branch

#### Manual Deployment

```bash
# Install dependencies
npm install

# Deploy to GitHub Pages
npm run deploy
```

### 2. GitHub Actions (Automated)

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically:
- Builds the application
- Deploys to GitHub Pages when pushing to main/master branch

#### Workflow Features

- **Trigger**: On push to main/master branch
- **Build**: Installs dependencies and builds the React app
- **Deploy**: Automatically deploys to GitHub Pages
- **Environment**: Uses Ubuntu latest with Node.js 18

### 3. Local Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## Configuration

### Package.json Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run deploy` - Deploy to GitHub Pages
- `npm test` - Run tests

### Environment Variables

Create a `.env` file in the root directory for environment-specific configurations:

```env
REACT_APP_API_URL=your_api_url_here
REACT_APP_GOOGLE_SHEETS_ID=your_sheets_id_here
```

## Deployment URLs

- **Production**: https://luantrongnguyen.github.io/merchants-interaction-tracking
- **Repository**: https://github.com/luantrongnguyen/merchants-interaction-tracking

## Troubleshooting

### Common Issues

1. **Build Fails**: Check for TypeScript errors and fix them before deploying
2. **Deployment Fails**: Ensure GitHub Pages is enabled in repository settings
3. **404 Errors**: Verify the homepage URL in package.json matches your repository

### Manual Deployment Steps

If automated deployment fails:

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy manually:
   ```bash
   npm run deploy
   ```

3. Check GitHub Pages settings in repository settings

## Security Notes

- Never commit sensitive environment variables
- Use GitHub Secrets for production configurations
- Regularly update dependencies for security patches

## Support

For deployment issues, check:
1. GitHub Actions logs in the repository
2. GitHub Pages settings
3. Build output for errors
