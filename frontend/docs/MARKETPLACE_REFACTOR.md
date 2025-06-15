# Marketplace Refactoring Documentation

## Overview

Esta documentación describe la refactorización completa del sistema de marketplace para separar responsabilidades, crear componentes reutilizables y mejorar la mantenibilidad del código.

## Nueva Estructura de Archivos

### Hooks Personalizados (`/hooks/`)

#### `useNFTMetadata.ts`

Hook para manejar la obtención y procesamiento de metadata de NFTs desde IPFS.

- **Parámetros**: `tokenId: bigint`
- **Retorna**: `{ metadata, imageUrl, isLoading, error, uriData }`
- **Funcionalidad**:
  - Obtiene el tokenURI del contrato NFT
  - Fetches metadata desde IPFS
  - Convierte URLs de IPFS a HTTPS
  - Maneja estados de loading y error

#### `useMarketplaceListing.ts`

Hook para manejar la lógica de listings del marketplace.

- **Funciones exportadas**:
  - `useMarketplaceListing(tokenId)`: Obtiene detalles de un listing específico
  - `useActiveListings()`: Obtiene todos los listings activos
- **Retorna**: Datos del listing procesados y funciones de refetch

#### `useUserWalletData.ts`

Hook centralizado para obtener datos del wallet del usuario.

- **Retorna**: `{ address, balanceData, parcelData, tokenCountData, userBalance, userParcels, userTokenCount }`
- **Funcionalidad**: Obtiene balance de tokens, parcelas y conteo de NFTs del usuario

### Utilidades (`/utils/`)

#### `nftHelpers.ts`

Funciones utilitarias para formateo y procesamiento de datos NFT:

- `formatPrice(price: bigint)`: Convierte Wei a formato legible
- `formatAddress(address: string)`: Formatea direcciones a formato corto
- `getRarityColor(rarity: string)`: Obtiene color según rareza
- `formatDate(timestamp: bigint)`: Formatea timestamps
- `extractRarity(attributes)`: Extrae rareza de atributos de metadata

### Componentes Reutilizables

#### Marketplace (`/components/marketplace/`)

##### `MarketplaceNFTItem.tsx`

Componente para mostrar NFTs en la lista del marketplace.

- **Props**: `{ tokenId: bigint }`
- **Funcionalidad**:
  - Usa `useNFTMetadata` y `useMarketplaceListing`
  - Muestra imagen, nombre, ID, rareza y precio
  - Navegación a detalles del NFT
  - Manejo de estados de loading

##### `NFTBuyButton.tsx`

Componente especializado para la compra de NFTs.

- **Props**: `{ listing, tokenId, onBuyStart, onBuyComplete }`
- **Funcionalidad**:
  - Validaciones previas a la compra
  - Integración con API de compra
  - Manejo de estados de loading
  - Callbacks para confirmación y resultado

#### Comunes (`/components/common/`)

##### `PixelBackButton.tsx`

Botón de retroceso reutilizable con estilo pixelado.

- **Props**: `{ onPress?, text? }`
- **Funcionalidad**: Navegación hacia atrás con estilo consistente

##### `EmptyState.tsx`

Componente para estados vacíos reutilizable.

- **Props**: `{ image?, message, style? }`
- **Funcionalidad**: Muestra imagen y mensaje cuando no hay contenido

## Pantallas Refactorizadas

### `marketplace.tsx`

- **Antes**: 431 líneas con lógica mixta
- **Después**: 112 líneas enfocadas en UI y navegación
- **Mejoras**:
  - Separación de concerns
  - Uso de hooks personalizados
  - Componentes reutilizables
  - Código más limpio y mantenible

### `nft-details.tsx`

- **Antes**: 520 líneas con múltiples responsabilidades
- **Después**: 280 líneas enfocadas en presentación
- **Mejoras**:
  - Lógica abstracta en hooks
  - Componente NFTBuyButton separado
  - Mejor manejo de estados
  - UI más limpia y consistente

## Beneficios de la Refactorización

### 1. Reutilización de Código

- Hooks pueden ser usados en múltiples componentes
- Componentes UI reutilizables (botones, estados vacíos)
- Funciones utilitarias centralizadas

### 2. Mantenibilidad

- Separación clara de responsabilidades
- Código más fácil de testear
- Componentes más pequeños y enfocados

### 3. Consistencia

- Estilos uniformes entre componentes
- Comportamientos estandarizados
- Manejo de errores consistente

### 4. Escalabilidad

- Fácil agregar nuevas funcionalidades
- Componentes modulares
- Estructura clara para nuevos desarrolladores

## Guía de Uso

### Para agregar un nuevo NFT en marketplace:

```tsx
import { MarketplaceNFTItem } from "@/components/marketplace/MarketplaceNFTItem";

<MarketplaceNFTItem tokenId={BigInt(tokenId)} />;
```

### Para obtener metadata de NFT:

```tsx
import { useNFTMetadata } from "@/hooks/useNFTMetadata";

const { metadata, imageUrl, isLoading } = useNFTMetadata(tokenId);
```

### Para manejar compra de NFT:

```tsx
import { NFTBuyButton } from "@/components/marketplace/NFTBuyButton";

<NFTBuyButton
  listing={listing}
  tokenId={tokenId}
  onBuyStart={() => setShowConfirm(true)}
  onBuyComplete={(success, message) => handleResult(success, message)}
/>;
```

## Próximos Pasos

1. **Testing**: Agregar tests unitarios para hooks y componentes
2. **Performance**: Implementar memoización donde sea necesario
3. **Accesibilidad**: Mejorar etiquetas y navegación por teclado
4. **Animaciones**: Agregar transiciones suaves entre estados
5. **Error Boundaries**: Implementar manejo de errores robusto

## Conclusión

La refactorización ha resultado en un código más modular, mantenible y escalable. La separación de concerns permite que cada componente y hook tenga una responsabilidad específica, facilitando el desarrollo futuro y la resolución de bugs.
