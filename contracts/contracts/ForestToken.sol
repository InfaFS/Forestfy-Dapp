// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ForestToken is ERC20, Ownable {
    mapping(address => bool) public hasClaimedReward;
    mapping(address => uint256) public virtualBalance;

    // Authorized contracts that can perform operations
    mapping(address => bool) public authorizedContracts;
    uint256 public constant INITIAL_REWARD = 20 * 10 ** 18; // 20 tokens
    uint256 public constant FEE_PERCENTAGE = 5; // 5% fee

    event VirtualTransfer(
        address indexed from,
        address indexed to,
        uint256 amount
    );
    event VirtualBurn(address indexed from, uint256 amount);
    event Withdrawal(
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 fee
    );
    event TokensMinted(uint256 amount);

    constructor() ERC20("Forest Token", "FOREST") Ownable() {
        // Mint tokens para el owner
        _mint(msg.sender, 1000000 * 10 ** decimals());
        virtualBalance[msg.sender] += 1000000 * 10 ** decimals();

        // Mint tokens para el contrato (para poder quemar)
        _mint(address(this), 1000000 * 10 ** decimals());
        virtualBalance[address(this)] += 1000000 * 10 ** decimals();
    }

    function mint(uint256 amount) public onlyOwner {
        _mint(address(this), amount);
        emit TokensMinted(amount);
    }

    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }

    function burnFromContract(uint256 amount) public onlyOwner {
        _burn(address(this), amount);
    }

    function claimInitialReward(address to) public onlyOwner {
        require(!hasClaimedReward[to], "Ya reclamaste tu recompensa");
        hasClaimedReward[to] = true;
        virtualBalance[to] += INITIAL_REWARD;
    }

    // Modifier for authorized contracts
    modifier onlyOwnerOrAuthorized() {
        require(
            msg.sender == owner() || authorizedContracts[msg.sender],
            "Not authorized"
        );
        _;
    }

    // Add authorized contract
    function addAuthorizedContract(address contractAddress) public onlyOwner {
        authorizedContracts[contractAddress] = true;
    }

    // Remove authorized contract
    function removeAuthorizedContract(
        address contractAddress
    ) public onlyOwner {
        authorizedContracts[contractAddress] = false;
    }

    function virtualTransfer(
        address from,
        address to,
        uint256 amount
    ) public onlyOwnerOrAuthorized {
        require(virtualBalance[from] >= amount, "Saldo virtual insuficiente");
        virtualBalance[from] -= amount;
        virtualBalance[to] += amount;
        emit VirtualTransfer(from, to, amount);
    }

    function virtualBurn(
        address from,
        uint256 amount
    ) public onlyOwnerOrAuthorized {
        require(virtualBalance[from] >= amount, "Saldo virtual insuficiente");
        require(
            balanceOf(address(this)) >= amount,
            "Contrato sin suficientes tokens para quemar"
        );

        virtualBalance[from] -= amount;
        _burn(address(this), amount);
        emit VirtualBurn(from, amount);
    }

    function withdraw(address to, uint256 amount) public onlyOwner {
        require(virtualBalance[to] >= amount, "Saldo virtual insuficiente");
        require(
            balanceOf(address(this)) >= amount,
            "Contrato sin suficientes tokens"
        );

        uint256 fee = (amount * FEE_PERCENTAGE) / 100;
        uint256 amountAfterFee = amount - fee;

        virtualBalance[to] -= amount;
        _transfer(address(this), to, amountAfterFee);
        _transfer(address(this), owner(), fee);

        emit Withdrawal(to, to, amountAfterFee, fee);
    }

    function deposit(uint256 amount) public onlyOwner {
        require(amount > 0, "Cantidad debe ser mayor a 0");
        require(balanceOf(msg.sender) >= amount, "Saldo insuficiente");

        _transfer(msg.sender, address(this), amount);
        virtualBalance[msg.sender] += amount;
    }

    //claimStaking
    function claimStaking(address to, uint256 amount) public onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        virtualBalance[to] += amount;
    }

    function reduceBalance(address from, uint256 amount) public onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        virtualBalance[from] -= amount;
    }
}
