# Deployment Guide

## Prerequisites

- Node.js v16 or higher
- Hardhat installed
- Network RPC endpoint (Infura, Alchemy, etc.)
- Private key with funds for gas

## Setup

1. Clone the repository:
```bash
git clone https://github.com/dhdvjdbx/StateForge.git
cd StateForge
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Compile contracts:
```bash
npm run compile
```

## Local Deployment

Start a local Hardhat node:
```bash
npx hardhat node
```

In another terminal, deploy:
```bash
npm run deploy:local
```

## Testnet Deployment

### Configuration

Edit `hardhat.config.ts` to add your network:

```typescript
networks: {
  sepolia: {
    url: process.env.SEPOLIA_RPC_URL,
    accounts: [process.env.PRIVATE_KEY]
  }
}
```

### Deploy

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

### Verify Contracts

```bash
npx hardhat run scripts/verify.ts --network sepolia
```

## Mainnet Deployment

⚠️ **Mainnet deployment requires extra caution**

1. Test thoroughly on testnet
2. Audit contracts
3. Use multi-sig for admin functions
4. Set up monitoring

```bash
npx hardhat run scripts/deploy.ts --network mainnet
```

## Post-Deployment

1. Save contract addresses
2. Verify on block explorer
3. Initialize workflows
4. Set up roles
5. Transfer ownership if needed

## Workflow Initialization

After deploying core contracts, initialize your workflow:

```bash
# Edit scripts/initialize-workflow.ts with your workflow
npx hardhat run scripts/initialize-workflow.ts --network <network>
```

## Security Checklist

- [ ] All contracts verified on block explorer
- [ ] Admin functions use multi-sig
- [ ] Pause guardians configured
- [ ] Roles properly assigned
- [ ] Timelocks set for sensitive operations
- [ ] Monitoring and alerts set up

## Troubleshooting

### Gas Issues

If deployment fails due to gas:
- Increase gas limit in hardhat.config.ts
- Check network congestion
- Verify account balance

### Verification Fails

- Ensure correct compiler version
- Check constructor arguments
- Verify network configuration

### Transaction Reverts

- Check account permissions
- Verify contract addresses
- Review transaction data

## Upgrading

StateForge uses UUPS upgrade pattern:

1. Deploy new implementation
2. Prepare upgrade through multi-sig
3. Execute upgrade with timelock
4. Verify upgrade successful

## Networks

### Testnet

- **Sepolia**: Ethereum testnet
- **Mumbai**: Polygon testnet  
- **Goerli**: Deprecated, use Sepolia

### Mainnet

- **Ethereum**: Mainnet
- **Polygon**: L2 solution
- **Arbitrum**: L2 optimistic rollup
- **Optimism**: L2 optimistic rollup

## Gas Optimization

Tips for reducing deployment costs:

- Optimize contract size
- Use libraries for common code
- Consider proxy patterns
- Deploy during low congestion

## Support

For deployment issues, contact:
- GitHub Issues
- Discord Community
- Email: support@stateforge.io

