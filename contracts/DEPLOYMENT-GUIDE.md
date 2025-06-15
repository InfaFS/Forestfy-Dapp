# 🚀 Guía de Deployment - Forestfy Contracts

Esta guía te ayudará a deployar todos los contratos de Forestfy en el orden correcto.

## 📋 Pre-requisitos

1. **Node.js** instalado
2. **Hardhat** configurado
3. **Wallet con ETH** para pagar gas
4. **Network configurada** en `hardhat.config.ts`

## 🔧 Pasos de Deployment

### 1. Compilar Contratos

```bash
cd contracts
npx hardhat compile
```

### 2. Deploy Todos los Contratos

```bash
npx hardhat run scripts/deploy-all.ts --network <NETWORK_NAME>
```

**Ejemplos de networks:**

```bash
# Local (Hardhat network)
npx hardhat run scripts/deploy-all.ts --network localhost

# Polygon Mumbai (testnet)
npx hardhat run scripts/deploy-all.ts --network mumbai

# Polygon Mainnet
npx hardhat run scripts/deploy-all.ts --network polygon
```

### 3. Guardar Direcciones

El script mostrará algo como:

```
📋 CONTRACT ADDRESSES:
   ForestToken:  0x1234...
   ForestNFT:    0x5678...
   Marketplace:  0x9abc...
```

**¡GUARDA ESTAS DIRECCIONES!** Las necesitarás para el backend.

## 🧪 Testing (Opcional)

### 1. Actualizar Script de Test

Edita `scripts/test-marketplace.ts` y reemplaza:

```typescript
const FOREST_TOKEN_ADDRESS = "0x1234..."; // Tu dirección real
const FOREST_NFT_ADDRESS = "0x5678..."; // Tu dirección real
const MARKETPLACE_ADDRESS = "0x9abc..."; // Tu dirección real
```

### 2. Ejecutar Tests

```bash
npx hardhat run scripts/test-marketplace.ts --network <NETWORK_NAME>
```

## 📱 Configurar Backend

Actualiza tu archivo `.env` del backend:

```env
FOREST_TOKEN_ADDRESS=0x1234...
FOREST_NFT_ADDRESS=0x5678...
MARKETPLACE_ADDRESS=0x9abc...
```

## ✅ Verificación en Block Explorer (Opcional)

Si quieres verificar los contratos:

```bash
# Verificar ForestToken
npx hardhat verify <FOREST_TOKEN_ADDRESS> --network <NETWORK>

# Verificar ForestNFT
npx hardhat verify <FOREST_NFT_ADDRESS> --network <NETWORK>

# Verificar Marketplace
npx hardhat verify <MARKETPLACE_ADDRESS> <FOREST_NFT_ADDRESS> <FOREST_TOKEN_ADDRESS> --network <NETWORK>
```

## 🎯 Lo que hace el Script de Deployment

1. **Deploy ForestToken** - Crea el token ERC20 con sistema virtual
2. **Deploy ForestNFT** - Crea los NFTs con manejo interno
3. **Deploy Marketplace** - Crea el marketplace conectado a los otros contratos
4. **Configurar Autorizaciones** - Permite al Marketplace operar con los otros contratos
5. **Setup Inicial** - Asigna parcelas y mintea NFT de prueba
6. **Verificaciones** - Confirma que todo funciona correctamente

## 🚨 Troubleshooting

### Error: "execution reverted"

- Verifica que tienes suficiente ETH para gas
- Verifica que la network esté configurada correctamente

### Error: "nonce too high"

- Resetea la cuenta en Metamask o usa `--reset` en Hardhat

### Error: "already deployed"

- Usa una network limpia o cambia las addresses en el script

## 📞 Resumen Rápido

```bash
# 1. Compilar
npx hardhat compile

# 2. Deploy (ejemplo con localhost)
npx hardhat run scripts/deploy-all.ts --network localhost

# 3. Copiar las addresses del output

# 4. Actualizar backend .env

# 5. ¡Listo para usar! 🎉
```

## 🎪 Features Disponibles Después del Deploy

- ✅ **Mint NFTs** con rareza dinámica
- ✅ **Sistema de parcelas** con límites de árboles
- ✅ **Tokens virtuales** para pagos sin gas del usuario
- ✅ **Marketplace** completo (listar, comprar, deslistar)
- ✅ **Manejo interno** sin transferir NFTs fuera del sistema
- ✅ **Backend sponsor** para pagar gas de usuarios

¡Todo el sistema está listo para funcionar! 🚀
