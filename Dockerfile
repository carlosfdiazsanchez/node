# Stage de build: instala dependencias y compila TypeScript
FROM node:24.8.0-alpine AS build
WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache python3 make g++

# Copiar package.json y package-lock si existe para cachear install
COPY package.json package-lock.json* ./

# Instalar dependencias de producción y de desarrollo necesarias para compilar TS
RUN npm install --production=false --silent

# Instalar typescript (si no está en devDependencies en el proyecto)
RUN npm install --no-save typescript@5 @types/node --silent

# Copiar el resto del código
COPY . .

# Compilar TypeScript a la carpeta dist
RUN npx tsc --outDir dist --incremental false || true

# Si no existe tsconfig o la compilación no generó dist, intentar transpilar con esbuild (fallback)
RUN if [ ! -d "dist" ]; then npx esbuild src/index.ts --bundle --platform=node --outfile=dist/index.js || true; fi

# Stage final: imagen ligera para ejecución
FROM node:24.8.0-alpine AS run
WORKDIR /app

# Copiar sólo node_modules de production y la carpeta dist
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
ENV NODE_ENV=production \
	ARI_URL="wss://asterisk.ridinn.com/ari/events" \
	ARI_USER="node" \
	ARI_PASSWORD="ari_password" \
	ARI_APP_NAME="node" \
	PORT=3000

# Exponer puerto configurado por la variable PORT
EXPOSE ${PORT}

# Comando por defecto
CMD ["node", "dist/index.js"]
