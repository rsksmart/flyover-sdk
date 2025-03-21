export const EXTENDED_TIMEOUT = 7200 * 1000
export const TEST_CONTRACT_ABI = [
  'function save(address destination) public payable',
  'function setValue(uint256 _value) external',
  'function retrieveValue() external view returns (uint256)',
  'function getBalance(address destination) external view returns (uint256)',
  'function withdraw() external'
]
