FROM node:18-slim

# Install dependencies and Playwright browsers
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --progress=false

# Ensure Playwright browsers are installed
RUN npx playwright install --with-deps

COPY . .

ENV NODE_ENV=production
VOLUME ["/app/data"]

CMD ["node", "src/index.js"]