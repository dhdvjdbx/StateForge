import { ethers } from "hardhat";

export async function getContractAt(name: string, address: string) {
  return await ethers.getContractAt(name, address);
}

export async function deployContract(name: string, ...args: any[]) {
  const Factory = await ethers.getContractFactory(name);
  const contract = await Factory.deploy(...args);
  await contract.waitForDeployment();
  return contract;
}

export function stateId(name: string): string {
  return ethers.id(name);
}

export function roleId(name: string): string {
  return ethers.id(name);
}

export async function waitForConfirmations(tx: any, confirmations: number = 2) {
  const receipt = await tx.wait(confirmations);
  return receipt;
}

export function logDeployment(name: string, address: string) {
  console.log(`${name}: ${address}`);
}

