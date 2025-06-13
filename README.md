# Forestfy 🌳

<img src="frontend/public/treenormal.png" alt="Forestfy Tree" width="300"/>

Forestfy is a Web3 focus-to-earn app where users stake tokens, mint NFT trees, trade them, and grow their forest while improving concentration.

> **Note**: This project is in very early development stage. The current implementation uses a custom backend with a sponsor wallet for gas transactions. In the future, we plan to migrate to a more integrated service that better aligns with abstract wallet techniques, following best practices and providing a more fluid user experience.

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Yarn](https://yarnpkg.com/) (globally installed)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (globally installed)
- [Docker](https://www.docker.com/products/docker-desktop/) and Docker Compose
- [Xcode](https://developer.apple.com/xcode/) (for iOS development)
- [Android Studio](https://developer.android.com/studio) (for Android development)

## Project Structure

```
forestfy/
├── frontend/          # React Native mobile app
├── contracts/         # Smart contracts
└── backend/          # Backend service
```

## Getting Started

### Smart Contracts Setup

1. Navigate to the contracts directory:

```bash
cd contracts
```

2. Install dependencies:

```bash
yarn install
# or
npm install
```

3. Configure environment variables:

   - Copy `.env.example` to `.env`
   - Add your sponsor wallet private key to the `.env` file
   - **Important**: Ensure your sponsor wallet has sufficient tokens for gas fees on the Mantle network

4. Compile the contracts:

```bash
npx hardhat compile
```

5. Deploy the contracts to Mantle network:

```bash
npx hardhat run scripts/deploy.ts --network mantle
```

After successful deployment, you'll see an output similar to this:

```
Deployment Summary:
-------------------
ForestToken: 0x500...DAf
ForestNFT: 0xFd9...6b9
```

6. After deployment, note down the contract addresses that are output in the console. You'll need these addresses for:
   - Frontend configuration
   - Backend configuration
   - Future contract interactions

> **Important**: The sponsor wallet must have enough tokens to cover gas fees for both contract deployment and subsequent transactions. Make sure to fund your sponsor wallet with the appropriate amount of tokens before proceeding.

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Configure environment variables:

   - Copy `.env.example` to `.env`
   - Add the following information to your `.env`:
     - NFT contract address
     - Token contract address
     - Sponsor wallet private key

3. Start the backend service:

```bash
# Ensure Docker daemon is running
docker-compose up --build
```

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
yarn install
```

3. Configure environment variables:

   - Copy `.env.example` to `.env`
   - Get your ThirdWeb client ID from [ThirdWeb Dashboard](https://thirdweb.com/dashboard/settings)
   - Fill in the required environment variables in `.env`

4. Prebuild the native projects:

```bash
npx expo prebuild
```

5. Run the application:

```bash
# For iOS
yarn ios

# For Android
yarn android
```

> **Development Tips**:
>
> - Press `r` in the terminal to reload the application
> - Press `Ctrl + C` to stop the application
> - To restart the application, run `npx expo start` again

## Environment Variables

### Frontend (.env)

```
EXPO_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id
EXPO_PUBLIC_THIRDWEB_SECRET_KEY=your_thidweb_secret_key
EXPO_PUBLIC_NFT_CONTRACT_ADDRESS=your_nft_contract_address
EXPO_PUBLIC_TOKEN_CONTRACT_ADDRESS=your_token_contract_address

```

### Contracts (.env)

```
PRIVATE_KEY=your_sponsor_wallet_private_key
```

### Backend (.env)

```
NFT_CONTRACT_ADDRESS=your_nft_contract_address
TOKEN_CONTRACT_ADDRESS=your_token_contract_address
SPONSOR_PRIVATE_KEY=your_sponsor_wallet_private_key
```

## Development Status

### Current Implementation

- Custom backend solution using a sponsor wallet for gas transactions
- Basic integration with abstract wallets
- Early development stage

### Future Plans

- Migration to a more integrated service for abstract wallet management
- Implementation of best practices for wallet interactions
- Enhanced user experience with more fluid transactions
- Better security measures and gas optimization

## Development

- Frontend runs on Expo
- Smart contracts are deployed on Mantle network
- Backend runs in Docker containers

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
