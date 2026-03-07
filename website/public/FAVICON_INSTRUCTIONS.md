# Favicon Setup

The `favicon.ico` file needs to be generated and placed in this directory.

## Option 1: Using Online Tools

1. Go to https://icoconvert.com/ or https://www.favicon-generator.org/
2. Upload the `logo.svg` file
3. Download the generated `favicon.ico`
4. Place it in this `public/` directory

## Option 2: Using ImageMagick

```bash
convert -background none logo.svg -define icon:auto-resize=64,48,32,16 favicon.ico
```

## Option 3: Using Graphicsmagick

```bash
gm convert logo.svg favicon.ico
```

## Verification

After adding `favicon.ico`, verify it works:
```bash
cd website
npm run docs:dev
# Check browser tab for favicon
```

The favicon will automatically be referenced in the website configuration.
