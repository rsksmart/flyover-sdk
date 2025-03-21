// SPDX-License-Identifier: MIT

pragma solidity >=0.8.2 <0.9.0;

contract TestContract {

    event Deposit(address indexed destination, uint256 amount);
    event Withdraw(address indexed destination, uint256 amount);
    event ValueChanged(uint256 oldValue, uint256 newValue);

    mapping(address => uint256) private balances;
    uint256 private value;

    function save(address destination) public payable {
        uint256 amount = msg.value;
        balances[destination] += amount;
        emit Deposit(destination, amount);
    }

    function setValue(uint256 _value) external {
        emit ValueChanged(value, _value);
        value = _value;
    }

    function retrieveValue() external view returns (uint256) {
        return value;
    }

    function getBalance(address destination) external view returns (uint256) {
        return balances[destination];
    }

    function withdraw() external {
        uint256 balance = balances[msg.sender];
        require(balance > 0, "Insufficient balance");
        balances[msg.sender] = 0;
        (bool success,) = msg.sender.call{value: balance}("");
        require(success, "Error sending the tokens");
        emit Withdraw(msg.sender, value);
    }
}
