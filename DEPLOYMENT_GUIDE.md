# GitHub Pages Deployment Guide

## Prerequisites
1. **Add your resume PDF**: Place your `resume.pdf` file in the `public/` folder
2. Ensure you're logged into GitHub in your terminal/Git Bash

## Deployment Steps

### 1. First-time setup (if not done already):
```bash
# Add all new files
git add .

# Commit your changes
git commit -m "React portfolio with modern design"

# Push to main branch
git push origin main
```

### 2. Deploy to GitHub Pages:
```bash
# This command builds and deploys to GitHub Pages
npm run deploy
```

This will:
- Build the production version
- Create a `gh-pages` branch
- Deploy the build folder to GitHub Pages

### 3. Enable GitHub Pages (First time only):
1. Go to your repository on GitHub: https://github.com/ArnavSinha717/portfolio
2. Click on "Settings" tab
3. Scroll down to "Pages" section
4. Under "Source", select "Deploy from a branch"
5. Select `gh-pages` branch and `/ (root)` folder
6. Click "Save"

### 4. Access your live site:
Your portfolio will be available at:
**https://arnavsinha717.github.io/portfolio**

## Updating the Site

Whenever you want to update your live site:

1. Make your changes locally
2. Test with `npm start`
3. Commit changes:
```bash
git add .
git commit -m "Update description"
git push origin main
```
4. Deploy:
```bash
npm run deploy
```

## Important Notes

- The site may take 5-10 minutes to update after deployment
- Make sure your `resume.pdf` is in the `public/` folder before deploying
- The old HTML/CSS/JS files are ignored via `.gitignore`

## Troubleshooting

If the deploy command fails:
1. Make sure you have push access to your repository
2. Try running: `npm install --save-dev gh-pages`
3. Ensure you're on the main branch: `git checkout main`

## Resume PDF
When you add your resume PDF to the `public/` folder, users will be able to download it directly from the website by clicking the "Download Resume PDF" button.