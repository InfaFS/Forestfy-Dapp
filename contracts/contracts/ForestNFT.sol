// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ForestNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // Authorized contracts that can perform operations
    mapping(address => bool) public authorizedContracts;

    enum Rarity {
        NORMAL,
        RARE,
        LEGENDARY
    }

    mapping(uint256 => Rarity) public tokenRarity;
    mapping(address => mapping(Rarity => uint256)) public userNFTsByRarity;
    mapping(address => uint256) public userParcels; // Cantidad de parcelas por usuario

    // Nuevos mappings para manejar la propiedad interna
    mapping(address => uint256[]) private _userOwnedTokens; // Tokens que "posee" cada usuario
    mapping(uint256 => address) private _tokenToOwner; // Mapeo de token a su "propietario"
    mapping(address => uint256) private _userTokenCount; // Contador de tokens por usuario
    mapping(uint256 => uint256) private _userOwnedTokensIndex; // Índice del token en el array del usuario

    uint256 public constant TREES_PER_PARCEL = 16; // Máximo de árboles por parcela

    constructor() ERC721("Forest NFT", "FORESTNFT") Ownable() {}

    // Nueva función mint con amount (escalado por 10, ej: 1.2 => 12)
    function mintTo(address to, uint256 amountScaled) public onlyOwner {
        require(
            amountScaled >= 12 && amountScaled <= 65,
            "Amount must be between 1.2 and 6.5 tokens (scaled by 10)"
        );

        // Verificar que el usuario tenga suficientes parcelas
        uint256 currentTrees = getUserTokenCount(to);
        uint256 maxTreesAllowed = userParcels[to] * TREES_PER_PARCEL;
        require(
            currentTrees < maxTreesAllowed,
            "Not enough parcels to mint more trees"
        );

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        Rarity rarity = determineRarity(amountScaled);
        tokenRarity[newTokenId] = rarity;

        string memory uri = createTokenURI(rarity);

        // Mintear al contrato mismo
        _mint(address(this), newTokenId);
        _setTokenURI(newTokenId, uri);

        // Asignar la propiedad interna al usuario
        _assignTokenToUser(to, newTokenId);

        // Actualizar contadores de rareza
        userNFTsByRarity[to][rarity]++;
    }

    // Función interna para asignar un token a un usuario
    function _assignTokenToUser(address user, uint256 tokenId) internal {
        _tokenToOwner[tokenId] = user;
        _userOwnedTokensIndex[tokenId] = _userOwnedTokens[user].length;
        _userOwnedTokens[user].push(tokenId);
        _userTokenCount[user]++;
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

    // Función para transferir tokens entre usuarios (dentro del contrato)
    function transferTokenBetweenUsers(
        address from,
        address to,
        uint256 tokenId
    ) public onlyOwnerOrAuthorized {
        require(
            _tokenToOwner[tokenId] == from,
            "Token does not belong to from address"
        );
        require(to != address(0), "Cannot transfer to zero address");

        // Verificar que el usuario destino tenga suficientes parcelas
        uint256 currentTrees = getUserTokenCount(to);
        uint256 maxTreesAllowed = userParcels[to] * TREES_PER_PARCEL;
        require(
            currentTrees < maxTreesAllowed,
            "Destination user does not have enough parcels"
        );

        Rarity rarity = tokenRarity[tokenId];

        // Remover del usuario anterior
        _removeTokenFromUser(from, tokenId);
        userNFTsByRarity[from][rarity]--;

        // Asignar al nuevo usuario
        _assignTokenToUser(to, tokenId);
        userNFTsByRarity[to][rarity]++;
    }

    // Función interna para remover un token de un usuario
    function _removeTokenFromUser(address user, uint256 tokenId) internal {
        uint256 lastIndex = _userOwnedTokens[user].length - 1;
        uint256 tokenIndex = _userOwnedTokensIndex[tokenId];

        if (tokenIndex != lastIndex) {
            uint256 lastTokenId = _userOwnedTokens[user][lastIndex];
            _userOwnedTokens[user][tokenIndex] = lastTokenId;
            _userOwnedTokensIndex[lastTokenId] = tokenIndex;
        }

        _userOwnedTokens[user].pop();
        delete _userOwnedTokensIndex[tokenId];
        _userTokenCount[user]--;
        delete _tokenToOwner[tokenId];
    }

    // Probabilidad dinámica según la cantidad stakeada
    function determineRarity(
        uint256 amountScaled
    ) internal view returns (Rarity) {
        // Escalar a rango -15 a +15
        // amountScaled va de 12 (1.2 tokens) a 65 (6.5 tokens)
        int256 adjustment = int256((amountScaled - 12) * 30) / 53 - 15; // de -15 a +15 aprox.

        // Base chances
        int256 baseNormal = 60;
        int256 baseRare = 25;
        int256 baseLegendary = 15;

        int256 normalChance = baseNormal - adjustment; // más amount => menos normal
        int256 rareChance = baseRare + adjustment / 2; // más amount => más rare
        int256 legendaryChance = baseLegendary + adjustment / 2; // más amount => más legendary

        uint256 finalNormal = clampChance(normalChance);
        uint256 finalRare = clampChance(rareChance);
        uint256 finalLegendary = clampChance(legendaryChance);

        uint256 total = finalNormal + finalRare + finalLegendary;

        // Protección contra total = 0 para evitar underflow
        if (total == 0) {
            // Fallback a probabilidades por defecto
            finalNormal = 60;
            finalRare = 25;
            finalLegendary = 15;
            total = 100;
        }

        uint256 random = uint256(
            keccak256(
                abi.encodePacked(block.timestamp, block.prevrandao, msg.sender)
            )
        ) % total;

        if (random < finalLegendary) {
            return Rarity.LEGENDARY;
        } else if (random < finalLegendary + finalRare) {
            return Rarity.RARE;
        } else {
            return Rarity.NORMAL;
        }
    }

    function clampChance(int256 value) internal pure returns (uint256) {
        if (value < 0) return 0;
        return uint256(value);
    }

    function createTokenURI(
        Rarity rarity
    ) internal pure returns (string memory) {
        if (rarity == Rarity.LEGENDARY) {
            return "ipfs://Qmbp2p52AfBnqs1VAydDDvPddaVjn1zufuGuSfy8J5sLGc";
        } else if (rarity == Rarity.RARE) {
            return "ipfs://QmURmmL4nbEWk5FQ79qnAoziNuRMPCoVdCucdoX9P2FQXW";
        } else {
            return "ipfs://QmNa6gzhekEgEH1oov7Ua5jPTp9FPwfX5WA2X44kkswhDg";
        }
    }

    function getNFTsByRarity(
        address user,
        Rarity rarity
    ) public view returns (uint256) {
        return userNFTsByRarity[user][rarity];
    }

    // Función actualizada para obtener tokens de un usuario (propiedad interna)
    function tokensOfOwner(
        address owner
    ) public view returns (uint256[] memory) {
        return _userOwnedTokens[owner];
    }

    // Nueva función para obtener el propietario interno de un token
    function getTokenOwner(uint256 tokenId) public view returns (address) {
        return _tokenToOwner[tokenId];
    }

    // Nueva función para obtener el balance interno de un usuario
    function getUserTokenCount(address user) public view returns (uint256) {
        return _userTokenCount[user];
    }

    // Función para asignar parcelas a un usuario
    function assignParcels(address user, uint256 parcels) public onlyOwner {
        require(parcels > 0, "Parcels must be greater than 0");
        userParcels[user] = parcels;
    }

    // Función para aumentar las parcelas de un usuario
    function addParcels(
        address user,
        uint256 additionalParcels
    ) public onlyOwner {
        require(
            additionalParcels > 0,
            "Additional parcels must be greater than 0"
        );
        userParcels[user] += additionalParcels;
    }

    // Función para consultar las parcelas de un usuario
    function getUserParcels(address user) public view returns (uint256) {
        return userParcels[user];
    }

    // Función para consultar cuántos árboles más puede plantar un usuario
    function getAvailableTreeSlots(address user) public view returns (uint256) {
        uint256 currentTrees = getUserTokenCount(user);
        uint256 maxTreesAllowed = userParcels[user] * TREES_PER_PARCEL;

        if (currentTrees >= maxTreesAllowed) {
            return 0;
        }

        return maxTreesAllowed - currentTrees;
    }

    // Función para verificar si un usuario puede plantar más árboles
    function canPlantMoreTrees(address user) public view returns (bool) {
        uint256 currentTrees = getUserTokenCount(user);
        uint256 maxTreesAllowed = userParcels[user] * TREES_PER_PARCEL;
        return currentTrees < maxTreesAllowed;
    }

    // Función para retirar un NFT del contrato hacia la wallet del usuario
    function withdraw(address to, uint256 tokenId) public onlyOwner {
        require(_tokenToOwner[tokenId] != address(0), "Token does not exist");
        require(to != address(0), "Cannot withdraw to zero address");

        address currentOwner = _tokenToOwner[tokenId];
        Rarity rarity = tokenRarity[tokenId];

        // Remover del sistema interno
        _removeTokenFromUser(currentOwner, tokenId);
        userNFTsByRarity[currentOwner][rarity]--;

        // Transferir el NFT del contrato a la wallet especificada
        _transfer(address(this), to, tokenId);
    }

    // Función para retirar múltiples NFTs de un usuario hacia su wallet
    function withdrawMultiple(
        address user,
        address to,
        uint256[] calldata tokenIds
    ) public onlyOwner {
        require(to != address(0), "Cannot withdraw to zero address");
        require(tokenIds.length > 0, "No tokens specified");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(
                _tokenToOwner[tokenId] == user,
                "Token does not belong to user"
            );

            Rarity rarity = tokenRarity[tokenId];

            // Remover del sistema interno
            _removeTokenFromUser(user, tokenId);
            userNFTsByRarity[user][rarity]--;

            // Transferir el NFT del contrato a la wallet especificada
            _transfer(address(this), to, tokenId);
        }
    }

    // Función para retirar todos los NFTs de un usuario hacia su wallet
    function withdrawAll(address user, address to) public onlyOwner {
        require(to != address(0), "Cannot withdraw to zero address");

        uint256[] memory userTokens = _userOwnedTokens[user];
        require(userTokens.length > 0, "User has no tokens");

        // Crear una copia del array porque se modificará durante el proceso
        uint256[] memory tokensToWithdraw = new uint256[](userTokens.length);
        for (uint256 i = 0; i < userTokens.length; i++) {
            tokensToWithdraw[i] = userTokens[i];
        }

        // Retirar todos los tokens
        for (uint256 i = 0; i < tokensToWithdraw.length; i++) {
            uint256 tokenId = tokensToWithdraw[i];
            Rarity rarity = tokenRarity[tokenId];

            // Remover del sistema interno
            _removeTokenFromUser(user, tokenId);
            userNFTsByRarity[user][rarity]--;

            // Transferir el NFT del contrato a la wallet especificada
            _transfer(address(this), to, tokenId);
        }
    }

    // Override para mantener compatibilidad pero ahora no se usa para transferencias de usuarios
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 /* batchSize */
    ) internal virtual override {
        // Esta función ahora solo se ejecuta para mint y burn del contrato
        // Las transferencias entre usuarios se manejan internamente
    }
}
